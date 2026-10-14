<script setup>
import { reactive, shallowRef, computed, useTemplateRef, nextTick } from "vue";
import { RouterLink } from "vue-router";
import { purchaseRules, validatePurchase } from "../../../shared/commerce.js";
const props = defineProps({ offer: { type: Object, required: true }, busy: Boolean, enabled: Boolean, serverErrors: { type: Object, default: () => ({}) } });
const emit = defineEmits(["submit"]);
const form = useTemplateRef("purchaseForm");
const fields = reactive({ contactName: "", email: "", requirements: "", acceptedTerms: false });
const localErrors = shallowRef({});
const edited = reactive({});
const errors = computed(() => ({ ...Object.fromEntries(Object.entries(props.serverErrors).filter(([key]) => !edited[key])), ...localErrors.value }));
function payload() { return { ...fields, serviceId: props.offer.id, expectedAmountCents: props.offer.priceCents, termsVersion: purchaseRules.termsVersion }; }
function validateField(field) {
  edited[field] = true;
  const next = { ...localErrors.value };
  delete next[field];
  const error = validatePurchase(payload()).errors[field];
  if (error) next[field] = error;
  localErrors.value = next;
}
function handleInput(field) { edited[field] = true; if (errors.value[field]) validateField(field); }
function submit() {
  if (props.busy || !props.enabled) return;
  const result = validatePurchase(payload());
  localErrors.value = result.errors;
  if (Object.keys(result.errors).length) {
    // 校验反馈渲染后定位第一个错误，避免只显示页面顶部提示。
    nextTick(() => form.value?.querySelector('[aria-invalid="true"]')?.focus());
    return;
  }
  for (const key of Object.keys(edited)) delete edited[key];
  emit("submit", payload());
}
</script>
<template>
  <form ref="purchaseForm" class="purchase-form" novalidate @submit.prevent="submit">
    <h2 class="commerce-title">填写服务联系信息</h2><p class="commerce-muted">仅用于本次订单沟通与交付，请勿提交密码、密钥或未经授权的源码。</p>
    <fieldset class="commerce-fields" :disabled="busy">
      <div class="commerce-field"><label for="contact-name">联系人 <span class="commerce-required">*</span></label><input id="contact-name" v-model="fields.contactName" name="name" autocomplete="name" required :maxlength="purchaseRules.contactNameMax" placeholder="请输入联系人" :aria-invalid="!!errors.contactName" aria-describedby="contact-name-error" @blur="validateField('contactName')" @input="handleInput('contactName')" /><p id="contact-name-error" class="commerce-field-error">{{ errors.contactName }}</p></div>
      <div class="commerce-field"><label for="contact-email">联系邮箱 <span class="commerce-required">*</span></label><input id="contact-email" v-model="fields.email" name="email" type="email" autocomplete="email" required :maxlength="purchaseRules.emailMax" placeholder="请输入联系邮箱" :aria-invalid="!!errors.email" aria-describedby="contact-email-help contact-email-error" @blur="validateField('email')" @input="handleInput('email')" /><p id="contact-email-help" class="commerce-help">请填写能正常收信的邮箱，方便确认资料与交付安排。</p><p id="contact-email-error" class="commerce-field-error">{{ errors.email }}</p></div>
      <div class="commerce-field"><label for="requirements">需求说明 <span class="commerce-required">*</span></label><textarea id="requirements" v-model="fields.requirements" name="requirements" required rows="5" :maxlength="purchaseRules.requirementsMax" placeholder="请简要说明现有项目、遇到的问题与期望结果" :aria-invalid="!!errors.requirements" aria-describedby="requirements-count requirements-error" @blur="validateField('requirements')" @input="handleInput('requirements')" /><p id="requirements-count" class="commerce-help commerce-count">{{ fields.requirements.length }} / {{ purchaseRules.requirementsMax }} 字符</p><p id="requirements-error" class="commerce-field-error">{{ errors.requirements }}</p></div>
      <div class="commerce-consent"><label><input v-model="fields.acceptedTerms" type="checkbox" required :aria-invalid="!!errors.acceptedTerms" aria-describedby="terms-error" @change="validateField('acceptedTerms')" />我已确认本套餐的范围、交付时间与价格，并阅读同意</label> <RouterLink to="/service-terms/" target="_blank" rel="noopener">服务购买条款与隐私说明</RouterLink><p id="terms-error" class="commerce-field-error">{{ errors.acceptedTerms }}</p></div>
    </fieldset>
    <button class="button button-primary commerce-submit" type="submit" :disabled="busy || !enabled">{{ busy ? "正在创建订单…" : "确认订单并前往支付宝" }} <span v-if="!busy" aria-hidden="true">↗</span></button>
    <p class="commerce-help">将在支付宝收银台完成支付；本网站不收集支付宝密码。订单有效期 {{ purchaseRules.orderMinutes }} 分钟。</p>
  </form>
</template>
