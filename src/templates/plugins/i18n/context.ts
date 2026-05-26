import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { parse } from "yaml";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function provideContext(projectDir: string) {
  // Load default language (ja)
  const langPath = join(__dirname, "languages", "ja.yaml");
  const content = await readFile(langPath, "utf-8");
  const translations = parse(content);

  const t = (key: string, params: Record<string, string> = {}) => {
    let text = translations[key] || key;
    for (const [pk, pv] of Object.entries(params)) {
      text = text.replace(`\${${pk}}`, pv);
    }
    return text;
  };

  return { t, i18n: translations };
}
