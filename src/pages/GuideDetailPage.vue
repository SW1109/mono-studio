<script setup>
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { findGuide, guideArticles } from "../content/guideArticles.js";
import { site } from "../content/site.js";
import { products, productPath } from "../content/products.js";
import { orderCenter } from "../config/orderCenter.js";
import GuideLinks from "../components/site/GuideLinks.vue";
import SiteNavLink from "../components/site/SiteNavLink.vue";
import NotFoundPage from "./NotFoundPage.vue";
import { caseStudies, caseStudyPath } from "../content/caseStudies.js";

const route = useRoute();
const guide = computed(() => findGuide(route.params.slug));
const related = computed(() => guideArticles.filter(item => guide.value?.related.includes(item.slug)));
const solutions = computed(() => products.filter(item => guide.value?.solutionSlugs.includes(item.slug)));
const offerUrl = computed(() => guide.value?.offerId && orderCenter?.products[guide.value.offerId]);
const relatedProjects = computed(() => caseStudies.filter(item => item.guideSlugs.includes(guide.value?.slug)));
</script>

<template>
  <article v-if="guide" class="container guide-detail">
    <header class="guide-detail-header">
      <nav class="breadcrumbs" aria-label="面包屑"><RouterLink to="/">首页</RouterLink><span aria-hidden="true">/</span><RouterLink to="/guides/">服务选购指南</RouterLink><span aria-hidden="true">/</span><span aria-current="page">{{ guide.category }}</span></nav>
      <p class="eyebrow">{{ guide.category }}</p>
      <h1>{{ guide.title }}</h1>
      <p class="guide-detail-summary">{{ guide.summary }}</p>
      <p class="guide-detail-meta"><RouterLink to="/about/">{{ site.shortName }}工作室</RouterLink><span>发布于 <time :datetime="guide.publishedAt">{{ guide.publishedAt }}</time></span><span>更新于 <time :datetime="guide.updatedAt">{{ guide.updatedAt }}</time></span></p>
    </header>
    <div class="guide-detail-layout">
      <nav class="guide-detail-toc" aria-label="文章目录"><p>本文内容</p><a href="#answer">先看结论</a><a v-for="section in guide.sections" :key="section.id" :href="`#${section.id}`">{{ section.title }}</a><a href="#questions">常见问题</a></nav>
      <div class="guide-detail-body">
        <section id="answer" class="guide-detail-answer"><h2>先看结论</h2><p>{{ guide.answer }}</p></section>
        <section v-for="section in guide.sections" :id="section.id" :key="section.id"><h2>{{ section.title }}</h2><p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p><ul v-if="section.items"><li v-for="item in section.items" :key="item">{{ item }}</li></ul></section>
        <section id="questions"><h2>常见问题</h2><div class="faq-list"><details v-for="faq in guide.faqs" :key="faq.question"><summary>{{ faq.question }}<span aria-hidden="true">+</span></summary><p>{{ faq.answer }}</p></details></div></section>
        <section v-if="relatedProjects.length" id="project-examples" class="guide-detail-next"><h2>在本站项目中如何落地</h2><p>下面记录工作室自有官网与商城的实际实施过程，可对照页面和源码查看。</p><ul><li v-for="item in relatedProjects" :key="item.slug"><RouterLink :to="caseStudyPath(item)">{{ item.title }}</RouterLink></li></ul></section>
        <section class="guide-detail-next"><h2>结合你的项目确认范围</h2><p>带上页面清单、业务流程或脱敏样例，沟通需要完成的工作与交付方式。</p><ul><li v-for="solution in solutions" :key="solution.slug"><RouterLink :to="productPath(solution)">{{ solution.name }}</RouterLink></li></ul><div class="button-row"><a v-if="offerUrl" class="button button-primary" :href="offerUrl">查看对应服务与价格</a><SiteNavLink v-else class="button button-primary" to="/shop/">查看服务商品</SiteNavLink><RouterLink class="text-link" to="/contact/">联系工作室</RouterLink><RouterLink class="text-link" to="/service-terms/">交付与售后条款</RouterLink></div></section>
      </div>
    </div>
    <GuideLinks :articles="related" title="继续阅读" />
  </article>
  <NotFoundPage v-else />
</template>

<style scoped>
.guide-detail { padding-block: 32px 64px; }
.guide-detail-header { max-width: 900px; padding-bottom: 48px; }
.guide-detail-header h1 { font-size: 40px; line-height: 1.4; font-weight: 500; margin-block: 20px; }
.guide-detail-summary { font-size: 17px; line-height: 1.9; color: var(--muted); }
.guide-detail-meta { display: flex; flex-wrap: wrap; gap: 8px 24px; margin-top: 24px; font-size: 12px; color: var(--muted); }
.guide-detail-meta a:hover { color: var(--ink); }
.guide-detail-layout { display: grid; grid-template-columns: 240px minmax(0, 760px); gap: 64px; padding-bottom: 32px; }
.guide-detail-toc { display: grid; gap: 4px; align-self: start; position: sticky; top: 112px; font-size: 13px; line-height: 1.8; }
.guide-detail-toc p { margin-bottom: 12px; color: var(--ink); }
.guide-detail-toc a { padding-block: 8px; color: var(--muted); }
.guide-detail-toc a:hover { color: var(--ink); }
.guide-detail-body { min-width: 0; }
.guide-detail-body section { scroll-margin-top: 112px; padding-block: 32px; border-top: 1px solid var(--line); }
.guide-detail-body h2 { font-size: 24px; line-height: 1.6; font-weight: 500; margin-bottom: 20px; }
.guide-detail-body p, .guide-detail-body li { font-size: 16px; line-height: 1.95; color: var(--muted); }
.guide-detail-body p + p { margin-top: 16px; }
.guide-detail-body ul { list-style: disc; padding-left: 22px; margin-top: 20px; }
.guide-detail-body li + li { margin-top: 10px; }
.guide-detail-body .guide-detail-answer { border-top-color: var(--accent); }
.guide-detail-answer p { color: var(--ink); }
.guide-detail-next li a { color: var(--ink); text-decoration: underline; text-underline-offset: 5px; }
.guide-detail a:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; }
@media (max-width: 900px) { .guide-detail-layout { grid-template-columns: 1fr; gap: 24px; }.guide-detail-toc { position: static; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 24px; }.guide-detail-toc p { grid-column: 1 / -1; } }
@media (max-width: 520px) { .guide-detail-header h1 { font-size: 30px; }.guide-detail-header { padding-bottom: 32px; }.guide-detail-body h2 { font-size: 22px; }.guide-detail-toc { grid-template-columns: 1fr; }.guide-detail-body p, .guide-detail-body li { font-size: 15px; } }
</style>
