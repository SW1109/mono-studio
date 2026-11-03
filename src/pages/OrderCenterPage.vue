<script setup>
import { computed, onMounted } from "vue";
import { RouterLink, useRoute } from "vue-router";
import PageHeading from "../components/site/PageHeading.vue";
import SiteNavLink from "../components/site/SiteNavLink.vue";
import { orderCenter } from "../config/orderCenter.js";
import "../styles/commerce.css";

const props = defineProps({ mode: { type: String, default: "checkout" } });
const route = useRoute();
const isOrders = computed(() => props.mode === "orders");
const title = computed(() => isOrders.value ? "我的订单" : "商品购买");
const destination = computed(() => {
  if (!orderCenter) return "";
  if (isOrders.value) return orderCenter.ordersUrl;
  const service = route.query.service;
  return typeof service === "string" && Object.hasOwn(orderCenter.products, service) ? orderCenter.products[service] : orderCenter.shopUrl;
});
// 兼容旧书签和开发预览；线上 /shop/ 直接由商城处理，正常导航无需经过此页。
onMounted(() => { if (destination.value) window.location.replace(destination.value); });
</script>
<template>
  <PageHeading eyebrow="PRODUCTS & ORDERS" :title="title" :current="title" description="选购服务、确认购买和查看订单，在同一网站完成。电脑和手机使用同一账号。" />
  <section class="container commerce-order-page">
    <div class="commerce-panel">
      <template v-if="orderCenter">
        <h2 class="commerce-title">{{ isOrders ? '正在打开我的订单' : '正在打开商品购买' }}</h2>
        <p class="commerce-muted" role="status">请稍候。如未自动打开，可使用下方入口继续。</p>
        <div class="commerce-actions"><a class="button button-primary" :href="destination">{{ isOrders ? '查看我的订单' : '浏览商品' }}</a><SiteNavLink class="text-link" :to="isOrders ? '/shop/' : '/orders/'">{{ isOrders ? '商品购买' : '我的订单' }}</SiteNavLink></div>
        <p class="commerce-help">订单归属下单账号，换设备后登录同一账号即可查询。本页面不创建另一笔订单。</p>
      </template>
      <template v-else>
        <h2 class="commerce-title">商城暂未开放</h2>
        <p class="commerce-muted" role="status">商品购买与账号订单正在准备中，请先联系工作室确认需求。</p>
        <div class="commerce-actions"><RouterLink class="button button-primary" to="/contact/">联系工作室</RouterLink></div>
      </template>
    </div>
  </section>
</template>
