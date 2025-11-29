import React, { useState, useEffect, useRef } from 'react';

function assembleSiteSrcDoc(files) {
  const index = files['index.html'] || '<!doctype html><html><body><pre>No index.html</pre></body></html>';
  let doc = index;

  // simple inline CSS links: <link href="/assets/css/xxx.css">
  doc = doc.replace(/<link[^>]*href=["']?\/?assets\/([^"'>]+)["']?[^>]*>/gi, (m, filename) => {
    const path = `assets/css/${filename}`.replace(/\/+/g,'/');
    const content = files[path] ?? files[`assets/${filename}`] ?? '';
    return `<style>\n/* inlined ${path} */\n${content}\n</style>`;
  });

  // inline scripts
  doc = doc.replace(/<script[^>]*src=["']?\/?assets\/([^"'>]+)["']?[^>]*>\s*<\/script>/gi, (m, filename) => {
    const path = `assets/js/${filename}`.replace(/\/+/g,'/');
    const content = files[path] ?? files[`assets/${filename}`] ?? '';
    return `<script>\n/* inlined ${path} */\n${content}\n</script>`;
  });

  return doc;
}

export default function App() {
  const [files, setFiles] = useState(() => ({
    'index.html': `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Live Site</title>
    <link rel="stylesheet" href="/assets/css/style.css">
  </head>
  <body>
    <header>
      <h1>Welcome</h1>
      <nav><a href="index.html">Home</a></nav>
    </header>
    <main id="content">
      <p>Edit files in the left editor or use chat commands to update this page.</p>
    </main>
    <script src="/assets/js/main.js"></script>
  </body>
</html>`,
    'assets/css/style.css': `body { font-family: Arial, sans-serif; margin: 0; padding: 16px; color:#111 }
header{background:#0ea5e9;color:white;padding:16px;border-radius:6px}
main{margin-top:12px}`,
    'assets/js/main.js': `console.log('Live site script running');`
  }));
  const [selectedFile, setSelectedFile] = useState('index.html');
  const [editorValue, setEditorValue] = useState(files['index.html']);
  const [chatMessages, setChatMessages] = useState([{role:'system', text:'Ready. Type commands.'}]);
  const [chatInput, setChatInput] = useState('');
  const [previewSrcDoc, setPreviewSrcDoc] = useState('');
  const iframeRef = useRef(null);

  useEffect(() => setEditorValue(files[selectedFile] ?? ''), [selectedFile, files]);
  useEffect(() => setPreviewSrcDoc(assembleSiteSrcDoc(files)), [files]);

  function saveEditor() {
    setFiles(prev => ({...prev, [selectedFile]: editorValue}));
    pushChat('system', `Saved ${selectedFile}`);
  }
  function pushChat(role, text){ setChatMessages(s => [...s, {role, text}]); }

  function processCommand(text) {
    const t = text.trim();
    let m;
    if ((m = /^create page (.+)$/i.exec(t))) {
      const name = m[1].trim(); const path = name.endsWith('.html')? name : `${name}.html`;
      if (files[path]) return `File ${path} exists`;
      const template = `<!doctype html>\n<html>\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${path}</title><link rel="stylesheet" href="/assets/css/style.css"></head>\n<body><h1>${path}</h1><p>New page</p></body>\n</html>`;
      setFiles(prev => ({...prev, [path]: template}));
      setSelectedFile(path);
      return `Created ${path}`;
    }
    if ((m = /^open (.+)$/i.exec(t))) {
      const path = m[1].trim();
      if (!files[path]) return `File ${path} not found`;
      setSelectedFile(path);
      return `Opened ${path}`;
    }
    if ((m = /^update (\S+) with ([\s\S]+)$/i.exec(t))) {
      const path = m[1].trim(), content = m[2];
      setFiles(prev => ({...prev, [path]: content}));
      return `Updated ${path}`;
    }
    if (/^list files$/i.test(t)) {
      return Object.keys(files).sort().join('\n');
    }
    if (/^help$/i.test(t)) {
      return `Commands:\ncreate page NAME\nopen PATH\nupdate PATH with CONTENT\nlist files\nhelp`;
    }
    return "Unknown command. Type 'help'.";
  }

  function handleChatSubmit(e) {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    pushChat('user', chatInput);
    const res = processCommand(chatInput);
    pushChat('assistant', res);
    setChatInput('');
  }

  function createFilePrompt() {
    const name = window.prompt('New file path (e.g. pages/about.html or assets/css/site.css)');
    if (!name) return;
    if (files[name]) { alert('exists'); return; }
    setFiles(prev => ({...prev, [name]: ''}));
    setSelectedFile(name);
  }

  function deleteFile(path) {
    if (!confirm(`Delete ${path}?`)) return;
    setFiles(prev => { const c = {...prev}; delete c[path]; return c; });
    const remaining = Object.keys(files).filter(k => k !== path);
    if (remaining.length) setSelectedFile(remaining[0]);
  }

  return (
    <div className="app-root">
      <div className="sidebar">
        <div className="files-header">
          <strong>Files</strong>
          <div>
            <button onClick={createFilePrompt}>New</button>
            <button onClick={() => { setFiles(prev => ({...prev, 'index.html': prev['index.html'] ?? '<h1>index</h1>'})); setSelectedFile('index.html'); }}>Ensure index</button>
          </div>
        </div>

        <div className="files-list">
          {Object.keys(files).sort().map(p => (
            <div key={p} className={`file-line ${p===selectedFile ? 'sel':''}`}>
              <button onClick={() => setSelectedFile(p)} className="file-name">{p}</button>
              <div className="file-actions">
                <button onClick={() => { navigator.clipboard?.writeText(p); pushChat('system', `Copied ${p}`)} }>Copy</button>
                <button onClick={() => deleteFile(p)}>Del</button>
              </div>
            </div>
          ))}
        </div>

        <div className="editor-block">
          <div className="editor-header"><strong>Editor — {selectedFile}</strong></div>
          <textarea value={editorValue} onChange={e=>setEditorValue(e.target.value)} />
          <div className="editor-actions">
            <button onClick={saveEditor}>Save</button>
            <button onClick={() => setEditorValue(files[selectedFile] ?? '')}>Revert</button>
          </div>
        </div>

        <div className="chat-block">
          <strong>Chat / Commands</strong>
          <div className="chat-window">
            {chatMessages.map((m,i)=> <div key={i} className={`chat-line ${m.role==='user'?'user':''}`}>{m.text}</div>)}
          </div>
          <form onSubmit={handleChatSubmit} className="chat-form">
            <input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Type command" />
            <button>Send</button>
          </form>
        </div>
      </div>

      <div className="preview">
        <div className="preview-header">
          <strong>Live Preview</strong>
          <div>
            <label>Page:</label>
            <select value={selectedFile} onChange={e=>setSelectedFile(e.target.value)}>
              {Object.keys(files).filter(k=>k.endsWith('.html')).map(k=> <option key={k} value={k}>{k}</option>)}
            </select>
            <button onClick={() => setPreviewSrcDoc(assembleSiteSrcDoc(files))}>Rebuild</button>
          </div>
        </div>
        <div className="iframe-wrap">
          <iframe ref={iframeRef} sandbox="allow-scripts allow-forms allow-same-origin" srcDoc={previewSrcDoc} title="preview" />
        </div>
      </div>
    </div>
  );
}
