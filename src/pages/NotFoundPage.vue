<script setup>
import { RouterLink } from "vue-router";
import PageHeading from "../components/site/PageHeading.vue";
</script>
<template><PageHeading eyebrow="404 / NOT FOUND" title="这条路径，暂时没有抵达。" current="页面未找到" description="页面可能已移动，或者地址有误。你可以回到首页，继续探索我们的产品与服务。"><div class="button-row"><RouterLink class="button button-primary" to="/">回到首页 <span aria-hidden="true">↗</span></RouterLink><RouterLink class="button button-secondary" to="/products/">浏览产品</RouterLink></div></PageHeading></template>
<style scoped>.button-row { margin: 32px 0 70px; }</style>