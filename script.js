/* script.js — Full replacement for UltraAI frontend (ready to work with the provided backend)
   Features:
   - LLM-backed chat via /api/chat (streaming-friendly)
   - File upload handling (text, image, pdf placeholder) and /api/upload helper
   - LocalStorage convo persistence and export
   - Voice recognition (Web Speech API) + TTS
   - Typing indicator & incremental streaming UI
   - Global functions preserved: newChat(), toggleVoice(), handleFileUpload(files), sendMessage()
   - Keeps compatibility with HTML element IDs: send-btn, chat-input, chat-messages, typing-indicator,
     chat-history, file-input, attach-btn, drop-zone, toggle-voice, new-chat, export-chat, clear-storage
*/

class UltraAI {
  constructor(opts = {}) {
    this.version = opts.version || 'ultraai-frontend-v1';
    this.storageKey = opts.storageKey || 'ultraai_v1_history';
    this.maxMessages = opts.maxMessages || 300;
    this.locale = opts.locale || 'hi-IN';
    this.conversationHistory = []; // {id,type,content,time,meta}
    this.isVoiceActive = false;
    this.recognition = null;
    this._streamingMsgElement = null; // temp element for streaming
    this._init();
  }

  _init() {
    this._bindElements();
    this._attachListeners();
    this._loadHistory();
    this._initVoice();
    this._renderAllMessages();
    window.ultraAI = this;
    console.info(`UltraAI frontend initialized (${this.version})`);
  }

  /* ---------------- DOM binding ---------------- */
  _bindElements() {
    this.el = {};
    const ids = ['send-btn','chat-input','chat-messages','typing-indicator','chat-history','file-input','attach-btn','drop-zone','toggle-voice','new-chat','export-chat','clear-storage'];
    ids.forEach(id => this.el[id.replace(/-/g,'_')] = document.getElementById(id));
    // safe fallbacks
    if (!this.el.typing_indicator) {
      const tmp = document.createElement('div'); tmp.id = 'typing-indicator'; tmp.style.display = 'none'; document.body.appendChild(tmp);
      this.el.typing_indicator = tmp;
    }
  }

  _attachListeners() {
    if (this.el.send_btn) this.el.send_btn.addEventListener('click', () => this.sendMessage());
    if (this.el.chat_input) this.el.chat_input.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.sendMessage(); });
    if (this.el.attach_btn && this.el.file_input) {
      this.el.attach_btn.addEventListener('click', () => this.el.file_input.click());
      this.el.file_input.addEventListener('change', (ev) => this.handleFileUpload(ev.target.files));
    }
    if (this.el.drop_zone) {
      this.el.drop_zone.addEventListener('dragover', (e) => { e.preventDefault(); this.el.drop_zone.classList?.add('drag-over'); });
      this.el.drop_zone.addEventListener('dragleave', (e) => { e.preventDefault(); this.el.drop_zone.classList?.remove('drag-over'); });
      this.el.drop_zone.addEventListener('drop', (e) => { e.preventDefault(); this.el.drop_zone.classList?.remove('drag-over'); this.handleFileUpload(e.dataTransfer.files); });
    }
    if (this.el.toggle_voice) this.el.toggle_voice.addEventListener('click', () => this.toggleVoice());
    if (this.el.new_chat) this.el.new_chat.addEventListener('click', () => this.newChat());
    if (this.el.export_chat) this.el.export_chat.addEventListener('click', () => this.exportHistory());
    if (this.el.clear_storage) this.el.clear_storage.addEventListener('click', () => this.clearStorage());
    // keyboard shortcut focus
    window.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); this.el.chat_input?.focus(); } });
  }

  /* ---------------- persistence ---------------- */
  _loadHistory() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) this.conversationHistory = parsed.slice(-this.maxMessages);
      }
    } catch (e) { console.warn('Failed to load history', e); }
  }

  _saveHistoryDebounced() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._saveHistory(), 300);
  }

  _saveHistory() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.conversationHistory.slice(-this.maxMessages)));
    } catch (e) { console.warn('Failed to save history', e); }
  }

  exportHistory() {
    const blob = new Blob([JSON.stringify(this.conversationHistory, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `ultraai-history-${new Date().toISOString()}.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  clearStorage() {
    if (!confirm('Remove saved conversations?')) return;
    localStorage.removeItem(this.storageKey);
    this.conversationHistory = [];
    this._renderAllMessages();
  }

  /* ---------------- message utilities ---------------- */
  _id(prefix = 'm') { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
  _nowISO() { return new Date().toISOString(); }

  addMessage(content, type = 'bot', meta = {}) {
    const msg = { id: this._id(type[0]), type, content, time: this._nowISO(), meta };
    this.conversationHistory.push(msg);
    if (this.conversationHistory.length > this.maxMessages) this.conversationHistory = this.conversationHistory.slice(-this.maxMessages);
    this._saveHistoryDebounced();
    this._renderMessage(msg);
    this._renderHistorySidebar();
    return msg;
  }

  _renderMessage(msg) {
    if (!this.el.chat_messages) return;
    const wrapper = document.createElement('div');
    wrapper.className = `message ${msg.type}-message`;
    wrapper.setAttribute('data-id', msg.id);

    const contentNode = document.createElement('div');
    contentNode.className = 'message-content';
    // long or multiline -> pre
    if (typeof msg.content !== 'string') msg.content = JSON.stringify(msg.content, null, 2);
    const isPre = msg.content.includes('\n') || msg.content.length > 400;
    if (isPre) {
      const pre = document.createElement('pre');
      pre.textContent = msg.content;
      contentNode.appendChild(pre);
    } else {
      contentNode.innerHTML = this._escapeHtml(msg.content).replace(/\n/g, '<br>');
    }

    wrapper.appendChild(contentNode);

    const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = `${msg.type} • ${new Date(msg.time).toLocaleString(this.locale)}`;
    wrapper.appendChild(meta);

    this.el.chat_messages.appendChild(wrapper);
    this.el.chat_messages.scrollTop = this.el.chat_messages.scrollHeight;
  }

  _renderAllMessages() {
    if (!this.el.chat_messages) return;
    this.el.chat_messages.innerHTML = '';
    for (const m of this.conversationHistory) this._renderMessage(m);
    this._renderHistorySidebar();
  }

  _renderHistorySidebar() {
    if (!this.el.chat_history) return;
    this.el.chat_history.innerHTML = '';
    const items = this.conversationHistory.slice(-40).reverse();
    for (const m of items) {
      const el = document.createElement('div');
      el.className = 'history-item';
      const preview = (m.content || '').toString().slice(0, 80).replace(/\n/g, ' ');
      el.textContent = `${m.type === 'user' ? 'You: ' : 'Bot: '}${preview}`;
      el.title = new Date(m.time).toLocaleString(this.locale);
      el.onclick = () => {
        const target = this.el.chat_messages.querySelector(`[data-id="${m.id}"]`);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
      this.el.chat_history.appendChild(el);
    }
  }

  _escapeHtml(str) {
    return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }

  /* ---------------- typing indicator ---------------- */
  showTyping() { if (this.el.typing_indicator) this.el.typing_indicator.style.display = 'flex'; }
  hideTyping() { if (this.el.typing_indicator) this.el.typing_indicator.style.display = 'none'; }

  /* ---------------- send / process message ---------------- */
  async sendMessage() {
    const input = this.el.chat_input;
    if (!input) return;
    const text = input.value?.trim();
    if (!text) return;
    input.value = '';
    this.addMessage(text, 'user', { input: true });
    this.showTyping();

    // Build conversation tail (server will reapply system prompt). Keep last N messages.
    const tail = this.conversationHistory.slice(-10).map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }));
    // Ensure the last action (user) is present
    tail.push({ role: 'user', content: text });

    try {
      // start streaming request
      await this._callServerChatStream(tail, { use_rag: false, rag_query: text });
      this.hideTyping();
    } catch (err) {
      this.hideTyping();
      console.error('chat stream error', err);
      this.addMessage('Server error: ' + (err.message || err), 'bot', { error: true });
    }
  }

  /* ---------------- streaming chat integration ----------------
     Expects server to respond as streaming body or plain text.
     Handles SSE-like "data: ..." chunks or raw streamed text.
  */
  async _callServerChatStream(conversation, extra = {}) {
    // create temporary streaming message element (so UI shows incremental tokens)
    this._ensureStreamingElement();

    const controller = new AbortController();
    const signal = controller.signal;

    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ conversation }, extra)),
      signal
    });

    if (!resp.ok) {
      const txt = await resp.text();
      // remove streaming element
      this._finalizeStreamingElement('', true);
      throw new Error(`Server responded ${resp.status}: ${txt}`);
    }

    // If no streaming (content-length, or small), fallback to text
    if (!resp.body) {
      const full = await resp.text();
      this._finalizeStreamingElement(full);
      return full;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let buffer = '';

    while (!done) {
      const { value, done: rdone } = await reader.read();
      if (rdone) { done = true; break; }
      const chunk = decoder.decode(value, { stream: true });
      // server may send SSE-like lines starting "data: ..." or plain text.
      buffer += chunk;
      // process buffer for "data: " lines if present
      if (buffer.includes('data:')) {
        // split by SSE delimiter
        const parts = buffer.split(/\r?\n\r?\n/);
        // keep last partial in buffer
        buffer = parts.pop() || '';
        for (const part of parts) {
          const m = part.trim();
          if (!m) continue;
          // each part may contain multiple lines; find lines starting with "data:"
          const lines = m.split(/\r?\n/).map(l => l.replace(/^data:\s*/,''));
          for (const line of lines) {
            if (line === '[DONE]' || line.toLowerCase().includes('event: done')) {
              // finish
              this._finalizeStreamingElement('', false, true);
              return;
            }
            this._appendToStreaming(line);
          }
        }
      } else {
        // no SSE markers: treat chunk as raw text tokens
        this._appendToStreaming(chunk);
      }
    }

    // flush remaining buffer
    if (buffer) {
      // if SSE-style left, try to strip "data:" prefixes
      const cleaned = buffer.replace(/^data:\s*/gm, '');
      this._appendToStreaming(cleaned);
    }

    // finalize
    this._finalizeStreamingElement('', false, true);
  }

  _ensureStreamingElement() {
    // remove existing streaming element if any
    if (this._streamingMsgElement) {
      // keep using it
      return;
    }
    // create a temporary bot message
    const wrap = document.createElement('div');
    wrap.className = 'message bot-message';
    wrap.setAttribute('data-temp-stream', 'true');
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = '';
    wrap.appendChild(content);
    const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = `bot • ${new Date().toLocaleString(this.locale)}`;
    wrap.appendChild(meta);
    this.el.chat_messages.appendChild(wrap);
    this.el.chat_messages.scrollTop = this.el.chat_messages.scrollHeight;
    this._streamingMsgElement = content;
  }

  _appendToStreaming(token) {
    if (!this._streamingMsgElement) this._ensureStreamingElement();
    // append token text safely (token might contain encoded \n sequences)
    const text = token.replace(/\\n/g, '\n');
    // keep last appended string length manageable
    this._streamingMsgElement.textContent += text;
    this.el.chat_messages.scrollTop = this.el.chat_messages.scrollHeight;
  }

  _finalizeStreamingElement(finalText = '', isError = false, treatAsComplete = false) {
    if (!this._streamingMsgElement) {
      if (finalText) this.addMessage(finalText, 'bot', { source: 'final' });
      return;
    }
    let content = this._streamingMsgElement.textContent || '';
    if (finalText) content += finalText;
    // remove temp element and add as real message (to include in history)
    const parent = this._streamingMsgElement.parentElement;
    if (parent) parent.remove();
    this._streamingMsgElement = null;
    if (isError) {
      this.addMessage('Server error during streaming.', 'bot', { error: true });
    } else {
      // add consolidated message
      this.addMessage(content, 'bot', { streamed: true });
      // auto TTS if voice active
      if (this.isVoiceActive) this.speak(content);
    }
  }

  /* ---------------- externalResponder hook (optional override) ----------------
     You can override ultraAI.externalResponder = async (conversation) => { ... } in the page to
     provide a custom client-side response source. By default, client calls /api/chat.
  */
  async externalResponder(conversation) {
    // default calls server endpoint; left here for clarity if user overrides
    return null;
  }

  /* ---------------- voice & TTS ---------------- */
  _initVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = this.locale;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
      this.recognition.onresult = (ev) => {
        const transcript = ev.results[0][0].transcript;
        this.addMessage(transcript, 'user', { via: 'voice' });
        // process message (do not duplicate to UI)
        this.showTyping();
        const tail = this.conversationHistory.slice(-10).map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }));
        tail.push({ role: 'user', content: transcript });
        this._callServerChatStream(tail, { use_rag: false, rag_query: transcript })
          .then(()=> this.hideTyping())
          .catch(e=> { this.hideTyping(); this.addMessage('Voice-server error: ' + e.message, 'bot'); });
      };
      this.recognition.onend = () => {
        if (this.isVoiceActive) {
          // restart listening
          try { this.recognition.start(); } catch (e) { console.warn('restart recognition failed', e); }
        }
      };
      this.recognition.onerror = (e) => console.warn('Speech recognition error', e);
    } else {
      this.recognition = null;
    }
  }

  toggleVoice() {
    // if no mic support, toggle TTS speak-on-response
    if (!this.recognition) {
      this.isVoiceActive = !this.isVoiceActive;
      alert(this.isVoiceActive ? 'TTS on (no mic support)' : 'TTS off');
      return;
    }
    this.isVoiceActive = !this.isVoiceActive;
    if (this.isVoiceActive) {
      try { this.recognition.start(); alert('Voice recognition started'); } catch (e) { console.warn(e); }
    } else {
      try { this.recognition.stop(); alert('Voice recognition stopped'); } catch (e) { console.warn(e); }
    }
  }

  speak(text) {
    if (!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(typeof text === 'string' ? text : String(text));
    // choose a voice matching locale if possible
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => v.lang && v.lang.toLowerCase().includes(this.locale.slice(0,2).toLowerCase()));
    if (match) utter.voice = match;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  /* ---------------- file handling ---------------- */
  async handleFileUpload(files) {
    if (!files || files.length === 0) return;
    const file = files[0];
    this.addMessage(`📁 File uploaded: ${file.name}`, 'user', { fileName: file.name });
    const type = file.type || '';
    try {
      if (type.startsWith('text/') || file.name.match(/\.(txt|csv|json|md)$/i)) {
        const txt = await file.text();
        const preview = txt.slice(0, 2000);
        // send to server /api/upload for embeddings if desired
        try {
          await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: file.name, text: txt })
          });
          this.addMessage(`✅ Text file processed and uploaded for retrieval. Preview:\n\n${preview}`, 'bot', { file: file.name });
        } catch (e) {
          // server may not exist; still show preview locally
          this.addMessage(`✅ Preview:\n\n${preview}`, 'bot', { file: file.name });
        }
        return;
      }

      if (type.startsWith('image/') || file.name.match(/\.(png|jpe?g|gif|webp)$/i)) {
        const url = URL.createObjectURL(file);
        this.addMessage(`🖼️ Image received: ${file.name}\nPreview below.`, 'bot', { preview: url });
        // render preview as inline image
        const wrapper = document.createElement('div'); wrapper.className = 'message bot-message';
        const img = document.createElement('img'); img.src = url; img.style.maxWidth = '320px'; img.style.borderRadius = '8px';
        wrapper.appendChild(img);
        const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = `bot • ${new Date().toLocaleString(this.locale)}`;
        wrapper.appendChild(meta);
        this.el.chat_messages.appendChild(wrapper);
        this.el.chat_messages.scrollTop = this.el.chat_messages.scrollHeight;
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        return;
      }

      if (type === 'application/pdf' || file.name.match(/\.pdf$/i)) {
        // PDFs require server-side parsing (PDF.js or server). Send as placeholder
        this.addMessage(`📄 PDF uploaded: ${file.name}. To extract text, use server-side PDF parsing (PDF.js or backend).`, 'bot', { file: file.name });
        // Optionally encode as base64 and send to /api/upload if backend accepts (not implemented by default)
        return;
      }

      // fallback: show file metadata
      this.addMessage(`📦 Received file: ${file.name} (${Math.round(file.size/1024)} KB) — unsupported for auto-processing.`, 'bot', { file: file.name });
    } catch (err) {
      console.error('file handling error', err);
      this.addMessage('File processing failed: ' + (err.message || err), 'bot', { error: true });
    }
  }

  /* ---------------- utility: clear conversation & new chat ---------------- */
  newChat() {
    if (!confirm('क्या आप नया चैट शुरू करना चाहते हैं?')) return;
    this.conversationHistory = [];
    this._saveHistory();
    this._renderAllMessages();
  }
}

/* ---------------- instantiate when DOM ready ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  if (!window.ultraAI) window.ultraAI = new UltraAI();
});

/* ---------------- global helpers (keeps page API stable) ---------------- */
window.newChat = function() { if (window.ultraAI) window.ultraAI.newChat(); };
window.toggleVoice = function() { if (window.ultraAI) window.ultraAI.toggleVoice(); };
window.handleFileUpload = function(files) { if (window.ultraAI) window.ultraAI.handleFileUpload(files); };
window.sendMessage = function() { if (window.ultraAI) window.ultraAI.sendMessage(); };
