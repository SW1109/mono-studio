import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { cesiumAssets } from "./scripts/lib/cesium-assets.mjs";
import { createShopxoOrderCenter } from "./shared/order-center.js";
import { prerenderPaths, publicPaths } from "./src/content/paths.js";
import { serviceGuide } from "./src/content/guides.js";
import { guideArticles, guidePath } from "./src/content/guideArticles.js";
import { searchTextAssets } from "./scripts/lib/search-assets.mjs";
import { caseStudies, caseStudyPath } from "./src/content/caseStudies.js";
import { site } from "./src/content/site.js";

function publishMetadata(origin, base, orderCenter) {
  return {
    name: "studio-publish-metadata",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "site-build.json", source: JSON.stringify({ base, paths: prerenderPaths, origin, commerce: { provider: "shopxo", configured: Boolean(orderCenter), ...orderCenter } }, null, 2) });
      if (!origin) return;
      const modified = new Map([["/guides/", serviceGuide.updatedAt], ["/about/", site.identity.updatedAt], ["/service-terms/", site.identity.updatedAt], ["/projects/", site.identity.updatedAt], ...guideArticles.map(guide => [guidePath(guide), guide.updatedAt]), ...caseStudies.map(study => [caseStudyPath(study), study.updatedAt])]);
      const urls = publicPaths.map(path => `<url><loc>${origin}${base.replace(/\/$/, "")}${path}</loc>${modified.has(path) ? `<lastmod>${modified.get(path)}</lastmod>` : ""}</url>`).join("");
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>` });
      const productSitemap = orderCenter ? `${orderCenter.origin}${orderCenter.basePath}?s=sitemap/index` : "";
      this.emitFile({ type: "asset", fileName: "robots.txt", source: `User-agent: *\nAllow: /\n# 允许读取页面上的 noindex；不以 robots 屏蔽代替收录控制。\nSitemap: ${origin}${base}sitemap.xml\n${productSitemap ? `Sitemap: ${productSitemap}\n` : ""}` });
      for (const asset of searchTextAssets({ origin, base, orderCenter })) this.emitFile({ type: "asset", ...asset });
    },
  };
}

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const orderCenter = createShopxoOrderCenter(env.VITE_SHOPXO_ORIGIN, env.VITE_SHOPXO_PRODUCTS, { allowLocalPreview: command === "serve" && mode !== "production", basePath: env.VITE_SHOPXO_BASE_PATH || "/" });
  const base = env.VITE_BASE_PATH || "/";
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) throw new Error("VITE_BASE_PATH 必须是以 / 开头和结尾的部署路径，如 / 或 /studio/。");
  const origin = String(env.VITE_SITE_URL || "").replace(/\/$/, "");
  if (origin && (!/^https?:\/\//.test(origin) || new URL(origin).origin !== origin)) throw new Error("VITE_SITE_URL 应仅包含正式站点协议与域名，不包含路径、查询或凭据。");

  return {
    base,
    server: { host: "127.0.0.1", port: 5173, strictPort: true },
    define: { CESIUM_BASE_URL: JSON.stringify(`${base}cesium/`) },
    plugins: [
      vue(),
      cesiumAssets(),
      publishMetadata(origin, base, orderCenter),
    ],
    build: {
      manifest: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/cesium/") || id.includes("node_modules/@cesium/")) return "cesium-engine";
            if (id.includes("node_modules/vue/") || id.includes("node_modules/@vue/")) return "vue-vendor";
          },
        },
      },
    },
    ssgOptions: {
      includedRoutes: () => prerenderPaths,
      dirStyle: "nested",
      script: "defer",
      formatting: "minify",
    },
  };
});
