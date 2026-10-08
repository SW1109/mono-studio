<script setup>
import { RouterLink } from "vue-router";
import { site } from "../../content/site.js";
import logo from "../../assets/brand-logo.jpg";
import recordIcon from "../../assets/gongan-beian.png";
</script>

<template>
  <footer class="site-footer">
    <div class="container footer-main">
      <div class="footer-brand"><RouterLink to="/" :aria-label="`${site.name}首页`"><img :src="logo" width="220" height="92" loading="lazy" :alt="site.name" /></RouterLink><p>让技术服务想法，让软件服务日常。</p></div>
      <div><h2>探索光年</h2><nav aria-label="页脚导航"><RouterLink v-for="item in site.navigation.slice(1)" :key="item.to" :to="item.to">{{ item.label }}</RouterLink></nav></div>
      <div class="footer-contact"><h2>开启对话</h2><a :href="`mailto:${site.email}`">{{ site.email }}</a><p>微信 · {{ site.wechat }}</p><RouterLink class="text-link" to="/contact/">沟通你的需求 <span aria-hidden="true">↗</span></RouterLink></div>
    </div>
    <div class="container footer-bottom"><p>© {{ new Date().getFullYear() }} {{ site.name }}</p><div class="footer-records"><a v-for="record in site.records" :key="record.href" :href="record.href" target="_blank" rel="noopener noreferrer"><img v-if="record.police" :src="recordIcon" width="14" height="14" alt="" loading="lazy" />{{ record.label }}</a></div></div>
  </footer>
</template>