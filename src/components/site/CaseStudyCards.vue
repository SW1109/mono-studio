<script setup>
import { RouterLink } from "vue-router";
import { caseStudyPath } from "../../content/caseStudies.js";
import SiteIcon from "./SiteIcon.vue";

defineProps({ items: { type: Array, required: true } });
const base = import.meta.env.BASE_URL;
</script>

<template>
  <div class="case-grid">
    <article v-for="item in items" :key="item.slug" class="case-card">
      <RouterLink class="case-card-image" :to="caseStudyPath(item)" tabindex="-1" aria-hidden="true"><img :src="`${base}${item.image}`" width="1440" height="1000" loading="lazy" decoding="async" alt="" /></RouterLink>
      <div class="case-card-copy"><p class="case-card-category">本站实录 · {{ item.category }}</p><h3><RouterLink :to="caseStudyPath(item)">{{ item.title }}<SiteIcon name="arrow" /></RouterLink></h3><p class="case-card-summary">{{ item.summary }}</p></div>
    </article>
  </div>
</template>

<style scoped>
.case-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
.case-card { min-width: 0; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: var(--surface); }
.case-card-image { display: block; aspect-ratio: 1440 / 1000; border-bottom: 1px solid var(--line); background: var(--canvas); }
.case-card-image img { width: 100%; height: 100%; object-fit: contain; }
.case-card-copy { padding: 24px; }
.case-card-category { font-size: 12px; color: var(--muted); margin-bottom: 14px; }
.case-card h3 { font-size: 20px; font-weight: 500; line-height: 1.6; margin-bottom: 14px; }
.case-card h3 a { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
.case-card h3 svg { width: 18px; height: 18px; margin-top: 6px; flex-shrink: 0; }
.case-card h3 a:hover { color: var(--accent); }
.case-card-summary { font-size: 14px; line-height: 1.9; color: var(--muted); }
@media (max-width: 1040px) { .case-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.case-card-copy { padding: 20px; } }
@media (max-width: 640px) { .case-grid { grid-template-columns: 1fr; }.case-card h3 { font-size: 19px; } }
</style>
