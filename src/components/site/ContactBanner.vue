<script setup>
import { RouterLink } from "vue-router";
defineProps({
  title: { type: String, default: "项目咨询\n与技术合作" },
  description: { type: String, default: "提供业务场景、核心功能与预期时间，便于评估技术方案和项目范围。" },
  to: { type: [String, Object], default: "/contact/" },
  buttonLabel: { type: String, default: "项目咨询" },
});
</script>

<template>
  <section class="contact-banner container" data-reveal>
    <div><p class="eyebrow">PROJECT ENQUIRIES</p><h2>{{ title }}</h2><p>{{ description }}</p></div>
    <RouterLink class="button button-primary" :to="to">{{ buttonLabel }} <span aria-hidden="true">↗</span></RouterLink>
  </section>
</template>