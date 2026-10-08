import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { prerenderPaths } from "../src/content/paths.js";
import { products } from "../src/content/products.js";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const load = filename => readFile(path.join(dist, filename), "utf8");
const manifest = JSON.parse(await load(".vite/manifest.json"));
const metadata = JSON.parse(await load("site-build.json"));
assert.deepEqual(metadata.paths, prerenderPaths, "产物路径与当前内容配置不一致，可能是旧构建。");
const main = manifest["index.html"] || Object.values(manifest).find(item => item.isEntry);
assert.ok(main, "缺少主入口构建记录。");

const heavy = name => /cesium|three|CesiumGlobe|CesiumExperience/i.test(name);
const keysByFile = new Map(Object.entries(manifest).map(([key, value]) => [value.file, key]));
function staticClosure(keys) {
  const seen = new Set();
  const visit = key => {
    if (seen.has(key)) return;
    assert.ok(manifest[key], `资源不存在：${key}`);
    seen.add(key);
    for (const child of manifest[key].imports || []) visit(child);
  };
  keys.forEach(visit);
  return [...seen].flatMap(key => [manifest[key].file, ...(manifest[key].css || [])]);
}

let firstLoadBytes = 0;
for (const file of staticClosure([keysByFile.get(main.file)])) {
  assert.ok(!heavy(file), `全局主入口静态依赖了重型资源：${file}`);
  firstLoadBytes += (await stat(path.join(dist, file))).size;
}
for (const route of prerenderPaths) {
  const filename = route === "/" ? "index.html" : `${route.slice(1)}index.html`;
  const html = await load(filename);
  assert.match(html, /<h1[\s>]/, `${route} 没有预渲染主标题。`);
  assert.match(html, /光年数智/, `${route} 缺少品牌正文。`);
  assert.match(html, /<title>[^<]+<\/title>/, `${route} 缺少页面标题。`);
  assert.doesNotMatch(html, /<!--(?:app-html|app-head)-->/, `${route} 遗留预渲染占位内容。`);
  const initial = [...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"[^>]*>/g)].map(match => match[1]);
  for (const url of initial) assert.ok(!heavy(url), `${route} 在启动前加载了引擎或引擎样式：${url}`);
  for (const url of initial) {
    if (!url.startsWith(metadata.base)) continue;
    const file = url.slice(metadata.base.length);
    const key = keysByFile.get(file);
    if (key) for (const dependency of staticClosure([key])) assert.ok(!heavy(dependency), `${route} 的预加载资源间接依赖引擎：${dependency}`);
    if (!/^https?:/.test(url)) await stat(path.join(dist, file));
  }
  const product = products.find(item => route === `/products/${item.slug}/`);
  if (product) {
    assert.ok(html.includes(product.name) && html.includes(product.summary), `${route} 产品正文未预渲染。`);
    if (product.kind === "solution") {
      assert.match(html, /可定制方案/, `${route} 缺少方案身份说明。`);
      assert.match(html, /定制开发方案/, `${route} SEO 未区分定制方案。`);
      for (const id of ["overview", "scenarios", "modules", "workflow", "delivery", "questions"]) assert.ok(html.includes(`id="${id}"`), `${route} 缺少详情章节 ${id}。`);
      const details = product.details;
      const content = [...details.scenarios.flatMap(item => [item.title, item.description]), ...details.modules.flatMap(item => [item.title, item.description]), ...details.workflow, ...details.deliverables, ...details.extensions, ...details.faq.flatMap(item => [item.question, item.answer]), product.note];
      for (const text of content) assert.ok(html.includes(text), `${route} 未预渲染详情内容：${text}`);
    }
  }
  if (route === "/404/") assert.match(html, /noindex/);
  if (metadata.origin && route !== "/404/") assert.ok(html.includes(`${metadata.origin}${metadata.base.replace(/\/$/, "")}${route}`), `${route} 缺少正式 canonical。`);
}
await stat(path.join(dist, "favicon.png"));
await stat(path.join(dist, "cesium/Workers"));
await stat(path.join(dist, "cesium/Assets/Textures/NaturalEarthII"));
if (metadata.origin) {
  const sitemap = await load("sitemap.xml");
  assert.ok(!sitemap.includes("/404/"));
  for (const route of metadata.paths.filter(item => item !== "/404/")) assert.ok(sitemap.includes(`${metadata.origin}${metadata.base.replace(/\/$/, "")}${route}`));
}
console.log(`构建检查通过：${prerenderPaths.length} 个预渲染页面；启动资源无 3D 引擎；主入口静态 JS/CSS ${(firstLoadBytes / 1024).toFixed(1)} KiB（不含页面动态块与图片）。`);