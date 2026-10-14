<script setup>
import { RouterLink } from "vue-router";
import SiteIcon from "./SiteIcon.vue";
import ProductVisual from "./ProductVisual.vue";
import { productPath } from "../../content/products.js";

defineProps({
  product: { type: Object, required: true },
  revealDelay: { type: Number, default: 0 },
});
</script>

<template>
  <article class="product-card" :class="`tone-${product.accent}`" data-reveal :data-reveal-delay="revealDelay">
    <RouterLink class="product-card-link" :to="productPath(product)" :aria-label="`了解 ${product.name} ${product.kind === 'solution' ? '方案' : '产品'}详情`">
      <ProductVisual :product="product" />
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
.product-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.product-kind { color: var(--muted); font-size: 12px; }
.card-modules { display: grid; gap: 10px; margin: -4px 0 24px; font-size: 13px; color: var(--muted); }
.card-modules li { display: flex; gap: 10px; align-items: center; }
.card-modules svg { width: 14px; height: 14px; flex-shrink: 0; color: var(--accent); }
</style>
