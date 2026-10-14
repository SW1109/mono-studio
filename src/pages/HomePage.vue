<script setup>
import { RouterLink } from "vue-router";
import { services } from "../content/services.js";
import { featuredProducts } from "../content/products.js";
import { process } from "../content/site.js";
import SiteIcon from "../components/site/SiteIcon.vue";
import StudioPreview from "../components/site/StudioPreview.vue";
import ProductCard from "../components/site/ProductCard.vue";
import ContactBanner from "../components/site/ContactBanner.vue";
import filmPoster from "../assets/media/studio-film-v5-poster.webp";
</script>

<template>
  <section class="home-hero">
    <div class="container hero-copy">
      <p class="eyebrow" data-reveal>GUANGNIAN · SOFTWARE STUDIO</p>
      <h1 data-reveal data-reveal-delay="80">专注软件研发<br /><span>设计与工程并重</span></h1>
      <p class="hero-description" data-reveal data-reveal-delay="160">产品设计、软件研发与系统集成。<br />网站、业务系统、小程序与自动化。</p>
      <div class="button-row" data-reveal data-reveal-delay="240">
        <RouterLink class="button button-primary" to="/services/">了解开发服务 <span aria-hidden="true">↗</span></RouterLink>
        <RouterLink class="button button-secondary" to="/products/">查看软件方案 <span aria-hidden="true">→</span></RouterLink>
      </div>
    </div>
    <div class="container hero-showcase"><StudioPreview /></div>
    <div class="container hero-bottom">
      <div class="hero-notes"><span>产品研发</span><span>定制开发</span><span>持续迭代</span></div>
      <a class="text-link" href="#capabilities">查看服务内容 <span aria-hidden="true">↓</span></a>
    </div>
  </section>

  <section id="capabilities" class="section container">
    <div class="section-heading" data-reveal>
      <div><p class="eyebrow">01 / WHAT WE BUILD</p><h2>产品设计<br />与多端应用开发</h2><p class="section-description">覆盖网站、移动端与桌面端开发，按项目需求提供界面设计、功能实现及系统对接。</p></div>
      <RouterLink class="text-link" to="/services/">查看开发服务 <span aria-hidden="true">↗</span></RouterLink>
    </div>
    <div class="service-grid">
      <article v-for="(service, index) in services" :key="service.id" class="service-card" data-reveal :data-reveal-delay="index * 60">
        <div class="card-top"><span class="icon-tile"><SiteIcon :name="service.icon" /></span><span class="card-number">{{ service.number }}</span></div>
        <h3>{{ service.title }}</h3><p>{{ service.description }}</p>
        <RouterLink class="text-link" :to="`/services/#${service.id}`">了解服务 <span aria-hidden="true">↗</span></RouterLink>
      </article>
    </div>
  </section>

  <section class="section section-soft">
    <div class="container">
      <div class="section-heading" data-reveal>
        <div><p class="eyebrow">02 / SOFTWARE SOLUTIONS</p><h2>企业应用<br />与定制方案</h2><p class="section-description">提供官网、业务管理与移动服务等方案参考。以下内容为定制开发方向，非已上线客户案例。</p></div>
        <RouterLink class="text-link" to="/products/">浏览全部方案 <span aria-hidden="true">↗</span></RouterLink>
      </div>
      <div class="product-grid"><ProductCard v-for="(product, index) in featuredProducts" :key="product.slug" :product="product" :reveal-delay="index * 80" /></div>
    </div>
  </section>

  <section class="section container process-section">
    <div data-reveal><p class="eyebrow">03 / HOW WE WORK</p><h2>需求、研发<br />与项目交付</h2><p class="section-description">确认功能范围、技术方案与验收要求，按阶段评审开发成果；部署、源码交接与维护安排以项目约定为准。</p><RouterLink class="text-link" to="/services/#process">了解合作方式 <span aria-hidden="true">↗</span></RouterLink></div>
    <ol class="process-list">
      <li v-for="(step, index) in process" :key="step.title" data-reveal :data-reveal-delay="index * 60"><span class="step-number">0{{ index + 1 }}</span><div><h3>{{ step.title }}</h3><p>{{ step.description }}</p></div><SiteIcon name="arrow" /></li>
    </ol>
  </section>

  <section class="home-studio-section">
    <div class="container home-about">
      <div data-reveal><p class="eyebrow">04 / MEET GUANGNIAN</p><h2>独立研发<br />与专业协作</h2><p class="section-description">光年数智是一家软件设计与研发工作室。<br />业务涵盖产品研发、定制开发<br class="desktop-break" />及系统集成。</p><RouterLink class="text-link" to="/about/">认识光年数智 <span aria-hidden="true">↗</span></RouterLink></div>
      <RouterLink class="home-film-preview" to="/about/" aria-label="进入关于光年，观看64秒工作室宣传片" data-reveal data-reveal-delay="120">
        <img :src="filmPoster" width="1920" height="1080" loading="lazy" alt="光年数智工作室宣传片封面" />
        <div class="home-film-caption"><span><i aria-hidden="true">▷</i>光年数智 · 品牌与研发短片</span><span aria-hidden="true">↗</span></div>
      </RouterLink>
    </div>
  </section>
  <ContactBanner />
</template>

<style scoped>
.home-hero { padding-top: 72px; }
.hero-copy { text-align: center; }
.hero-copy .eyebrow { justify-content: center; margin-bottom: 24px; }
.hero-copy h1 { font-size: clamp(42px, 5.3vw, 72px); line-height: 1.25; font-weight: 600; letter-spacing: -.05em; }
.hero-copy h1 > span { color: var(--accent); }
.hero-description { color: var(--muted); font-size: 20px; line-height: 1.8; margin-top: 24px; }
.hero-copy .button-row { justify-content: center; margin-top: 32px; }
.hero-showcase { margin-top: 56px; }
.hero-bottom { display: flex; justify-content: space-between; align-items: center; gap: 24px; padding-block: 24px; border-bottom: 1px solid var(--line); }
.hero-notes { display: flex; align-items: center; gap: 24px; color: var(--muted); font-size: 13px; }
.hero-notes span + span { border-left: 1px solid var(--line); padding-left: 24px; }
.hero-bottom .text-link { font-size: 13px; }
.process-section { display: grid; grid-template-columns: .9fr 1.1fr; gap: 120px; }
.process-section .section-description { max-width: 390px; margin: 24px 0; }
.home-studio-section { background: var(--dark); color: var(--on-dark); }
.home-about { padding-block: 88px; display: grid; grid-template-columns: .85fr 1.15fr; align-items: center; gap: 88px; }
.home-about .eyebrow, .home-about .section-description { color: var(--muted-on-dark); }
.home-about .section-description { margin: 24px 0; }
.home-about .text-link { color: var(--accent-on-dark); }
.home-film-preview { display: block; min-width: 0; }
.home-film-preview > img { width: 100%; aspect-ratio: 16 / 9; height: auto; object-fit: contain; }
.home-film-caption { display: flex; justify-content: space-between; align-items: center; gap: 24px; padding-top: 20px; color: var(--on-dark); font-size: 15px; }
.home-film-caption > span:first-child { display: flex; align-items: center; gap: 12px; }
.home-film-caption i { font-style: normal; display: inline-grid; place-items: center; width: 36px; height: 36px; border: 1px solid var(--muted-on-dark); border-radius: 50%; }
@media (max-width: 1040px) {
  .process-section, .home-about { gap: 56px; }
  .hero-copy h1 { font-size: 60px; }
  .desktop-break { display: none; }
}
@media (max-width: 760px) {
  .home-hero { padding-top: 48px; }
  .hero-copy h1 { font-size: clamp(38px, 7vw, 52px); }
  .hero-description { font-size: 16px; margin-top: 20px; }
  .hero-copy .button-row { margin-top: 28px; gap: 12px; }
  .hero-copy .button { font-size: 14px; padding-inline: 16px; gap: 10px; }
  .hero-showcase { margin-top: 40px; width: calc(100% - 24px); }
  .hero-bottom { gap: 16px; padding-block: 16px; }
  .hero-notes { gap: 12px; font-size: 11px; }
  .hero-notes span + span { padding-left: 12px; }
  .hero-bottom .text-link { font-size: 12px; gap: 8px; }
  .process-section, .home-about { grid-template-columns: 1fr; gap: 36px; }
  .home-about { padding-block: 64px; }
  .home-film-caption { font-size: 14px; }
}
</style>
