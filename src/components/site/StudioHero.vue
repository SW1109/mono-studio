<script setup>
import { RouterLink } from "vue-router";
import heroVisual from "../../assets/visuals/studio-glass-hero.webp";
</script>

<template>
  <section class="studio-hero" aria-labelledby="studio-hero-title">
    <img class="hero-artwork" :src="heroVisual" width="1920" height="1080" alt="" aria-hidden="true" fetchpriority="high" />
    <div class="hero-shade" aria-hidden="true"></div>
    <div class="container hero-layout">
      <div class="hero-copy">
        <p class="eyebrow" data-reveal><span class="eyebrow-dot" aria-hidden="true"></span>GUANGNIAN · SOFTWARE STUDIO</p>
        <h1 id="studio-hero-title" data-reveal data-reveal-delay="80">专注软件研发<br /><span>设计与工程并重</span></h1>
        <p class="hero-description" data-reveal data-reveal-delay="160">产品设计、软件研发与系统集成。<br />网站、业务系统、小程序与自动化。</p>
        <div class="button-row" data-reveal data-reveal-delay="240">
          <RouterLink class="button button-primary" to="/services/">了解开发服务 <span aria-hidden="true">↗</span></RouterLink>
          <RouterLink class="button button-secondary" to="/products/">查看软件方案 <span aria-hidden="true">→</span></RouterLink>
        </div>
      </div>
      <RouterLink class="hero-statement glass-dark-panel" to="/about/" data-reveal data-reveal-delay="240">
        <div><p>INDEPENDENT SOFTWARE STUDIO</p><strong>光年数智 · 软件研发工作室</strong></div>
        <span class="hero-statement-symbol" aria-hidden="true">↗</span>
      </RouterLink>
      <div class="hero-bottom">
        <div class="hero-notes" aria-label="工作室服务"><span>产品研发</span><span>定制开发</span><span>持续迭代</span></div>
        <a class="hero-scroll" href="#capabilities">探索服务内容 <span aria-hidden="true">↓</span></a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.studio-hero { position: relative; isolation: isolate; overflow: hidden; min-height: 740px; height: min(920px, 100svh); background: var(--dark); color: #fff; border-radius: 0 0 36px 36px; }
.hero-artwork, .hero-shade { position: absolute; inset: 0; width: 100%; height: 100%; z-index: -1; }
.hero-artwork { object-fit: cover; object-position: center; filter: hue-rotate(67deg) saturate(190%) brightness(.84) contrast(105%); }
.hero-shade { background: radial-gradient(ellipse at 88% 16%, rgba(120, 85, 217, .24), transparent 58%), linear-gradient(90deg, rgba(11, 20, 53, .86), rgba(26, 32, 76, .42) 42%, transparent 70%), linear-gradient(0deg, rgba(22, 26, 68, .32), transparent 40%); }
.hero-layout { position: relative; min-height: inherit; height: 100%; display: flex; align-items: center; padding-block: 160px 150px; }
.hero-copy { max-width: 620px; }
.hero-copy .eyebrow { color: #e2e7ff; margin-bottom: 28px; letter-spacing: .18em; font-size: 11px; }
.hero-copy .eyebrow-dot { background: #bbb6ff; box-shadow: 0 0 0 5px rgba(196, 188, 255, .12); }
.hero-copy h1 { font-size: clamp(40px, 3.8vw, 56px); line-height: 1.5; font-weight: 400; letter-spacing: -.025em; }
.hero-copy h1 > span { color: var(--accent-on-dark); }
.hero-description { color: #dce1f5; font-size: 16px; line-height: 2; margin-top: 28px; }
.hero-copy .button-row { margin-top: 34px; gap: 16px; }
.hero-copy .button { min-height: 46px; font-size: 14px; padding: 10px 22px; }
.hero-copy .button-primary { box-shadow: 0 8px 24px rgba(46, 37, 126, .2); }
.hero-copy .button-secondary { color: #fff; background: var(--glass-overlay-bg); border-color: rgba(229, 231, 255, .58); -webkit-backdrop-filter: var(--glass-filter); backdrop-filter: var(--glass-filter); }
.hero-copy .button-secondary:hover { background: rgba(43, 45, 98, .64); border-color: #fff; }
.hero-statement { position: absolute; bottom: 126px; right: 0; width: 294px; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 20px 22px; border-radius: 18px; text-align: left; }
.hero-statement-symbol { flex-shrink: 0; width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid rgba(255, 255, 255, .28); border-radius: 50%; font-size: 18px; }
.hero-statement p { color: var(--muted-on-dark); font: 9px/1.8 var(--font-mono); letter-spacing: .12em; }
.hero-statement strong { display: block; font-weight: 400; font-size: 14px; margin-top: 9px; }
.hero-statement:hover { border-color: rgba(255, 255, 255, .65); }
.hero-bottom { position: absolute; inset: auto 0 28px; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding-top: 22px; border-top: 1px solid rgba(255, 255, 255, .26); }
.hero-notes { display: flex; flex-wrap: wrap; gap: 10px; }
.hero-notes > span { padding: 4px 0; font-size: 11px; color: #ebedff; letter-spacing: .04em; }
.hero-notes > span + span { border-left: 1px solid rgba(255, 255, 255, .3); padding-left: 16px; margin-left: 6px; }
.hero-scroll { display: flex; align-items: center; gap: 24px; min-height: 44px; font-size: 12px; color: #fff; }
.hero-scroll > span { width: 38px; height: 38px; display: grid; place-items: center; background: var(--glass-overlay-bg); border: 1px solid rgba(255, 255, 255, .32); border-radius: 50%; font-size: 18px; }
.hero-scroll:hover { text-decoration: underline; text-underline-offset: 5px; }
@media (max-width: 1040px) {
  .hero-artwork { object-position: 58% center; }
  .hero-statement { width: 285px; right: 0; padding: 20px; }
  .hero-copy { max-width: 560px; }
}
@media (max-width: 760px) {
  .studio-hero { height: auto; min-height: 820px; border-radius: 0 0 28px 28px; }
  .hero-artwork { object-position: 64% center; }
  .hero-shade { background: radial-gradient(ellipse at 90% 60%, rgba(112, 77, 203, .18), transparent 60%), linear-gradient(180deg, rgba(15, 22, 54, .64), rgba(15, 22, 54, .78) 40%, rgba(23, 24, 65, .32) 72%, rgba(15, 22, 54, .72)); }
  .hero-layout { display: block; padding-block: 174px 220px; }
  .hero-copy { max-width: 100%; }
  .hero-copy .eyebrow { font-size: 9px; letter-spacing: .1em; margin-bottom: 24px; }
  .hero-copy h1 { font-size: clamp(32px, 7.6vw, 52px); line-height: 1.45; }
  .hero-description { font-size: 15px; margin-top: 24px; }
  .hero-copy .button-row { gap: 10px; margin-top: 28px; }
  .hero-copy .button { font-size: 13px; padding-inline: 17px; gap: 10px; }
  .hero-statement { inset: auto 0 116px auto; width: 270px; padding: 18px; gap: 16px; }
  .hero-statement strong { font-size: 13px; }
  .hero-bottom { bottom: 24px; gap: 12px; }
  .hero-notes { gap: 6px; }
  .hero-notes > span { font-size: 10px; padding: 4px 0; }
  .hero-notes > span + span { padding-left: 12px; margin-left: 6px; }
  .hero-scroll { gap: 8px; font-size: 0; }
}
</style>
