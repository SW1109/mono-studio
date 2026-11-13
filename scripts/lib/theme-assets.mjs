import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export const sharedThemeFiles = Object.freeze(["theme.js", "theme.css", "fonts/noto-serif-sc-subset.woff2", "fonts/OFL.txt"]);
export const storefrontThemeFiles = Object.freeze(["shell.css", "storefront.css", "native.css", "auth.css", "forms.js", "commerce.js"]);

export async function readSharedTheme() {
  const entries = await Promise.all(sharedThemeFiles.map(async file => {
    const bytes = await readFile(new URL(`../../public/${file}`, import.meta.url));
    return [file, createHash("sha256").update(bytes).digest("hex")];
  }));
  const files = Object.fromEntries(entries);
  return { version: themeVersion(files), files };
}

export function themeVersion(files) {
  return createHash("sha256").update(JSON.stringify(files)).digest("hex").slice(0, 12);
}
