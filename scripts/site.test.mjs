import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parse, compileScript, compileTemplate, compileStyle } from "@vue/compiler-sfc";
import { products, solutions, existingProducts, featuredProducts, findProduct, productPath, productInquiry, productInquirySubject } from "../src/content/products.js";
import { site } from "../src/content/site.js";
import { services } from "../src/content/services.js";
import { publicPaths, prerenderPaths } from "../src/content/paths.js";
import { routes } from "../src/routes.js";

const root = fileURLToPath(new URL("../", import.meta.url));
async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? collect(path.join(directory, entry.name)) : path.join(directory, entry.name)))).flat();
}
const files = await collect(path.join(root, "src"));

test("产品标识唯一，列表、详情与预渲染路径使用同一数据", () => {
  assert.equal(products.length, solutions.length + existingProducts.length);
  assert.equal(existingProducts.length, 5);
  assert.equal(new Set(products.map(item => item.slug)).size, products.length);
  for (const product of products) {
    assert.match(product.slug, /^[a-z0-9-]+$/);
    assert.equal(findProduct(product.slug), product);
    assert.ok(publicPaths.includes(productPath(product)));
    assert.ok(product.summary && product.headline && product.capabilities.length);
  }
  assert.equal(findProduct("not-a-product"), undefined);
});

test("定制方案覆盖常见业务，每个详情模块完整且明确区分现有产品", () => {
  assert.equal(solutions.length, 9);
  assert.equal(new Set(solutions.map(item => item.category)).size, 6);
  for (const solution of solutions) {
    assert.equal(solution.kind, "solution");
    assert.ok(solution.platforms.length && solution.audience && solution.note);
    const { scenarios, modules, workflow, deliverables, extensions, faq } = solution.details;
    assert.ok(scenarios.length >= 3 && modules.length >= 4);
    assert.ok(workflow.length >= 3 && deliverables.length >= 3 && extensions.length >= 2 && faq.length >= 2);
    for (const item of [...scenarios, ...modules]) assert.ok(item.title && item.description.length >= 20);
    for (const item of faq) assert.ok(item.question && item.answer.length >= 20);
    assert.deepEqual(solution.capabilities, modules.map(module => module.title));
    assert.equal(solution.downloadUrl, undefined);
  }
  assert.ok(featuredProducts.length > 0 && featuredProducts.length <= 3);
  assert.ok(featuredProducts.every(item => item.kind === "solution" && solutions.includes(item)));
  for (const slug of ["viewturbo", "autoclick-pro", "clipstack", "watchdog", "renamex"]) {
    assert.equal(findProduct(slug)?.kind, "product");
    assert.ok(publicPaths.includes(`/products/${slug}/`));
  }
});

test("咨询链接和邮件标题使用同一内容，方案与产品身份不混淆", () => {
  for (const product of products) {
    assert.deepEqual(productInquiry(product), { path: "/contact/", query: { product: product.name } });
    assert.equal(productInquirySubject(product), `${product.kind === "solution" ? "方案咨询" : "产品咨询"}：${product.name}`);
  }
});

test("公开页面与产品路径完整，404 不进入 sitemap", () => {
  assert.equal(prerenderPaths.length, publicPaths.length + 3);
  assert.ok(!publicPaths.includes("/checkout/"));
  assert.ok(!publicPaths.includes("/orders/"));
  assert.equal(new Set(prerenderPaths).size, prerenderPaths.length);
  assert.ok(prerenderPaths.includes("/404/"));
  assert.ok(!publicPaths.includes("/404/"));
  for (const location of publicPaths.filter(item => !item.startsWith("/products/") || item === "/products/")) assert.ok(routes.some(route => route.path === location));
  assert.ok(routes.some(route => route.path === "/products/:slug/"));
  assert.ok(routes.some(route => route.meta.noindex));
});

test("品牌、联系信息与服务配置完整", () => {
  assert.equal(site.name, "光年数智网络科技工作室");
  assert.equal(site.email, "heerjohn379@gmail.com");
  assert.equal(site.wechat, "feg1735");
  assert.equal(services.length, 4);
  assert.equal(new Set(services.map(item => item.id)).size, services.length);
  assert.ok(site.navigation.every(item => publicPaths.includes(item.to)));
});

test("相对模块、Logo 与页面资源引用存在", async () => {
  for (const filename of files.filter(item => /\.(?:js|vue)$/.test(item))) {
    const source = await readFile(filename, "utf8");
    for (const match of source.matchAll(/(?:from\s*|import\s*\()\s*["'](\.[^"']+)["']/g)) {
      const target = path.resolve(path.dirname(filename), match[1]);
      const results = await Promise.all(["", ".js", ".vue"].map(extension => stat(target + extension).then(() => true, () => false)));
      assert.ok(results.some(Boolean), `${path.relative(root, filename)} 引用了不存在的资源 ${match[1]}`);
    }
  }
});

for (const filename of files.filter(item => item.endsWith(".vue"))) {
  test(`Vue 编译：${path.relative(root, filename)}`, async () => {
    const source = await readFile(filename, "utf8");
    const { descriptor, errors } = parse(source, { filename });
    assert.deepEqual(errors, []);
    const script = descriptor.scriptSetup ? compileScript(descriptor, { id: filename }) : undefined;
    const result = compileTemplate({ source: descriptor.template.content, filename, id: filename, compilerOptions: { bindingMetadata: script?.bindings } });
    assert.deepEqual(result.errors, []);
    for (const style of descriptor.styles) assert.deepEqual(compileStyle({ source: style.content, filename, id: filename, scoped: style.scoped }).errors, []);
  });
}

test("普通页面源码没有旧渲染循环或重型引擎导入", async () => {
  const ordinary = files.filter(filename => /pages|components[/\\]site/.test(filename) && !filename.endsWith("LabPage.vue"));
  for (const filename of ordinary) {
    const source = await readFile(filename, "utf8");
    assert.doesNotMatch(source, /from\s+["'](?:three|cesium)["']|CesiumGlobe|CesiumExperience|requestAnimationFrame|setInterval/);
  }
  const lab = await readFile(path.join(root, "src/pages/LabPage.vue"), "utf8");
  assert.match(lab, /async function start[\s\S]*await import\("\.\.\/components\/CesiumExperience.vue"\)/);
  assert.doesNotMatch(lab, /onMounted|scene=cesium/);
});

test("CSS 语法有效，持续动画有可见性与用户偏好约束", async () => {
  const source = await readFile(path.join(root, "src/styles/main.css"), "utf8");
  assert.deepEqual(compileStyle({ source, filename: "main.css", id: "site" }).errors, []);
  assert.doesNotMatch(source, /animation\s*:[^;]*infinite/);
  assert.match(source, /#main-content\s+\.motion-loop\s*\{\s*animation-play-state:\s*paused/);
  assert.ok(source.includes('[data-motion="running"] [data-motion-scene][data-scene-active="true"]:not([data-scene-paused="true"])'));
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /animation-iteration-count:\s*1\s*!important/);
});

test("动效按节点注册并清理，不新增滚动或逐帧循环", async () => {
  const source = await readFile(path.join(root, "src/composables/useSiteMotion.js"), "utf8");
  assert.doesNotMatch(source, /requestAnimationFrame|setInterval|getBoundingClientRect|addEventListener\(["'](?:scroll|mousemove)/);
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /MutationObserver/);
  assert.match(source, /onScopeDispose/);
  assert.match(source, /mutations\.disconnect\(\)/);
  assert.match(source, /pendingReveals\.delete\(element\)/);
  assert.match(source, /removeEventListener\("visibilitychange", syncMotion\)/);
  assert.match(source, /animation\.cancel\(\)/);
});