<script setup>
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { findProduct, productInquiry } from "../content/products.js";
import SiteIcon from "../components/site/SiteIcon.vue";
import ProductVisual from "../components/site/ProductVisual.vue";
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
        <figure class="detail-preview" data-reveal data-reveal-delay="120">
          <ProductVisual :product="product" large />
          <figcaption>{{ isSolution ? '方案界面结构示意，非已上线系统截图' : '功能方向示意，实际界面与版本请咨询确认' }}</figcaption>
        </figure>
      </div>
    </header>

    <nav v-if="isSolution" class="container detail-nav" aria-label="方案内容导航" data-reveal><a v-for="section in sections" :key="section.id" :href="`#${section.id}`">{{ section.title }}</a></nav>

    <section id="overview" class="section container detail-content" aria-labelledby="overview-title">
      <div data-reveal>
        <p class="eyebrow">{{ isSolution ? 'START WITH THE PROBLEM' : 'DESIGNED FOR EVERYDAY USE' }}</p>
        <h2 id="overview-title">{{ isSolution ? '方案概述与适用范围' : '产品概述与使用场景' }}</h2>
        <p class="section-description">{{ product.description }}</p>
        <h3>{{ isSolution ? '适合哪些团队' : '适合谁使用' }}</h3><p>{{ product.audience }}</p>
      </div>
      <aside class="detail-capabilities" data-reveal data-reveal-delay="120">
        <template v-if="isSolution"><h3>定制前，需要明确的边界</h3><p class="scope-note">{{ product.note }}</p><p class="small-note">本页介绍开发方向与可选模块，不代表现货软件或已完成案例。具体功能、交付周期、费用和维护安排以确认后的方案为准。</p></template>
        <template v-else><h3>产品方向</h3><ul class="check-list"><li v-for="capability in product.capabilities" :key="capability"><SiteIcon name="check" />{{ capability }}</li></ul><p class="small-note">{{ product.note }}</p><p class="small-note">获取方式与实际版本请联系确认；本页不提供未经确认的下载链接。</p></template>
      </aside>
    </section>

    <SolutionDetails v-if="isSolution" :details="product.details" />
    <ContactBanner :title="isSolution ? '业务需求沟通\n与定制方案评估' : '产品功能咨询\n与适用场景确认'" :description="isSolution ? '提供使用人员、现有流程与核心功能要求，便于评估技术方案、开发范围及实施安排。' : '咨询具体功能、支持平台、获取方式与配置要求，确认产品是否适用于当前工作场景。'" :to="productInquiry(product)" :button-label="isSolution ? '沟通这个方案' : '咨询这款产品'" />
  </template>
  <NotFoundPage v-else />
</template>

<style scoped>
.detail-heading { padding-block: 32px 64px; }
.detail-hero { display: grid; grid-template-columns: 1.1fr .9fr; gap: 72px; align-items: center; margin-top: 48px; }
.detail-hero > div { min-width: 0; }
.detail-kind { margin-bottom: 20px; color: var(--accent); background: var(--accent-soft); border-color: var(--line); }
.detail-hero h1 { font-size: clamp(34px, 3.7vw, 52px); line-height: 1.3; letter-spacing: -.045em; }
.detail-hero h2 { margin-top: 20px; font-size: 24px; line-height: 1.5; }
.detail-hero .button-row { margin-top: 32px; }
.platform-list { display: flex; flex-wrap: wrap; gap: 12px 24px; margin-top: 24px; }
.platform-list li { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 14px; }
.platform-list svg { width: 15px; height: 15px; color: var(--accent); }
.detail-preview { margin: 0; min-width: 0; }
.detail-preview figcaption { font-size: 12px; color: var(--muted); margin-top: 16px; text-align: center; }
.detail-nav { display: flex; flex-wrap: wrap; gap: 8px 16px; border-block: 1px solid var(--line); padding-block: 16px; }
.detail-nav a { display: inline-flex; align-items: center; min-height: 44px; padding: 8px 16px; font-size: 14px; color: var(--muted); border-radius: var(--radius-pill); }
.detail-nav a:hover { background: var(--accent-soft); color: var(--accent); }
.detail-content { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; }
.detail-content .section-description { margin: 24px 0 32px; }
.detail-content h3 { font-size: 20px; margin-bottom: 16px; }
.detail-content > div > p:last-child { color: var(--muted); font-size: 17px; }
.detail-capabilities { background: var(--surface); border-radius: var(--radius-card); padding: 36px; align-self: start; }
.scope-note { font-size: 16px; line-height: 1.8; color: var(--muted); }
.detail-capabilities .small-note { margin-top: 24px; }
@media (max-width: 1040px) { .detail-hero, .detail-content { gap: 40px; } }
@media (max-width: 760px) {
  .detail-heading { padding-block: 24px 48px; }
  .detail-hero, .detail-content { grid-template-columns: 1fr; gap: 32px; }
  .detail-hero { margin-top: 32px; }
  .detail-hero h1 { font-size: 34px; }
  .detail-hero h2 { font-size: 21px; }
  .detail-capabilities { padding: 28px; }
  .detail-nav { gap: 4px; }
  .detail-nav a { font-size: 13px; padding-inline: 12px; }
}
</style>
