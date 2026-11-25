<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { splitTitle } from "../../composables/splitTitle.js";

const props = defineProps({
  title: { type: String, default: "有个项目，\n一起聊聊。" },
  description: { type: String, default: "说说你想做什么、遇到了什么问题，以及希望什么时候完成。" },
  to: { type: [String, Object], default: "/contact/" },
  buttonLabel: { type: String, default: "联系工作室" },
});
const lines = computed(() => splitTitle(props.title));
</script>

<template>
  <section class="contact-banner container">
    <p class="eyebrow" data-reveal>PROJECT ENQUIRIES</p>
    <h2 data-reveal="lines"><span v-for="(line, index) in lines" :key="`${index}-${line}`" class="line-mask"><span class="line-inner" :class="{ 'is-accent': lines.length > 1 && index === lines.length - 1 }">{{ line }}</span></span></h2>
    <p class="contact-banner-copy" data-reveal data-reveal-delay="120">{{ description }}</p>
    <div data-reveal data-reveal-delay="180"><RouterLink class="button button-primary button-lg" :to="to">{{ buttonLabel }} <span aria-hidden="true">↗</span></RouterLink></div>
  </section>
</template>
