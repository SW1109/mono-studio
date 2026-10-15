<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { site } from "../../content/site.js";
import mark from "../../assets/brand-mark.png";

const route = useRoute();
const menu = ref(null);
const menuOpen = ref(false);
let previousOverflow = "";
let desktopQuery;

function handleDesktopChange(event) {
  if (event.matches) closeMenu();
}

function restoreScroll() {
  if (menuOpen.value) document.body.style.overflow = previousOverflow;
  menuOpen.value = false;
}
function closeMenu() {
  menu.value?.close();
  restoreScroll();
}
function openMenu() {
  previousOverflow = document.body.style.overflow;
  menuOpen.value = true;
  document.body.style.overflow = "hidden";
  menu.value?.showModal();
}
watch(() => route.fullPath, closeMenu);
onMounted(() => {
  desktopQuery = matchMedia("(min-width: 1041px)");
  desktopQuery.addEventListener("change", handleDesktopChange);
});
onBeforeUnmount(() => {
  desktopQuery?.removeEventListener("change", handleDesktopChange);
  if (!import.meta.env.SSR) closeMenu();
});
</script>

<template>
  <header class="site-header">
    <div class="container header-inner">
      <RouterLink class="brand" to="/" :aria-label="`${site.name}首页`">
        <img :src="mark" width="44" height="37" alt="" />
        <span><strong>光年数智</strong><small>GUANGNIAN · DIGITAL</small></span>
      </RouterLink>
      <nav class="desktop-nav" aria-label="主导航">
        <RouterLink v-for="item in site.navigation" :key="item.to" :to="item.to" :class="{ 'is-active': item.to === '/' ? route.path === '/' : route.path.startsWith(item.to) }">{{ item.label }}</RouterLink>
      </nav>
      <RouterLink class="button button-primary header-contact" to="/contact/">项目咨询 <span aria-hidden="true">↗</span></RouterLink>
      <button class="menu-toggle" type="button" aria-label="打开导航菜单" aria-controls="mobile-menu" :aria-expanded="menuOpen" @click="openMenu"><span></span><span></span></button>
    </div>
    <dialog id="mobile-menu" ref="menu" class="mobile-menu" aria-label="导航菜单" @close="restoreScroll" @click="(event) => { if (event.target === menu) closeMenu(); }">
      <div class="mobile-menu-top"><strong>光年数智</strong><button class="icon-button" type="button" aria-label="关闭导航菜单" @click="closeMenu">×</button></div>
      <nav aria-label="移动端主导航"><RouterLink v-for="item in site.navigation" :key="item.to" :to="item.to" @click="closeMenu">{{ item.label }} <span aria-hidden="true">↗</span></RouterLink><RouterLink to="/contact/" @click="closeMenu">联系合作 <span aria-hidden="true">↗</span></RouterLink></nav>
      <p>专注软件研发，设计与工程并重。</p>
    </dialog>
  </header>
</template>