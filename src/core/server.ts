import { watch, type FSWatcher } from "chokidar";
import { Compiler } from "./compiler";
import { join } from "node:path";
import { readFile, writeFile, readdir } from "node:fs/promises";
import { parse as yamlParse } from "yaml";
import { AdminGUI } from "./admin/index";

export class DevServer {
  private compiler: Compiler;
  private port: number;
  private watcher: FSWatcher | null = null;
  private server: any = null;
  private sseClients: Set<any> = new Set();

  constructor(port: number = 3000) {
    this.compiler = new Compiler();
    this.port = port;
  }

  async stop() {
    console.log("\n🛑 Stopping dev server...");
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    for (const client of this.sseClients) {
      try { client.close(); } catch {}
    }
    this.sseClients.clear();
    if (this.server) {
      this.server.stop(true); // Force close connections
      this.server = null;
    }
    console.log("✅ Server stopped.");
  }

  async start() {
    await this.compiler.loadConfig();
    await this.compiler.build();

    // Watch for changes
    this.watcher = watch(process.cwd(), { 
      ignored: /dist|\.git|node_modules/,
      ignoreInitial: true 
    }).on("change", async (path) => {
      console.log(`\n♻️ File changed: ${path}. Rebuilding...`);
      try {
        await this.compiler.buildFile(path);
        // Notify clients to reload
        this.notifyClients("reload");
      } catch (e) {
        console.error("❌ Rebuild failed:", e);
      }
    });

    // Handle graceful shutdown
    const shutdown = async () => {
      await this.stop();
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    console.log(`\n🚀 Dev server started at http://localhost:${this.port}`);
    console.log(`📂 Admin GUI at http://localhost:${this.port}/mofuri-admin`);

    this.server = Bun.serve({
      port: this.port,
      idleTimeout: 30, // Increase timeout
      fetch: async (req) => {
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

        // Admin API: Live Preview
        if (url.pathname === "/api/preview" && req.method === "POST") {
          const { content } = await req.json() as { content: string };
          try {
            const html = await this.compiler.compileMarkdown(content);
            return new Response(html, {
              headers: { "Content-Type": "text/html; charset=utf-8" }
            });
          } catch (e) {
            return new Response("Preview failed", { status: 500 });
          }
        }

        // Admin API: Docs
        if (url.pathname === "/api/docs") {
          try {
            const docs = await this.compiler.getDocs();
            return new Response(JSON.stringify(docs), {
              headers: { "Content-Type": "application/json" }
            });
          } catch (e) {
            return new Response("Docs failed", { status: 500 });
          }
        }

        // Admin API: Settings (Get all manifests)
        if (url.pathname === "/api/settings" && req.method === "GET") {
          try {
            const config = yamlParse(await readFile(join(process.cwd(), "mofuri.yaml"), "utf-8"));
            
            // Get theme manifest
            let themeManifest = {};
            try {
              themeManifest = yamlParse(await readFile(join(process.cwd(), "themes", config.theme, "manifest.yaml"), "utf-8"));
            } catch {}

            // Get plugins manifests
            const plugins: any[] = [];
            for (const p of config.plugins || []) {
              try {
                const manifest = yamlParse(await readFile(join(process.cwd(), "plugins", p, "manifest.yaml"), "utf-8"));
                plugins.push({ id: p, ...manifest });
              } catch {
                plugins.push({ id: p, name: p, error: "Manifest not found" });
              }
            }

            return new Response(JSON.stringify({ config, theme: themeManifest, plugins }), {
              headers: { "Content-Type": "application/json" }
            });
          } catch (e) {
            return new Response("Settings failed", { status: 500 });
          }
        }

        // Fast Reload: SSE Endpoint
        if (url.pathname === "/api/sse") {
          return new Response(new ReadableStream({
            start: (controller) => {
              this.sseClients.add(controller);
              controller.enqueue(new TextEncoder().encode("data: connected\n\n"));
            },
            cancel: (controller) => {
              this.sseClients.delete(controller);
            }
          }), {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive"
            }
          });
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
            let content = await file.text();
            
            // Inject Fast Reload script into HTML
            if (filePath.endsWith(".html")) {
              const reloadScript = `
                <script>
                  const sse = new EventSource('/api/sse');
                  sse.onmessage = (e) => {
                    if (e.data === 'reload') {
                      console.log('♻️ Fast reloading...');
                      location.reload();
                    }
                  };
                </script>
              `;
              content = content.replace("</body>", `${reloadScript}</body>`);
            }
            
            return new Response(content, {
              headers: { "Content-Type": Bun.file(filePath).type }
            });
          }
        } catch (e) {}

        return new Response("404 Not Found", { status: 404 });
      },
    });
  }

  private notifyClients(msg: string) {
    const data = new TextEncoder().encode(`data: ${msg}\n\n`);
    for (const client of this.sseClients) {
      try {
        client.enqueue(data);
      } catch (e) {
        this.sseClients.delete(client);
      }
    }
  }
}

async function getAdminHTML() {
  return AdminGUI() as any as string;
}
