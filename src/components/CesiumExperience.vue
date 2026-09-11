<script setup>
/*
 * Cesium 第二屏体验容器
 * 负责按需加载重型引擎、镜头模式控制和数据源状态展示，不直接操作 Cesium Viewer。
 */
import {
  defineAsyncComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  useTemplateRef,
} from "vue";

const active = shallowRef(new URLSearchParams(window.location.search).get("scene") === "cesium");
const viewMode = shallowRef("earth");
const sceneStatus = shallowRef({
  state: "idle",
  source: "Commercial source pending",
  message: "接近第二屏时加载真实世界三维数据",
});
const section = useTemplateRef("section");
const CesiumGlobe = defineAsyncComponent(() => import("./CesiumGlobe.vue"));
let loadObserver;

/**
 * 激活 Cesium 场景并立即进入加载状态
 * @returns {void}
 */
function activateScene() {
  if (active.value) return;
  sceneStatus.value = {
    state: "loading",
    source: "Connecting",
    message: "正在加载城市摄影测量与空间数据",
  };
  active.value = true;
}

/**
 * 接收场景组件上报的实际数据源状态
 * @param {{state:string,source:string,message:string}} status 当前场景状态
 * @returns {void}
 */
function handleSceneStatus(status) {
  sceneStatus.value = status;
}

/**
 * 切换地球总览或城市实景镜头
 * @param {"earth"|"city"} mode 目标镜头模式
 * @returns {void}
 */
function setViewMode(mode) {
  viewMode.value = mode;
  activateScene();
}

/**
 * 接近第二屏时预加载 Cesium；移动端缩短提前量以控制流量和内存
 * @returns {Promise<void>}
 */
async function setupDeferredActivation() {
  if (active.value) {
    await nextTick();
    section.value?.scrollIntoView({ block: "start" });
    return;
  }

  const mobile = matchMedia("(max-width: 768px)").matches;
  loadObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    activateScene();
    loadObserver.disconnect();
  }, {
    rootMargin: mobile ? "0px" : "320px 0px",
    threshold: mobile ? 0.18 : 0.01,
  });
  loadObserver.observe(section.value);
}

onMounted(setupDeferredActivation);
onBeforeUnmount(() => loadObserver?.disconnect());
</script>

<template>
  <!-- 第二屏负责解释真实世界数据价值，Cesium 画布保持为唯一视觉主角。 -->
  <section id="spatial" ref="section" class="spatial-lab">
    <div class="section-head spatial-head">
      <div class="spatial-copy">
        <p class="eyebrow reveal">3D Spatial Intelligence · CesiumJS</p>
        <h2 class="h2">
          <span class="line-mask"><span class="line">把数据放进真实世界</span></span>
        </h2>
        <p class="section-sub reveal d2">
          从全球链路切入真实城市，以摄影测量 3D Tiles 呈现街区、建筑与地形细节。
          场景按需加载，业务数据始终使用 WGS84 坐标与真实空间对齐。
        </p>
      </div>

      <div class="spatial-actions reveal d2">
        <span class="spatial-source-pill" :class="`is-${sceneStatus.state}`">
          <i></i>{{ sceneStatus.source }}
        </span>
        <button v-if="!active" class="btn btn-solid spatial-launch magnetic" type="button" @click="activateScene">
          进入真实城市 <span class="arr">→</span>
        </button>
      </div>
    </div>

    <div class="spatial-stage reveal">
      <!-- HUD 只展示与当前场景相关的信息，不遮挡右下角法定版权归属。 -->
      <div class="spatial-hud" aria-hidden="true">
        <span><i :class="`is-${sceneStatus.state}`"></i> {{ sceneStatus.message }}</span>
        <span>WGS84 · 3D TILES · HIGH DPI</span>
      </div>

      <div v-if="active" class="spatial-view-switch" aria-label="三维场景视角">
        <button
          type="button"
          :class="{ active: viewMode === 'earth' }"
          @click="setViewMode('earth')"
        >
          地球总览
        </button>
        <button
          type="button"
          :class="{ active: viewMode === 'city' }"
          @click="setViewMode('city')"
        >
          城市实景
        </button>
      </div>

      <Suspense>
        <CesiumGlobe
          v-if="active"
          :view-mode="viewMode"
          @status="handleSceneStatus"
        />
        <template #fallback>
          <div class="spatial-loading"><span></span>正在加载 Cesium 引擎…</div>
        </template>
      </Suspense>

      <button v-if="!active" class="spatial-placeholder" type="button" @click="activateScene">
        <span class="spatial-orbit" aria-hidden="true"><i></i><i></i><i></i></span>
        <b>进入真实世界三维场景</b>
        <small>支持 Google Photorealistic 3D Tiles 与 Cesium ion 商业数据源</small>
      </button>

      <div class="spatial-meta" aria-hidden="true">
        <span>REAL-WORLD MESH</span><span>ON-DEMAND STREAMING</span><span>COMMERCIAL READY</span>
      </div>
    </div>

    <p v-if="sceneStatus.state === 'degraded'" class="spatial-notice" role="status">
      {{ sceneStatus.message }}。生产环境请在 <code>.env</code> 中配置 Google Map Tiles API Key 或 Cesium ion Token。
    </p>
  </section>
</template>

<style scoped>
.spatial-lab {
  position: relative;
  padding: clamp(76px, 9vw, 132px) 0 clamp(100px, 12vw, 170px);
  overflow: hidden;
  background:
    radial-gradient(circle at 74% 28%, rgba(255, 92, 26, 0.14), transparent 36%),
    radial-gradient(circle at 22% 76%, rgba(110, 58, 30, 0.11), transparent 34%),
    linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px),
    #0a0a0c;
  background-size: auto, auto, 84px 84px, 84px 84px, auto;
}

.spatial-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 40px;
}

.spatial-copy {
  max-width: 780px;
}

.spatial-actions {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: flex-end;
  gap: 14px;
  margin-bottom: 4px;
}

.spatial-source-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 320px;
  color: rgba(245, 244, 240, 0.62);
  font: 10px/1.35 monospace;
  letter-spacing: 0.08em;
  text-align: right;
}

.spatial-source-pill i {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #8a8a93;
}

.spatial-source-pill.is-ready i {
  background: #3ddc84;
  box-shadow: 0 0 12px rgba(61, 220, 132, 0.72);
}

.spatial-source-pill.is-loading i {
  background: var(--accent);
  box-shadow: 0 0 12px var(--accent-soft);
  animation: spatial-live 1.1s ease-in-out infinite;
}

.spatial-source-pill.is-degraded i,
.spatial-source-pill.is-error i {
  background: #ffb15c;
  box-shadow: 0 0 12px rgba(255, 177, 92, 0.55);
}

.spatial-stage {
  position: relative;
  width: min(calc(100% - var(--pad) * 1.2), 1540px);
  height: clamp(680px, 78vh, 920px);
  margin: clamp(42px, 6vw, 72px) auto 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 28px;
  background: #05070b;
  box-shadow:
    0 58px 180px rgba(0, 0, 0, 0.58),
    0 0 90px rgba(255, 92, 26, 0.07),
    inset 0 0 0 1px rgba(255, 255, 255, 0.025);
}

.spatial-stage::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  border-radius: inherit;
  background:
    linear-gradient(90deg, rgba(255, 92, 26, 0.16), transparent 10%, transparent 90%, rgba(255, 92, 26, 0.1)),
    linear-gradient(180deg, rgba(0, 0, 0, 0.28), transparent 16%, transparent 82%, rgba(0, 0, 0, 0.42));
  box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.28);
}

.spatial-hud {
  position: absolute;
  z-index: 7;
  left: 22px;
  right: 22px;
  top: 18px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  pointer-events: none;
  color: rgba(245, 244, 240, 0.62);
  font: 10px/1.3 monospace;
  letter-spacing: 0.11em;
}

.spatial-hud i {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 8px;
  border-radius: 50%;
  background: #8a8a93;
}

.spatial-hud i.is-ready {
  background: #3ddc84;
  box-shadow: 0 0 12px #3ddc84;
}

.spatial-hud i.is-loading {
  background: var(--accent);
  box-shadow: 0 0 12px var(--accent);
  animation: spatial-live 1.1s ease-in-out infinite;
}

.spatial-hud i.is-degraded,
.spatial-hud i.is-error {
  background: #ffb15c;
}

.spatial-view-switch {
  position: absolute;
  z-index: 8;
  top: 48px;
  right: 22px;
  display: flex;
  gap: 4px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: rgba(7, 7, 9, 0.72);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.spatial-view-switch button {
  padding: 8px 14px;
  border-radius: 999px;
  color: rgba(245, 244, 240, 0.58);
  font-size: 12px;
  transition: color .3s, background .3s, box-shadow .3s;
}

.spatial-view-switch button:hover {
  color: var(--paper);
}

.spatial-view-switch button.active {
  color: #fff;
  background: var(--accent);
  box-shadow: 0 5px 24px rgba(255, 92, 26, 0.24);
}

.spatial-placeholder {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 10px;
  color: var(--paper);
  background:
    radial-gradient(circle at center, rgba(255, 92, 26, 0.1), transparent 38%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.01), transparent);
}

.spatial-placeholder b {
  margin-top: 24px;
  font-size: clamp(1.2rem, 2vw, 1.6rem);
}

.spatial-placeholder small {
  max-width: calc(100vw - 72px);
  color: var(--muted);
  text-align: center;
}

.spatial-orbit {
  position: relative;
  width: 164px;
  height: 164px;
  border: 1px solid rgba(255, 92, 26, 0.48);
  border-radius: 50%;
  box-shadow: inset 0 0 52px rgba(255, 92, 26, 0.08), 0 0 54px rgba(255, 92, 26, 0.07);
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
  z-index: 7;
  left: 20px;
  right: 20px;
  bottom: 16px;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  color: rgba(245, 244, 240, 0.44);
  font: 10px/1 monospace;
  letter-spacing: 0.13em;
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

.spatial-notice {
  width: min(calc(100% - var(--pad) * 1.2), 1540px);
  margin: 18px auto 0;
  color: #caa17d;
  font-size: 12px;
  line-height: 1.7;
}

.spatial-notice code {
  color: var(--paper);
  font-family: monospace;
}

@keyframes spatial-spin {
  to { transform: rotate(360deg); }
}

@keyframes spatial-float {
  50% { transform: translateY(-10px); }
}

@keyframes spatial-live {
  50% { opacity: 0.35; }
}

@media (max-width: 768px) {
  .spatial-head {
    align-items: start;
    flex-direction: column;
  }

  .spatial-actions {
    width: 100%;
    align-items: flex-start;
  }

  .spatial-stage {
    width: calc(100% - 28px);
    height: 570px;
    border-radius: 18px;
  }

  .spatial-launch {
    width: 100%;
    justify-content: center;
  }

  .spatial-hud {
    left: 14px;
    right: 14px;
    font-size: 8px;
  }

  .spatial-hud span:last-child {
    display: none;
  }

  .spatial-view-switch {
    top: 46px;
    right: 14px;
  }

  .spatial-meta {
    left: 12px;
    right: 12px;
    font-size: 8px;
  }

  .spatial-meta span:nth-child(2) {
    display: none;
  }

  .spatial-notice {
    width: calc(100% - 28px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spatial-orbit,
  .spatial-orbit i,
  .spatial-source-pill i,
  .spatial-hud i,
  .spatial-loading span {
    animation: none;
  }
}
</style>