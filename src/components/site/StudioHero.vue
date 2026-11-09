<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import SiteNavLink from "./SiteNavLink.vue";
import poster from "../../assets/visuals/particle-poster.webp";
import lightPoster from "../../assets/visuals/particle-poster-light.webp";

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
    <div class="particle-field" aria-hidden="true"><img class="particle-poster-dark" :src="poster" width="1026" height="786" alt="" /><img class="particle-poster-light" :src="lightPoster" width="1026" height="786" alt="" /><canvas ref="canvas"></canvas></div>
    <div class="container hero-layout">
      <div class="hero-copy">
        <p class="eyebrow hero-kicker" data-reveal>[ GUANGNIAN · SOFTWARE STUDIO ]</p>
        <h1 id="studio-hero-title" data-reveal data-reveal-delay="80">光年数智<br /><span>软件设计与研发</span></h1>
        <p class="hero-description" data-reveal data-reveal-delay="160">网站、业务系统、小程序与自动化。<br />从需求梳理，到上线交付。</p>
        <div class="button-row" data-reveal data-reveal-delay="240">
          <SiteNavLink class="button button-primary" to="/shop/">浏览商品 <span class="button-arrow" aria-hidden="true">↗</span></SiteNavLink>
          <a class="text-link hero-service-link" href="#capabilities">了解开发服务 <span aria-hidden="true">↓</span></a>
        </div>
      </div>
      <div class="hero-bottom" data-reveal data-reveal-delay="320">
        <dl class="hero-specs">
          <div><dt>交付形态</dt><dd>远程人工实施</dd></div>
          <div><dt>源码归属</dt><dd>项目完整交接</dd></div>
          <div><dt>验收方式</dt><dd>按约定范围验收</dd></div>
        </dl>
        <a class="hero-scroll" href="#capabilities"><span class="status-dot" aria-hidden="true"></span>DESIGN · DEVELOP · DELIVER <span aria-hidden="true">↓</span></a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.studio-hero { position: relative; isolation: isolate; overflow: hidden; background: var(--canvas); }
.particle-field { position: absolute; inset: 40px -4% 24px 32%; z-index: -1; pointer-events: none; }
.particle-field canvas { display: block; width: 100%; height: 100%; }
.particle-field img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
.particle-field:has(canvas[data-rendered="true"]) img { visibility: hidden; }
.particle-field .particle-poster-light { display: none; }
:global(:root[data-theme="light"] .particle-poster-light) { display: block; }
:global(:root[data-theme="light"] .particle-poster-dark) { display: none; }
.hero-layout { min-height: min(850px, 90svh); padding-top: 166px; display: flex; flex-direction: column; justify-content: center; }
.hero-copy { padding-block: 32px 64px; }
.hero-kicker { margin-bottom: 30px; font-size: 10px; }
.hero-copy h1 { font-family: var(--font-display); font-size: 88px; font-weight: 300; line-height: 1.25; letter-spacing: 0; }
.hero-copy h1 > span { background: linear-gradient(105deg, var(--accent), var(--rose) 60%, var(--mint)); background-clip: text; -webkit-background-clip: text; color: transparent; }
.hero-description { font-size: 16px; color: var(--muted); line-height: 1.95; margin-top: 32px; }
.hero-copy .button-row { margin-top: 36px; gap: 32px; }
.hero-service-link { color: var(--ink); font-size: 14px; }
.hero-bottom { display: flex; align-items: center; justify-content: space-between; gap: 32px; border-top: 1px solid var(--line); padding-block: 24px 30px; margin-top: auto; }
.hero-specs { display: flex; flex: 1; gap: 48px; }
.hero-specs > div { flex: 1; }
.hero-specs dt { color: var(--muted); font: 10px/1.6 var(--font-mono); margin-bottom: 6px; }
.hero-specs dd { font-size: 13px; }
.hero-scroll { display: flex; align-items: center; gap: 12px; font: 9px/1.6 var(--font-mono); color: var(--muted); min-height: 44px; }
.hero-scroll > span:last-child { margin-left: 8px; font-size: 16px; }
@media (min-width: 1440px) { .hero-copy h1 { font-size: 100px; } }
@media (min-width: 761px) and (max-height: 800px) { .hero-layout { min-height: calc(100svh - 24px); padding-top: 110px; } .hero-copy { padding-block: 30px 50px; } .hero-copy h1 { font-size: 72px; } }
@media (max-width: 1120px) { .hero-copy h1 { font-size: 72px; } .hero-scroll { display: none; } .particle-field { left: 25%; } }
@media (max-width: 760px) {
  .hero-layout { min-height: min(840px, 94svh); padding-top: 144px; }
  .hero-copy { padding-block: 20px 180px; }
  .hero-copy h1 { font-size: 44px; line-height: 1.4; }
  .hero-kicker { font-size: 9px; margin-bottom: 24px; }
  .hero-description { font-size: 14px; margin-top: 24px; }
  .hero-copy .button-row { gap: 20px; margin-top: 28px; }
  .hero-copy .button { font-size: 13px; padding-inline: 18px 10px; }
  .hero-service-link { font-size: 12px; }
  .particle-field { inset: 430px -55px 70px 24%; opacity: 1; }
  .hero-bottom { padding-block: 18px 24px; }
  .hero-specs { gap: 12px; }
  .hero-specs dt { font-size: 9px; }
  .hero-specs dd { font-size: 11px; }
}
@media (max-width: 380px) { .hero-copy h1 { font-size: 32px; } .hero-copy .button-row { gap: 16px; } .hero-copy .button { gap: 12px; } }
</style>
