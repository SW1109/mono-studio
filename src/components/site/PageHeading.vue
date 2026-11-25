<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { splitTitle } from "../../composables/splitTitle.js";

const props = defineProps({ eyebrow: String, title: String, description: String, current: String });
const lines = computed(() => splitTitle(props.title));
</script>

<template>
  <header class="page-heading container">
    <nav class="breadcrumbs" data-reveal aria-label="面包屑">
      <RouterLink to="/">首页</RouterLink><span aria-hidden="true">/</span><span aria-current="page">{{ current || title }}</span>
    </nav>
    <p class="eyebrow" data-reveal>{{ eyebrow }}</p>
    <h1 data-reveal="lines" data-reveal-delay="60"><span v-for="(line, index) in lines" :key="`${index}-${line}`" class="line-mask"><span class="line-inner" :class="{ 'is-accent': lines.length > 1 && index === lines.length - 1 }">{{ line }}</span></span></h1>
    <p v-if="description" class="page-description" data-reveal data-reveal-delay="180">{{ description }}</p>
    <slot />
    <span class="page-heading-rule" aria-hidden="true"></span>
  </header>
</template>
