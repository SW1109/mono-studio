<script setup>
import { centsToAmount } from "../../../shared/commerce.js";
defineProps({ offer: { type: Object, required: true } });
</script>
<template>
  <aside class="commerce-panel commerce-summary" aria-label="本次服务摘要">
    <p class="eyebrow">YOUR SERVICE</p><h2 class="commerce-title">{{ offer.name }}</h2><p class="commerce-muted">{{ offer.summary }}</p>
    <p class="commerce-total"><span>订单金额</span><strong>¥{{ centsToAmount(offer.priceCents) }}</strong></p>
    <dl class="commerce-specification"><dt>服务范围</dt><dd>{{ offer.scope }}</dd><dt>交付时间</dt><dd>{{ offer.delivery }}</dd><dt>需要准备</dt><dd>{{ offer.preparation }}</dd><dt>不包含</dt><dd>{{ offer.exclusions }}</dd></dl>
    <p class="commerce-help">第三方平台费用不包含在套餐内。付款后由工作室联系确认资料与排期，不代表服务已自动交付。</p>
  </aside>
</template>
