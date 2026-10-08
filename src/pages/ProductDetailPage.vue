<script setup>
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { findProduct, productInquiry } from "../content/products.js";
import SiteIcon from "../components/site/SiteIcon.vue";
import ContactBanner from "../components/site/ContactBanner.vue";
import SolutionDetails from "../components/site/SolutionDetails.vue";
import NotFoundPage from "./NotFoundPage.vue";

const route = useRoute();
const product = computed(() => findProduct(route.params.slug));
const isSolution = computed(() => product.value?.kind === "solution");
const sections = [
  { id: "overview", title: "方案概览" },
  { id: "scenarios", title: "适用场景" },
  { id: "modules", title: "功能模块" },
  { id: "workflow", title: "业务流程" },
  { id: "delivery", title: "交付与扩展" },
  { id: "questions", title: "常见问题" },
];
</script>

<template>
  <template v-if="product">
    <header class="container detail-heading">
      <nav class="breadcrumbs" aria-label="面包屑"><RouterLink to="/">首页</RouterLink><span aria-hidden="true">/</span><RouterLink to="/products/">软件产品</RouterLink><span aria-hidden="true">/</span><span aria-current="page">{{ product.name }}</span></nav>
      <div class="detail-hero">
        <div data-reveal>
          <p class="eyebrow">{{ isSolution ? 'CUSTOM SOFTWARE' : 'SOFTWARE TOOL' }} / {{ product.category }}</p>
          <span class="detail-kind tag">{{ isSolution ? '可定制方案 · 按需求开发' : '现有软件工具' }}</span>
          <h1>{{ product.name }}</h1>
          <h2>{{ product.headline }}</h2>
          <p class="page-description">{{ product.summary }}</p>
          <ul v-if="isSolution" class="platform-list" aria-label="可选使用平台"><li v-for="platform in product.platforms" :key="platform"><SiteIcon name="check" />{{ platform }}</li></ul>
          <div class="button-row">
            <RouterLink class="button button-primary" :to="productInquiry(product)">{{ isSolution ? '沟通这个方案' : '咨询这款产品' }} <span aria-hidden="true">↗</span></RouterLink>
            <RouterLink class="button button-secondary" to="/products/">{{ isSolution ? '浏览其他方案' : '浏览其他产品' }}</RouterLink>
          </div>
        </div>
        <div class="detail-art" :class="[`tone-${product.accent}`, { 'solution-art': isSolution }]" data-reveal data-reveal-delay="160" aria-hidden="true">
          <template v-if="isSolution">
            <div class="concept-top"><span class="concept-icon"><SiteIcon :name="product.icon" /></span><div><strong>业务模块组合</strong><small>CONCEPT / CUSTOM SOFTWARE</small></div><span class="concept-dot"></span></div>
            <div class="concept-modules"><div v-for="(module, index) in product.details.modules.slice(0, 4)" :key="module.title"><span>0{{ index + 1 }}</span><strong>{{ module.title }}</strong><SiteIcon name="check" /></div></div>
            <div class="concept-bottom"><span>按场景组合 · 按需求实现</span><SiteIcon name="workflow" /></div>
            <p class="concept-caption">功能结构示意，非已上线系统截图</p>
          </template>
          <template v-else><SiteIcon :name="product.icon" /><span>{{ product.name }}</span><small>GUANGNIAN / SOFTWARE TOOL</small></template>
        </div>
      </div>
    </header>

    <nav v-if="isSolution" class="container detail-nav" aria-label="方案内容导航" data-reveal><a v-for="section in sections" :key="section.id" :href="`#${section.id}`">{{ section.title }}</a></nav>

    <section id="overview" class="section container detail-content" aria-labelledby="overview-title">
      <div data-reveal>
        <p class="eyebrow">{{ isSolution ? 'START WITH THE PROBLEM' : 'DESIGNED FOR EVERYDAY USE' }}</p>
        <h2 id="overview-title">{{ isSolution ? '先理解业务，再选择功能。' : '围绕场景，解决问题。' }}</h2>
        <p class="section-description">{{ product.description }}</p>
        <h3>{{ isSolution ? '适合哪些团队' : '适合谁使用' }}</h3><p>{{ product.audience }}</p>
      </div>
      <aside class="detail-capabilities" data-reveal data-reveal-delay="120">
        <template v-if="isSolution"><h3>定制前，需要明确的边界</h3><p class="scope-note">{{ product.note }}</p><p class="small-note">本页介绍开发方向与可选模块，不代表现货软件或已完成案例。具体功能、交付周期、费用和维护安排以确认后的方案为准。</p></template>
        <template v-else><h3>产品方向</h3><ul class="check-list"><li v-for="capability in product.capabilities" :key="capability"><SiteIcon name="check" />{{ capability }}</li></ul><p class="small-note">{{ product.note }}</p><p class="small-note">获取方式与实际版本请联系确认；本页不提供未经确认的下载链接。</p></template>
      </aside>
    </section>

    <SolutionDetails v-if="isSolution" :details="product.details" />
    <ContactBanner :title="isSolution ? '把你的业务流程，\n变成清晰的开发方案。' : '工具适不适合，\n从你的场景聊起。'" :description="isSolution ? '告诉我们使用人群、现有流程与最需要解决的问题，一起确定适合先实现的范围。' : '我们可以一起了解产品方向、获取方式与使用需求。'" :to="productInquiry(product)" :button-label="isSolution ? '沟通这个方案' : '咨询这款产品'" />
  </template>
  <NotFoundPage v-else />
</template>

<style scoped>
.detail-heading { padding-block: 30px 52px; }
.detail-hero { display: grid; grid-template-columns: 1.1fr .9fr; gap: 64px; align-items: center; margin-top: 48px; }
.detail-hero > div { min-width: 0; }
.detail-kind { margin-bottom: 18px; color: var(--accent); background: var(--accent-soft); border-color: #d4e1fa; }
.detail-hero h1 { font-size: clamp(32px, 3.6vw, 50px); line-height: 1.35; letter-spacing: -.04em; }
.detail-hero h2 { margin-top: 18px; font-size: 21px; line-height: 1.7; }
.detail-hero .button-row { margin-top: 28px; }
.platform-list { display: flex; flex-wrap: wrap; gap: 10px 22px; margin-top: 22px; }
.platform-list li { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 11px; }
.platform-list svg { width: 14px; height: 14px; color: var(--accent); }
.detail-art { aspect-ratio: 1.2; border-radius: 18px; border: 1px solid var(--tone-line); background: radial-gradient(circle at 65% 30%, #ffffffd9, transparent 50%), var(--tone-bg); display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; overflow: hidden; }
.detail-art:not(.solution-art)::before { content: ''; position: absolute; width: 65%; aspect-ratio: 1; border: 1px solid var(--tone-line); border-radius: 50%; }
.detail-art > svg { width: 84px; height: 84px; color: var(--tone-color); position: relative; }
.detail-art > span { font-size: 26px; margin-top: 30px; font-weight: 600; color: var(--tone-color); }
.detail-art > small { font: 9px/1.5 ui-monospace, monospace; color: var(--muted); letter-spacing: .12em; margin-top: 12px; }
.solution-art { aspect-ratio: auto; padding: 30px; align-items: stretch; }
.concept-top { display: flex; align-items: center; gap: 14px; margin-bottom: 26px; }
.concept-icon { width: 44px; height: 44px; border-radius: 10px; display: grid; place-items: center; background: white; border: 1px solid var(--tone-line); color: var(--tone-color); flex-shrink: 0; }
.concept-icon svg { width: 24px; height: 24px; }
.concept-top strong { font-size: 15px; font-weight: 600; }
.concept-top small { display: block; font: 8px/1.6 ui-monospace, monospace; letter-spacing: .06em; margin-top: 4px; color: var(--tone-color); }
.concept-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--tone-color); margin-left: auto; }
.concept-modules { display: grid; gap: 10px; }
.concept-modules > div { display: flex; align-items: center; gap: 14px; background: #ffffffe6; border: 1px solid var(--tone-line); border-radius: 8px; padding: 15px; }
.concept-modules span { font: 10px/1.5 ui-monospace, monospace; color: var(--tone-color); }
.concept-modules strong { font-size: 12px; font-weight: 500; }
.concept-modules svg { width: 14px; height: 14px; flex-shrink: 0; margin-left: auto; color: var(--tone-color); }
.concept-bottom { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--tone-color); font-size: 10px; padding-top: 22px; }
.concept-bottom svg { width: 18px; height: 18px; }
.concept-caption { font-size: 9px; color: var(--muted); border-top: 1px solid var(--tone-line); padding-top: 14px; margin-top: 18px; }
.detail-nav { display: flex; flex-wrap: wrap; gap: 8px 14px; border-block: 1px solid var(--line); padding-block: 14px; }
.detail-nav a { display: inline-flex; align-items: center; min-height: 44px; padding: 8px 12px; font-size: 12px; color: var(--muted); border-radius: 6px; }
.detail-nav a:hover { background: var(--accent-soft); color: var(--accent); }
.detail-content { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; }
.detail-content .section-description { margin: 22px 0 32px; }
.detail-content h3 { font-size: 16px; margin-bottom: 12px; }
.detail-content > div > p:last-child { color: var(--muted); font-size: 14px; }
.detail-capabilities { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 30px; align-self: start; }
.scope-note { font-size: 13px; line-height: 1.95; color: #586a82; }
.detail-capabilities .small-note { margin-top: 22px; }
@media (max-width: 1000px) { .detail-hero, .detail-content { gap: 40px; }.solution-art { padding: 24px; } }
@media (max-width: 760px) {
  .detail-heading { padding-block: 24px 36px; }.detail-hero, .detail-content { grid-template-columns: 1fr; gap: 32px; }
  .detail-hero { margin-top: 32px; }.detail-hero h1 { font-size: 32px; }.detail-hero h2 { font-size: 19px; }
  .detail-art:not(.solution-art) { max-height: 280px; }.solution-art { padding: 24px; }.detail-capabilities { padding: 24px; }
  .detail-nav { gap: 2px; }.detail-nav a { font-size: 11px; padding-inline: 10px; }
}
</style>