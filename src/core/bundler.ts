import { readFile, writeFile, mkdir, cp, readdir } from "node:fs/promises";
import { join, extname } from "node:path";

export class Bundler {
  private projectDir: string;
  private distDir: string;

  constructor(projectDir: string = process.cwd()) {
    this.projectDir = projectDir;
    this.distDir = join(projectDir, "dist");
  }

  async bundle() {
    console.log("📦 Bundling assets...");
    await mkdir(this.distDir, { recursive: true });

    // 1. Copy public directory if it exists
    const publicDir = join(this.projectDir, "public");
    try {
      await cp(publicDir, this.distDir, { recursive: true });
      console.log("  📂 Copied public assets");
    } catch (e) {
      // public dir might not exist
    }

    // 2. Aggregate CSS from theme and components
    await this.bundleCSS();

    console.log("✅ Assets bundled!");
  }

  private async bundleCSS() {
    let combinedCSS = "/* Mofuri Aggregated CSS */\n";

    // helper to scan for .mofuri files
    const scanStyles = async (dir: string) => {
      try {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const res = join(dir, entry.name);
          if (entry.isDirectory()) {
            await scanStyles(res);
          } else if (entry.isFile() && entry.name.endsWith(".mofuri")) {
            const content = await readFile(res, "utf-8");
            const style = content.match(/<style>([\s\S]*?)<\/style>/)?.[1] || "";
            if (style) {
              combinedCSS += `\n/* From ${entry.name} */\n${style.trim()}\n`;
            }
          }
        }
      } catch (e) {}
    };

    // Scan theme pages and components
    const configPath = join(this.projectDir, "mofuri.yaml");
    try {
      const configContent = await readFile(configPath, "utf-8");
      const { parse } = await import("yaml");
      const config = parse(configContent);
      const themeDir = join(this.projectDir, "themes", config.theme);
      
      await scanStyles(themeDir);
      
      // Also write theme style.css as base if exists
      try {
        const baseCSS = await readFile(join(themeDir, "style.css"), "utf-8");
        combinedCSS = baseCSS + "\n" + combinedCSS;
      } catch {}

      await writeFile(join(this.distDir, "style.css"), combinedCSS);
      
      // 3. Minify CSS if in production mode (simplified check)
      try {
        const build = await Bun.build({
          entrypoints: [join(this.distDir, "style.css")],
          outdir: this.distDir,
          minify: true,
        });
        if (build.success) {
          console.log("  ✨ Minified CSS");
        }
      } catch (e) {}

      console.log("  🎨 Bundled CSS -> /style.css");
    } catch (e: any) {
      console.error("  ❌ Failed to bundle CSS:", e.message);
    }
  }
}
