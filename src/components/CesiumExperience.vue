<script setup>
import { onBeforeUnmount, onMounted, shallowRef } from "vue";

const globe = shallowRef(null);
const viewMode = shallowRef("earth");
const status = shallowRef({ state: "loading", source: "三维空间", message: "正在加载三维引擎…" });
let generation = 0;

async function loadScene() {
  const current = ++generation;
  globe.value = null;
  status.value = { state: "loading", source: "三维空间", message: "正在加载三维引擎…" };
  try {
    const { default: component } = await import("./CesiumGlobe.vue");
    if (current !== generation) return;
    globe.value = component;
  } catch {
    if (current !== generation) return;
    status.value = { state: "error", source: "加载失败", message: "引擎资源暂时无法加载，请检查网络后重试。" };
  }
}
function handleStatus(value) {
  status.value = value;
  if (value.state === "error") globe.value = null;
}
onMounted(loadScene);
onBeforeUnmount(() => { generation += 1; });
</script>

<template>
  <div class="scene-shell">
    <div class="scene-toolbar"><div role="status" aria-live="polite"><strong>{{ status.source }}</strong><span>{{ status.message }}</span></div><div v-if="globe" class="view-switch" role="group" aria-label="三维场景视角"><button type="button" :aria-pressed="viewMode === 'earth'" @click="viewMode = 'earth'">地球总览</button><button type="button" :aria-pressed="viewMode === 'city'" @click="viewMode = 'city'">城市近景</button></div></div>
    <div class="scene-stage"><component :is="globe" v-if="globe" :key="generation" :view-mode="viewMode" @status="handleStatus" /><div v-else class="scene-feedback"><p>{{ status.message }}</p><button v-if="status.state === 'error'" class="button button-primary" type="button" @click="loadScene">重试加载</button></div><span v-if="globe && status.state === 'loading'" class="scene-loading">正在准备场景…</span></div>
    <p class="scene-caption">演示数据 · 非实时业务指标。地图与瓦片版权归属请见画布标注；实景数据的可用性取决于配置与服务权限。</p>
  </div>
</template>
<style scoped>
.scene-shell { border: 1px solid var(--line); border-radius: 14px; overflow: hidden; background: white; }.scene-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 24px; padding: 18px 22px; border-bottom: 1px solid var(--line); }.scene-toolbar strong { display: block; font-size: 11px; }.scene-toolbar span { display: block; font-size: 10px; color: var(--muted); margin-top: 5px; }.view-switch { display: flex; flex-shrink: 0; gap: 5px; padding: 4px; background: var(--surface); border: 1px solid var(--line); border-radius: 7px; }.view-switch button { padding: 7px 12px; border: none; background: transparent; font-size: 11px; border-radius: 4px; }.view-switch button[aria-pressed='true'] { background: white; color: var(--accent); box-shadow: 0 1px 3px #213b551a; }.scene-stage { height: min(65vh, 600px); min-height: 380px; position: relative; background: #05070b; }.scene-feedback { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; padding: 28px; text-align: center; color: #c1cddd; font-size: 13px; }.scene-loading { position: absolute; top: 15px; left: 15px; padding: 6px 10px; color: #d5e2f4; background: #14213ce6; border-radius: 5px; font-size: 11px; pointer-events: none; }.scene-caption { padding: 13px 22px; font-size: 10px; color: var(--muted); }
@media (max-width: 760px) { .scene-toolbar { flex-direction: column; align-items: start; gap: 14px; }.scene-stage { min-height: 340px; }.scene-caption { padding: 13px 18px; } }
</style>