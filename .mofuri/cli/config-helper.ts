import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parse as yamlParse, stringify as yamlStringify } from "yaml";

export async function updateConfig(projectDir: string, updateFn: (config: any) => any) {
  const configPath = join(projectDir, "mofuri.yaml");
  const content = await readFile(configPath, "utf-8");
  const config = yamlParse(content);
  const newConfig = updateFn(config);
  await writeFile(configPath, yamlStringify(newConfig), "utf-8");
}
