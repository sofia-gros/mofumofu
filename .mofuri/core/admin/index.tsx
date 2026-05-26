/** @jsxImportSource .. */
import { jsx } from "../jsx-runtime";
// Use root themes directory for Admin UI components
import Button from "../../../themes/default/components/button";
import Input from "../../../themes/default/components/input";

export function AdminGUI() {
  return (
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <title>Mofuri Admin</title>
        <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
        <script src="https://unpkg.com/turndown/dist/turndown.js"></script>
        <AdminStyles />
      </head>
      <body>
        <AdminHeader />
        
        {/* Editor View */}
        <div id="view-editor" class="main-container">
          <AdminSidebar title="Recent Posts" id="posts-list">
            Loading...
          </AdminSidebar>
          
          <AdminEditorLayout />
          
          <div id="empty-state" style="grid-column: 2 / span 2; display:flex; align-items:center; justify-content:center; color:#94a3b8; flex-direction:column;">
               <div style="font-size:3rem; opacity:0.3; margin-bottom:1rem;">📝</div>
               <div style="font-weight:500;">Select a post to begin editing</div>
          </div>
        </div>

        {/* Docs View */}
        <div id="view-docs" class="main-container" style="display:none; grid-template-columns: 1fr; padding: 2rem; background: #f8fafc; overflow-y:auto; scroll-behavior: smooth;">
          <div style="max-width: 800px; margin: 0 auto; width: 100%;">
            <header style="margin-bottom: 2.5rem;">
              <h2 style="margin-top:0; color:#0f172a; font-size:1.5rem;">Component Library</h2>
              <p style="color:#64748b; font-size:0.9375rem;">Automatically extracted documentation for your custom tags.</p>
            </header>
            <div id="docs-list" style="display:grid; gap:2.5rem;"></div>
          </div>
        </div>

        {/* Settings View */}
        <div id="view-settings" class="main-container" style="display:none; grid-template-columns: 1fr; padding: 2rem; background: #f8fafc; overflow-y:auto;">
          <div style="max-width: 800px; margin: 0 auto; width: 100%;">
            <header style="margin-bottom: 2.5rem;">
              <h2 style="margin-top:0; color:#0f172a; font-size:1.5rem;">Plugin & Theme Settings</h2>
              <p style="color:#64748b; font-size:0.9375rem;">Manage your site configuration and content extensions.</p>
            </header>
            <div id="settings-content" style="display:grid; gap:2rem;">
              <div class="settings-section">
                 <h3>Global Configuration</h3>
                 <div id="global-settings"></div>
              </div>
              <div class="settings-section">
                 <h3>Active Plugins</h3>
                 <div id="plugins-list" style="display:grid; gap:1rem;"></div>
              </div>
            </div>
          </div>
        </div>

        <AdminScripts />
      </body>
    </html>
  );
}

function AdminHeader() {
  return (
    <header>
      <div class="nav">
        <h1 onclick="switchTab('editor')" style="cursor:pointer">🐾 mofuri</h1>
        <div id="nav-editor" class="nav-item active" onclick="switchTab('editor')">Post Editor</div>
        <div id="nav-docs" class="nav-item" onclick="switchTab('docs')">Component Docs</div>
        <div id="nav-settings" class="nav-item" onclick="switchTab('settings')">Settings</div>
      </div>
      <div id="file-info" style="font-size: 0.75rem; color: #94a3b8; font-weight: 500;"></div>
    </header>
  );
}

function AdminSidebar({ title, id, children }: any) {
  return (
    <aside class="sidebar">
      <h3>{title}</h3>
      <div id={id} class="posts-list">{children}</div>
    </aside>
  );
}

function AdminEditorLayout() {
  return (
    <main id="editor-layout" style="display:none; grid-template-columns: 1fr 1fr; flex:1; overflow:hidden;">
      <div id="editor-wrapper" class="editor-area">
        <div class="toolbar">
           <Button onClick="editor.chain().focus().toggleBold().run()" variant="secondary"><b>B</b></Button>
           <Button onClick="editor.chain().focus().toggleItalic().run()" variant="secondary"><i>I</i></Button>
           <Button onClick="editor.chain().focus().toggleHeading({ level: 1 }).run()" variant="secondary">H1</Button>
           <Button onClick="editor.chain().focus().toggleHeading({ level: 2 }).run()" variant="secondary">H2</Button>
           <div style="flex:1"></div>
           <Button onClick="editor.chain().focus().undo().run()" variant="secondary">Undo</Button>
        </div>
        
        <div id="editor" class="tiptap-container"></div>
        
        <div class="footer-actions">
          <div class="status-badge">
            <div id="status-dot" class="status-dot"></div>
            <span id="status-text">Ready</span>
          </div>
          <Button onClick="savePost()" id="save-btn">Save Changes</Button>
        </div>
      </div>

      <div class="preview-area">
         <div class="toolbar" style="justify-content:center; font-weight:700; font-size:0.625rem; letter-spacing:0.1em; color:#94a3b8; text-transform:uppercase;">
           Live Preview
         </div>
         <div id="preview" class="preview-content"></div>
      </div>
    </main>
  );
}

function AdminStyles() {
  return (
    <style>{`
      body { font-family: 'Inter', system-ui, -apple-system, sans-serif; padding: 0; margin: 0; background: #f8fafc; height: 100vh; display: flex; flex-direction: column; color: #1e293b; }
      header { background: white; border-bottom: 1px solid #e2e8f0; padding: 0.5rem 2rem; display: flex; justify-content: space-between; align-items: center; z-index: 10; }
      header h1 { color: #f26; margin: 0; font-size: 1.25rem; display: flex; align-items: center; gap: 0.5rem; font-weight: 800; text-transform: lowercase; }
      header .nav { display: flex; gap: 1.5rem; align-items: center; }
      header .nav-item { cursor: pointer; padding: 0.5rem 0; border-bottom: 2px solid transparent; font-weight: 600; color: #64748b; font-size: 0.875rem; transition: all 0.2s; }
      header .nav-item.active { color: #f26; border-bottom-color: #f26; }
      
      .main-container { display: grid; grid-template-columns: 250px 1fr 1fr; flex: 1; min-height: 0; }
      
      .sidebar { background: white; border-right: 1px solid #e2e8f0; padding: 1.5rem; overflow-y: auto; }
      .sidebar h3 { margin-top: 0; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 1rem; }
      
      .posts-list { list-style: none; padding: 0; margin: 0; }
      .post-item { padding: 0.625rem 0.875rem; border-radius: 0.375rem; cursor: pointer; margin-bottom: 0.25rem; transition: all 0.2s; font-size: 0.875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border: 1px solid transparent; color: #475569; }
      .post-item:hover { background: #f1f5f9; color: #0f172a; }
      .post-item.active { background: #fff1f2; color: #f26; border-color: #fecdd3; font-weight: 600; }
      
      .editor-area { display: flex; flex-direction: column; background: white; margin: 1rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
      .preview-area { display: flex; flex-direction: column; background: white; margin: 1rem 1rem 1rem 0; border-radius: 0.75rem; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
      .preview-content { flex: 1; overflow-y: auto; padding: 2rem; background: white; }
      
      .toolbar { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 0.5rem; display: flex; gap: 0.25rem; flex-wrap: wrap; align-items: center; }
      
      .tiptap-container { flex: 1; overflow-y: auto; padding: 1.5rem; position: relative; }
      .ProseMirror { outline: none; min-height: 100%; font-size: 0.9375rem; line-height: 1.6; color: #334155; }
      
      .footer-actions { border-top: 1px solid #e2e8f0; padding: 0.75rem 1.5rem; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
      .status-badge { font-size: 0.75rem; color: #64748b; display: flex; align-items: center; gap: 0.35rem; }
      .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #cbd5e1; }
      .status-dot.active { background: #22c55e; }

      .settings-section { background: white; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.5rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
      .settings-section h3 { margin-top: 0; margin-bottom: 1.25rem; font-size: 1rem; color: #0f172a; }

      .plugin-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem; display: flex; justify-content: space-between; align-items: flex-start; }
      .plugin-info h4 { margin: 0; font-size: 0.9375rem; color: #1e293b; }
      .plugin-info p { margin: 0.25rem 0 0; font-size: 0.8125rem; color: #64748b; }

      .docs-card { background: white; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.5rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
      .docs-card h3 { margin: 0; color: #f26; font-family: monospace; font-size: 1.125rem; }
      .docs-tag { font-size: 0.75rem; background: #fff1f2; padding: 0.25rem 0.5rem; border-radius: 0.25rem; color: #f26; font-weight: 600; }
      .docs-props { background: #0f172a; border-radius: 0.5rem; padding: 1rem; margin-top: 1rem; overflow-x: auto; }
      .docs-props pre { margin: 0; font-family: 'JetBrains Mono', monospace; font-size: 0.8125rem; color: #e2e8f0; }
    `}</style>
  );
}

function AdminScripts() {
  return (
    <script type="module" dangerouslySetInnerHTML={{ __html: `
      import { Editor } from 'https://esm.sh/@tiptap/core'
      import StarterKit from 'https://esm.sh/@tiptap/starter-kit'
      import Placeholder from 'https://esm.sh/@tiptap/extension-placeholder'

      let currentPath = '';
      let previewTimeout = null;
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced'
      });

      // Initialize Tiptap
      window.editor = new Editor({
        element: document.querySelector('#editor'),
        extensions: [
          StarterKit,
          Placeholder.configure({
            placeholder: 'Start writing your story...',
          }),
        ],
        content: '',
        onUpdate: ({ editor }) => {
          document.getElementById('status-dot').className = 'status-dot';
          document.getElementById('status-text').textContent = 'Unsaved changes';
          updatePreview();
        },
      });

      window.switchTab = function(tab) {
        document.getElementById('view-editor').style.display = tab === 'editor' ? 'grid' : 'none';
        document.getElementById('view-docs').style.display = tab === 'docs' ? 'block' : 'none';
        document.getElementById('view-settings').style.display = tab === 'settings' ? 'block' : 'none';
        
        document.getElementById('nav-editor').classList.toggle('active', tab === 'editor');
        document.getElementById('nav-docs').classList.toggle('active', tab === 'docs');
        document.getElementById('nav-settings').classList.toggle('active', tab === 'settings');

        if (tab === 'docs') loadDocs();
        if (tab === 'settings') loadSettings();
        
        if (tab === 'editor') {
            document.getElementById('file-info').textContent = currentPath ? 'Editing: ' + currentPath : '';
        } else {
            document.getElementById('file-info').textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
        }
      }

      async function loadSettings() {
        const res = await fetch('/api/settings');
        const data = await res.json();
        
        // Render Global Settings
        document.getElementById('global-settings').innerHTML = \`
          <div style="font-size:0.875rem; color:#475569;">
            <p><strong>Site Name:</strong> \${data.config.siteName}</p>
            <p><strong>Theme:</strong> \${data.config.theme}</p>
          </div>
        \`;

        // Render Plugins
        document.getElementById('plugins-list').innerHTML = data.plugins.map(p => \`
          <div class="plugin-card">
            <div class="plugin-info">
              <h4>\${p.name || p.id}</h4>
              <p>\${p.description || 'No description'}</p>
            </div>
            <div style="font-size:0.75rem; color:#94a3b8;">v\${p.version || '0.0.0'}</div>
          </div>
        \`).join('') || '<p style="color:#94a3b8; font-size:0.875rem;">No plugins installed.</p>';
      }

      async function loadDocs() {
        const res = await fetch('/api/docs');
        const docs = await res.json();
        document.getElementById('docs-list').innerHTML = docs.map(doc => \`
          <div class="docs-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
              <div style="display:flex; flex-direction:column; gap:0.25rem;">
                <div style="font-size:0.625rem; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:0.1em;">Tag & Function</div>
                <h3>\${doc.tag} <span style="color:#cbd5e1; font-weight:400; margin-left:0.5rem; font-size:0.875rem;">\${doc.functionName}</span></h3>
              </div>
              <span class="docs-tag">\${doc.name}.tsx</span>
            </div>
            <div style="color:#475569; line-height:1.7; font-size:0.9375rem; margin-bottom:1.5rem; white-space:pre-wrap;">\${doc.description}</div>
            <div class="docs-props">
              <div style="font-size:0.625rem; font-weight:800; color:#64748b; margin-bottom:0.75rem; text-transform:uppercase; letter-spacing:0.1em;">Interface Definitions</div>
              <pre>\${doc.props}</pre>
            </div>
          </div>
        \`).join('');
      }

      async function updatePreview() {
          if (previewTimeout) clearTimeout(previewTimeout);
          previewTimeout = setTimeout(async () => {
              const html = window.editor.getHTML();
              const markdownBody = turndownService.turndown(html);
              const fullMarkdown = (window.currentFM || '') + '\\n\\n' + markdownBody;
              
              const res = await fetch('/api/preview', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ content: fullMarkdown })
              });
              if (res.ok) {
                  const previewHtml = await res.text();
                  document.getElementById('preview').innerHTML = previewHtml;
              }
          }, 500);
      }

      async function loadPosts() {
        const res = await fetch('/api/posts');
        const posts = await res.json();
        document.getElementById('posts-list').innerHTML = posts.map(p => 
          \`<div class="post-item" onclick="editPost('\${p}', this)">\${p}</div>\`
        ).join('');
      }

      window.editPost = async function(path, el) {
        document.querySelectorAll('.post-item').forEach(l => l.classList.remove('active'));
        el.classList.add('active');
        
        currentPath = path;
        document.getElementById('file-info').textContent = 'Editing: ' + path;
        document.getElementById('editor-layout').style.display = 'grid';
        document.getElementById('empty-state').style.display = 'none';
        
        const res = await fetch('/api/post-content?path=' + path);
        const markdown = await res.text();
        
        const fmMatch = markdown.match(/^---\\n([\\s\\S]*?)\\n---/);
        let fm = '';
        let body = markdown;
        if (fmMatch) {
          fm = fmMatch[0];
          body = markdown.replace(fm, '');
        }
        
        window.currentFM = fm;
        const html = marked.parse(body);
        
        window.editor.commands.setContent(html);
        document.getElementById('status-dot').className = 'status-dot active';
        document.getElementById('status-text').textContent = 'Saved';
        updatePreview();
      }

      window.savePost = async function() {
        const saveBtn = document.querySelector('.btn-save');
        const statusText = document.getElementById('status-text');
        
        try {
          const html = window.editor.getHTML();
          const markdownBody = turndownService.turndown(html);
          const fullMarkdown = (window.currentFM || '') + '\\n\\n' + markdownBody;
          const res = await fetch('/api/save-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: currentPath, content: fullMarkdown })
          });
          if (res.ok) {
            document.getElementById('status-dot').className = 'status-dot active';
            statusText.textContent = 'Changes saved';
          }
        } catch (e) {
          statusText.textContent = 'Error saving';
        }
      }

      loadPosts();
    ` }} />
  );
}
