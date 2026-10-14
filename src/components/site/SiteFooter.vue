<script setup>
import { RouterLink } from "vue-router";
import { site } from "../../content/site.js";
import mark from "../../assets/brand-mark.png";
import recordIcon from "../../assets/gongan-beian.png";
</script>

<template>
  <footer class="site-footer">
    <div class="container footer-main">
      <div class="footer-brand">
        <RouterLink class="brand" to="/" :aria-label="`${site.name}首页`"><img :src="mark" width="44" height="37" loading="lazy" alt="" /><span><strong>光年数智</strong><small>GUANGNIAN · DIGITAL</small></span></RouterLink>
        <p>软件设计与研发<br />网站 · 业务系统 · 自动化</p>
        <p class="footer-wordmark">SOFTWARE DESIGN &amp; ENGINEERING.</p>
      </div>
      <div><h2>网站导航</h2><nav aria-label="页脚导航"><RouterLink v-for="item in site.navigation.slice(1)" :key="item.to" :to="item.to">{{ item.label }}</RouterLink></nav></div>
      <div class="footer-contact">
        <h2>联系合作</h2>
        <a :href="`mailto:${site.email}`">{{ site.email }}</a>
        <p>微信 · {{ site.wechat }}</p>
        <nav aria-label="服务与订单">
          <RouterLink to="/service-terms/">服务条款与隐私说明</RouterLink>
          <RouterLink to="/orders/">订单查询</RouterLink>
        </nav>
        <RouterLink class="text-link" to="/contact/">项目咨询 <span aria-hidden="true">↗</span></RouterLink>
      </div>
    </div>
    <div class="container footer-bottom"><p>© {{ new Date().getFullYear() }} {{ site.name }}</p><div class="footer-records"><a v-for="record in site.records" :key="record.href" :href="record.href" target="_blank" rel="noopener noreferrer"><img v-if="record.police" :src="recordIcon" width="14" height="14" alt="" loading="lazy" />{{ record.label }}</a></div></div>
  </footer>
</template>