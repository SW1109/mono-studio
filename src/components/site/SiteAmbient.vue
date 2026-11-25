<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

// 内页背景：沿用首页的光点场景，不同栏目对应不同形态与主色，切换页面时光点直接变形过去。
const looks = [
  [/^\/services\//, 4, "#c3a0ff"],
  [/^\/products\//, 3, "#e7c07c"],
  [/^\/projects\//, 1, "#7fb2ff"],
  [/^\/guides\//, 1, "#91cfb4"],
  [/^\/about\//, 5, "#f0a6c8"],
  [/^\/contact\//, 2, "#91cfb4"],
  [/^\/service-terms\//, 0, "#9ba5ff"],
];
const route = useRoute();
const canvas = ref(null);
let scene;
let deep = false;
let disposed = false;
let idleId;

function look(path) {
  const match = looks.find(([pattern]) => pattern.test(path));
  return match ? { index: match[1], color: match[2] } : { index: 0, color: "#9ba5ff" };
}

function apply() {
  const { index, color } = look(route.path);
  document.documentElement.style.setProperty("--page-light", color);
  // 读到正文后光点退后，只留氛围，不干扰阅读。
  scene?.go(index, { color, side: "left", scale: 0.82, dim: deep ? 0.32 : 0.78 });
}

function onScroll() {
  const next = window.scrollY > window.innerHeight * 0.55;
  if (next === deep) return;
  deep = next;
  apply();
}

onMounted(() => {
  apply();
  window.addEventListener("scroll", onScroll, { passive: true });
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const load = () => import("../home/lightyear-scene.js")
    .then(({ createLightyearScene }) => {
      if (disposed || !canvas.value) return;
      scene = createLightyearScene(canvas.value, { reduced });
      onScroll();
      apply();
    })
    .catch(() => { if (canvas.value) canvas.value.hidden = true; });
  // 等页面主体渲染完再加载三维背景，不抢首屏。
  if ("requestIdleCallback" in window) idleId = requestIdleCallback(load, { timeout: 1200 });
  else idleId = setTimeout(load, 300);
});

watch(() => route.path, () => { deep = false; apply(); });

onBeforeUnmount(() => {
  disposed = true;
  if ("cancelIdleCallback" in window) cancelIdleCallback(idleId);
  clearTimeout(idleId);
  window.removeEventListener("scroll", onScroll);
  document.documentElement.style.removeProperty("--page-light");
  scene?.dispose();
});
</script>

<template>
  <div class="site-ambient" aria-hidden="true">
    <div class="ambient-glow"></div>
    <canvas ref="canvas"></canvas>
    <div class="ambient-vignette"></div>
    <div class="ambient-grain"></div>
  </div>
</template>

<style scoped>
.site-ambient { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.site-ambient canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; opacity: 0; transition: opacity 1.6s ease; }
.site-ambient canvas[data-ready] { opacity: 1; }
.ambient-glow { position: absolute; inset: 0; background: radial-gradient(36% 46% at 74% 30%, color-mix(in srgb, var(--page-light) 15%, transparent), transparent 72%); transition: background 1s ease; }
.ambient-vignette { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(8, 9, 11, .72), rgba(8, 9, 11, .2) 52%, transparent 70%), radial-gradient(circle at 50% 50%, transparent 50%, rgba(8, 9, 11, .9) 100%); }
.ambient-grain { position: absolute; inset: 0; opacity: .06; mix-blend-mode: overlay; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
@media (max-width: 760px) {
  .ambient-vignette { background: linear-gradient(180deg, transparent, rgba(8, 9, 11, .55) 40%, rgba(8, 9, 11, .85) 70%); }
}
@media (prefers-reduced-motion: reduce) { .site-ambient canvas, .ambient-glow { transition: none; } }
</style>
