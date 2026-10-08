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
  <PageHeading eyebrow="SOFTWARE & SOLUTIONS" title="从业务场景，找到合适的软件。" current="软件产品" description="从品牌官网到业务系统，从小程序到智能工具，了解常见的软件开发方向，以及每个方向可以解决什么问题、交付哪些内容。" />
  <section class="container catalog-intro" aria-label="软件展示说明" data-reveal>
    <div class="catalog-intro-copy">
      <span class="icon-tile"><SiteIcon name="layers" /></span>
      <div><h2>先找到方向，再一起定义细节。</h2><p>以下为可按需求开发的方案介绍，不是已上线的标准产品或客户案例。功能、平台、费用与交付范围以双方确认的方案为准。</p></div>
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
        <div><p class="eyebrow">SOFTWARE TOOLS</p><h2 id="tools-title">也有面向日常的效率工具。</h2><p class="section-description">原有工具继续保留，功能、平台支持和获取方式请进入详情后咨询确认。</p></div>
        <span class="tag">{{ existingProducts.length }} 款现有工具</span>
      </div>
      <div class="product-grid"><ProductCard v-for="(product, index) in existingProducts" :key="product.slug" :product="product" :reveal-delay="index * 75" /></div>
    </div>
  </section>
  <ContactBanner :title="'不必套用现成流程，\n让软件适应你的业务。'" description="可以从一个核心模块开始，也可以组合多个方向。先确认要解决的问题，再确定开发范围。" />
</template>

<style scoped>
.catalog-intro { display: flex; justify-content: space-between; align-items: center; gap: 40px; padding: 28px 32px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; margin-bottom: 60px; }
.catalog-intro-copy { display: flex; gap: 20px; max-width: 690px; }
.catalog-intro-copy .icon-tile { flex-shrink: 0; }
.catalog-intro h2 { font-size: 18px; margin-bottom: 10px; }
.catalog-intro p { color: var(--muted); font-size: 12px; line-height: 1.9; }
.catalog-counts { display: flex; gap: 30px; flex-shrink: 0; }
.catalog-counts dt { color: var(--muted); font-size: 10px; }
.catalog-counts dd { color: var(--accent); font-size: 30px; font-weight: 600; line-height: 1.5; }
.catalog-counts small { font-size: 10px; font-weight: 400; color: var(--muted); display: block; }
.product-catalog { padding-bottom: 72px; }
.catalog-heading { margin-bottom: 28px; }
.filter-list { display: flex; gap: 10px; flex-wrap: wrap; padding-bottom: 24px; border-bottom: 1px solid var(--line); }
.filter-list button { min-height: 44px; background: var(--surface); border: 1px solid var(--line); border-radius: 7px; font-size: 12px; padding: 9px 16px; transition: color .2s, border-color .2s, background .2s, transform .2s; }
.filter-list button.selected { background: var(--accent); color: white; border-color: var(--accent); }
.filter-list button:active { transform: scale(.97); }
.filter-list button:not(.selected):hover { background: var(--accent-soft); border-color: #b9cef1; color: var(--accent); }
.filter-status { color: var(--muted); font-size: 11px; margin: 18px 0 26px; }
@media (max-width: 1000px) { .catalog-intro { gap: 24px; padding: 26px; }.catalog-counts { gap: 20px; } }
@media (max-width: 760px) { .catalog-intro { flex-direction: column; align-items: start; margin-bottom: 42px; padding: 24px; }.catalog-intro-copy { gap: 14px; }.catalog-counts { gap: 40px; padding-left: 56px; }.product-catalog { padding-bottom: 48px; } }
</style>