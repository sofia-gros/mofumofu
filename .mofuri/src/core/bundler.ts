import { readFile, writeFile, mkdir, cp, readdir } from "node:fs/promises";
import { join } from "node:path";

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
      // public dir might not exist, that's fine
    }

    // 2. Aggregate CSS from theme
    await this.bundleCSS();

    console.log("✅ Assets bundled!");
  }

  private async bundleCSS() {
    // This is a simple version. A more advanced version would parse all .mofuri and .tsx files
    // and extract their <style> blocks or import statements.
    
    // For now, let's just create a basic style.css if it doesn't exist
    // Or if there's a theme CSS, use that.
    
    // In a real implementation, we would use Bun.build or a CSS processor.
    // Here we'll just look for a default theme CSS.
    const configPath = join(this.projectDir, "mofuri.yaml");
    try {
      const configContent = await readFile(configPath, "utf-8");
      const { parse } = await import("yaml");
      const config = parse(configContent);
      
      const themeCSSPath = join(this.projectDir, "themes", config.theme, "style.css");
      try {
        const css = await readFile(themeCSSPath, "utf-8");
        await writeFile(join(this.distDir, "style.css"), css);
        console.log("  🎨 Bundled theme CSS -> /style.css");
      } catch {
        // No theme CSS, create a fallback
        const fallbackCSS = "body { font-family: system-ui; line-height: 1.5; padding: 2rem; }";
        await writeFile(join(this.distDir, "style.css"), fallbackCSS);
      }
    } catch (e: any) {
      console.error("  ❌ Failed to bundle CSS:", e.message);
    }
  }
}
