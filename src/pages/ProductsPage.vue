<script setup>
import { computed, ref } from "vue";
import { solutions, existingProducts } from "../content/products.js";
import PageHeading from "../components/site/PageHeading.vue";
import ProductCard from "../components/site/ProductCard.vue";
import ContactBanner from "../components/site/ContactBanner.vue";
import SiteIcon from "../components/site/SiteIcon.vue";

const category = ref("全部方案");
const categories = ["全部方案", ...new Set(solutions.map(item => item.category))];
const filtered = computed(() => category.value === "全部方案" ? solutions : solutions.filter(item => item.category === category.value));
</script>

<template>
  <PageHeading eyebrow="SOFTWARE & SOLUTIONS" title="企业应用与软件工具" current="软件产品" description="涵盖企业网站、业务管理、移动服务与自动化等开发方向。功能模块、支持平台及交付范围依据项目需求确认。" />
  <section class="container catalog-intro glass-panel" aria-label="软件展示说明" data-reveal>
    <div class="catalog-intro-copy">
      <span class="icon-tile"><SiteIcon name="layers" /></span>
      <div><h2>定制方案与适用范围</h2><p>以下为可按需求开发的方案介绍，不是已上线的标准产品或客户案例。功能、平台、费用与交付范围以双方确认的方案为准。</p></div>
    </div>
    <dl class="catalog-counts">
      <div><dt>开发方向</dt><dd>{{ solutions.length }}<small>个方案</small></dd></div>
      <div><dt>应用领域</dt><dd>{{ categories.length - 1 }}<small>类场景</small></dd></div>
    </dl>
  </section>

  <section class="container product-catalog" aria-labelledby="solutions-title">
    <div class="section-heading catalog-heading" data-reveal>
      <div><p class="eyebrow">CUSTOM SOFTWARE</p><h2 id="solutions-title">可定制的软件方案</h2></div>
      <a class="text-link" href="#existing-tools">寻找现有工具 <span aria-hidden="true">↓</span></a>
    </div>
    <div class="filter-list" data-reveal role="group" aria-label="按方案类别筛选">
      <button v-for="item in categories" :key="item" type="button" :aria-pressed="category === item" :class="{ selected: category === item }" @click="category = item">{{ item }}</button>
    </div>
    <p class="filter-status" role="status" aria-live="polite">{{ category }} · {{ filtered.length }} 个可定制方案</p>
    <div :key="category" class="product-grid"><ProductCard v-for="(product, index) in filtered" :key="product.slug" :product="product" :reveal-delay="Math.min(index, 5) * 75" /></div>
  </section>

  <section id="existing-tools" class="section section-soft" aria-labelledby="tools-title">
    <div class="container">
      <div class="section-heading" data-reveal>
        <div><p class="eyebrow">SOFTWARE TOOLS</p><h2 id="tools-title">桌面与办公效率工具</h2><p class="section-description">工具功能、支持平台及获取方式请查阅详情，并通过产品咨询确认。</p></div>
        <span class="tag">{{ existingProducts.length }} 款现有工具</span>
      </div>
      <div class="product-grid"><ProductCard v-for="(product, index) in existingProducts" :key="product.slug" :product="product" :reveal-delay="index * 75" /></div>
    </div>
  </section>
  <ContactBanner :title="'业务需求沟通\n与定制方案评估'" description="提供现有流程、核心功能与系统对接要求，便于评估开发范围和实施安排。" />
</template>

<style scoped>
.catalog-intro { display: flex; justify-content: space-between; align-items: center; gap: 48px; padding: 32px 40px; background: var(--glass-bg); border-radius: var(--radius-card); margin-bottom: 72px; }
.catalog-intro-copy { display: flex; gap: 24px; max-width: 730px; }
.catalog-intro-copy .icon-tile { flex-shrink: 0; }
.catalog-intro h2 { font-size: 21px; margin-bottom: 12px; }
.catalog-intro p { color: var(--muted); font-size: 14px; line-height: 1.8; }
.catalog-counts { display: flex; gap: 32px; flex-shrink: 0; }
.catalog-counts dt { color: var(--muted); font-size: 12px; }
.catalog-counts dd { color: var(--ink); font-size: 36px; font-weight: 600; line-height: 1.5; }
.catalog-counts small { font-size: 12px; font-weight: 400; color: var(--muted); display: block; }
.product-catalog { padding-bottom: 96px; }
.catalog-heading { margin-bottom: 32px; }
.filter-list { display: flex; gap: 10px; flex-wrap: wrap; }
.filter-list button { min-height: 44px; background: var(--glass-bg-strong); color: var(--muted); border: 1px solid var(--line); border-radius: var(--radius-pill); font-size: 14px; padding: 10px 18px; transition: color .2s, border-color .2s, background .2s; }
.filter-list button.selected { background: var(--accent); color: var(--canvas); border-color: var(--accent); }
.filter-list button:not(.selected):hover { border-color: var(--accent); color: var(--accent); }
.filter-status { font-size: 13px; color: var(--muted); margin-block: 24px 28px; }
#existing-tools { scroll-margin-top: 96px; }
@media (max-width: 1040px) { .catalog-intro { gap: 32px; padding: 32px; }.catalog-counts { gap: 24px; } }
@media (max-width: 760px) {
  .catalog-intro { flex-direction: column; align-items: start; gap: 28px; padding: 28px; margin-bottom: 48px; }
  .catalog-intro-copy { gap: 16px; }
  .catalog-intro h2 { font-size: 20px; }
  .catalog-counts { width: 100%; padding-top: 24px; border-top: 1px solid var(--line); gap: 48px; }
  .catalog-counts dd { font-size: 32px; }
  .product-catalog { padding-bottom: 64px; }
  .filter-list { gap: 8px; }
  .filter-list button { font-size: 13px; padding-inline: 16px; }
}
</style>
