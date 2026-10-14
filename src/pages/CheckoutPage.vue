<script setup>
import { computed, shallowRef, onScopeDispose } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import PageHeading from "../components/site/PageHeading.vue";
import PurchaseForm from "../components/commerce/PurchaseForm.vue";
import OrderSummary from "../components/commerce/OrderSummary.vue";
import { centsToAmount } from "../../shared/commerce.js";
import { useCommerceCatalog } from "../composables/useCommerce.js";
import { commerceRequest, submitAlipayCheckout } from "../api/commerce.js";
import { orderCenter } from "../config/orderCenter.js";
import "../styles/commerce.css";
const route = useRoute();
const router = useRouter();
const { catalog, loading, error: catalogError } = useCommerceCatalog();
const offer = computed(() => catalog.value.offers.find(item => item.id === route.query.service) || (!route.query.service ? catalog.value.offers[0] : null));
const busy = shallowRef(false), error = shallowRef(""), serverErrors = shallowRef({}), savedOrder = shallowRef(null);
let key, fingerprint, controller;
function selectService(id) { if (!busy.value) router.replace({ path: "/checkout/", query: { service: id } }); }
async function purchase(payload) {
  if (orderCenter || busy.value || !catalog.value.paymentsEnabled) return;
  busy.value = true; error.value = ""; serverErrors.value = {};
  controller = new AbortController();
  const current = controller;
  try {
    const nextFingerprint = JSON.stringify(payload);
    if (nextFingerprint !== fingerprint) {
      // 兼容已有 Web Crypto、但尚未提供 randomUUID 的浏览器；不使用可预测随机数。
      key = crypto.randomUUID?.() || Array.from(crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, "0")).join("");
      fingerprint = nextFingerprint; savedOrder.value = null;
    }
    if (!savedOrder.value) {
      const result = await commerceRequest("/orders", { method: "POST", body: payload, idempotencyKey: key, signal: current.signal });
      savedOrder.value = result.order;
    }
    const { checkout } = await commerceRequest(`/orders/${savedOrder.value.id}/payment`, { method: "POST", body: { provider: "alipay" }, signal: current.signal });
    if (!current.signal.aborted) submitAlipayCheckout(checkout);
  } catch (failure) { if (!current.signal.aborted) { error.value = failure.fields?.serviceId || failure.message; serverErrors.value = failure.fields || {}; } }
  finally { if (!current.signal.aborted) busy.value = false; }
}
onScopeDispose(() => controller?.abort());
</script>
<template>
  <PageHeading eyebrow="CHECKOUT" title="确认服务订单" current="确认订单" :description="orderCenter ? '请进入订单中心核对价格、服务范围与条款，登录账号后确认购买。' : '请核对套餐范围与价格，并填写可联系的邮箱。你将在支付宝自己的收银台完成支付。'" />
  <section v-if="orderCenter" class="container commerce-checkout">
    <div class="commerce-panel">
      <h2 class="commerce-title">请在订单中心确认并购买服务</h2>
      <p class="commerce-help">本页面不创建另一笔订单。请在订单中心核对实时价格、服务范围与条款，登录后下单；付款渠道以订单中心实际开通情况为准。</p>
      <div class="commerce-actions"><a v-if="offer" class="button button-primary" :href="orderCenter.products[offer.id]" rel="noreferrer">查看 {{ offer.name }} <span aria-hidden="true">↗</span></a><RouterLink class="text-link" to="/shop/">返回服务商城</RouterLink></div>
      <p v-if="!offer" class="commerce-error">该服务不存在，请返回服务商城重新选择。</p>
    </div>
  </section>
  <section v-else class="container commerce-checkout">
    <p v-if="loading" class="commerce-notice" role="status">正在确认服务与支付状态…</p>
    <p v-else-if="catalogError" class="commerce-notice" role="alert">{{ catalogError }}</p>
    <p v-else-if="!catalog.paymentsEnabled" class="commerce-notice">在线收款尚未开放，以下套餐与价格待经营者确认。请先<RouterLink to="/contact/">联系工作室</RouterLink>。</p>
    <p v-else-if="catalog.environment === 'sandbox'" class="commerce-notice">沙箱测试：请使用支付宝沙箱账号，不能用于真实交易。</p>
    <template v-if="offer">
      <fieldset class="commerce-selector" :disabled="busy"><legend>选择服务</legend><label v-for="item in catalog.offers" :key="item.id" :class="{ selected: item.id === offer.id }"><input type="radio" name="service" :checked="item.id === offer.id" :value="item.id" @change="selectService(item.id)" /><span>{{ item.name }}</span><strong>¥{{ centsToAmount(item.priceCents) }}</strong></label></fieldset>
      <p v-if="error" class="commerce-error" role="alert">{{ error }}</p>
      <p v-if="savedOrder && error" class="commerce-help">订单已创建，不必重复下单。<RouterLink :to="{ path: '/orders/', query: { order: savedOrder.id } }">查看订单 {{ savedOrder.id }}</RouterLink></p>
      <div class="commerce-checkout-grid"><div class="commerce-panel"><PurchaseForm :offer="offer" :busy="busy" :enabled="!loading && !catalogError && catalog.paymentsEnabled" :server-errors="serverErrors" @submit="purchase" /></div><OrderSummary :offer="offer" /></div>
      <p v-if="catalog.merchantName" class="commerce-help">经营主体：{{ catalog.merchantName }}。支付渠道：支付宝{{ catalog.environment === 'sandbox' ? '（沙箱）' : '' }}。</p>
    </template>
    <p v-else class="commerce-error" role="alert">该服务不存在，请<RouterLink to="/shop/">返回服务商城</RouterLink>重新选择。</p>
  </section>
</template>
