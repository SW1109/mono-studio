<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { site } from "../../content/site.js";
import { guideArticles } from "../../content/guideArticles.js";
import GuideLinks from "./GuideLinks.vue";

const props = defineProps({ study: { type: Object, required: true } });
const guides = computed(() => guideArticles.filter(item => props.study.guideSlugs.includes(item.slug)));
const base = import.meta.env.BASE_URL;
</script>

<template>
  <article class="container case-article">
    <header class="case-heading">
      <nav class="breadcrumbs" aria-label="面包屑"><RouterLink to="/">首页</RouterLink><span aria-hidden="true">/</span><RouterLink to="/projects/">项目实录</RouterLink><span aria-hidden="true">/</span><span aria-current="page">{{ study.category }}</span></nav>
      <p class="eyebrow">自有项目 · {{ study.category }}</p><h1>{{ study.title }}</h1><p class="case-summary">{{ study.summary }}</p>
      <p class="case-meta"><RouterLink to="/about/#studio-facts">{{ site.shortName }}工作室</RouterLink><span>发布于 <time :datetime="study.publishedAt">{{ study.publishedAt }}</time></span><span>更新于 <time :datetime="study.updatedAt">{{ study.updatedAt }}</time></span></p>
      <dl class="case-facts"><div v-for="fact in study.facts" :key="fact.label"><dt>{{ fact.label }}</dt><dd>{{ fact.value }}</dd></div></dl>
    </header>
    <figure class="case-media"><img :src="`${base}${study.image}`" width="1440" height="1000" :alt="study.imageAlt" decoding="async" /><figcaption><span>{{ study.caption }}</span><a :href="`${base}${study.image}`" target="_blank" rel="noopener noreferrer">查看原图</a></figcaption></figure>
    <div class="case-layout">
      <nav class="case-toc" aria-label="项目内容导航"><p>实施记录</p><a href="#overview">项目概况</a><a v-for="section in study.sections" :key="section.id" :href="`#${section.id}`">{{ section.title }}</a><a href="#verification">核对结果与范围</a><a href="#references">可核对资料</a><a href="#questions">相关问题</a></nav>
      <div class="case-body">
        <section id="overview"><h2>项目概况</h2><p>{{ study.lead }}</p></section>
        <section v-for="section in study.sections" :id="section.id" :key="section.id"><h2>{{ section.title }}</h2><p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p><ul v-if="section.items"><li v-for="item in section.items" :key="item">{{ item }}</li></ul></section>
        <figure v-if="study.gallery" class="case-media"><img :src="`${base}${study.gallery.image}`" width="1440" height="1000" :alt="study.gallery.alt" loading="lazy" decoding="async" /><figcaption><span>{{ study.gallery.caption }}</span><a :href="`${base}${study.gallery.image}`" target="_blank" rel="noopener noreferrer">查看原图</a></figcaption></figure>
        <section id="verification"><h2>核对结果与范围</h2><dl class="case-checks"><div v-for="check in study.checks" :key="check.title"><dt>{{ check.title }}</dt><dd>{{ check.detail }}</dd></div></dl><p class="case-boundary">{{ study.boundary }}</p></section>
        <section id="references"><h2>可核对资料</h2><ul class="case-references"><li v-for="reference in study.references" :key="reference.href"><a :href="reference.href" target="_blank" rel="noopener noreferrer">{{ reference.label }} <span aria-hidden="true">↗</span></a><p>{{ reference.detail }}</p></li></ul></section>
        <section id="questions"><h2>相关问题</h2><div class="faq-list"><details v-for="faq in study.faqs" :key="faq.question"><summary>{{ faq.question }}<span aria-hidden="true">+</span></summary><p>{{ faq.answer }}</p></details></div></section>
        <div class="case-action"><p>有类似的系统或流程需要处理，可以带上现状与目标一起沟通。</p><div class="button-row"><RouterLink class="button button-primary" to="/contact/">沟通项目需求</RouterLink><RouterLink class="text-link" to="/projects/">全部项目实录</RouterLink></div></div>
      </div>
    </div>
    <GuideLinks :articles="guides" title="相关选购与交付指南" />
  </article>
</template>

<style scoped>
.case-article { padding-block: 32px 64px; }
.case-heading h1 { font-size: 40px; line-height: 1.4; font-weight: 500; margin-block: 20px; max-width: 940px; }
.case-summary { font-size: 18px; line-height: 1.9; color: var(--muted); max-width: 880px; }
.case-meta { display: flex; flex-wrap: wrap; gap: 8px 24px; color: var(--muted); font-size: 12px; margin-top: 24px; }
.case-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px; margin-block: 40px 32px; border-block: 1px solid var(--line); padding-block: 24px; }
.case-facts dt { font-size: 12px; color: var(--muted); margin-bottom: 10px; }
.case-facts dd { font-size: 15px; line-height: 1.7; }
.case-media { margin: 0; min-width: 0; }
.case-media img { display: block; width: 100%; height: auto; aspect-ratio: 1440 / 1000; object-fit: contain; border: 1px solid var(--line); border-radius: 8px; }
.case-media figcaption { display: flex; justify-content: space-between; gap: 16px; padding-block: 16px 24px; font-size: 12px; line-height: 1.8; color: var(--muted); }
.case-media figcaption a { flex-shrink: 0; text-decoration: underline; text-underline-offset: 4px; }
.case-layout { display: grid; grid-template-columns: 240px minmax(0, 780px); gap: 64px; margin-top: 32px; padding-bottom: 40px; }
.case-toc { display: grid; gap: 4px; position: sticky; top: 112px; align-self: start; font-size: 13px; line-height: 1.8; }
.case-toc p { margin-bottom: 12px; }
.case-toc a { padding-block: 8px; color: var(--muted); }
.case-toc a:hover { color: var(--ink); }
.case-body { min-width: 0; }
.case-body section { scroll-margin-top: 112px; border-top: 1px solid var(--line); padding-block: 32px; }
.case-body h2 { font-size: 25px; font-weight: 500; line-height: 1.6; margin-bottom: 20px; }
.case-body p, .case-body li, .case-checks dd { font-size: 16px; line-height: 1.95; color: var(--muted); }
.case-body p + p { margin-top: 16px; }
.case-body ul { padding-left: 22px; list-style: disc; margin-top: 20px; }
.case-body li + li { margin-top: 12px; }
.case-checks { display: grid; gap: 24px; }
.case-checks dt { font-size: 15px; margin-bottom: 8px; }
.case-boundary { border-left: 2px solid var(--line); padding-left: 20px; margin-top: 28px; }
.case-body .case-references { padding: 0; list-style: none; }
.case-references a { color: var(--ink); text-decoration: underline; text-underline-offset: 5px; }
.case-references p { font-size: 14px; margin-top: 8px; }
.case-action { padding-top: 24px; }
@media (max-width: 900px) { .case-layout { grid-template-columns: 1fr; gap: 24px; }.case-toc { position: static; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 24px; }.case-toc p { grid-column: 1 / -1; } }
@media (max-width: 520px) { .case-heading h1 { font-size: 30px; }.case-summary { font-size: 16px; }.case-facts { grid-template-columns: 1fr; gap: 16px; margin-top: 28px; }.case-facts > div { display: grid; grid-template-columns: 80px minmax(0, 1fr); gap: 12px; }.case-facts dt { margin: 0; padding-top: 3px; }.case-body h2 { font-size: 22px; }.case-body p, .case-body li, .case-checks dd { font-size: 15px; }.case-media figcaption { flex-wrap: wrap; gap: 8px; } }
</style>
