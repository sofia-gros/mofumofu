import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { join, parse, extname } from "node:path";
import fm from "front-matter";
import { marked } from "marked";
import { parse as yamlParse } from "yaml";
import { Bundler } from "./bundler";

export interface MofuriConfig {
  siteName: string;
  theme: string;
  plugins: string[];
}

export interface PostData {
  title: string;
  date: Date;
  content: string;
  [key: string]: any;
}

export interface RenderContext {
  siteName: string;
  post?: PostData;
  page?: any;
}

export class Compiler {
  private config!: MofuriConfig;
  private projectDir: string;
  private themeDir!: string;
  private globalContext: Record<string, any> = {};

  constructor(projectDir: string = process.cwd()) {
    this.projectDir = projectDir;
  }

  async loadConfig() {
    const configPath = join(this.projectDir, "mofuri.yaml");
    const configContent = await readFile(configPath, "utf-8");
    this.config = yamlParse(configContent) as MofuriConfig;
    this.themeDir = join(this.projectDir, "themes", this.config.theme);
  }

  async loadPluginContexts() {
    // ...
  }

  async getDocs() {
    const docs: any[] = [];
    
    const dirsToScan = [
      { path: join(this.themeDir, "components"), type: "theme" },
      { path: join(this.projectDir, "plugins"), type: "plugins-dir" },
    ];

    for (const dirInfo of dirsToScan) {
      const { path: dir, type } = dirInfo;
      console.log(`🔍 Scanning ${type}: ${dir}`);
      try {
        if (type === "plugins-dir") {
          const plugins = await readdir(dir, { withFileTypes: true });
          for (const plugin of plugins) {
            if (plugin.isDirectory()) {
              const compDir = join(dir, plugin.name, "components");
              try {
                const comps = await readdir(compDir);
                for (const comp of comps) {
                  if (comp.endsWith(".tsx")) {
                    docs.push(await this.extractMetadata(join(compDir, comp)));
                  }
                }
              } catch {}
            }
          }
        } else {
          const entries = await readdir(dir);
          for (const entry of entries) {
            if (entry.endsWith(".tsx")) {
              docs.push(await this.extractMetadata(join(dir, entry)));
            }
          }
        }
      } catch (e: any) {
        console.log(`⚠️ Skip ${dir}: ${e.message}`);
      }
    }

    return docs;
  }

  private async extractMetadata(filePath: string) {
    const content = await readFile(filePath, "utf-8");
    const filename = parse(filePath).name;
    
    // Extract description from JSDoc
    const jsDocMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
    const description = jsDocMatch ? jsDocMatch[1]?.replace(/\n\s*\* ?/g, "\n").trim() : "No description provided.";
    
    // Extract Props (more flexible interface/type extraction)
    const propsMatch = content.match(/(?:interface|type)\s+\w+Props\s*(?:=)?\s*\{([\s\S]*?)\}/) || 
                       content.match(/(?:interface|type)\s+\w+\s*(?:=)?\s*\{([\s\S]*?)\}/);
    let props = propsMatch ? propsMatch[1]?.trim() : "Props definition not found.";

    // Extract Function Name
    const fnMatch = content.match(/export\s+default\s+function\s+(\w+)/);
    const functionName = fnMatch ? fnMatch[1] : filename;
    
    return {
      name: filename,
      functionName,
      tag: `<m-${filename} />`,
      description,
      props,
      path: filePath
    };
  }

  async build() {
    console.log("🛠 Building static site...");
    await this.loadConfig();
    await this.loadPluginContexts();

    const distDir = join(this.projectDir, "dist");
    await mkdir(distDir, { recursive: true });

    // 1. Build posts
    const postsDir = join(this.projectDir, "posts");
    const postFiles = (await readdir(postsDir)).filter(f => f.endsWith(".md"));
    const posts: PostData[] = [];

    const singleTemplatePath = join(this.themeDir, "pages", "single.mofuri");
    const singleTemplate = await this.parseMofuriSFC(singleTemplatePath);

    for (const file of postFiles) {
      await this.buildPost(file, singleTemplate);
      console.log(`  📄 Compiled post: ${file}`);
    }

    // 2. Build index page
    await this.buildIndex(posts);

    // 3. Bundle assets
    const bundler = new Bundler(this.projectDir);
    await bundler.bundle();

    console.log("✅ Build completed!");
  }

  /**
   * Incremental build for a specific file
   */
  async buildFile(path: string) {
    await this.loadConfig();
    await this.loadPluginContexts();

    if (path.includes("posts") && path.endsWith(".md")) {
      const filename = parse(path).base;
      const singleTemplatePath = join(this.themeDir, "pages", "single.mofuri");
      const singleTemplate = await this.parseMofuriSFC(singleTemplatePath);
      await this.buildPost(filename, singleTemplate);
      console.log(`  ♻️ Incremental build: ${filename}`);
    } else {
      // For themes or components, we rebuild everything for now
      // but we could optimize this further in the future.
      await this.build();
    }
  }

  private async buildPost(file: string, template: any) {
    const postsDir = join(this.projectDir, "posts");
    const content = await readFile(join(postsDir, file), "utf-8");
    const { attributes, body } = fm(content) as { attributes: any, body: string };
    
    const postData: PostData = {
      ...attributes,
      slug: parse(file).name,
      content: await marked(body || "")
    };

    const html = await this.renderTemplate(template, {
      siteName: this.config.siteName,
      post: postData
    });

    const finalHtml = await this.processCustomTags(html);
    const outputDir = join(this.projectDir, "dist", postData.slug);
    await mkdir(outputDir, { recursive: true });
    await writeFile(join(outputDir, "index.html"), finalHtml);
  }

  private async buildIndex(posts: PostData[]) {
    const indexTemplatePath = join(this.themeDir, "pages", "index.mofuri");
    let html = "";
    try {
      const sfc = await this.parseMofuriSFC(indexTemplatePath);
      html = await this.renderTemplate(sfc, {
        siteName: this.config.siteName,
        posts: posts
      });
    } catch (e) {
      html = `<h1>${this.config.siteName}</h1><ul>` + 
        posts.map(p => `<li><a href="/${p.slug}">${p.title}</a></li>`).join("") + 
        "</ul>";
    }
    
    const finalHtml = await this.processCustomTags(html);
    await writeFile(join(this.projectDir, "dist", "index.html"), finalHtml);
    console.log("  📄 Generated root: /index.html");
  }

  private async processCustomTags(html: string): Promise<string> {
    let result = html;

    // 1. Match <m-tag ...> or <m-tag ...>...</m-tag>
    const mTagRegex = /<m-([a-z0-9-]+)\s*([^>]*?)\s*(?:\/|>([\s\S]*?)<\/m-\1)>/gi;
    // 2. Match [Tag ...] shortcodes
    const shortcodeRegex = /\[([A-Z][a-zA-Z0-9-]+)\s*([^\]]*?)\]/g;

    const process = async (tagName: string, attrString: string, content?: string) => {
      const attrs: Record<string, string> = {};
      if (attrString) {
        // Handle both "val" and &quot;val&quot; (from markdown)
        const normalizedAttrs = attrString.replace(/&quot;/g, '"');
        const attrRegex = /([a-z0-9-]+)=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(normalizedAttrs)) !== null) {
          if (attrMatch[1]) {
            attrs[attrMatch[1]] = attrMatch[2] || attrMatch[3] || attrMatch[4] || "";
          }
        }
      }

      // Convert PascalCase/CamelCase to kebab-case for filename matching
      const kebabName = tagName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      return await this.renderComponent(kebabName, attrs, content || "");
    };

    // Process <m-tag>
    const mMatches = Array.from(html.matchAll(mTagRegex));
    for (const match of mMatches) {
      const [fullTag, tagName, attrString, content] = match;
      if (tagName && attrString !== undefined) {
        const replacement = await process(tagName, attrString, content);
        result = result.replace(fullTag, replacement);
      }
    }

    // Process [Shortcode]
    const sMatches = Array.from(result.matchAll(shortcodeRegex));
    for (const match of sMatches) {
      const [fullTag, tagName, attrString] = match;
      if (tagName && attrString !== undefined) {
        const replacement = await process(tagName, attrString);
        result = result.replace(fullTag, replacement);
      }
    }

    return result;
  }

  private async renderComponent(name: string, props: any, content?: string): Promise<string> {
    const themePath = join(this.themeDir, "components", `${name}.tsx`);
    let componentPath = "";

    // 1. Check theme
    try {
      await readFile(themePath);
      componentPath = themePath;
    } catch {
      // 2. Check plugins
      try {
        const pluginsDir = join(this.projectDir, "plugins");
        const plugins = await readdir(pluginsDir);
        for (const p of plugins) {
          const pPath = join(pluginsDir, p, "components", `${name}.tsx`);
          try {
            await readFile(pPath);
            componentPath = pPath;
            break;
          } catch {}
        }
      } catch {}

      if (!componentPath) {
        return `<!-- Component m-${name} not found -->`;
      }
    }

    try {
      const module = await import(componentPath);
      const Component = module.default || module[name.replace(/-/g, "")];
      
      if (typeof Component === "function") {
        // Pass props, children, and global context
        const result = Component({ ...this.globalContext, ...props, children: content });
        return result.toString();
      }
      return `<!-- m-${name} is not a valid component -->`;
    } catch (error: any) {
      console.error(`Error rendering component m-${name}:`, error);
      return `<!-- Error rendering m-${name} -->`;
    }
  }

  private async parseMofuriSFC(path: string) {
    const content = await readFile(path, "utf-8");
    
    const serverScript = content.match(/<script type="server">([\s\S]*?)<\/script>/)?.[1] || "";
    const template = content.match(/<template>([\s\S]*?)<\/template>/)?.[1] || "";
    const clientScript = content.match(/<script>([\s\S]*?)<\/script>/)?.[1] || "";
    const style = content.match(/<style>([\s\S]*?)<\/style>/)?.[1] || "";

    return { serverScript, template, clientScript, style };
  }

  private async renderTemplate(sfc: any, context: RenderContext | any) {
    // 1. Evaluate server script
    const keys = ["post", "posts", "siteName", ...Object.keys(this.globalContext)];
    const values = [context.post, context.posts, context.siteName, ...Object.values(this.globalContext)];

    const serverFn = new Function(...keys, `
      let exports = {};
      ${sfc.serverScript}
      return { post, posts, siteName, ...exports };
    `);
    
    const data = { ...this.globalContext, ...serverFn(...values) };

    // 2. Evaluate template
    let html = sfc.template;
    
    const evalTemplate = (tpl: string, scope: any) => {
      const sKeys = Object.keys(scope);
      const sValues = Object.values(scope);
      try {
        return new Function(...sKeys, `return \`${tpl}\`;`)(...sValues);
      } catch (error: any) {
        console.warn("Template evaluation error:", error.message);
        return tpl; 
      }
    };

    html = evalTemplate(html, data);

    // 3. Inject client script and style
    const styleTag = sfc.style ? `<style>${sfc.style}</style>` : "";
    const scriptTag = sfc.clientScript ? `<script>${sfc.clientScript}</script>` : "";
    
    if (html.includes("</head>")) {
      html = html.replace("</head>", `${styleTag}\n</head>`);
    } else if (html.includes("<head>")) {
      html = html.replace("<head>", `<head>\n${styleTag}`);
    } else {
      html = styleTag + html;
    }

    if (html.includes("</body>")) {
      html = html.replace("</body>", `${scriptTag}\n</body>`);
    } else {
      html = html + scriptTag;
    }

    return html;
  }

  /**
   * Helper for Live Preview, converts raw markdown + custom tags to HTML
   */
  async compileMarkdown(content: string) {
    const { body } = fm(content) as { body: string };
    const html = await marked(body);
    return await this.processCustomTags(html);
  }
}
