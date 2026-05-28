import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { updateConfig } from "../config-helper";

export async function addAction(plugin: string) {
  console.log(`🔌 Adding plugin: ${plugin}...`);
  
  const projectDir = process.cwd();
  const pluginsDir = join(projectDir, "plugins");
  await mkdir(pluginsDir, { recursive: true });

  let pluginName = plugin;

  if (plugin.startsWith("http") || plugin.includes("/")) {
    console.log("  🌐 Downloading from GitHub...");
    const repo = plugin.replace("https://github.com/", "").replace(".git", "");
    pluginName = repo.split("/").pop() || "plugin";
    
    const pluginDir = join(pluginsDir, pluginName);
    try {
      await mkdir(pluginDir, { recursive: true });
      await writeFile(join(pluginDir, "manifest.yaml"), `id: ${pluginName}\nsource: ${repo}`);
      await writeFile(join(pluginDir, "index.tsx"), `export default function ${pluginName.replace(/-/g, "")}() {\n  return <div>Plugin from ${repo}</div>;\n}`);
      console.log(`  📦 Fetching ${repo}...`);
    } catch (e) {
      console.error(`  ❌ Failed to add plugin: ${e}`);
      return;
    }
  } else {
    console.log(`  📦 Searching for plugin ID: ${plugin}...`);
    const pluginDir = join(pluginsDir, plugin);
    try {
      await mkdir(pluginDir);
      await writeFile(join(pluginDir, "manifest.yaml"), `id: ${plugin}\nversion: 1.0.0\nauthor: user`);
      await writeFile(join(pluginDir, "index.tsx"), `export default function ${plugin.replace(/-/g, "")}(props) {\n  return <div>New Plugin: ${plugin}</div>;\n}`);
    } catch (e) {
      console.error(`  ❌ Error: Plugin ${plugin} already exists or could not be created.`);
      return;
    }
  }

  // Update mofuri.yaml
  await updateConfig(projectDir, (config) => {
    config.plugins = config.plugins || [];
    if (!config.plugins.includes(pluginName)) {
      config.plugins.push(pluginName);
    }
    return config;
  });

  console.log(`  ✅ Successfully added plugin: ${pluginName}`);
  console.log("✨ Done!");
}
