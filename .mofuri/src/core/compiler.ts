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

  constructor(projectDir: string = process.cwd()) {
    this.projectDir = projectDir;
  }

  async loadConfig() {
    const configPath = join(this.projectDir, "mofuri.yaml");
    const configContent = await readFile(configPath, "utf-8");
    this.config = yamlParse(configContent) as MofuriConfig;
    this.themeDir = join(this.projectDir, "themes", this.config.theme);
  }

  async build() {
    console.log("🛠 Building static site...");
    await this.loadConfig();

    const distDir = join(this.projectDir, "dist");
    await mkdir(distDir, { recursive: true });

    // 1. Build posts
    const postsDir = join(this.projectDir, "posts");
    const postFiles = (await readdir(postsDir)).filter(f => f.endsWith(".md"));
    const posts: PostData[] = [];

    const singleTemplatePath = join(this.themeDir, "pages", "single.mofuri");
    const singleTemplate = await this.parseMofuriSFC(singleTemplatePath);

    for (const file of postFiles) {
      const content = await readFile(join(postsDir, file), "utf-8");
      const { attributes, body } = fm(content) as { attributes: any, body: string };
      
      const postData: PostData = {
        ...attributes,
        slug: parse(file).name,
        content: await marked(body)
      };
      posts.push(postData);

      const html = await this.renderTemplate(singleTemplate, {
        siteName: this.config.siteName,
        post: postData
      });

      const finalHtml = await this.processCustomTags(html);

      const outputDir = join(distDir, postData.slug);
      await mkdir(outputDir, { recursive: true });
      await writeFile(join(outputDir, "index.html"), finalHtml);
      console.log(`  📄 Compiled post: ${file} -> /${postData.slug}/index.html`);
    }

    // 2. Build index page
    await this.buildIndex(posts);

    // 3. Bundle assets
    const bundler = new Bundler(this.projectDir);
    await bundler.bundle();

    console.log("✅ Build completed!");
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
    // Regex to match <m-tag attr="val" /> or <m-tag attr="val"></m-tag>
    const tagRegex = /<m-([a-z0-9-]+)\s*([^>]*?)\s*(?:\/|>([\s\S]*?)<\/m-\1)>/g;
    
    let result = html;
    const matches = Array.from(html.matchAll(tagRegex));

    for (const match of matches) {
      const [fullTag, tagName, attrString, content] = match;
      if (!tagName) continue;
      
      const attrs: Record<string, string> = {};
      
      // Parse attributes
      const attrRegex = /([a-z0-9-]+)=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrString)) !== null) {
        if (attrMatch[1]) {
          attrs[attrMatch[1]] = attrMatch[2] || attrMatch[3] || attrMatch[4] || "";
        }
      }

      // Resolve component
      const componentHtml = await this.renderComponent(tagName, attrs, content || "");
      result = result.replace(fullTag, componentHtml);
    }

    return result;
  }

  private async renderComponent(name: string, props: any, content?: string): Promise<string> {
    // 1. Check theme components
    const themeCompPath = join(this.themeDir, "components", `${name}.tsx`);
    // 2. Check plugins
    const pluginPath = join(this.projectDir, "plugins", name, "index.tsx");

    let componentPath = "";
    try {
      await readFile(themeCompPath); // Check existence
      componentPath = themeCompPath;
    } catch {
      try {
        await readFile(pluginPath);
        componentPath = pluginPath;
      } catch {
        return `<!-- Component m-${name} not found -->`;
      }
    }

    try {
      // In Bun, we can import .tsx directly
      const module = await import(componentPath);
      const Component = module.default || module[name.replace(/-/g, "")];
      
      if (typeof Component === "function") {
        // Pass props and children (content)
        const result = Component({ ...props, children: content });
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
    const serverFn = new Function("post", "posts", "siteName", `
      let exports = {};
      ${sfc.serverScript}
      return { post, posts, siteName, ...exports };
    `);
    
    const data = serverFn(context.post, context.posts, context.siteName);

    // 2. Evaluate template
    let html = sfc.template;
    
    const evalTemplate = (tpl: string, scope: any) => {
      const keys = Object.keys(scope);
      const values = Object.values(scope);
      try {
        return new Function(...keys, `return \`${tpl}\`;`)(...values);
      } catch (error: any) {
        console.warn("Template evaluation error:", error.message);
        return tpl; // Return as is on error
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
}
