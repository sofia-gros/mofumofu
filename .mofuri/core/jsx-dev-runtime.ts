/**
 * Mofuri Lightweight JSX Runtime
 * Renders JSX directly to strings.
 */

export function jsx(tag: any, props: any): string {
  if (typeof tag === "function") {
    return tag(props);
  }

  const { children, dangerouslySetInnerHTML, ...rest } = props;
  
  // Format attributes
  const attrs = Object.entries(rest)
    .map(([k, v]) => {
      if (k === "className") k = "class";
      if (k === "htmlFor") k = "for";
      if (v === true) return ` ${k}`;
      if (v === false || v === null || v === undefined) return "";
      
      // Handle style object
      if (k === "style" && typeof v === "object") {
        const styleStr = Object.entries(v)
          .map(([sk, sv]) => {
            const camelToKebab = sk.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
            return `${camelToKebab}:${sv}`;
          })
          .join(";");
        return ` style="${styleStr}"`;
      }

      return ` ${k}="${String(v).replace(/"/g, "&quot;")}"`;
    })
    .join("");

  // Handle inner HTML
  if (dangerouslySetInnerHTML) {
    return `<${tag}${attrs}>${dangerouslySetInnerHTML.__html}</${tag}>`;
  }

  // Handle children
  let content = "";
  if (Array.isArray(children)) {
    content = children.flat().map(c => (c === undefined || c === null ? "" : String(c))).join("");
  } else if (children !== undefined && children !== null) {
    content = String(children);
  }

  // Void elements
  const voidElements = ["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"];
  if (voidElements.includes(tag.toLowerCase())) {
    return `<${tag}${attrs}>`;
  }

  return `<${tag}${attrs}>${content}</${tag}>`;
}

export const jsxs = jsx;

// Bun の開発モード（@jsxImportSource）は jsxDEV を要求する
export const jsxDEV = jsx;

export function Fragment({ children }: { children?: any }) {
  if (Array.isArray(children)) return children.join("");
  return children || "";
}
