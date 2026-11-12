<script setup>
import { RouterLink } from "vue-router";
import { services } from "../content/services.js";
import { featuredProducts } from "../content/products.js";
import { process } from "../content/site.js";
import StudioHero from "../components/site/StudioHero.vue";
import ProductCard from "../components/site/ProductCard.vue";
import ContactBanner from "../components/site/ContactBanner.vue";
import aurora from "../assets/visuals/aurora.jpg";
import architecture from "../assets/visuals/architecture.jpg";
</script>

<template>
  <StudioHero />
  <section id="capabilities" class="section container capabilities-section">
    <div class="capabilities-heading" data-reveal>
      <p class="eyebrow">01 / WHAT WE BUILD</p><h2>设计、开发<br />与系统集成</h2>
      <p class="section-description">把业务需求整理清楚，<br />再做成好用的网站和软件。</p>
      <RouterLink class="text-link" to="/services/">全部开发服务 <span aria-hidden="true">↗</span></RouterLink>
    </div>
    <div class="capability-list">
      <RouterLink v-for="service in services" :key="service.id" class="capability-row" :to="`/services/#${service.id}`" data-reveal>
        <span class="capability-number">{{ service.number }}</span>
        <div><p class="capability-label">{{ service.tag }}</p><h3>{{ service.title }}</h3><p class="capability-description">{{ service.description }}</p><p class="capability-tags">{{ service.scenarios }}</p></div>
        <span class="circle-arrow" aria-hidden="true">↗</span>
      </RouterLink>
    </div>
  </section>
  <section id="solutions" class="section section-soft">
    <div class="container">
      <div class="section-heading" data-reveal>
        <div><p class="eyebrow">02 / SELECTED DIRECTIONS</p><h2>软件方案</h2><p class="section-description">从官网到业务管理，按你的工作方式来设计。</p></div>
        <RouterLink class="text-link" to="/products/">浏览全部方案 <span aria-hidden="true">↗</span></RouterLink>
      </div>
      <div class="home-product-grid"><ProductCard v-for="(product, index) in featuredProducts.slice(0, 3)" :key="product.slug" :product="product" :reveal-delay="index * 80" /></div>
      <p class="small-note concept-note">方案界面为设计示意，具体功能与交付范围在项目中确认。</p>
    </div>
  </section>
  <figure class="landscape-section" aria-label="极光摄影">
    <img :src="aurora" width="1920" height="1280" loading="lazy" decoding="async" alt="夜空中紫粉与薄荷绿交织的极光，山林静立在下方" />
    <figcaption><span class="landscape-word">A little further.</span><span>Justin Verweire / Unsplash</span></figcaption>
  </figure>
  <section id="process" class="section container home-process">
    <div class="section-heading" data-reveal><div><p class="eyebrow">03 / HOW WE WORK</p><h2>一步一步，<br />把项目做好。</h2></div><p class="section-description">先确认范围，再分阶段开发。<br />每一步都有可以核对的结果。</p></div>
    <ol class="home-process-grid">
      <li v-for="(step, index) in process" :key="step.title" data-reveal :data-reveal-delay="index * 80"><span class="step-number">0{{ index + 1 }} <span aria-hidden="true">→</span></span><h3>{{ step.title }}</h3><p>{{ step.description }}</p></li>
    </ol>
  </section>
  <section id="about" class="section container home-about">
    <figure class="about-image" data-reveal><img :src="architecture" width="1280" height="1920" loading="lazy" decoding="async" alt="方形天窗把自然光引入深色建筑空间" /><figcaption>Shojol Islam / Unsplash</figcaption></figure>
    <div data-reveal data-reveal-delay="120"><p class="eyebrow">04 / MEET GUANGNIAN</p><h2>小工作室。<br />认真做软件。</h2><p class="section-description">光年数智是一家独立软件工作室，<br />做网站、业务系统和自动化工具。</p><p class="section-description">从界面到代码，和你直接沟通。<br />该交付什么、什么时候完成，提前说清楚。</p><RouterLink class="text-link" to="/about/">认识光年数智 <span aria-hidden="true">↗</span></RouterLink></div>
  </section>
  <ContactBanner />
</template>

<style scoped>
.capabilities-section { display: grid; grid-template-columns: .85fr 1.4fr; gap: 100px; }
.capabilities-heading { position: sticky; top: 136px; align-self: start; }
.capabilities-heading .section-description { margin-block: 28px; }
.capability-row { position: relative; display: grid; grid-template-columns: 30px 1fr 44px; gap: 24px; padding-block: 36px; border-top: 1px solid var(--line); }
.capability-row:last-child { border-bottom: 1px solid var(--line); }
.capability-row::before { content: ""; position: absolute; inset: -1px 0 auto; height: 1px; background: var(--accent); transform: scaleX(0); transform-origin: left; transition: transform .4s var(--ease-out); }
.capability-row:hover::before, .capability-row:focus-visible::before { transform: scaleX(1); }
.capability-number { color: var(--muted); font: 11px/1.6 var(--font-mono); padding-top: 5px; }
.capability-label { font: 9px/1.8 var(--font-mono); color: var(--muted); text-transform: uppercase; margin-bottom: 12px; }
.capability-row h3 { font-family: var(--font-display); font-size: 30px; font-weight: 400; }
.capability-description { font-size: 14px; color: var(--muted); line-height: 1.9; margin-block: 18px; max-width: 430px; }
.capability-tags { color: var(--muted); font-size: 11px; }
.circle-arrow { display: grid; place-items: center; align-self: center; width: 44px; height: 44px; border: 1px solid var(--line); border-radius: 50%; font-size: 19px; transition: color .3s, border-color .3s, transform .6s var(--ease-out); }
.capability-row:hover .circle-arrow { color: var(--mint); border-color: var(--mint); transform: rotate(45deg); }
.home-product-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 28px; }
.home-product-grid :deep(.product-card:first-child) { grid-row: span 2; }
.home-product-grid :deep(.product-card:first-child .product-visual) { min-height: 390px; aspect-ratio: 1.35; padding: 60px; }
.home-product-grid :deep(.product-card:not(:first-child) .product-card-link) { display: grid; grid-template-columns: 42% 58%; }
.home-product-grid :deep(.product-card:not(:first-child) .product-visual) { height: 100%; min-height: 250px; aspect-ratio: auto; padding-inline: 18px; }
.home-product-grid :deep(.product-card:not(:first-child) .product-card-body) { padding: 24px; }
.home-product-grid :deep(.product-card:not(:first-child) h3) { font-size: 20px; }
.home-product-grid :deep(.product-card:not(:first-child) p) { font-size: 13px; }
.home-product-grid :deep(.product-card:not(:first-child) .card-modules) { display: none; }
.home-product-grid :deep(.product-card:not(:first-child) .visual-caption) { font-size: 6px; left: 12px; }
.home-product-grid :deep(.product-card:not(:first-child) .visual-footnote) { font-size: 8px; left: 12px; right: 12px; }
.concept-note { margin-top: 24px; }
.landscape-section { position: relative; overflow: hidden; height: 620px; margin-block: 32px; }
.landscape-section > img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 50%; }
.landscape-section figcaption { position: absolute; inset: auto 5% 28px; display: flex; justify-content: space-between; align-items: end; gap: 24px; color: #fff; text-shadow: 0 1px 8px #07060b; }
.landscape-word { font: italic 64px/1.2 var(--font-display); }
.landscape-section figcaption > span:last-child { font: 10px/1.6 var(--font-mono); }
.home-process-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 40px; margin-top: 64px; }
.home-process-grid li { border-top: 1px solid var(--line); padding-top: 22px; }
.home-process-grid .step-number { display: flex; justify-content: space-between; }
.home-process-grid .step-number > span { color: var(--muted); }
.home-process-grid h3 { font-family: var(--font-display); font-weight: 400; font-size: 24px; margin-block: 36px 16px; }
.home-process-grid p { font-size: 14px; line-height: 1.9; color: var(--muted); }
.home-about { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 120px; border-top: 1px solid var(--line); }
.about-image { position: relative; overflow: hidden; height: 540px; }
.about-image img { width: 100%; height: 100%; object-fit: cover; }
.about-image figcaption { position: absolute; bottom: 18px; left: 20px; color: #c7c2cc; font: 9px/1.6 var(--font-mono); }
.home-about .section-description { margin-top: 28px; }
.home-about .text-link { margin-top: 30px; }
@media (max-width: 1120px) {
  .capabilities-section { gap: 56px; }
  .home-product-grid { grid-template-columns: 1fr 1fr; }
  .home-product-grid :deep(.product-card:first-child) { grid-column: 1 / -1; grid-row: auto; }
  .home-product-grid :deep(.product-card:first-child .product-card-link) { display: grid; grid-template-columns: 1.2fr 1fr; }
  .home-product-grid :deep(.product-card:not(:first-child) .product-card-link) { display: flex; }
  .home-product-grid :deep(.product-card:not(:first-child) .product-visual) { height: 270px; }
  .home-about { gap: 64px; }
  .home-process-grid { gap: 28px; }
}
@media (max-width: 760px) {
  .capabilities-section { grid-template-columns: 1fr; gap: 36px; }
  .capabilities-heading { position: static; }
  .capability-row { gap: 12px; grid-template-columns: 22px 1fr 36px; padding-block: 28px; }
  .capability-row h3 { font-size: 23px; }
  .circle-arrow { width: 36px; height: 36px; }
  .capability-description { font-size: 13px; }
  .home-product-grid { grid-template-columns: 1fr; gap: 24px; }
  .home-product-grid :deep(.product-card:first-child .product-card-link) { display: flex; }
  .home-product-grid :deep(.product-card:first-child .product-visual) { min-height: 280px; padding: 40px 32px; }
  .landscape-section { height: 460px; margin-block: 0; }
  .landscape-section figcaption { align-items: start; flex-direction: column; gap: 14px; }
  .landscape-word { font-size: 40px; }
  .home-process-grid { grid-template-columns: 1fr 1fr; gap: 36px 24px; margin-top: 36px; }
  .home-process-grid h3 { font-size: 21px; margin-top: 24px; }
  .home-process-grid p { font-size: 13px; }
  .home-about { grid-template-columns: 1fr; gap: 48px; }
  .about-image { height: 400px; }
}
@media (prefers-reduced-motion: reduce) { .capability-row:hover .circle-arrow { transform: none; } }
</style>
