<script setup>
import { nextTick, ref, watch } from "vue";
import { RouterView, useRoute } from "vue-router";
import SiteHeader from "./components/site/SiteHeader.vue";
import SiteFooter from "./components/site/SiteFooter.vue";
import { useSiteMotion } from "./composables/useSiteMotion.js";
import { useSiteSeo } from "./composables/useSiteSeo.js";

const mainContent = ref(null);
const { motionMode } = useSiteMotion(mainContent);
const route = useRoute();
useSiteSeo();

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