import { cp, mkdir, access } from "node:fs/promises";
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

    // Copy template directory
    await cp(templateDir, targetDir, { recursive: true });

    // Create .mofuri directory and copy core source
    const coreDir = join(targetDir, ".mofuri");
    await mkdir(coreDir, { recursive: true });
    
    const srcDir = join(__dirname, "..", "..");
    // Filter to avoid copying large/irrelevant folders
    await cp(srcDir, join(coreDir, "src"), { 
      recursive: true, 
      filter: (src) => !src.includes("node_modules") && !src.includes(".git") && !src.includes("test-site") 
    });

    console.log("✅ Mofuri project initialized successfully!");
    console.log("Next steps:");
    console.log("  mofuri dev    # Start development server");
    console.log("  mofuri build  # Build static site");
  } catch (error) {
    console.error("❌ Error initializing project:", error);
    process.exit(1);
  }
}
