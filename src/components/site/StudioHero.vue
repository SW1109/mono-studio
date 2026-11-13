<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import SiteNavLink from "./SiteNavLink.vue";
import SolutionShowcase from "./SolutionShowcase.vue";
import poster from "../../assets/visuals/particle-poster.webp";

const field = ref(null);
const canvas = ref(null);
let dispose;
let unmounted = false;

onMounted(async () => {
  try {
    const { createParticleRibbon } = await import("./particle-ribbon.js");
    if (!unmounted) dispose = createParticleRibbon(canvas.value, field.value);
  } catch {
    // 引擎不可用时保留静态背景和全部导航，不阻断首页。
    if (canvas.value) canvas.value.hidden = true;
  }
});
onBeforeUnmount(() => { unmounted = true; dispose?.(); });
</script>

<template>
  <section ref="field" class="studio-hero" aria-labelledby="studio-hero-title" data-motion-scene>
    <div class="particle-field" aria-hidden="true"><img class="particle-poster-dark" :src="poster" width="1026" height="786" fetchpriority="high" decoding="async" alt="" /><canvas ref="canvas"></canvas></div>
    <div class="container hero-layout">
      <div class="hero-copy">
        <div class="hero-title-group">
          <p class="eyebrow hero-kicker" data-reveal>独立软件工作室 / GUANGNIAN</p>
          <h1 id="studio-hero-title" data-reveal data-reveal-delay="80">光年数智<span>软件设计与研发</span></h1>
        </div>
        <div class="hero-intro" data-reveal data-reveal-delay="160">
          <p class="hero-description">把业务里的想法，做成日常用得上的软件。<br />网站、管理系统、小程序与自动化。</p>
          <div class="button-row">
            <SiteNavLink class="button button-primary" to="/shop/">选购技术服务 <span class="button-arrow" aria-hidden="true">↗</span></SiteNavLink>
            <a class="text-link hero-service-link" href="#capabilities">定制开发 <span aria-hidden="true">↓</span></a>
          </div>
        </div>
      </div>
      <SolutionShowcase />
      <div class="hero-bottom"><span>从原型、开发到上线交付</span><span>源码交接 <i aria-hidden="true">/</i> 分阶段验收 <i aria-hidden="true">/</i> 直接沟通</span></div>
    </div>
  </section>
</template>

<style scoped>
.studio-hero { position: relative; isolation: isolate; overflow: hidden; background: var(--canvas); }
.particle-field { position: absolute; inset: 40px -6% auto 38%; height: 570px; z-index: -1; pointer-events: none; opacity: .8; }
.particle-field canvas { display: block; width: 100%; height: 100%; }
.particle-field img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
.particle-field:has(canvas[data-rendered="true"]) img { visibility: hidden; }
.particle-field .particle-poster-light { display: none; }
:global(:root[data-theme="light"] .particle-poster-light) { display: block; }
:global(:root[data-theme="light"] .particle-poster-dark) { display: none; }
.hero-layout { padding-top: 138px; }
.hero-copy { display: grid; grid-template-columns: 1.15fr 1fr; align-items: end; gap: 72px; padding-bottom: 64px; }
.hero-kicker { margin-bottom: 22px; font-size: 12px; line-height: 1.5; font-family: inherit; }
.hero-copy h1 { font-size: 64px; font-weight: 600; line-height: 1.2; letter-spacing: 0; }
.hero-copy h1 > span { display: block; margin-top: 10px; font-size: 40px; font-weight: 500; color: var(--muted); }
.hero-description { max-width: 380px; font-size: 16px; color: var(--muted); line-height: 1.85; }
.hero-copy .button-row { margin-top: 26px; gap: 24px; }
.hero-service-link { color: var(--ink); font-size: 14px; }
.hero-bottom { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-block: 20px 32px; color: var(--muted); font-size: 12px; }
.hero-bottom i { font-style: normal; color: var(--theme-line-strong); margin-inline: 12px; }
@media (min-width: 1600px) { .hero-layout { padding-top: 156px; } .hero-copy { padding-bottom: 80px; } }
@media (max-width: 1120px) { .hero-copy { gap: 40px; } .hero-copy h1 { font-size: 56px; } .hero-copy h1 > span { font-size: 32px; } .hero-description { font-size: 14px; } }
@media (max-width: 760px) {
  .hero-layout { padding-top: 108px; }
  .hero-copy { grid-template-columns: 1fr; gap: 24px; padding-bottom: 32px; }
  .hero-copy h1 { font-size: 44px; line-height: 1.25; }
  .hero-copy h1 > span { font-size: 28px; margin-top: 8px; }
  .hero-kicker { font-size: 10px; margin-bottom: 18px; }
  .hero-description { font-size: 14px; max-width: 300px; }
  .hero-copy .button-row { gap: 22px; margin-top: 22px; }
  .hero-copy .button { font-size: 13px; padding-inline: 14px; }
  .hero-service-link { font-size: 13px; }
  .particle-field { inset: 50px -180px auto 20%; height: 360px; opacity: .55; }
  .hero-bottom { align-items: start; flex-direction: column; gap: 6px; font-size: 11px; padding-block: 16px 24px; }
}
@media (max-width: 380px) { .hero-copy h1 { font-size: 40px; } .hero-copy h1 > span { font-size: 26px; } .hero-copy .button-row { gap: 16px; } }
</style>
