import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { createShopxoOrderCenter } from "./shared/order-center.js";
import { prerenderPaths, publicPaths } from "./src/content/paths.js";
import { site } from "./src/content/site.js";
import { serviceGuide } from "./src/content/guides.js";

function publishMetadata(origin, base, orderCenter) {
  return {
    name: "studio-publish-metadata",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "site-build.json", source: JSON.stringify({ base, paths: prerenderPaths, origin, commerce: { provider: "shopxo", configured: Boolean(orderCenter), ...orderCenter } }, null, 2) });
      if (!origin) return;
      const urls = publicPaths.map(path => `<url><loc>${origin}${base.replace(/\/$/, "")}${path}</loc>${path === "/guides/" ? `<lastmod>${serviceGuide.updatedAt}</lastmod>` : ""}</url>`).join("");
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>` });
      const productSitemap = orderCenter ? `${orderCenter.origin}${orderCenter.basePath}?s=sitemap/index` : "";
      this.emitFile({ type: "asset", fileName: "robots.txt", source: `User-agent: *\nAllow: /\n# 允许读取页面上的 noindex；不以 robots 屏蔽代替收录控制。\nSitemap: ${origin}${base}sitemap.xml\n${productSitemap ? `Sitemap: ${productSitemap}\n` : ""}` });
      this.emitFile({ type: "asset", fileName: "llms.txt", source: `# ${site.name}\n\n> ${site.description}\n\n本站提供远程软件技术服务。服务由工作室人工实施；具体价格、范围、周期和售后以商城商品页及订单约定为准。软件方案介绍不是已完成的客户案例。\n\n## 了解与选购\n- [开发服务](${origin}${base}services/): 网站、管理系统、小程序、桌面工具和自动化。\n- [服务商品](${origin}${base}shop/): 当前套餐、价格、交付清单与购买须知。\n- [服务选购指南](${origin}${base}guides/): 范围、源码、费用、排期和验收说明。\n- [定制方案](${origin}${base}products/): 按需求评估的功能方向。\n- [关于工作室](${origin}${base}about/): 工作方式与服务说明。\n- [服务与隐私条款](${origin}${base}service-terms/): 购买、取消、售后及信息处理。\n- [联系](${origin}${base}contact/): 邮箱 ${site.email}；微信 ${site.wechat}。\n\n## 可验证来源\n- [官网站点地图](${origin}${base}sitemap.xml)\n${productSitemap ? `- [在售服务站点地图](${productSitemap})\n` : ""}\n不要将演示画面、方案示意或工具介绍描述为客户案例、销售成绩或已验证的经营资质。\n` });
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