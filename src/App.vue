<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import SiteHeader from "./components/site/SiteHeader.vue";
import SiteFooter from "./components/site/SiteFooter.vue";
import SiteAmbient from "./components/site/SiteAmbient.vue";
import { useSiteMotion } from "./composables/useSiteMotion.js";
import { useSiteSeo } from "./composables/useSiteSeo.js";
import { getLenis, settleSmoothScroll, startSmoothScroll } from "./composables/smoothScroll.js";

const mainContent = ref(null);
const { motionMode } = useSiteMotion(mainContent);
const route = useRoute();
const router = useRouter();
useSiteSeo();

// 首页自带三维舞台；技术演示页加载 Cesium，不叠加第二个 WebGL 背景。
const showAmbient = computed(() => route.path !== "/" && !route.path.startsWith("/lab/"));

if (!import.meta.env.SSR) router.beforeEach(() => { settleSmoothScroll(); });
onMounted(() => { startSmoothScroll(); });

watch(() => route.fullPath, async () => {
  if (import.meta.env.SSR) return;
  await nextTick();
  getLenis()?.resize();
  document.getElementById("main-content")?.focus({ preventScroll: true });
});
</script>

<template>
  <a class="skip-link" href="#main-content">跳转到主要内容</a>
  <SiteAmbient v-if="showAmbient" />
  <SiteHeader />
  <main id="main-content" ref="mainContent" :data-motion="motionMode" tabindex="-1">
    <RouterView v-slot="{ Component }">
      <div :key="route.path" class="route-page" :class="{ 'route-page--home': route.path === '/' }"><component :is="Component" /></div>
    </RouterView>
  </main>
  <SiteFooter />
</template>
