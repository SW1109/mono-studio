<script setup>
import { RouterLink } from "vue-router";
defineProps({
  title: { type: String, default: "有个项目，\n一起聊聊。" },
  description: { type: String, default: "说说你想做什么、遇到了什么问题，以及希望什么时候完成。" },
  to: { type: [String, Object], default: "/contact/" },
  buttonLabel: { type: String, default: "联系工作室" },
});
</script>

<template>
  <section class="contact-banner container" data-reveal>
    <div><p class="eyebrow">PROJECT ENQUIRIES</p><h2>{{ title }}</h2><p>{{ description }}</p></div>
    <RouterLink class="button button-primary" :to="to">{{ buttonLabel }} <span aria-hidden="true">↗</span></RouterLink>
  </section>
</template>
