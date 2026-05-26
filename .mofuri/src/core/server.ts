import { watch } from "chokidar";
import { Compiler } from "./compiler";
import { join } from "node:path";
import { readFile, writeFile, readdir } from "node:fs/promises";

export class DevServer {
  private compiler: Compiler;
  private port: number;

  constructor(port: number = 3000) {
    this.compiler = new Compiler();
    this.port = port;
  }

  async start() {
    await this.compiler.loadConfig();
    await this.compiler.build();

    // Watch for changes
    watch(process.cwd(), { ignored: /dist|\.git|node_modules/ }).on("change", async (path) => {
      console.log(`\n♻️ File changed: ${path}. Rebuilding...`);
      try {
        await this.compiler.build();
      } catch (e) {
        console.error("❌ Rebuild failed:", e);
      }
    });

    console.log(`\n🚀 Dev server started at http://localhost:${this.port}`);
    console.log(`📂 Admin GUI at http://localhost:${this.port}/mofuri-admin`);

    const server = Bun.serve({
      port: this.port,
      async fetch(req) {
        const url = new URL(req.url);
        
        // Admin GUI
        if (url.pathname === "/mofuri-admin") {
          return new Response(await getAdminHTML(), {
            headers: { "Content-Type": "text/html; charset=utf-8" }
          });
        }

        // Admin API: List posts
        if (url.pathname === "/api/posts" && req.method === "GET") {
          const posts = await readdir("posts");
          return new Response(JSON.stringify(posts), {
            headers: { "Content-Type": "application/json" }
          });
        }

        // Admin API: Get post content
        if (url.pathname === "/api/post-content" && req.method === "GET") {
          const postPath = url.searchParams.get("path");
          if (!postPath) return new Response("Missing path", { status: 400 });
          try {
            const content = await readFile(join("posts", postPath), "utf-8");
            return new Response(content);
          } catch (e) {
            return new Response("File not found", { status: 404 });
          }
        }

        // Admin API: Save post content
        if (url.pathname === "/api/save-post" && req.method === "POST") {
          const { path, content } = await req.json() as { path: string, content: string };
          if (!path || content === undefined) return new Response("Missing data", { status: 400 });
          try {
            await writeFile(join("posts", path), content);
            return new Response("Saved", { status: 200 });
          } catch (e) {
            return new Response("Save failed", { status: 500 });
          }
        }

        // Static files service (from dist)
        let filePath = url.pathname;
        if (filePath === "/") filePath = "/index.html";
        
        // Handle pretty URLs (e.g., /hello-world -> /hello-world/index.html)
        if (!filePath.includes(".")) {
          filePath = join(filePath, "index.html");
        }

        try {
          const file = Bun.file(join("dist", filePath));
          if (await file.exists()) {
            return new Response(file);
          }
        } catch (e) {}

        return new Response("404 Not Found", { status: 404 });
      },
    });
  }
}

async function getAdminHTML() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Mofuri Admin</title>
      <style>
        body { font-family: system-ui; padding: 2rem; max-width: 1000px; margin: 0 auto; background: #f0f2f5; height: 100vh; display: flex; flex-direction: column; }
        .container { display: grid; grid-template-columns: 250px 1fr; gap: 2rem; flex: 1; min-height: 0; }
        .card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; flex-direction: column; }
        h1 { color: #f26; margin-top: 0; }
        ul { list-style: none; padding: 0; }
        li { padding: 0.5rem; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s; }
        li:hover { background: #f0f2f5; }
        li.active { background: #f26; color: white; }
        .editor-container { display: flex; flex-direction: column; gap: 1rem; flex: 1; }
        textarea { flex: 1; font-family: monospace; padding: 1rem; border: 1px solid #ddd; border-radius: 4px; resize: none; font-size: 1rem; }
        .actions { display: flex; justify-content: flex-end; gap: 1rem; }
        button { background: #f26; color: white; border: none; padding: 0.5rem 1.5rem; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 1rem; }
        button:disabled { background: #ccc; }
        .status { font-size: 0.9rem; color: #666; align-self: center; }
      </style>
    </head>
    <body>
      <div style="margin-bottom: 2rem;">
        <h1>🐾 Mofuri Admin</h1>
      </div>
      <div class="container">
        <div class="card">
          <h3>Posts</h3>
          <div id="posts-list">Loading...</div>
        </div>
        <div class="card editor-container">
          <div id="current-post-title" style="font-weight: bold; margin-bottom: 0.5rem;">Select a post to edit</div>
          <textarea id="editor" disabled></textarea>
          <div class="actions">
            <span id="status" class="status"></span>
            <button id="save-btn" disabled onclick="savePost()">Save Changes</button>
          </div>
        </div>
      </div>

      <script>
        let currentPath = '';
        const editor = document.getElementById('editor');
        const saveBtn = document.getElementById('save-btn');
        const status = document.getElementById('status');
        const title = document.getElementById('current-post-title');

        async function loadPosts() {
          const res = await fetch('/api/posts');
          const posts = await res.json();
          document.getElementById('posts-list').innerHTML = '<ul>' + 
            posts.map(p => \`<li onclick="editPost('\${p}', this)">\${p}</li>\`).join('') + 
            '</ul>';
        }

        async function editPost(path, el) {
          document.querySelectorAll('li').forEach(l => l.classList.remove('active'));
          el.classList.add('active');
          
          currentPath = path;
          title.textContent = 'Editing: ' + path;
          status.textContent = 'Loading...';
          
          const res = await fetch('/api/post-content?path=' + path);
          const content = await res.text();
          
          editor.value = content;
          editor.disabled = false;
          saveBtn.disabled = false;
          status.textContent = 'Ready';
        }

        async function savePost() {
          saveBtn.disabled = true;
          status.textContent = 'Saving...';
          
          try {
            const res = await fetch('/api/save-post', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: currentPath, content: editor.value })
            });
            
            if (res.ok) {
              status.textContent = 'Last saved: ' + new Date().toLocaleTimeString();
            } else {
              status.textContent = 'Save failed!';
            }
          } catch (e) {
            status.textContent = 'Error saving!';
          } finally {
            saveBtn.disabled = false;
          }
        }

        loadPosts();
      </script>
    </body>
    </html>
  `;
}
