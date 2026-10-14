<script setup>
import { shallowRef, computed, watch, onScopeDispose } from "vue";
import { RouterLink, useRoute } from "vue-router";
import PageHeading from "../components/site/PageHeading.vue";
import { paymentStatuses, centsToAmount } from "../../shared/commerce.js";
import { commerceRequest, submitAlipayCheckout } from "../api/commerce.js";
import { orderCenter } from "../config/orderCenter.js";
import "../styles/commerce.css";
const route = useRoute();
const order = shallowRef(null), orders = shallowRef([]), busy = shallowRef(false), error = shallowRef("");
const orderId = computed(() => typeof route.query.order === "string" ? route.query.order : "");
let controller, generation = 0;
function date(value) { return new Date(value).toLocaleString("zh-CN", { hour12: false }); }
async function load(refresh = false) {
  if (orderCenter) { busy.value = false; return; }
  controller?.abort(); controller = new AbortController(); const current = controller;
  busy.value = true; error.value = "";
  try {
    if (orderId.value) {
      const result = await commerceRequest(`/orders/${encodeURIComponent(orderId.value)}${refresh ? '/refresh' : ''}`, { ...(refresh ? { method: "POST", body: {} } : {}), signal: current.signal });
      if (!current.signal.aborted) order.value = result.order;
    } else {
      const result = await commerceRequest("/orders", { signal: current.signal });
      if (!current.signal.aborted) orders.value = result.orders;
    }
  } catch (failure) { if (!current.signal.aborted) error.value = failure.message; }
  finally { if (!current.signal.aborted) busy.value = false; }
}
async function continuePayment() {
  if (busy.value || !order.value) return;
  await load(true);
  if (error.value || order.value.status !== "PENDING" || order.value.expired) return;
  busy.value = true; error.value = "";
  const current = controller;
  try {
    const { checkout } = await commerceRequest(`/orders/${order.value.id}/payment`, { method: "POST", body: { provider: "alipay" }, signal: current.signal });
    if (!current.signal.aborted) submitAlipayCheckout(checkout);
  } catch (failure) { if (!current.signal.aborted) error.value = failure.message; }
  finally { if (!current.signal.aborted) busy.value = false; }
}
watch(orderId, async () => {
  const currentGeneration = ++generation;
  if (import.meta.env.SSR) return;
  order.value = null; orders.value = [];
  await load();
  if (currentGeneration === generation && order.value?.status === "PENDING" && !error.value) await load(true);
}, { immediate: true });
onScopeDispose(() => controller?.abort());
</script>
<template>
  <PageHeading eyebrow="YOUR ORDERS" title="服务订单查询" current="订单查询" :description="orderCenter ? '进入独立订单中心，登录下单账号，在电脑和手机上查询同一批订单。' : '付款结果以支付宝验签通知或服务端查询为准。请使用下单时的同一浏览器查询；支付成功后由工作室人工安排服务。'" />
  <section v-if="orderCenter" class="container commerce-order-page">
    <article class="commerce-panel">
      <h2 class="commerce-title">使用同一账号，跨设备查看订单</h2>
      <p class="commerce-help">在电脑、手机或其他浏览器进入订单中心，登录下单时使用的同一账号，查询该账号的订单和付款状态。</p>
      <p class="commerce-help">请保管好账号，不要向他人提供密码。旧版官网的浏览器订单不会自动归入新账号；如有旧订单，请联系工作室核实。</p>
      <div class="commerce-actions"><a class="button button-primary" :href="orderCenter.ordersUrl" rel="noreferrer">登录订单中心查询 <span aria-hidden="true">↗</span></a><RouterLink class="text-link" to="/shop/">返回服务商城</RouterLink></div>
    </article>
  </section>
  <section v-else class="container commerce-order-page" :aria-busy="busy">
    <p v-if="error" class="commerce-error" role="alert">{{ error }}</p><p v-if="busy" class="commerce-notice" role="status">正在查询订单，请稍候…</p>
    <article v-if="order" class="commerce-panel">
      <div class="commerce-order-heading"><div><p class="eyebrow">{{ order.id }}</p><h2 class="commerce-title">{{ order.serviceName }}</h2></div><span class="commerce-status" :class="{ paid: order.status === 'PAID' }">{{ order.expired ? '待支付 · 已超时' : paymentStatuses[order.status] }}</span></div>
      <p class="commerce-total"><span>订单金额</span><strong>¥{{ centsToAmount(order.amountCents) }}</strong></p>
      <dl class="commerce-specification"><dt>创建时间</dt><dd>{{ date(order.createdAt) }}</dd><dt v-if="order.serviceSnapshot?.scope">服务范围</dt><dd v-if="order.serviceSnapshot?.scope">{{ order.serviceSnapshot.scope }}</dd><dt v-if="order.serviceSnapshot?.delivery">交付约定</dt><dd v-if="order.serviceSnapshot?.delivery">{{ order.serviceSnapshot.delivery }}</dd><dt>联系信息</dt><dd>{{ order.contactName }} · {{ order.email }}</dd><dt>需求说明</dt><dd class="commerce-requirements">{{ order.requirements }}</dd></dl>
      <p v-if="order.status === 'PAID'" class="commerce-notice">付款已确认，无需再次支付。请保留订单号；后续资料确认、排期、交付以及取消或退款结果，以工作室与你的订单沟通为准。</p>
      <p v-else-if="order.expired" class="commerce-notice">订单本地支付有效期已结束。如你已经付款，请刷新确认结果；未付款可重新选择服务。</p>
      <p v-else-if="order.status === 'PENDING'" class="commerce-help">若已完成支付但仍显示待支付，请刷新查询，不要重复付款。</p>
      <div class="commerce-actions"><button class="button button-secondary" type="button" :disabled="busy" @click="load(true)">刷新支付结果</button><button v-if="order.status === 'PENDING' && !order.expired" class="button button-primary" type="button" :disabled="busy" @click="continuePayment">继续支付宝支付 <span aria-hidden="true">↗</span></button><RouterLink class="text-link" :to="{ path: '/contact/', query: { service: `订单 ${order.id}` } }">联系工作室</RouterLink></div>
    </article>
    <template v-else-if="!orderId && !busy && !error"><div v-if="orders.length" class="commerce-order-list"><RouterLink v-for="item in orders" :key="item.id" class="commerce-panel commerce-order-row" :to="{ path: '/orders/', query: { order: item.id } }"><div><h2 class="commerce-title">{{ item.serviceName }}</h2><p class="commerce-help">{{ item.id }} · {{ date(item.createdAt) }}</p></div><div><strong>¥{{ centsToAmount(item.amountCents) }}</strong><p class="commerce-help">{{ item.expired ? '待支付 · 已超时' : paymentStatuses[item.status] }} ↗</p></div></RouterLink></div><p v-else class="commerce-notice">当前浏览器还没有订单。可以先<RouterLink to="/shop/">查看服务商品</RouterLink>。</p></template>
    <div class="commerce-actions"><RouterLink class="text-link" to="/shop/">返回服务商城</RouterLink><RouterLink v-if="orderId" class="text-link" to="/orders/">查看最近订单</RouterLink><button v-if="error" class="text-link" type="button" @click="load(!!orderId)">重试查询</button></div>
  </section>
</template>
