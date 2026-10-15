<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { RouterView, useRoute } from "vue-router";
import { useHead } from "@unhead/vue";
import SiteHeader from "./components/site/SiteHeader.vue";
import SiteFooter from "./components/site/SiteFooter.vue";
import { site } from "./content/site.js";
import { findProduct } from "./content/products.js";
import { useSiteMotion } from "./composables/useSiteMotion.js";

const mainContent = ref(null);
const { motionMode } = useSiteMotion(mainContent);
const route = useRoute();
const product = computed(() => findProduct(route.params.slug));
const productTitle = computed(() => product.value ? `${product.value.name}${product.value.kind === "solution" ? " · 定制开发方案" : ""}` : undefined);
const unknownProduct = computed(() => route.path.startsWith("/products/") && route.params.slug && !product.value);
const configuredUrl = String(import.meta.env.VITE_SITE_URL || "").replace(/\/$/, "");
const canonical = computed(() => configuredUrl && !route.meta.noindex && !unknownProduct.value ? `${configuredUrl}${import.meta.env.BASE_URL.replace(/\/$/, "")}${route.path}` : undefined);

useHead(() => ({
  title: `${unknownProduct.value ? "页面未找到" : productTitle.value || route.meta.title} · ${site.name}`,
  meta: [
    { name: "description", content: product.value?.summary || route.meta.description || site.description },
    { name: "theme-color", content: route.path === "/" ? "#f6edfc" : "#fcf9ff" },
    { name: "robots", content: route.meta.noindex || unknownProduct.value ? "noindex, follow" : "index, follow" },
    { property: "og:type", content: "website" },
    { property: "og:title", content: `${unknownProduct.value ? "页面未找到" : productTitle.value || route.meta.title} · ${site.shortName}` },
    { property: "og:description", content: product.value?.summary || route.meta.description || site.description },
    { property: "og:locale", content: "zh_CN" },
    ...(canonical.value ? [{ property: "og:url", content: canonical.value }] : []),
  ],
  link: canonical.value ? [{ rel: "canonical", href: canonical.value }] : [],
}));

watch(() => route.fullPath, async () => {
  if (import.meta.env.SSR) return;
  await nextTick();
  document.getElementById("main-content")?.focus({ preventScroll: true });
});
</script>

<template>
  <a class="skip-link" href="#main-content">跳转到主要内容</a>
  <SiteHeader />
  <main id="main-content" ref="mainContent" :data-motion="motionMode" tabindex="-1">
    <RouterView v-slot="{ Component }">
      <div :key="route.path" class="route-page" :class="{ 'route-page--home': route.path === '/' }"><component :is="Component" /></div>
    </RouterView>
  </main>
  <SiteFooter />
</template>