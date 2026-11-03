<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { orderCenter } from "../../config/orderCenter.js";

const props = defineProps({ to: { type: String, required: true } });
// 商城页面由原生服务端处理，普通站内页面继续使用 Vue 路由。
const commerceUrl = computed(() => {
  if (!orderCenter) return "";
  if (props.to === "/shop/") return orderCenter.shopUrl;
  if (props.to === "/orders/") return orderCenter.ordersUrl;
  return "";
});
</script>
<template>
  <a v-if="commerceUrl" :href="commerceUrl"><slot /></a>
  <RouterLink v-else :to="to"><slot /></RouterLink>
</template>
