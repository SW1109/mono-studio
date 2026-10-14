<script setup>
import { RouterLink } from "vue-router";
import PageHeading from "../components/site/PageHeading.vue";
import ServiceOfferCard from "../components/commerce/ServiceOfferCard.vue";
import { useCommerceCatalog } from "../composables/useCommerce.js";
import { orderCenter } from "../config/orderCenter.js";
import "../styles/commerce.css";
const { catalog, loading, error, reload } = useCommerceCatalog();
</script>
<template>
  <PageHeading eyebrow="SERVICE STORE" title="专项技术服务" current="服务商城" description="提供软件问题诊断、前端单页面优化与单接口对接服务。购买前请核对适用范围、交付内容与服务条款；较大范围的项目单独评估。" />
  <section class="container commerce-shop">
    <div class="commerce-shop-toolbar"><div><span class="tag">远程软件技术服务</span><span class="commerce-muted">一次购买 · 明确范围 · 人工交付</span></div><RouterLink class="text-link" to="/orders/">查询我的订单 <span aria-hidden="true">↗</span></RouterLink></div>
    <div v-if="orderCenter" class="commerce-notice">下单、付款与订单查询在独立订单中心完成。电脑和手机登录同一账号查看订单；最终价格、交付范围和条款以订单中心确认为准。</div>
    <div v-else-if="loading" class="commerce-notice" role="status">正在确认在线收款状态…</div>
    <div v-else-if="error" class="commerce-notice" role="alert">{{ error }} <button class="text-link" type="button" @click="reload">重新检查</button></div>
    <div v-else-if="!catalog.paymentsEnabled" class="commerce-notice">套餐与价格待经营者确认，在线收款暂未开放。可先了解服务范围，或<RouterLink to="/contact/">联系工作室</RouterLink>确认需求。</div>
    <div v-else-if="catalog.environment === 'sandbox'" class="commerce-notice" role="status">当前为支付宝沙箱联调，仅使用沙箱账号测试，不进行正式收款。</div>
    <div class="commerce-offer-grid"><ServiceOfferCard v-for="offer in catalog.offers" :key="offer.id" :offer="offer" :checkout-url="orderCenter?.products[offer.id] || ''" /></div>
    <div class="commerce-store-note"><div><h2 class="commerce-title">定制开发与维护需求</h2><p class="commerce-muted">整站开发、支付系统搭建或长期维护不包含在标准套餐内。若资料或授权条件不满足，会先与你确认是否调整或取消订单。</p></div><RouterLink class="button button-secondary" to="/contact/">沟通定制需求 <span aria-hidden="true">↗</span></RouterLink></div>
    <p v-if="orderCenter" class="commerce-help">正式价格、经营主体、服务交付及取消退款约定，请在订单中心购买页核对；官网展示内容不替代下单时的约定。</p>
    <p v-else class="commerce-help">服务条款、取消与退款沟通方式、联系方式及信息使用说明，请查看<RouterLink to="/service-terms/">服务购买条款与隐私说明</RouterLink>。{{ catalog.merchantName ? `经营主体：${catalog.merchantName}` : "正式经营主体以开通收款后的公示信息为准。" }}</p>
  </section>
</template>
