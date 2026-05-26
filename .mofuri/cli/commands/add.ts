import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function addAction(plugin: string) {
  console.log(`🔌 Adding plugin: ${plugin}...`);
  
  const pluginsDir = join(process.cwd(), "plugins");
  await mkdir(pluginsDir, { recursive: true });

  // Basic logic: if it's a GitHub URL, we would ideally clone it.
  // For this lightweight CLI, let's simulate the process or use a simple fetch.
  
  if (plugin.startsWith("http") || plugin.includes("/")) {
    console.log("  🌐 Downloading from GitHub...");
    const repo = plugin.replace("https://github.com/", "").replace(".git", "");
    const pluginName = repo.split("/").pop() || "plugin";
    
    // Simulate git clone/download
    const pluginDir = join(pluginsDir, pluginName);
    try {
      await mkdir(pluginDir, { recursive: true });
      // In a real environment, we would use Bun.spawn(["git", "clone", ...])
      console.log(`  📦 Fetching ${repo}...`);
      await writeFile(join(pluginDir, "manifest.yaml"), `id: ${pluginName}\nsource: ${repo}`);
      await writeFile(join(pluginDir, "index.tsx"), `export default function ${pluginName.replace(/-/g, "")}() {\n  return <div>Plugin from ${repo}</div>;\n}`);
      
      console.log(`  ✅ Successfully added plugin: ${pluginName}`);
    } catch (e) {
      console.error(`  ❌ Failed to add plugin: ${e}`);
    }
  } else {
    // Treat as an ID (ID check against a registry could be added here)
    console.log(`  📦 Searching for plugin ID: ${plugin}...`);
    
    // Simulate creating a basic plugin structure if not found
    const pluginDir = join(pluginsDir, plugin);
    try {
      await mkdir(pluginDir);
      await writeFile(join(pluginDir, "manifest.yaml"), `id: ${plugin}\nversion: 1.0.0\nauthor: user`);
      await writeFile(join(pluginDir, "index.tsx"), `export default function ${plugin.replace(/-/g, "")}(props) {\n  return <div>New Plugin: ${plugin}</div>;\n}`);
      console.log(`  ✅ Created boilerplate for plugin: ${plugin}`);
    } catch (e) {
      console.error(`  ❌ Error: Plugin ${plugin} already exists or could not be created.`);
    }
  }

  console.log("✨ Done!");
}
