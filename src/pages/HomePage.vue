<script setup>
import { RouterLink } from "vue-router";
import { services } from "../content/services.js";
import { featuredProducts } from "../content/products.js";
import { process } from "../content/site.js";
import SiteIcon from "../components/site/SiteIcon.vue";
import StudioPreview from "../components/site/StudioPreview.vue";
import ProductCard from "../components/site/ProductCard.vue";
import ContactBanner from "../components/site/ContactBanner.vue";
</script>

<template>
  <section class="home-hero">
    <div class="hero-grid-lines" aria-hidden="true"></div>
    <div class="container hero-grid">
      <div class="hero-copy">
        <p class="eyebrow" data-reveal><span class="eyebrow-dot"></span>GUANGNIAN · SOFTWARE STUDIO</p>
        <h1>
          <span class="hero-title-line" data-reveal data-reveal-delay="80">把想法，</span>
          <span class="hero-title-line" data-reveal data-reveal-delay="160">构建成<span class="hero-highlight">好用的软件</span><i>。</i></span>
        </h1>
        <p class="hero-description" data-reveal data-reveal-delay="240">我们是光年数智网络科技工作室。<br />做实用的软件产品，也为你的业务构建合适的数字工具。</p>
        <div class="button-row" data-reveal data-reveal-delay="320">
          <RouterLink class="button button-primary" to="/services/">了解开发服务 <span aria-hidden="true">↗</span></RouterLink>
          <RouterLink class="button button-secondary" to="/products/">浏览软件产品 <span aria-hidden="true">→</span></RouterLink>
        </div>
        <div class="hero-notes" data-reveal data-reveal-delay="400"><span>产品研发</span><span>定制开发</span><span>持续迭代</span></div>
      </div>
      <StudioPreview />
    </div>
    <div class="container hero-bottom" data-reveal data-reveal-delay="400">
      <span><i aria-hidden="true"></i>用清晰的方案，连接想法与实现。</span>
      <a class="text-link explore-link" href="#capabilities">探索我们的能力 <span aria-hidden="true">↓</span></a>
    </div>
  </section>

  <section id="capabilities" class="section container">
    <div class="section-heading" data-reveal>
      <div><p class="eyebrow">WHAT WE BUILD</p><h2>为真实需求，<br class="mobile-break" />构建合适的解决方案。</h2></div>
      <RouterLink class="text-link" to="/services/">全部开发服务 <span aria-hidden="true">↗</span></RouterLink>
    </div>
    <div class="service-grid">
      <article v-for="(service, index) in services" :key="service.id" class="service-card" data-reveal :data-reveal-delay="index * 80">
        <div class="card-top"><span class="icon-tile"><SiteIcon :name="service.icon" /></span><span class="card-number">{{ service.number }}</span></div>
        <h3>{{ service.title }}</h3><p>{{ service.description }}</p>
        <RouterLink class="text-link" :to="`/services/#${service.id}`">了解服务 <span aria-hidden="true">↗</span></RouterLink>
      </article>
    </div>
  </section>

  <section class="section section-soft">
    <div class="container">
      <div class="section-heading" data-reveal>
        <div><p class="eyebrow">SOFTWARE SOLUTIONS</p><h2>从具体场景，<br class="mobile-break" />走向可用的软件。</h2><p class="section-description">官网、客户管理与预约服务，先看清典型功能，再按你的业务定制。以下展示为开发方案，非已上线产品案例。</p></div>
        <RouterLink class="text-link" to="/products/">探索全部方案 <span aria-hidden="true">↗</span></RouterLink>
      </div>
      <div class="product-grid"><ProductCard v-for="(product, index) in featuredProducts" :key="product.slug" :product="product" :reveal-delay="index * 100" /></div>
    </div>
  </section>

  <section class="section container process-section">
    <div data-reveal><p class="eyebrow">A CLEAR WAY TO WORK</p><h2>好的协作，<br />让每一步都有方向。</h2><p class="section-description">技术只是方法。理解需求、明确边界、持续沟通，才是让项目向前的基础。</p><RouterLink class="text-link" to="/services/#process">了解合作方式 <span aria-hidden="true">↗</span></RouterLink></div>
    <ol class="process-list">
      <li v-for="(step, index) in process" :key="step.title" data-reveal :data-reveal-delay="index * 90"><span class="step-number">0{{ index + 1 }}</span><div><h3>{{ step.title }}</h3><p>{{ step.description }}</p></div><SiteIcon name="arrow" /></li>
    </ol>
  </section>

  <section class="section-soft">
    <div class="container home-about">
      <div class="about-symbol" data-reveal aria-hidden="true"><span>G.</span><small>IDEAS MEET ENGINEERING</small><i class="symbol-node"></i><i class="symbol-node"></i><i class="symbol-node"></i></div>
      <div data-reveal data-reveal-delay="140"><p class="eyebrow">ABOUT GUANGNIAN</p><h2>保持好奇，<br />也保持务实。</h2><p class="section-description">我们相信，好的软件不止于功能实现。它需要清晰的结构、自然的体验，以及对真实使用场景的理解。</p><RouterLink class="text-link" to="/about/">认识光年数智 <span aria-hidden="true">↗</span></RouterLink></div>
    </div>
  </section>
  <ContactBanner />
</template>

<style scoped>
.home-hero { position: relative; isolation: isolate; background: radial-gradient(ellipse at 78% 38%, #eaf2ff, transparent 56%), linear-gradient(180deg, #f7f9fc, #fff); border-bottom: 1px solid var(--line); overflow: hidden; }
.hero-grid-lines { position: absolute; inset: 0 0 0 45%; z-index: -1; background-image: linear-gradient(#b6c9e51c 1px, transparent 1px), linear-gradient(90deg, #b6c9e51c 1px, transparent 1px); background-size: 48px 48px; mask-image: linear-gradient(90deg, transparent, black 50%, transparent); }
.hero-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 70px; align-items: center; padding-block: 72px 42px; }
.hero-copy h1 { font-size: clamp(38px, 4.6vw, 65px); line-height: 1.35; letter-spacing: -.055em; font-weight: 700; }
.hero-title-line { display: block; }.hero-highlight { position: relative; color: var(--accent); white-space: nowrap; }
.hero-highlight::after { content: ''; position: absolute; left: 2px; right: 0; bottom: -6px; height: 7px; border-radius: 50%; border-top: 2px solid #a9c5f7; transform: rotate(-2deg); }
.hero-copy h1 i { color: var(--accent); font-style: normal; }
.hero-description { color: var(--muted); font-size: 15px; line-height: 1.9; margin: 28px 0 30px; }
.hero-notes { display: flex; align-items: center; gap: 20px; margin-top: 34px; font-size: 11px; color: #788496; }.hero-notes span + span { border-left: 1px solid #d5dce7; padding-left: 20px; }
.hero-bottom { border-top: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; padding-block: 19px; font-size: 11px; color: var(--muted); }
.hero-bottom > span { display: inline-flex; align-items: center; gap: 10px; }.hero-bottom > span i { width: 5px; height: 5px; border-radius: 50%; background: #7195ca; }
.explore-link > span { display: grid; place-items: center; border: 1px solid #d4e0f2; border-radius: 50%; width: 28px; height: 28px; }
.process-section { display: grid; grid-template-columns: .9fr 1.1fr; gap: 120px; }.process-section .section-description { max-width: 330px; margin: 24px 0; }
.home-about { padding-block: 80px; display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 120px; }.home-about .section-description { margin: 24px 0; max-width: 450px; }
.about-symbol { min-height: 280px; border: 1px solid #e0e7f1; border-radius: 12px; background: radial-gradient(circle at 50% 50%, #fff9, transparent 55%), linear-gradient(135deg, #f6f9ff, #edf3fd); display: grid; place-content: center; text-align: center; position: relative; overflow: hidden; }
.about-symbol::before, .about-symbol::after { content: ''; position: absolute; inset: 30px; border: 1px solid #dce5f3; border-radius: 50%; transition: transform .7s ease; }.about-symbol::after { inset: 55px; border-style: dashed; }
.about-symbol span { font-size: 110px; font-weight: 700; color: #2764e7; letter-spacing: -.1em; z-index: 1; transition: transform .6s cubic-bezier(.22, 1, .36, 1); }.about-symbol small { color: #5c7eae; font: 9px/2 ui-monospace, monospace; letter-spacing: .2em; }
.symbol-node { position: absolute; width: 7px; height: 7px; border-radius: 50%; background: #96b8ed; top: 38px; left: 30%; }.symbol-node:nth-of-type(2) { top: auto; bottom: 40px; left: 67%; }.symbol-node:nth-of-type(3) { top: 50%; left: 34px; background: #a1d1c5; }
@media (hover: hover) and (pointer: fine) { .about-symbol:hover span { transform: translateY(-5px); }.about-symbol:hover::before { transform: rotate(10deg) scale(1.05); }.about-symbol:hover::after { transform: rotate(-15deg); } }
@media (max-width: 1000px) { .hero-grid { gap: 30px; }.hero-copy h1 { font-size: 43px; }.process-section, .home-about { gap: 60px; } }
@media (max-width: 760px) { .hero-grid { grid-template-columns: 1fr; padding-block: 56px 26px; gap: 26px; }.hero-copy h1 { font-size: clamp(36px, 7.5vw, 52px); }.hero-description { font-size: 14px; }.hero-bottom > span { max-width: 50%; }.process-section, .home-about { grid-template-columns: 1fr; gap: 38px; }.home-about { padding-block: 56px; }.about-symbol { min-height: 230px; }.hero-notes { margin-top: 25px; }.hero-grid-lines { inset: 40% 0 0; } }
</style>