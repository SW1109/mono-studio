import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { prerenderPaths, publicPaths, noindexPaths } from "../src/content/paths.js";
import { products } from "../src/content/products.js";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const load = filename => readFile(path.join(dist, filename), "utf8");
const manifest = JSON.parse(await load(".vite/manifest.json"));
const metadata = JSON.parse(await load("site-build.json"));
// 两个运行环境共用同一主题，避免官网改色后原生商城仍使用旧副本。
for (const file of ["theme.js", "theme.css", "fonts/noto-serif-sc-subset.woff2", "fonts/OFL.txt"]) {
  const source = await readFile(new URL(`../public/${file}`, import.meta.url));
  assert.ok(source.equals(await readFile(path.join(dist, file))), `构建主题资源不同步：${file}`);
  assert.ok(source.equals(await readFile(new URL(`../deploy/shopxo/overlay/public/static/mono/${file}`, import.meta.url))), `商城主题资源不同步：${file}`);
}
assert.deepEqual(metadata.paths, prerenderPaths, "产物路径与当前内容配置不一致，可能是旧构建。");
// 缺配置的构建会静默降级：商城入口退回站内占位页、canonical 与 sitemap 不再输出，因此这里直接失败。
if (!process.env.VITE_ALLOW_UNCONFIGURED_BUILD) {
  assert.equal(metadata.commerce?.configured, true, "构建缺少 VITE_SHOPXO_ORIGIN / VITE_SHOPXO_BASE_PATH：商品购买会退回「商城暂未开放」占位页。请使用仓库内的 .env.production 构建。");
  assert.ok(metadata.origin, "构建缺少 VITE_SITE_URL：页面不会输出 canonical，sitemap 也会缺少绝对地址。");
}
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
  if (["/shop/", "/checkout/", "/orders/"].includes(route)) {
    assert.equal(metadata.commerce?.provider, "shopxo", "只保留 ShopXO 一套交易系统。");
    assert.doesNotMatch(html, /api\/commerce|当前浏览器还没有订单|确认订单并前往支付宝|￥?(?:299|699|999)\.00/, "官网不应保留本地订单表单或静态报价。");
    if (!metadata.commerce.configured) assert.ok(html.includes("商城暂未开放"), "未配置时应提示商城未开放。");
  }
  if (metadata.commerce.configured && route === "/shop/") {
    assert.ok(html.includes(`href="${metadata.commerce.shopUrl.replaceAll("&", "&amp;")}"`), "商品购买应直接进入原生商城。");
  }
  if (metadata.commerce.configured && route === "/orders/") {
    assert.ok(html.includes(`href="${metadata.commerce.ordersUrl.replaceAll("&", "&amp;")}"`) && html.includes("同一账号"), "缺少跨设备账户订单入口。");
  }
  if (metadata.commerce.configured && route === "/checkout/") {
    assert.ok(html.includes(`href="${metadata.commerce.shopUrl.replaceAll("&", "&amp;")}"`) && html.includes("本页面不创建另一笔订单"), "旧确认页应进入商城，不再本地下单。");
  }
  const descriptions = [...html.matchAll(/<meta\b[^>]*name="description"[^>]*>/g)];
  assert.equal(descriptions.length, 1, `${route} 页面描述应只有一份。`);
  const structured = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  if (metadata.origin && publicPaths.includes(route)) {
    assert.equal([...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/g)].length, 1, `${route} 规范链接应只有一份。`);
    assert.equal(structured.length, 1, `${route} 缺少结构化数据。`);
    assert.ok(structured[0]["@graph"].some(item => item["@type"] === "Organization"));
    assert.match(html, /social-card\.png/, `${route} 缺少分享图。`);
  }
  if (route === "/guides/") {
    assert.match(html, /<table[\s>]/, "选购对照应在无 JavaScript 的 HTML 中可读。");
    assert.match(html, /id="selection"/);
    assert.match(html, /Excel 数据整理自动化/);
  }
  // JSON-LD 不能比正文多描述问答，避免只给爬虫展示额外营销内容。
  for (const graph of structured) for (const entry of graph["@graph"] || []) {
    if (entry["@type"] !== "FAQPage") continue;
    for (const question of entry.mainEntity) {
      const outsideSchema = html.replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g, "");
      assert.ok(outsideSchema.includes(question.name) && outsideSchema.includes(question.acceptedAnswer.text), `${route} 结构化问答与正文不一致。`);
    }
  }
  if (noindexPaths.includes(route)) { assert.match(html, /noindex/); assert.equal(structured.length, 0); }
  if (metadata.origin && publicPaths.includes(route)) assert.ok(html.includes(`${metadata.origin}${metadata.base.replace(/\/$/, "")}${route}`), `${route} 缺少正式 canonical。`);
}
await stat(path.join(dist, "favicon.png"));
await stat(path.join(dist, "cesium/Workers"));
await stat(path.join(dist, "cesium/Assets/Textures/NaturalEarthII"));
if (metadata.origin) {
  await stat(path.join(dist, "social-card.png"));
  const robots = await load("robots.txt");
  for (const route of noindexPaths) assert.ok(!robots.includes(`Disallow: ${metadata.base}${route.slice(1)}`), "爬虫必须能读取页面上的 noindex。");
  const directory = await load("llms.txt");
  assert.ok(directory.includes(`${metadata.origin}${metadata.base}guides/`));
  if (metadata.commerce.configured) assert.ok(robots.includes(`${metadata.commerce.origin}${metadata.commerce.basePath}?s=sitemap/index`));
  const sitemap = await load("sitemap.xml");
  assert.ok(!sitemap.includes("/404/"));
  for (const route of publicPaths) assert.ok(sitemap.includes(`${metadata.origin}${metadata.base.replace(/\/$/, "")}${route}`));
}
console.log(`构建检查通过：${prerenderPaths.length} 个预渲染页面；启动资源无 3D 引擎；主入口静态 JS/CSS ${(firstLoadBytes / 1024).toFixed(1)} KiB（不含页面动态块与图片）。`);
