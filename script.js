/* ULTRA AI — Upgraded JavaScript only
   Drop this script into your existing HTML page (keep your IDs: send-btn, chat-input, chat-messages,
   typing-indicator, chat-history, file input handlers). This replaces your original UltraAI class
   with a fully-featured, modular, single-file JS implementation.

   Features:
   - Intent-driven instant answers + fuzzy matching
   - Async responder with extension points for external APIs
   - Voice recognition (Web Speech API) + TTS (speechSynthesis) with controls
   - File handling: text/plain, images, PDFs (PDF reading placeholder for integration)
   - LocalStorage persistence + versioning + export helper
   - Typing indicator, message rendering, history sidebar updates
   - Conversation pruning, metadata per message, safe fallbacks
   - Public functions preserved: newChat(), toggleVoice(), handleFileUpload(files), sendMessage()
*/

class UltraAI {
  constructor(opts = {}) {
    this.version = opts.version || '3.0-js-only';
    this.storageKey = opts.storageKey || 'ultra_ai_v3_history';
    this.maxMessages = opts.maxMessages || 200;
    this.conversationHistory = []; // {id,type,content,time,meta}
    this.isVoiceActive = false;
    this.recognition = null;
    this.defaultLocale = opts.locale || 'hi-IN';
    this.typingTimer = null;
    this.instantAnswers = this._defaultInstantAnswers();
    this.init();
  }

  /* ---------------- init & setup ---------------- */
  init() {
    this._bindElements();
    this._loadConversationHistory();
    this._attachListeners();
    this._initVoice();
    this._renderAllMessages();
    console.info(`ULTRA AI ${this.version} initialized`);
  }

  _bindElements() {
    this.sendBtn = document.getElementById('send-btn');
    this.chatInput = document.getElementById('chat-input');
    this.chatMessages = document.getElementById('chat-messages');
    this.typingIndicator = document.getElementById('typing-indicator');
    this.chatHistory = document.getElementById('chat-history');
    // if these don't exist, create safe fallbacks
    if (!this.typingIndicator) {
      this.typingIndicator = document.createElement('div');
      this.typingIndicator.id = 'typing-indicator';
      this.typingIndicator.style.display = 'none';
      document.body.appendChild(this.typingIndicator);
    }
  }

  _attachListeners() {
    if (this.sendBtn) this.sendBtn.addEventListener('click', () => this.sendMessage());
    if (this.chatInput) {
      this.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.sendMessage();
      });
    }
    // keep available global functions consistent with prior code
    window.ultraAI = this;
  }

  /* --------------- persistence ----------------- */
  _loadConversationHistory() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) this.conversationHistory = parsed.slice(-this.maxMessages);
      }
    } catch (e) { console.warn('load error', e); }
  }

  _saveConversationHistory() {
    try {
      const toSave = this.conversationHistory.slice(-this.maxMessages);
      localStorage.setItem(this.storageKey, JSON.stringify(toSave));
    } catch (e) { console.warn('save error', e); }
  }

  exportHistoryJSON() {
    const blob = new Blob([JSON.stringify(this.conversationHistory, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ultraai-history-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---------------- message helpers ---------------- */
  _id(prefix = 'm') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  _nowISO() { return new Date().toISOString(); }

  addMessage(content, type = 'bot', meta = {}) {
    const msg = { id: this._id(type[0]), type, content, time: this._nowISO(), meta };
    this.conversationHistory.push(msg);
    if (this.conversationHistory.length > this.maxMessages) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxMessages);
    }
    this._saveConversationHistory();
    this._renderMessage(msg);
    this._updateHistorySidebar();
    return msg;
  }

  _renderMessage(msg) {
    if (!this.chatMessages) return;
    const wrap = document.createElement('div');
    wrap.className = `message ${msg.type}-message`;
    wrap.setAttribute('data-id', msg.id);

    const contentHtml = this._formatMessageContent(msg.content);
    wrap.innerHTML = contentHtml;

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${msg.type} • ${new Date(msg.time).toLocaleString(this.defaultLocale)}`;
    wrap.appendChild(meta);

    this.chatMessages.appendChild(wrap);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  _formatMessageContent(content) {
    if (typeof content !== 'string') content = JSON.stringify(content, null, 2);
    // if long or contains newline, render in <pre>
    const isPre = content.includes('\n') || content.length > 300;
    const safe = this._escapeHtml(content);
    return isPre ? `<pre>${safe}</pre>` : `<div>${safe.replace(/\n/g, '<br>')}</div>`;
  }

  _renderAllMessages() {
    if (!this.chatMessages) return;
    this.chatMessages.innerHTML = '';
    for (const m of this.conversationHistory) this._renderMessage(m);
    this._updateHistorySidebar();
  }

  _updateHistorySidebar() {
    if (!this.chatHistory) return;
    this.chatHistory.innerHTML = '';
    // show latest user messages (or last 30)
    const items = this.conversationHistory.slice(-30).reverse();
    for (const m of items) {
      const el = document.createElement('div');
      el.className = 'history-item';
      const preview = (m.content || '').toString().slice(0, 80).replace(/\n/g, ' ');
      el.textContent = `${m.type === 'user' ? 'You: ' : 'Bot: '}${preview}`;
      el.title = new Date(m.time).toLocaleString(this.defaultLocale);
      el.onclick = () => {
        const msgEl = this.chatMessages.querySelector(`[data-id="${m.id}"]`);
        if (msgEl) msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
      this.chatHistory.appendChild(el);
    }
  }

  _escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  /* ---------------- typing indicator ---------------- */
  showTyping() {
    if (!this.typingIndicator) return;
    this.typingIndicator.style.display = 'flex';
  }

  hideTyping() {
    if (!this.typingIndicator) return;
    this.typingIndicator.style.display = 'none';
  }

  /* ---------------- instant answers & intent matching ---------------- */
  _defaultInstantAnswers() {
    return {
      greetings: [
        { keys: ['hi', 'hello', 'namaste', 'नमस्ते'], reply: 'नमस्ते! मैं ULTRA AI हूँ — कैसे मदद करूँ?' },
      ],
      facts: [
        { keys: ['capital of india', 'capital india', 'capital of bharat'], reply: 'भारत की राजधानी: नई दिल्ली।' },
        { keys: ['current pm of india', 'prime minister of india', 'pm of india'], reply: 'भारत के प्रधान मंत्री: नरेंद्र मोदी। (जानकारी 2024 के आसपास)' },
      ],
      math: [
        { keys: ['2+2', '2 + 2'], reply: '2 + 2 = 4' },
      ],
      datetime: [
        { keys: ['current time', 'time'], reply: () => `वर्तमान समय: ${new Date().toLocaleTimeString(this.defaultLocale)}` },
        { keys: ['today date', 'date', 'today'], reply: () => `आज की तारीख: ${new Date().toLocaleDateString(this.defaultLocale)}` },
      ]
    };
  }

  _matchInstantAnswer(userMessage) {
    if (!userMessage) return null;
    const text = userMessage.toLowerCase();
    // flatten intents
    for (const group of Object.values(this.instantAnswers)) {
      for (const intent of group) {
        for (const k of intent.keys) {
          // contains match for common cases (keeps from exact only)
          if (text.includes(k)) {
            return typeof intent.reply === 'function' ? intent.reply() : intent.reply;
          }
        }
      }
    }
    // short numeric math direct
    const mathMatch = text.match(/^([\d\.\s\+\-\*\/\(\)]+)$/);
    if (mathMatch) {
      try {
        // safe evaluate simple math only
        const result = Function(`"use strict";return (${mathMatch[1]})`)();
        return `${mathMatch[1].trim()} = ${result}`;
      } catch (e) { /* ignore */ }
    }
    return null;
  }

  /* ---------------- message processing ---------------- */
  async _processUserMessage(userMessage) {
    // attempt instant answer first
    const instant = this._matchInstantAnswer(userMessage);
    if (instant) {
      this.hideTyping();
      this.addMessage(instant, 'bot', { source: 'instant' });
      return;
    }

    // otherwise simulate typing & call generator
    this.showTyping();
    // simulate variable thinking delay based on length
    const baseDelay = Math.min(1500 + userMessage.length * 8, 4000);
    await this._sleep(baseDelay);

    try {
      const response = await this.generateUltraResponse(userMessage);
      this.hideTyping();
      this.addMessage(response, 'bot', { source: 'generated' });
      // auto-speak if voice active
      if (this.isVoiceActive) this.speak(response);
    } catch (err) {
      this.hideTyping();
      this.addMessage('माफ़ कीजिए — जवाब देने में समस्या हुई।', 'bot', { error: err.message });
      console.error(err);
    }
  }

  async sendMessage() {
    const input = this.chatInput;
    if (!input) return;
    const message = input.value?.trim();
    if (!message) return;
    input.value = '';
    this.addMessage(message, 'user', { ephemeral: false });
    // process asynchronously
    this._processUserMessage(message);
  }

  /* ---------------- response generation ----------------
     This implementation uses local rule-based responses and a safe extension hook `externalResponder`.
     To integrate external APIs, override `externalResponder(message)` to call your backend or OpenAI, then return the text.
  */
  async generateUltraResponse(userMessage) {
    // Basic heuristics: if user asked 'how', 'why', return contextual prompt
    const lower = userMessage.toLowerCase();
    if (/\bwhy\b|\bक्यों\b/.test(lower)) {
      return `"${userMessage}" — यह अच्छा प्रश्न है। संक्षेप में: (यहाँ विस्तार से बताएं)। आप चाहें तो मैं step-by-step explain कर दूँ।`;
    }
    if (/\bhow\b|\bकैसे\b/.test(lower)) {
      return `"${userMessage}" — मैं step-by-step तरीका बता सकता हूँ। आप किस स्तर पर detail चाहेंगे? (बुनियादी / मध्यम / गहरा)`;
    }

    // hook for external responder (no-op here). If you plug an API, return its response.
    if (typeof this.externalResponder === 'function') {
      try {
        const ext = await this.externalResponder(userMessage);
        if (ext) return ext;
      } catch (e) {
        console.warn('externalResponder failed', e);
      }
    }

    // fallback smart responses
    const fallbackPool = [
      `यहाँ "${userMessage}" के बारे में मेरी जानकारी है — क्या आप specific details चाहते हैं?`,
      `आपने पूछा: "${userMessage}". मैं इससे जुड़े महत्वपूर्ण बिंदु दे रहा हूँ — बताइए किस हिस्से पर ध्यान दें।`,
      `Interesting: "${userMessage}". मैं इसे summarize कर सकता हूँ या detailed analysis दे सकता हूँ — बताइए।`
    ];
    return fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
  }

  /* -------------- voice recognition & TTS -------------- */
  _initVoice() {
    // initialize speech recognition if supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = this.defaultLocale;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.addMessage(transcript, 'user', { via: 'voice' });
        // process message
        this._processUserMessage(transcript);
      };
      this.recognition.onend = () => {
        if (this.isVoiceActive) {
          // restart continuous listening
          try { this.recognition.start(); } catch (e) { /* ignore */ }
        }
      };
      this.recognition.onerror = (e) => console.warn('Speech recognition error', e);
    } else {
      this.recognition = null;
    }
  }

  toggleVoice() {
    if (!this.recognition) {
      // enable TTS-only toggle: toggle TTS speak-on-response
      this.isVoiceActive = !this.isVoiceActive;
      alert(this.isVoiceActive ? 'Voice: TTS on (no mic).' : 'Voice: TTS off.');
      return;
    }

    this.isVoiceActive = !this.isVoiceActive;
    if (this.isVoiceActive) {
      try {
        this.recognition.start();
        alert('Voice recognition started');
      } catch (e) { console.warn(e); }
    } else {
      try {
        this.recognition.stop();
        alert('Voice recognition stopped');
      } catch (e) { console.warn(e); }
    }
  }

  speak(text) {
    if (!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(typeof text === 'string' ? text : String(text));
    // try to pick a matching voice for locale
    const voices = window.speechSynthesis.getVoices();
    const matched = voices.find(v => v.lang && v.lang.toLowerCase().includes(this.defaultLocale.slice(0,2).toLowerCase()));
    if (matched) utter.voice = matched;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  /* ---------------- file handling ---------------- */
  async handleFileUpload(files) {
    if (!files || files.length === 0) return;
    const file = files[0];
    this.addMessage(`📁 File uploaded: ${file.name}`, 'user', { fileName: file.name });
    // quick processing depending on type
    const type = file.type || '';
    if (type.startsWith('text/') || file.name.match(/\.(txt|csv|json)$/i)) {
      const text = await file.text();
      // show preview (first 1000 chars)
      const preview = text.slice(0, 2000);
      this.addMessage(`✅ फाइल पढ़ी गयी (प्रिव्यू):\n\n${preview}`, 'bot', { fileName: file.name, fileType: 'text' });
      // optionally process (e.g., extract job number)
      // look for patterns like Job#1234 or job no: 1234
      const jobMatch = preview.match(/job(?:\s|#|no[:\s])\s*([A-Za-z0-9\-]+)/i);
      if (jobMatch) {
        this.addMessage(`🔎 Found job identifier: ${jobMatch[1]}`, 'bot', { fileName: file.name, extracted: jobMatch[1] });
      }
      return;
    }

    if (type.startsWith('image/') || file.name.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
      // create preview element
      const blobUrl = URL.createObjectURL(file);
      this.addMessage(`🖼️ Image received: ${file.name}\nPreview URL: ${blobUrl}`, 'bot', { fileType: 'image', preview: blobUrl });
      // release object URL after some time
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      return;
    }

    if (type === 'application/pdf' || file.name.match(/\.pdf$/i)) {
      // PDF reading requires PDF.js or server-side parsing. Provide placeholder and instructions.
      this.addMessage(`📄 PDF received: ${file.name}\n(Processing PDFs requires a PDF parser. Integrate PDF.js or send the file to the server for text extraction.)`, 'bot', { fileName: file.name, fileType: 'pdf' });
      return;
    }

    // default fallback: show name and size
    this.addMessage(`📦 Received file: ${file.name} (${Math.round(file.size/1024)} KB). Unable to auto-process this type locally.`, 'bot', { fileName: file.name, fileType: type });
  }

  /* ---------------- utilities ---------------- */
  _sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

  clearHistory(confirmBefore = true) {
    if (confirmBefore && !confirm('क्या आप सभी चैट हटाना चाहते हैं?')) return;
    this.conversationHistory = [];
    this._saveConversationHistory();
    this._renderAllMessages();
  }

  /* ---------------- escape hatch for external API ----------------
     To enable LLM responses: set ultraAI.externalResponder = async (message) => { ...fetch to your backend... }
     The function should return a string reply. Example:
       ultraAI.externalResponder = async (msg) => {
         const r = await fetch('/api/ai', {method:'POST', body: JSON.stringify({prompt: msg})});
         const json = await r.json();
         return json.text;
       }
  */
}

/* ----------------- global functions (keeps your page API stable) ----------------- */
window.newChat = function() {
  if (window.ultraAI) {
    if (confirm('क्या आप नया चैट शुरू करना चाहते हैं?')) {
      window.ultraAI.clearHistory(false);
    }
  }
};

window.toggleVoice = function() {
  if (window.ultraAI) window.ultraAI.toggleVoice();
};

window.handleFileUpload = function(files) {
  if (window.ultraAI) window.ultraAI.handleFileUpload(files);
};

window.sendMessage = function() {
  if (window.ultraAI) window.ultraAI.sendMessage();
};

/* ----------------- instantiate (auto) ----------------- */
document.addEventListener('DOMContentLoaded', () => {
  if (!window.ultraAI) window.ultraAI = new UltraAI();
});
