import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { createShopxoOrderCenter } from "./shared/order-center.js";
import { prerenderPaths, publicPaths } from "./src/content/paths.js";

function publishMetadata(origin, base, orderCenter) {
  return {
    name: "studio-publish-metadata",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "site-build.json", source: JSON.stringify({ base, paths: prerenderPaths, origin, commerce: orderCenter ? { provider: "shopxo", ...orderCenter } : { provider: "node" } }, null, 2) });
      if (!origin) return;
      const urls = publicPaths.map(path => `<url><loc>${origin}${base.replace(/\/$/, "")}${path}</loc></url>`).join("");
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>` });
      this.emitFile({ type: "asset", fileName: "robots.txt", source: `User-agent: *\nAllow: /\nSitemap: ${origin}${base}sitemap.xml\n` });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const orderCenter = createShopxoOrderCenter(env.VITE_SHOPXO_ORIGIN, env.VITE_SHOPXO_PRODUCTS);
  const base = env.VITE_BASE_PATH || "/";
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) throw new Error("VITE_BASE_PATH 必须是以 / 开头和结尾的部署路径，如 / 或 /studio/。");
  const origin = String(env.VITE_SITE_URL || "").replace(/\/$/, "");
  if (origin && (!/^https?:\/\//.test(origin) || new URL(origin).origin !== origin)) throw new Error("VITE_SITE_URL 应仅包含正式站点协议与域名，不包含路径、查询或凭据。");

  return {
    base,
    server: { proxy: { [`${base}api/commerce`]: { target: "http://127.0.0.1:8787", changeOrigin: false } } },
    define: { CESIUM_BASE_URL: JSON.stringify(`${base}cesium/`) },
    plugins: [
      vue(),
      viteStaticCopy({ targets: ["Workers", "ThirdParty", "Assets", "Widgets"].map(name => ({ src: `node_modules/cesium/Build/Cesium/${name}`, dest: "cesium" })) }),
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