// server/index.js
// Minimal Express backend: /api/chat (stream) , /api/embed, /api/upload (text files), /api/vector_search
// Uses OpenAI (chat + embeddings). Swap provider by replacing call functions.

import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const app = express();
app.use(bodyParser.json({ limit: '2mb' }));
app.use(express.static(path.resolve('./public')));

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.error('Set OPENAI_API_KEY in environment');
  process.exit(1);
}

// Simple in-memory vector DB (persist to disk)
const VSTORE_FILE = path.resolve('./vector_store.json');
let VECTOR_STORE = [];
try {
  if (fs.existsSync(VSTORE_FILE)) VECTOR_STORE = JSON.parse(fs.readFileSync(VSTORE_FILE, 'utf8'));
} catch (e) { VECTOR_STORE = []; }

// Helpers
const id = (p='it') => `${p}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

async function openaiChatCompletionStream(systemPrompt, conversation) {
  // Using OpenAI Chat Completions (v1) streaming via "stream": true
  // Adjust to provider specifics if needed.
  const url = 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model: 'gpt-4o-mini', // replace with available model; or "gpt-4o" etc.
    messages: [{ role: 'system', content: systemPrompt }, ...conversation],
    temperature: 0.2,
    stream: true
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    // signal: abortController.signal optional
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI chat error: ${res.status} ${txt}`);
  }

  // Return the raw response body stream to be proxied to client (SSE style)
  return res.body;
}

async function openaiEmbedding(text) {
  const url = 'https://api.openai.com/v1/embeddings';
  const payload = { model: 'text-embedding-3-small', input: text };
  const r = await fetch(url, {
    method:'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!r.ok) throw new Error('Embedding failed: ' + await r.text());
  const j = await r.json();
  return j.data[0].embedding;
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i=0;i<a.length;i++){ dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na)*Math.sqrt(nb) + 1e-8);
}

// Save vector store to disk (simple)
function persistVectorStore() { fs.writeFileSync(VSTORE_FILE, JSON.stringify(VECTOR_STORE, null, 2)); }

/* ---------------- API: embed/upload/search ---------------- */

app.post('/api/upload', async (req, res) => {
  // Expect { filename, text } (for now); you can extend to multipart file upload
  try {
    const { filename, text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text' });
    // chunking simple: split into 500-char chunks
    const chunkSize = 800;
    const chunks = [];
    for (let i=0;i<text.length;i+=chunkSize) chunks.push(text.slice(i,i+chunkSize));
    for (const chunk of chunks) {
      const emb = await openaiEmbedding(chunk);
      const item = { id: id('vec'), text: chunk, embedding: emb, source: filename, time: new Date().toISOString() };
      VECTOR_STORE.push(item);
    }
    persistVectorStore();
    return res.json({ ok:true, added: chunks.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/vector_search', async (req, res) => {
  // { query, topK }
  try {
    const { query, topK = 4 } = req.body;
    if (!query) return res.status(400).json({ error:'no query' });
    const qEmb = await openaiEmbedding(query);
    const scored = VECTOR_STORE.map(v => ({ ...v, score: cosine(qEmb, v.embedding) }));
    scored.sort((a,b)=>b.score-a.score);
    return res.json({ results: scored.slice(0, topK) });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

/* ---------------- API: chat (streaming proxy) ----------------
   Request: { conversation: [{role, content}], use_rag:bool, query_for_rag: string (optional) }
   Response: streaming text (SSE events) OR final JSON if stream unsupported.
*/

app.post('/api/chat', async (req, res) => {
  try {
    const { conversation = [], use_rag = false, rag_query = '' } = req.body;
    // system prompt (customize)
    const systemPrompt = `You are ULTRA AI — concise, helpful assistant. Answer in Hindi or the language of the user. Provide summary and direct answer. Do not hallucinate. If external docs are provided, cite them.`;

    // If RAG requested, fetch top docs and prepend as system instruction
    let augmentedSystem = systemPrompt;
    if (use_rag && rag_query) {
      // vector search
      const qEmb = await openaiEmbedding(rag_query);
      const scored = VECTOR_STORE.map(v => ({ ...v, score: cosine(qEmb, v.embedding) }));
      scored.sort((a,b)=>b.score-b.score);
      const top = scored.slice(0,3);
      if (top.length) {
        const docs = top.map((t,i) => `DOC${i+1} (score:${t.score.toFixed(3)}): ${t.text}`).join('\n\n');
        augmentedSystem = `${systemPrompt}\n\nUse the following docs when answering (do not invent other facts):\n\n${docs}\n\nAnswer concisely.`;
      }
    }

    // Proxy via streaming
    // We'll stream chunks to client as SSE-like with text chunks separated by \n\n
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control','no-cache');
    res.setHeader('Connection','keep-alive');

    const stream = await openaiChatCompletionStream(augmentedSystem, conversation);
    // Pipe stream to client directly (node-fetch body is readable stream)
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      // Forward chunk to client
      res.write(`data: ${chunk.replace(/\n/g,'\\n')}\n\n`);
    }
    res.write('event: done\ndata: end\n\n');
    res.end();
  } catch (err) {
    console.error('chat error', err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- health ---------------- */
app.get('/api/health', (req, res) => res.json({ ok:true, version: '1.0' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server listening ${PORT}`));
