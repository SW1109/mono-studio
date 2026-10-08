<script setup>
import { onBeforeUnmount, shallowRef } from "vue";
import PageHeading from "../components/site/PageHeading.vue";
import ContactBanner from "../components/site/ContactBanner.vue";

const sceneComponent = shallowRef(null);
const state = shallowRef("idle");
let generation = 0;

async function start() {
  const current = ++generation;
  state.value = "loading";
  try {
    // 唯一引擎入口留在用户操作中，路由预渲染及预取不触发加载。
    const { default: component } = await import("../components/CesiumExperience.vue");
    if (current !== generation) return;
    sceneComponent.value = component;
    state.value = "ready";
  } catch {
    if (current !== generation) return;
    state.value = "error";
  }
}
function stop() {
  generation += 1;
  sceneComponent.value = null;
  state.value = "idle";
}
onBeforeUnmount(stop);
</script>
<template><PageHeading eyebrow="GUANGNIAN / TECH LAB" title="让空间数据，被直观看见。" current="技术演示" description="一个独立的三维空间技术演示。它展示可视化的可能性，不是工作室的实时业务数据。" /><section class="container lab-content"><div class="lab-intro"><div><span class="tag">CESIUM / 3D VISUALIZATION</span><h2>从地球总览，到城市空间。</h2><p>演示需要支持 WebGL 的浏览器，启动后会加载三维引擎与场景资源。第三方地图数据可能产生外部请求；未配置数据源时使用本地预览底图。</p><p class="small-note">普通页面不会加载该引擎。你可以随时停止，离开本页时场景会销毁。</p></div><div class="lab-controls"><button v-if="state === 'idle' || state === 'error'" class="button button-primary" type="button" @click="start">{{ state === 'error' ? '重试加载' : '启动三维演示' }} <span aria-hidden="true">↗</span></button><button v-if="state === 'loading' || state === 'ready'" class="button button-secondary" type="button" @click="stop">{{ state === 'loading' ? '取消启动' : '停止演示' }}</button></div></div><div v-if="state === 'idle'" class="lab-placeholder" aria-label="三维演示未启动"><div class="static-globe" aria-hidden="true"><i></i><i></i><i></i></div><strong>仅在你准备好时，开启三维空间。</strong><p>尚未加载引擎与地图数据</p></div><div v-else-if="state === 'loading' || state === 'error'" class="lab-placeholder" role="status"><strong>{{ state === 'loading' ? '正在准备三维演示…' : '暂时无法加载三维演示。' }}</strong><p>{{ state === 'loading' ? '首次启动需要下载引擎资源，你可以取消等待。' : '请检查网络连接，再点击重试；也可以继续浏览其他页面。' }}</p></div><component :is="sceneComponent" v-else-if="sceneComponent" /></section><ContactBanner :title="'数据可视化，\n也可以服务你的场景。'" description="如果你有地图、空间数据或业务可视化需求，欢迎交流。" /></template>
<style scoped>
.lab-content { padding-bottom: 32px; }.lab-intro { display: flex; align-items: center; justify-content: space-between; gap: 40px; padding: 30px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; margin-bottom: 24px; }.lab-intro > div:first-child { max-width: 700px; }.lab-intro h2 { font-size: 24px; margin: 15px 0; }.lab-intro p:not(.small-note) { font-size: 13px; color: var(--muted); line-height: 1.9; }.lab-intro .small-note { margin-top: 12px; }.lab-controls { flex-shrink: 0; }.lab-placeholder { min-height: 400px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 16px; text-align: center; padding: 32px; border: 1px solid var(--line); border-radius: 14px; background: radial-gradient(ellipse at 50% 20%, #edf3fe, transparent 65%), #fafcfe; }.lab-placeholder strong { font-size: 18px; }.lab-placeholder p { font-size: 12px; color: var(--muted); }.static-globe { position: relative; width: 160px; height: 160px; border: 1px solid #93afe5; border-radius: 50%; margin-bottom: 15px; }.static-globe::before, .static-globe::after { content: ''; position: absolute; border: 1px solid #c0d2f2; border-radius: 50%; }.static-globe::before { inset: 35% 0; }.static-globe::after { inset: 0 28%; }.static-globe i { position: absolute; width: 6px; height: 6px; background: var(--accent); border-radius: 50%; top: 28%; left: 20%; }.static-globe i:nth-child(2) { top: 65%; left: 64%; }.static-globe i:nth-child(3) { top: 25%; left: 70%; }
@media (max-width: 760px) { .lab-intro { flex-direction: column; align-items: start; gap: 24px; padding: 24px; }.lab-placeholder { min-height: 340px; }.lab-placeholder strong { font-size: 15px; } }
</style>