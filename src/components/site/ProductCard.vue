<script setup>
import { RouterLink } from "vue-router";
import SiteIcon from "./SiteIcon.vue";
import { productPath } from "../../content/products.js";

defineProps({
  product: { type: Object, required: true },
  revealDelay: { type: Number, default: 0 },
});
</script>

<template>
  <article class="product-card" :class="`tone-${product.accent}`" data-reveal :data-reveal-delay="revealDelay">
    <RouterLink class="product-card-link" :to="productPath(product)" :aria-label="`了解 ${product.name} ${product.kind === 'solution' ? '方案' : '产品'}详情`">
      <div class="product-art" aria-hidden="true">
        <span class="product-art-grid"></span>
        <div class="product-emblem"><SiteIcon :name="product.icon" /></div>
        <span class="art-corner">{{ product.kind === 'solution' ? 'GN / CUSTOM SOFTWARE' : 'GN / SOFTWARE TOOL' }}</span>
        <span class="art-name">{{ product.kind === 'solution' ? '方案示意' : product.name }}</span>
        <span class="art-open">↗</span>
      </div>
      <div class="product-card-body">
        <div class="product-tags">
          <span class="tag">{{ product.category }}</span>
          <span class="product-kind">{{ product.kind === 'solution' ? '可定制方案' : '现有工具' }}</span>
        </div>
        <h3>{{ product.name }}</h3>
        <p>{{ product.summary }}</p>
        <ul v-if="product.kind === 'solution'" class="card-modules">
          <li v-for="module in product.details.modules.slice(0, 3)" :key="module.title"><SiteIcon name="check" />{{ module.title }}</li>
        </ul>
        <span class="text-link">{{ product.kind === 'solution' ? '查看方案详情' : '了解产品' }} <span aria-hidden="true">↗</span></span>
      </div>
    </RouterLink>
  </article>
</template>

<style scoped>
.product-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.product-kind { color: var(--tone-color); font-size: 10px; }
.card-modules { display: grid; gap: 8px; margin: -5px 0 22px; font-size: 11px; color: #586a82; }
.card-modules li { display: flex; gap: 8px; align-items: center; }
.card-modules svg { width: 13px; height: 13px; flex-shrink: 0; color: var(--tone-color); }
</style>