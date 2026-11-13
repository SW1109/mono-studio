<script setup>
import { RouterLink } from "vue-router";
import { services } from "../content/services.js";
import { featuredProducts } from "../content/products.js";
import { process } from "../content/site.js";
import StudioHero from "../components/site/StudioHero.vue";
import SiteIcon from "../components/site/SiteIcon.vue";
import ProductCard from "../components/site/ProductCard.vue";
import SiteNavLink from "../components/site/SiteNavLink.vue";
import ContactBanner from "../components/site/ContactBanner.vue";
import GuideLinks from "../components/site/GuideLinks.vue";
import { guideArticles } from "../content/guideArticles.js";
import { caseStudies } from "../content/caseStudies.js";
import CaseStudyCards from "../components/site/CaseStudyCards.vue";
import aurora from "../assets/visuals/aurora.jpg";
import architecture from "../assets/visuals/architecture.jpg";
</script>

<template>
  <StudioHero />
  <section id="capabilities" class="section container capabilities-section">
    <div class="section-heading" data-reveal>
      <div><p class="eyebrow">开发服务</p><h2>软件围绕业务来设计。</h2></div>
      <p class="section-description">从一个独立工具，到一套业务系统。<br />先确定要解决的问题，再选择合适的技术。</p>
    </div>
    <div class="capability-grid">
      <RouterLink v-for="service in services" :key="service.id" class="capability-item" :to="`/services/#${service.id}`" data-reveal>
        <div class="capability-top"><SiteIcon :name="service.icon" /><span>{{ service.number }}</span></div>
        <h3>{{ service.title }}</h3><p>{{ service.description }}</p>
        <span class="capability-link">查看服务 <SiteIcon name="arrow" /></span>
      </RouterLink>
    </div>
    <div class="service-purchase-line"><p>已有明确的问题和范围？商城里可以直接选购专项技术服务。</p><SiteNavLink class="text-link" to="/shop/">进入服务商城 <span aria-hidden="true">↗</span></SiteNavLink></div>
  </section>
  <section id="solutions" class="section home-solutions">
    <div class="container">
      <div class="section-heading" data-reveal>
        <div><p class="eyebrow">软件方案</p><h2>从常见需求，找到起点。</h2><p class="section-description">官网、客户管理与移动服务，按实际流程继续定制。</p></div>
        <RouterLink class="text-link" to="/products/">全部软件方案 <span aria-hidden="true">↗</span></RouterLink>
      </div>
      <div class="home-product-grid"><ProductCard v-for="(product, index) in featuredProducts.slice(0, 3)" :key="product.slug" :product="product" :reveal-delay="index * 60" /></div>
      <p class="small-note concept-note">界面为方案示意。功能、周期与交付范围，以项目约定为准。</p>
    </div>
  </section>
  <figure class="landscape-section" aria-label="极光摄影">
    <img :src="aurora" width="1920" height="1280" loading="lazy" decoding="async" alt="山林上方展开的紫色与绿色极光" />
    <figcaption class="container"><div><p>DESIGN. BUILD. KEEP GOING.</p><span class="landscape-word">想法向前，<br />软件落地。</span></div><span>Justin Verweire / Unsplash</span></figcaption>
  </figure>
  <section id="process" class="section container home-process">
    <div class="section-heading" data-reveal><div><p class="eyebrow">项目协作</p><h2>每一步，都有明确交付。</h2></div><p class="section-description">范围、费用和时间提前确认。<br />分阶段看版本，按约定逐项验收。</p></div>
    <ol class="home-process-grid">
      <li v-for="(step, index) in process" :key="step.title" data-reveal :data-reveal-delay="index * 60"><span class="step-number">0{{ index + 1 }}</span><h3>{{ step.title }}</h3><p>{{ step.description }}</p></li>
    </ol>
  </section>
  <section id="about" class="section container home-about">
    <figure class="about-image" data-reveal><img :src="architecture" width="1280" height="1920" loading="lazy" decoding="async" alt="自然光穿过方形天窗，照亮建筑空间" /><figcaption>Shojol Islam / Unsplash</figcaption></figure>
    <div data-reveal><p class="eyebrow">关于光年</p><h2>直接沟通。<br />认真做完。</h2><p class="section-description">光年数智是一家独立软件工作室，做网站、业务系统和自动化工具。</p><p class="section-description">你可以直接和开发者讨论业务、确认界面、核对版本。从第一张原型到最后一次交接，把项目落实到具体工作里。</p><RouterLink class="text-link" to="/about/">认识工作室 <span aria-hidden="true">↗</span></RouterLink></div>
  </section>
  <section class="section container home-case-records"><div class="section-heading"><div><p class="eyebrow">本站项目实录</p><h2>官网与商城的实施记录</h2><p class="section-description">记录同一个自有项目中的官网、商城、支付与搜索内容建设。</p></div><RouterLink class="text-link" to="/projects/">全部实录 <span aria-hidden="true">↗</span></RouterLink></div><CaseStudyCards :items="caseStudies" /></section>
  <div class="container"><GuideLinks :articles="guideArticles" /></div>
  <ContactBanner title="聊聊你的项目。" />
</template>

<style scoped>
.capabilities-section { border-top: 1px solid var(--line); }
.capabilities-section .section-heading > .section-description { margin: 0; max-width: 380px; }
.capability-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.capability-item { min-width: 0; display: flex; flex-direction: column; padding: 32px 28px; border-right: 1px solid var(--line); transition: background .2s; }
.capability-item:first-child { padding-left: 0; }
.capability-item:last-child { border-right: 0; padding-right: 0; }
.capability-item:hover { background: var(--surface); }
.capability-top { display: flex; justify-content: space-between; align-items: center; color: var(--muted); margin-bottom: 32px; }
.capability-top svg { width: 24px; height: 24px; }
.capability-top > span { font: 10px/1.5 var(--font-mono); }
.capability-item h3 { font-size: 19px; font-weight: 500; margin-bottom: 14px; }
.capability-item p { font-size: 13px; line-height: 1.9; color: var(--muted); margin-bottom: 28px; }
.capability-link { display: flex; align-items: center; justify-content: space-between; margin-top: auto; font-size: 12px; }
.capability-link svg { width: 15px; height: 15px; color: var(--muted); transition: transform .2s; }
.capability-item:hover .capability-link svg { transform: translate(2px, -2px); color: var(--ink); }
.service-purchase-line { display: flex; justify-content: space-between; align-items: center; gap: 24px; padding-top: 24px; font-size: 12px; color: var(--muted); }
.service-purchase-line a { flex-shrink: 0; font-size: 12px; }
.home-solutions { border-block: 1px solid var(--line); background: var(--surface); }
.home-product-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
.home-product-grid :deep(.product-visual) { min-height: 260px; background: var(--surface-inset); }
.home-product-grid :deep(.product-card) { background: var(--canvas); }
.home-product-grid :deep(.product-card h3) { font-size: 20px; }
.concept-note { margin-top: 20px; }
.landscape-section { position: relative; overflow: hidden; height: 440px; }
.landscape-section > img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 42%; }
.landscape-section figcaption { position: absolute; inset: 0; display: flex; justify-content: space-between; align-items: end; gap: 24px; padding-block: 48px; color: #fff; text-shadow: 0 1px 8px #0008; }
.landscape-section figcaption p { font: 10px/1.5 var(--font-mono); margin-bottom: 18px; }
.landscape-word { font: 500 44px/1.35 var(--font-display); }
.landscape-section figcaption > span { font: 10px/1.6 var(--font-mono); }
.home-process-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 40px; margin-top: 48px; }
.home-process-grid li { border-top: 1px solid var(--line); padding-top: 20px; }
.home-process-grid h3 { font-weight: 500; font-size: 21px; margin-block: 28px 12px; }
.home-process-grid p { font-size: 13px; line-height: 1.9; color: var(--muted); }
.home-about { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 96px; border-top: 1px solid var(--line); }
.about-image { position: relative; overflow: hidden; height: 420px; }
.about-image img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 40%; }
.about-image figcaption { position: absolute; bottom: 16px; left: 20px; color: #d0d6e0; font: 9px/1.6 var(--font-mono); }
.home-about .section-description { margin-top: 24px; max-width: 400px; }
.home-about .text-link { margin-top: 24px; }
@media (max-width: 1120px) { .capability-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .capability-item { padding: 28px 24px; } .capability-item:nth-child(2n) { padding-right: 0; border-right: 0; } .capability-item:nth-child(2n + 1) { padding-left: 0; } .capability-item:nth-child(-n + 2) { border-bottom: 1px solid var(--line); } .home-product-grid { gap: 16px; } .home-product-grid :deep(.product-card-body) { padding: 20px; } .home-about { gap: 48px; } }
@media (max-width: 900px) { .home-product-grid { grid-template-columns: 1fr; } .home-product-grid :deep(.product-card-link) { display: grid; grid-template-columns: 40% minmax(0, 1fr); } .home-product-grid :deep(.product-visual) { height: 100%; } .home-product-grid :deep(.card-modules) { display: none; } }
@media (max-width: 760px) {
  .capabilities-section .section-heading > .section-description { font-size: 13px; } .capability-item { padding: 24px 16px; } .capability-top { margin-bottom: 24px; } .capability-top svg { width: 20px; height: 20px; } .capability-item h3 { font-size: 16px; } .capability-item p { font-size: 12px; margin-bottom: 24px; } .capability-link { font-size: 11px; }
  .service-purchase-line { align-items: start; flex-direction: column; gap: 8px; font-size: 12px; }
  .home-product-grid { gap: 20px; } .home-product-grid :deep(.product-card-link) { display: flex; } .home-product-grid :deep(.product-visual) { min-height: 250px; } .home-product-grid :deep(.product-card-body) { padding: 24px; }
  .landscape-section { height: 340px; } .landscape-section figcaption { align-items: start; justify-content: end; flex-direction: column; gap: 18px; padding-block: 32px; } .landscape-word { font-size: 32px; } .landscape-section figcaption p { font-size: 8px; }
  .home-process-grid { grid-template-columns: 1fr 1fr; gap: 32px 24px; margin-top: 32px; } .home-process-grid h3 { font-size: 18px; margin-top: 22px; } .home-process-grid p { font-size: 12px; }
  .home-about { grid-template-columns: 1fr; gap: 36px; } .about-image { height: 300px; }
}
@media (prefers-reduced-motion: reduce) { .capability-item:hover .capability-link svg { transform: none; } }
</style>
