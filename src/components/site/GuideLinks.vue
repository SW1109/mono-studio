<script setup>
import { RouterLink } from "vue-router";
import { guidePath } from "../../content/guideArticles.js";
import SiteIcon from "./SiteIcon.vue";

defineProps({ articles: { type: Array, required: true }, title: { type: String, default: "开始之前，把这些事说清楚。" } });
</script>

<template>
  <section v-if="articles.length" class="guide-links">
    <div class="guide-links-heading"><h2>{{ title }}</h2><RouterLink class="text-link" to="/guides/">选购指南 <SiteIcon name="arrow" /></RouterLink></div>
    <div class="guide-links-list">
      <article v-for="guide in articles" :key="guide.slug">
        <p class="guide-links-category">{{ guide.category }}</p>
        <h3><RouterLink :to="guidePath(guide)">{{ guide.title }} <SiteIcon name="arrow" /></RouterLink></h3>
        <p class="guide-links-summary">{{ guide.summary }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.guide-links { padding-block: 48px; border-top: 1px solid var(--line); }
.guide-links-heading { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 16px 32px; margin-bottom: 28px; }
.guide-links-heading h2 { font-size: 24px; line-height: 1.5; font-weight: 500; }
.guide-links-heading svg, .guide-links-list svg { width: 16px; height: 16px; flex-shrink: 0; }
.guide-links-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 32px; }
.guide-links-list article { min-width: 0; }
.guide-links-category { color: var(--muted); font-size: 12px; margin-bottom: 12px; }
.guide-links-list h3 { font-size: 17px; font-weight: 500; line-height: 1.7; margin-bottom: 12px; }
.guide-links-list a { display: inline-flex; align-items: baseline; gap: 8px; }
.guide-links-list a:hover { color: var(--accent); }
.guide-links-summary { color: var(--muted); font-size: 14px; line-height: 1.9; }
@media (max-width: 520px) { .guide-links-heading h2 { font-size: 21px; } }
</style>
