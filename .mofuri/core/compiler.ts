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
  private collectedStyles: string[] = [];

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
      } catch (e: any) {}
    }
    return docs;
  }

  private async extractMetadata(filePath: string) {
    const content = await readFile(filePath, "utf-8");
    const filename = parse(filePath).name;
    const jsDocMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
    const description = jsDocMatch ? jsDocMatch[1]?.replace(/\n\s*\* ?/g, "\n").trim() : "No description provided.";
    const propsMatch = content.match(/(?:interface|type)\s+\w+Props\s*(?:=)?\s*\{([\s\S]*?)\}/) || 
                       content.match(/(?:interface|type)\s+\w+\s*(?:=)?\s*\{([\s\S]*?)\}/);
    let props = propsMatch ? propsMatch[1]?.trim() : "Props definition not found.";
    const fnMatch = content.match(/export\s+default\s+function\s+(\w+)/);
    const functionName = fnMatch ? fnMatch[1] : filename;
    return { name: filename, functionName, tag: `<m-${filename} />`, description, props, path: filePath };
  }

  async build() {
    console.log("🛠 Building static site...");
    await this.loadConfig();
    await this.loadPluginContexts();

    const distDir = join(this.projectDir, "dist");
    await mkdir(distDir, { recursive: true });

    // 1. Collect posts data
    const postsDir = join(this.projectDir, "posts");
    let posts: PostData[] = [];
    try {
      const postFiles = (await readdir(postsDir)).filter(f => f.endsWith(".md"));
      for (const file of postFiles) {
        const post = await this.parsePost(file);
        if (post) posts.push(post);
      }
      posts.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
    } catch (e) {}

    // 2. Identify all pages (Theme priority shadowing logic)
    const pageMap = new Map<string, string>();
    
    // A. Load from root pages/
    try {
      const rootPagesDir = join(this.projectDir, "pages");
      const rootPageFiles = (await readdir(rootPagesDir)).filter(f => f.endsWith(".mofuri"));
      for (const file of rootPageFiles) {
        pageMap.set(parse(file).name, join(rootPagesDir, file));
      }
    } catch (e) {}

    // B. Load from themes/<theme>/pages/ (Overwrites root)
    try {
      const themePagesDir = join(this.themeDir, "pages");
      const themePageFiles = (await readdir(themePagesDir)).filter(f => f.endsWith(".mofuri"));
      for (const file of themePageFiles) {
        pageMap.set(parse(file).name, join(themePagesDir, file));
      }
    } catch (e) {}

    // 3. Render pages
    for (const [slug, path] of pageMap) {
      if (slug === "single") continue;
      const sfc = await this.parseMofuriSFC(path);
      const html = await this.renderTemplate(sfc, { siteName: this.config.siteName, posts });
      const finalHtml = await this.processCustomTags(html);
      
      if (slug === "index") {
        await writeFile(join(distDir, "index.html"), finalHtml);
        console.log(`  📄 Generated root: /index.html (source: ${path})`);
      } else {
        const outputDir = join(distDir, slug);
        await mkdir(outputDir, { recursive: true });
        await writeFile(join(outputDir, "index.html"), finalHtml);
        console.log(`  📄 Generated page: /${slug} (source: ${path})`);
      }
    }

    // 4. Render articles using single.mofuri (Theme priority)
    const singleTemplatePath = pageMap.get("single");
    if (singleTemplatePath) {
      const singleSfc = await this.parseMofuriSFC(singleTemplatePath);
      for (const post of posts) {
        const html = await this.renderTemplate(singleSfc, { siteName: this.config.siteName, post });
        const finalHtml = await this.processCustomTags(html);
        const outputDir = join(distDir, post.slug);
        await mkdir(outputDir, { recursive: true });
        await writeFile(join(outputDir, "index.html"), finalHtml);
        console.log(`  📄 Compiled post: /${post.slug} (template: ${singleTemplatePath})`);
      }
    }

    const bundler = new Bundler(this.projectDir);
    await bundler.bundle();
    console.log("✅ Build completed!");
  }

  async buildFile(filename: string) {
    // For now, simpler to just trigger full build to ensure consistency
    // but we could optimize this later.
    await this.build();
  }

  private async parsePost(file: string): Promise<PostData | null> {
    try {
      const postsDir = join(this.projectDir, "posts");
      const content = await readFile(join(postsDir, file), "utf-8");
      const { attributes, body } = fm(content) as { attributes: any, body: string };
      return { ...attributes, slug: parse(file).name, date: attributes.date ? new Date(attributes.date) : new Date(), content: await marked(body || "") };
    } catch (e) { return null; }
  }

  private async processCustomTags(html: string): Promise<string> {
    let result = html;
    const mTagRegex = /<m-([a-z0-9-]+)\s*([^>]*?)\s*(?:\/|>([\s\S]*?)<\/m-\1)>/gi;
    // Updated shortcode regex to capture both tag and attributes better
    const shortcodeRegex = /\[([a-z0-9-]+)\s*([^\]]*?)\]/g;

    const process = async (tagName: string, attrString: string, content?: string) => {
      const attrs: Record<string, string> = {};
      if (attrString) {
        const normalizedAttrs = attrString.replace(/&quot;/g, '"');
        const attrRegex = /([a-z0-9-]+)=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(normalizedAttrs)) !== null) {
          if (attrMatch[1]) attrs[attrMatch[1]] = attrMatch[2] || attrMatch[3] || attrMatch[4] || "";
        }
      }
      const kebabName = tagName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      
      // Recursively process nested tags in content
      let processedContent = content || "";
      if (processedContent) {
        processedContent = await this.processCustomTags(processedContent);
        processedContent = await marked(processedContent.trim());
      }
      
      return await this.renderComponent(kebabName, attrs, processedContent);
    };

    let hasMatches = true;
    while (hasMatches) {
      const mMatch = mTagRegex.exec(result);
      if (mMatch) {
        const [fullTag, tagName, attrString, content] = mMatch;
        const replacement = await process(tagName, attrString, content);
        result = result.replace(fullTag, replacement);
        mTagRegex.lastIndex = 0;
      } else {
        const sMatch = shortcodeRegex.exec(result);
        if (sMatch) {
          const [fullTag, tagName, attrString] = sMatch;
          const replacement = await process(tagName, attrString);
          result = result.replace(fullTag, replacement);
          shortcodeRegex.lastIndex = 0;
        } else {
          hasMatches = false;
        }
      }
    }

    return result;
  }

  private async renderComponent(name: string, props: any, content?: string): Promise<string> {
    const themePath = join(this.themeDir, "components", `${name}.tsx`);
    let componentPath = "";
    try { await readFile(themePath); componentPath = themePath; } catch {
      try {
        const pluginsDir = join(this.projectDir, "plugins");
        const plugins = await readdir(pluginsDir);
        for (const p of plugins) {
          const pPath = join(pluginsDir, p, "components", `${name}.tsx`);
          try { await readFile(pPath); componentPath = pPath; break; } catch {}
        }
      } catch {}
      if (!componentPath) return `<!-- Component m-${name} not found -->`;
    }
    try {
      // Use query param to bypass Bun/Node import cache during dev
      const module = await import(`${componentPath}?update=${Date.now()}`);
      const Component = module.default || module[name.replace(/-/g, "")];
      if (typeof Component === "function") return Component({ ...this.globalContext, ...props, children: content }).toString();
      return `<!-- m-${name} is not a valid component -->`;
    } catch (error: any) { return `<!-- Error rendering m-${name} -->`; }
  }

  private async parseMofuriSFC(path: string) {
    const content = await readFile(path, "utf-8");
    const serverScript = content.match(/<script type="server">([\s\S]*?)<\/script>/)?.[1] || "";
    const template = content.match(/<template>([\s\S]*?)<\/template>/)?.[1] || "";
    const clientScript = content.match(/<script>([\s\S]*?)<\/script>/)?.[1] || "";
    const style = content.match(/<style>([\s\S]*?)<\/style>/)?.[1] || "";
    return { serverScript, template, clientScript, style };
  }

  private registerStyle(css: string) {
    if (!this.collectedStyles.includes(css)) {
      this.collectedStyles.push(css);
    }
  }

  private async renderTemplate(sfc: any, context: any) {
    const keys = ["post", "posts", "siteName", ...Object.keys(this.globalContext)];
    const values = [context.post, context.posts, context.siteName, ...Object.values(this.globalContext)];
    
    // Transpile static imports to dynamic imports for simple cases in server scripts
    const transpiledScript = sfc.serverScript.replace(
      /import\s+({[\s\S]+?}|[*]\s+as\s+\w+|\w+)\s+from\s+(['"])(.+?)\2;?/g,
      (match: string, imports: string, quote: string, path: string) => {
        if (imports.startsWith('{')) return `const ${imports} = await import('${path}');`;
        if (imports.startsWith('*')) return `const ${imports.replace('* as ', '')} = await import('${path}');`;
        return `const { default: ${imports} } = await import('${path}');`;
      }
    );

    // Wrap server script in an async IIFE to support top-level await
    const serverScript = `(async () => { let exports = {}; ${transpiledScript}; return { post, posts, siteName, ...exports }; })()`;
    let data = { ...this.globalContext };
    try {
      const result = await new Function(...keys, `return ${serverScript}`)(...values);
      data = { ...data, ...result };
    } catch (e) {
      console.error("Server Script Error:", e);
    }
    
    let html = sfc.template;
    const evalTemplate = (tpl: string, scope: any) => {
      const sKeys = Object.keys(scope);
      const sValues = Object.values(scope);
      
      let result = "";
      let i = 0;
      while (i < tpl.length) {
        const start = tpl.indexOf("${", i);
        if (start === -1) {
          result += tpl.substring(i);
          break;
        }
        result += tpl.substring(i, start);
        
        let depth = 1;
        let end = -1;
        let inString: string | null = null;
        for (let j = start + 2; j < tpl.length; j++) {
          const char = tpl[j];
          if (!inString) {
            if (char === "'" || char === '"' || char === "`") inString = char;
            else if (char === "{") depth++;
            else if (char === "}") {
              depth--;
              if (depth === 0) { end = j; break; }
            }
          } else if (char === inString && tpl[j-1] !== "\\") {
            inString = null;
          }
        }
        
        if (end === -1) {
          result += tpl.substring(start);
          break;
        }
        
        const expr = tpl.substring(start + 2, end);
        try {
          const val = new Function(...sKeys, `return (${expr});`)(...sValues);
          result += (val === undefined || val === null) ? "" : val;
        } catch (e) {
          result += tpl.substring(start, end + 1);
        }
        i = end + 1;
      }
      return result;
    };
    html = evalTemplate(html, data);
    const styleTag = `<style>${[sfc.style, ...this.collectedStyles].join("\n")}</style>`;
    const scriptTag = sfc.clientScript ? `<script>${sfc.clientScript}</script>` : "";
    if (html.includes("</head>")) html = html.replace("</head>", `${styleTag}\n</head>`);
    else if (html.includes("<head>")) html = html.replace("<head>", `<head>\n${styleTag}`);
    else html = styleTag + html;
    if (html.includes("</body>")) html = html.replace("</body>", `${scriptTag}\n</body>`);
    else html = html + scriptTag;
    return html;
  }

  async renderMofuri(path: string, context: any) {
    const sfc = await this.parseMofuriSFC(path);
    return await this.renderTemplate(sfc, context);
  }
}
