<script setup>
import { RouterLink } from "vue-router";
defineProps({ eyebrow: String, title: String, description: String, current: String });
</script>

<template>
  <header class="page-heading container">
    <nav class="breadcrumbs" data-reveal aria-label="面包屑">
      <RouterLink to="/">首页</RouterLink><span aria-hidden="true">/</span><span aria-current="page">{{ current || title }}</span>
    </nav>
    <p class="eyebrow" data-reveal>{{ eyebrow }}</p>
    <h1 data-reveal data-reveal-delay="80">{{ title }}</h1>
    <p v-if="description" class="page-description" data-reveal data-reveal-delay="160">{{ description }}</p>
    <slot />
  </header>
</template>
