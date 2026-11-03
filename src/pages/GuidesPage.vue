<script setup>
import { RouterLink } from "vue-router";
import PageHeading from "../components/site/PageHeading.vue";
import SiteNavLink from "../components/site/SiteNavLink.vue";
import { serviceGuide } from "../content/guides.js";
</script>

<template>
  <PageHeading eyebrow="SERVICE GUIDE" :title="serviceGuide.title" current="服务选购指南" :description="serviceGuide.summary" />
  <div class="container guide-layout">
    <aside class="guide-navigation"><p class="eyebrow">购买之前</p><nav aria-label="指南目录"><a v-for="(section, index) in serviceGuide.sections" :key="section.id" :href="`#${section.id}`"><span>0{{ index + 1 }}</span>{{ section.title }}</a></nav><p class="guide-updated">更新于 <time :datetime="serviceGuide.updatedAt">{{ serviceGuide.updatedAt }}</time></p></aside>
    <article class="guide-article">
      <section v-for="(section, index) in serviceGuide.sections" :id="section.id" :key="section.id"><span class="eyebrow">0{{ index + 1 }} / GUIDE</span><h2>{{ section.title }}</h2><p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p><div v-if="section.options" class="guide-comparison" role="region" aria-label="技术服务选择对照表，可左右滚动" tabindex="0"><table><caption>按项目问题选择服务，开始前核对资料和交付物</caption><thead><tr><th scope="col">当前需求</th><th scope="col">适合的服务</th><th scope="col">开始前准备</th><th scope="col">主要交付物</th></tr></thead><tbody><tr v-for="option in section.options" :key="option.service"><th scope="row">{{ option.need }}</th><td>{{ option.service }}</td><td>{{ option.preparation }}</td><td>{{ option.result }}</td></tr></tbody></table></div></section>
      <section id="questions"><p class="eyebrow">QUESTIONS & ANSWERS</p><h2>常见问题</h2><div class="faq-list"><details v-for="faq in serviceGuide.faqs" :key="faq.question"><summary>{{ faq.question }}<span aria-hidden="true">+</span></summary><p>{{ faq.answer }}</p></details></div></section>
      <div class="guide-action"><h2>找到适合当前项目的服务</h2><p>在商品页核对服务范围、价格与交付约定，开始前联系确认排期。</p><div class="button-row"><SiteNavLink class="button button-primary" to="/shop/">查看服务商品 <span aria-hidden="true">↗</span></SiteNavLink><RouterLink class="text-link" to="/service-terms/">服务与售后条款 <span aria-hidden="true">↗</span></RouterLink></div></div>
    </article>
  </div>
</template>

<style scoped>
.guide-layout { display:grid; grid-template-columns:260px minmax(0,1fr); gap:64px; padding-bottom:96px; }
.guide-navigation { align-self:start; position:sticky; top:128px; }
.guide-navigation nav { display:grid; gap:8px; margin-top:22px; }
.guide-navigation a { display:flex; gap:14px; padding:12px 0; color:var(--muted); font-size:14px; line-height:1.7; }
.guide-navigation a:hover { color:var(--accent); }
.guide-navigation a span { font:11px/2 var(--font-mono); color:var(--accent); }
.guide-updated { margin-top:28px; font-size:12px; color:var(--muted); }
.guide-article { min-width:0; }
.guide-article section { padding-bottom:44px; margin-bottom:44px; border-bottom:1px solid var(--line); scroll-margin-top:130px; }
.guide-article h2 { font-size:clamp(24px,2.2vw,32px); line-height:1.45; margin:14px 0 22px; letter-spacing:-.03em; }
.guide-article section>p:not(.eyebrow) { color:var(--muted); font-size:16px; line-height:1.95; margin-top:16px; }
.guide-comparison { overflow-x:auto; margin-top:28px; border:1px solid var(--line); border-radius:16px; }
.guide-comparison:focus-visible { outline:2px solid var(--accent); outline-offset:4px; }
.guide-comparison table { width:100%; min-width:640px; border-collapse:collapse; text-align:left; font-size:14px; line-height:1.8; }
.guide-comparison caption { text-align:left; padding:18px 20px; color:var(--muted); }
.guide-comparison th, .guide-comparison td { padding:16px 20px; border-top:1px solid var(--line); vertical-align:top; }
.guide-comparison thead th { background:var(--glass-bg); color:var(--ink); white-space:nowrap; }
.guide-comparison tbody th { width:25%; font-weight:500; color:var(--ink); }
.guide-comparison td { color:var(--muted); }
.guide-action { border:1px solid var(--glass-line); background:var(--glass-bg); border-radius:24px; padding:36px; }
.guide-action p { color:var(--muted); line-height:1.9; margin-bottom:26px; }
@media(max-width:900px) { .guide-layout { grid-template-columns:1fr; gap:36px; }.guide-navigation { position:static; padding-bottom:24px; border-bottom:1px solid var(--line); }.guide-navigation nav { grid-template-columns:repeat(2,minmax(0,1fr)); gap:0 20px; }.guide-article section { scroll-margin-top:110px; } }
@media(max-width:520px) { .guide-navigation nav { grid-template-columns:1fr; }.guide-action { padding:24px; }.guide-layout { padding-bottom:64px; } }
</style>
