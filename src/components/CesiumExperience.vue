<script setup>
import { defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref } from "vue";

const active = ref(new URLSearchParams(window.location.search).get("scene") === "cesium");
const section = ref(null);
const CesiumGlobe = defineAsyncComponent(() => import("./CesiumGlobe.vue"));
let loadObserver;

onMounted(async () => {
  if (active.value) {
    await nextTick();
    section.value?.scrollIntoView({ block: "start" });
    return;
  }

  const mobile = matchMedia("(max-width: 768px)").matches;
  loadObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    active.value = true;
    loadObserver.disconnect();
  }, { rootMargin: mobile ? "0px" : "320px 0px", threshold: mobile ? 0.18 : 0.01 });
  loadObserver.observe(section.value);
});

onBeforeUnmount(() => loadObserver?.disconnect());
</script>

<template>
  <section id="spatial" ref="section" class="spatial-lab">
    <div class="section-head spatial-head">
      <div>
        <p class="eyebrow reveal">3D Spatial Lab · CesiumJS</p>
        <h2 class="h2">
          <span class="line-mask"><span class="line">把数据放进真实世界</span></span>
        </h2>
        <p class="section-sub reveal d2">
          Three.js 负责品牌视觉，CesiumJS 驱动高清地球、城市节点与空间链路。接近第二屏时自动加载，不阻塞首屏。
        </p>
      </div>
      <button v-if="!active" class="btn btn-solid spatial-launch magnetic" type="button" @click="active = true">
        启动地球场景 <span class="arr">→</span>
      </button>
    </div>

    <div class="spatial-stage reveal">
      <div class="spatial-hud" aria-hidden="true">
        <span><i></i> LIVE EARTH ENGINE</span>
        <span>HIGH DPI · HDR · WEBGL</span>
      </div>
      <Suspense>
        <CesiumGlobe v-if="active" />
        <template #fallback>
          <div class="spatial-loading"><span></span>正在加载 Cesium 引擎…</div>
        </template>
      </Suspense>
      <button v-if="!active" class="spatial-placeholder" type="button" @click="active = true">
        <span class="spatial-orbit" aria-hidden="true"><i></i><i></i><i></i></span>
        <b>按需加载 CesiumJS</b>
        <small>本地 Natural Earth 图层 · 无需 Ion Token</small>
      </button>
      <div class="spatial-meta" aria-hidden="true">
        <span>WGS84</span><span>WEBGL</span><span>LAZY CHUNK</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.spatial-lab {
  position: relative;
  padding: clamp(76px, 9vw, 132px) 0 clamp(100px, 12vw, 170px);
  overflow: hidden;
  background:
    radial-gradient(circle at 75% 25%, rgba(255, 92, 26, 0.16), transparent 38%),
    linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px),
    #0a0a0c;
  background-size: auto, 84px 84px, 84px 84px, auto;
}

.spatial-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 40px;
}

.spatial-head > div {
  max-width: 720px;
}

.spatial-launch {
  flex: 0 0 auto;
  margin-bottom: 4px;
}

.spatial-stage {
  position: relative;
  width: min(calc(100% - var(--pad) * 1.4), 1480px);
  height: clamp(640px, 74vh, 880px);
  margin: clamp(42px, 6vw, 72px) auto 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 28px;
  background: #070709;
  box-shadow: 0 52px 160px rgba(0, 0, 0, 0.5), 0 0 80px rgba(255, 92, 26, 0.08);
}

.spatial-stage::before {
  content: "";
  position: absolute;
  z-index: 3;
  left: 0;
  right: 0;
  top: -18%;
  height: 18%;
  pointer-events: none;
  background: linear-gradient(to bottom, transparent, rgba(255, 92, 26, 0.08), rgba(255, 92, 26, 0.42));
  mix-blend-mode: screen;
  animation: spatial-scan 7s ease-in-out infinite;
}

.spatial-stage::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  z-index: 4;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04), inset 0 0 90px rgba(255, 92, 26, 0.035);
}

.spatial-hud {
  position: absolute;
  z-index: 5;
  left: 22px;
  right: 22px;
  top: 18px;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  color: rgba(245, 244, 240, 0.58);
  font: 10px/1 monospace;
  letter-spacing: 0.14em;
}

.spatial-hud i {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 8px;
  border-radius: 50%;
  background: #3ddc84;
  box-shadow: 0 0 12px #3ddc84;
  animation: spatial-live 1.8s ease-in-out infinite;
}

.spatial-placeholder {
  position: absolute;
  inset: 0;
  width: 100%;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 10px;
  color: var(--paper);
  background: radial-gradient(circle at center, rgba(255, 92, 26, 0.1), transparent 42%);
}

.spatial-placeholder b {
  margin-top: 24px;
  font-size: clamp(1.2rem, 2vw, 1.6rem);
}

.spatial-placeholder small {
  color: var(--muted);
}

.spatial-orbit {
  position: relative;
  width: 154px;
  height: 154px;
  border: 1px solid rgba(255, 92, 26, 0.5);
  border-radius: 50%;
  box-shadow: inset 0 0 45px rgba(255, 92, 26, 0.08), 0 0 48px rgba(255, 92, 26, 0.08);
  animation: spatial-float 5s var(--ease) infinite;
}

.spatial-orbit::before,
.spatial-orbit::after,
.spatial-orbit i {
  content: "";
  position: absolute;
  inset: 19%;
  border: 1px solid rgba(255, 255, 255, 0.17);
  border-radius: 50%;
  transform: rotateX(66deg);
}

.spatial-orbit::after {
  transform: rotateY(66deg);
}

.spatial-orbit i:nth-child(1) {
  inset: -4px;
  border-color: transparent;
  border-top-color: var(--accent);
  animation: spatial-spin 4s linear infinite;
}

.spatial-orbit i:nth-child(2) {
  inset: 46%;
  border: 0;
  background: var(--accent);
  box-shadow: 0 0 22px var(--accent);
}

.spatial-meta {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 16px;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  color: rgba(245, 244, 240, 0.42);
  font: 10px/1 monospace;
  letter-spacing: 0.14em;
}

.spatial-loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 16px;
  color: var(--muted);
}

.spatial-loading span {
  width: 28px;
  height: 28px;
  margin: auto;
  border: 2px solid var(--line);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spatial-spin 0.8s linear infinite;
}

@keyframes spatial-spin {
  to { transform: rotate(360deg); }
}

@keyframes spatial-float {
  50% { transform: translateY(-10px); }
}

@keyframes spatial-scan {
  0%, 14% { transform: translateY(0); opacity: 0; }
  24% { opacity: 0.62; }
  72% { opacity: 0.32; }
  86%, 100% { transform: translateY(655%); opacity: 0; }
}

@keyframes spatial-live {
  50% { opacity: 0.35; }
}

@media (max-width: 768px) {
  .spatial-head { align-items: start; flex-direction: column; }
  .spatial-stage { width:calc(100% - 28px);height:520px;border-radius:18px; }
  .spatial-launch { width: 100%; justify-content: center; }
  .spatial-hud { left:14px;right:14px;font-size:8px; }
}
</style>
