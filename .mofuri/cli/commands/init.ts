import { cp, mkdir, access, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export async function initAction() {
  console.log("🚀 Initializing Mofuri project...");

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const templateDir = join(__dirname, "..", "templates");
  const targetDir = process.cwd();

  try {
    // 1. Check if mofuri.yaml already exists
    try {
      await access(join(targetDir, "mofuri.yaml"));
      console.error("❌ Error: mofuri.yaml already exists in this directory.");
      return;
    } catch {
      // Doesn't exist, proceed
    }

    // 2. Create mandatory directory structure
    const dirs = ["pages", "posts", "themes", "plugins", "public"];
    for (const dir of dirs) {
      await mkdir(join(targetDir, dir), { recursive: true });
      console.log(`  📁 Created: /${dir}`);
    }

    // 3. Copy default contents from templates
    await cp(join(templateDir, "posts"), join(targetDir, "posts"), { recursive: true });
    await cp(join(templateDir, "themes"), join(targetDir, "themes"), { recursive: true });
    await cp(join(templateDir, "plugins"), join(targetDir, "plugins"), { recursive: true });
    await cp(join(templateDir, "mofuri.yaml"), join(targetDir, "mofuri.yaml"));

    // 4. Setup TypeScript / Bun config for Zero-React JSX
    const corePath = "./.mofuri/core";
    
    const tsconfig = {
      compilerOptions: {
        lib: ["ESNext"],
        target: "ESNext",
        module: "ESNext",
        moduleDetection: "force",
        jsx: "react-jsx",
        jsxImportSource: corePath,
        allowJs: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        verbatimModuleSyntax: true,
        noEmit: true,
        strict: true,
        skipLibCheck: true
      },
      "include": ["**/*"]
    };
    await writeFile(join(targetDir, "tsconfig.json"), JSON.stringify(tsconfig, null, 2));

    const bunfig = `[jsx]\nruntime = "automatic"\nimport-source = "${corePath}"\n`;
    await writeFile(join(targetDir, "bunfig.toml"), bunfig);

    console.log("\n✅ Mofuri project initialized successfully!");
    console.log("Next steps:");
    console.log("  bun .mofuri/cli/index.ts dev    # Start development server");
    console.log("  bun .mofuri/cli/index.ts build  # Build static site");
  } catch (error) {
    console.error("❌ Error initializing project:", error);
    process.exit(1);
  }
}
