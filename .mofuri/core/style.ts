import { randomUUID } from "node:crypto";

export interface ScopedStyles {
  [key: string]: { [key: string]: string | number };
}

export function createScopedStyle(styles: ScopedStyles) {
  const scopeId = `m-${randomUUID().slice(0, 8)}`;
  const css = Object.entries(styles)
    .map(([selector, rules]) => {
      const ruleString = Object.entries(rules)
        .map(([prop, val]) => `${prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${val};`)
        .join(" ");
      return `[data-scope="${scopeId}"] ${selector} { ${ruleString} }`;
    })
    .join("\n");

  return {
    scopeId,
    css,
    // スタイルを適用するためのルート属性
    attrs: { "data-scope": scopeId },
  };
}
