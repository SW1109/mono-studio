<script setup>
import { RouterLink } from "vue-router";
defineProps({
  title: { type: String, default: "下一个好用的软件，\n从一次对话开始。" },
  description: { type: String, default: "聊聊你正在做的事，以及技术可以帮上忙的地方。" },
  to: { type: [String, Object], default: "/contact/" },
  buttonLabel: { type: String, default: "聊聊你的项目" },
});
</script>

<template>
  <section class="contact-banner container" data-reveal>
    <div><p class="eyebrow">LET’S BUILD TOGETHER</p><h2>{{ title }}</h2><p>{{ description }}</p></div>
    <RouterLink class="button button-primary" :to="to">{{ buttonLabel }} <span aria-hidden="true">↗</span></RouterLink>
    <span class="banner-orbit" aria-hidden="true"></span>
  </section>
</template>