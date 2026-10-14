<script setup>
import { RouterLink } from "vue-router";
import SiteIcon from "../site/SiteIcon.vue";
import { centsToAmount } from "../../../shared/commerce.js";
defineProps({ offer: { type: Object, required: true }, checkoutUrl: { type: String, default: "" } });
</script>
<template>
  <article :id="offer.id" class="offer-card" data-reveal>
    <div class="offer-heading"><span class="icon-tile"><SiteIcon :name="offer.icon" /></span><span class="tag">{{ offer.category }}</span></div>
    <h2>{{ offer.name }}</h2><p class="offer-summary">{{ offer.summary }}</p>
    <p v-if="checkoutUrl" class="offer-external-price">价格及可购买状态以订单中心为准</p>
    <p v-else class="offer-price"><span>¥</span>{{ centsToAmount(offer.priceCents) }}<small> / 项</small></p>
    <p class="offer-scope">{{ offer.scope }}</p>
    <ul class="check-list"><li v-for="item in offer.deliverables" :key="item"><SiteIcon name="check" />{{ item }}</li></ul>
    <div class="offer-detail"><h3>交付时间</h3><p>{{ offer.delivery }}</p><h3>不包含</h3><p>{{ offer.exclusions }}</p></div>
    <a v-if="checkoutUrl" class="button button-primary" :href="checkoutUrl" rel="noreferrer">前往订单中心确认 <span aria-hidden="true">↗</span></a>
    <RouterLink v-else class="button button-primary" :to="{ path: '/checkout/', query: { service: offer.id } }">查看并确认服务 <span aria-hidden="true">↗</span></RouterLink>
  </article>
</template>
<style scoped>
.offer-external-price { margin-block: 24px 16px; font-size: 14px; color: var(--muted); }
.offer-card { display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: var(--radius-card); padding: 32px; background: var(--canvas); scroll-margin-top: 104px; }
.offer-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 32px; }
.offer-card h2 { font-size: 25px; }
.offer-summary { margin-top: 16px; color: var(--muted); font-size: 15px; line-height: 1.8; min-height: 81px; }
.offer-price { font-size: 44px; font-weight: 600; letter-spacing: -.04em; margin-block: 28px 20px; line-height: 1.2; font-variant-numeric: tabular-nums; }
.offer-price > span { font-size: 22px; margin-right: 6px; }
.offer-price > small { font-size: 13px; color: var(--muted); font-weight: 400; letter-spacing: 0; }
.offer-scope { font-size: 14px; line-height: 1.8; background: var(--surface); padding: 16px; border-radius: var(--radius-sm); min-height: 84px; }
.offer-card .check-list { margin-block: 28px; }
.offer-detail { padding-top: 24px; border-top: 1px solid var(--line); flex: 1; }
.offer-detail h3 { font-size: 14px; margin-bottom: 10px; }
.offer-detail p { font-size: 14px; color: var(--muted); line-height: 1.8; margin-bottom: 20px; }
.offer-card .button { margin-top: 16px; width: 100%; font-size: 14px; }
@media (max-width: 1040px) { .offer-card { padding: 28px; }.offer-card h2 { font-size: 23px; } }
@media (max-width: 760px) { .offer-card { padding: 28px; }.offer-summary, .offer-scope { min-height: 0; } }
</style>
