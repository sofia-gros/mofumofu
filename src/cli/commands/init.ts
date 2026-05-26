import { cp, mkdir, access, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export async function initAction() {
  console.log("🚀 Initializing Mofuri project...");

  // In a real CLI package, the template would be relative to the binary.
  // Here we use the source template.
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const templateDir = join(__dirname, "..", "..", "templates");
  const targetDir = process.cwd();

  console.log(`📂 Template directory: ${templateDir}`);
  console.log(`📂 Target directory: ${targetDir}`);

  try {
    // Check if mofuri.yaml already exists to avoid overwriting existing projects
    try {
      await access(join(targetDir, "mofuri.yaml"));
      console.error("❌ Error: mofuri.yaml already exists in this directory.");
      process.exit(1);
    } catch {
      // Doesn't exist, proceed
    }

    // Copy template directory (including mofuri.yaml, etc.)
    await cp(templateDir, targetDir, { recursive: true });

    // Create .mofuri directory and copy core source
    const coreDir = join(targetDir, ".mofuri");
    await mkdir(coreDir, { recursive: true });
    
    // Use the root mofuri directory as source for .mofuri/src
    const mofuriRootDir = join(__dirname, "..", ".."); 
    
    await cp(mofuriRootDir, join(coreDir, "src"), { 
      recursive: true, 
      filter: (src) => {
        const base = src.split(/[\\/]/).pop() || "";
        return !["node_modules", ".git", "test-site", "dist", ".mofuri"].includes(base);
      }
    });

    // Write absolute paths to config files for reliable JSX resolution
    const absoluteRuntimePath = join(targetDir, ".mofuri", "src", "core").replace(/\\/g, "/");
    
    const tsconfig = {
      compilerOptions: {
        lib: ["ESNext"],
        target: "ESNext",
        module: "ESNext",
        moduleDetection: "force",
        jsx: "react-jsx",
        jsxImportSource: absoluteRuntimePath,
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

    const bunfig = `[jsx]\nruntime = "automatic"\nimport-source = "${absoluteRuntimePath}"\n`;
    await writeFile(join(targetDir, "bunfig.toml"), bunfig);

    console.log("✅ Mofuri project initialized successfully!");
    console.log("Next steps:");
    console.log("  mofuri dev    # Start development server");
    console.log("  mofuri build  # Build static site");
  } catch (error) {
    console.error("❌ Error initializing project:", error);
    process.exit(1);
  }
}
