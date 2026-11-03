import { computed } from "vue";
import { useRoute } from "vue-router";
import { useHead } from "@unhead/vue";
import { site } from "../content/site.js";
import { findProduct } from "../content/products.js";
import { buildSearchGraph, serializeStructuredData } from "../content/search.js";

export function useSiteSeo() {
  const route = useRoute();
  const product = computed(() => findProduct(route.params.slug));
  const unknownProduct = computed(() => route.path.startsWith("/products/") && route.params.slug && !product.value);
  const noindex = computed(() => Boolean(route.meta.noindex || unknownProduct.value));
  const origin = String(import.meta.env.VITE_SITE_URL || "").replace(/\/$/, "");
  const base = import.meta.env.BASE_URL;
  const path = computed(() => route.path.endsWith("/") ? route.path : `${route.path}/`);
  const title = computed(() => unknownProduct.value ? "页面未找到" : product.value ? `${product.value.name}${product.value.kind === "solution" ? " · 定制开发方案" : ""}` : route.meta.title);
  const description = computed(() => product.value?.summary || route.meta.description || site.description);
  const canonical = computed(() => origin && !noindex.value ? `${origin}${base.replace(/\/$/, "")}${path.value}` : undefined);
  const graph = computed(() => noindex.value ? null : buildSearchGraph({ origin, base, path: path.value, title: title.value, description: description.value, product: product.value }));
  const image = origin ? `${origin}${base}social-card.png` : undefined;
  useHead(() => ({
    title: `${title.value} · ${site.name}`,
    htmlAttrs: { lang: "zh-CN" },
    meta: [
      { name: "description", content: description.value },
      { name: "theme-color", content: route.path === "/" ? "#f6edfc" : "#fcf9ff" },
      { name: "robots", content: noindex.value ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: site.shortName },
      { property: "og:title", content: `${title.value} · ${site.shortName}` },
      { property: "og:description", content: description.value },
      { property: "og:locale", content: "zh_CN" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `${title.value} · ${site.shortName}` },
      { name: "twitter:description", content: description.value },
      ...(canonical.value ? [{ property: "og:url", content: canonical.value }] : []),
      ...(image ? [{ property: "og:image", content: image }, { property: "og:image:width", content: "1200" }, { property: "og:image:height", content: "630" }, { property: "og:image:alt", content: "光年数智 · 软件开发与技术服务" }, { name: "twitter:image", content: image }] : []),
    ],
    link: canonical.value ? [{ rel: "canonical", href: canonical.value }] : [],
    script: graph.value ? [{ key: "site-structured-data", type: "application/ld+json", innerHTML: serializeStructuredData(graph.value) }] : [],
  }));
}
