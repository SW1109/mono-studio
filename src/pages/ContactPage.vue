<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { site, faqs } from "../content/site.js";
import { products, productInquirySubject } from "../content/products.js";
import { services } from "../content/services.js";
import PageHeading from "../components/site/PageHeading.vue";
import { useClipboard } from "../composables/useClipboard.js";
const route = useRoute();
const { copied, message, copy } = useClipboard();
// 查询参数只选择本站已知内容，不将任意输入拼入咨询标题。
const subject = computed(() => {
  const product = products.find(item => item.name === route.query.product);
  const service = services.find(item => item.title === route.query.service);
  return product ? productInquirySubject(product) : service ? `项目咨询：${service.title}` : "项目与产品咨询";
});
const mailHref = computed(() => `mailto:${site.email}?subject=${encodeURIComponent(subject.value)}`);
const checklist = ["项目背景、现有流程与需要解决的问题。", "使用人员、目标设备与主要使用场景。", "核心功能、现有系统与可提供的参考资料。", "预期时间与预算范围（如已有计划）。"];
</script>
<template><PageHeading eyebrow="GET IN TOUCH" title="项目咨询与技术合作" current="联系合作" description="产品咨询、软件定制与系统迭代需求，可通过以下方式联系。建议附上项目背景、功能范围与预期时间。" /><section class="container contact-layout"><div><p class="consultation-label">{{ subject }}</p><div class="contact-card" data-reveal><span class="contact-type">01 / EMAIL</span><h2>邮件联系</h2><p>适合描述完整需求、发送资料与交流合作方案。</p><a class="contact-value" :href="mailHref">{{ site.email }}</a><div class="button-row"><a class="button button-primary" :href="mailHref">打开邮件客户端 <span aria-hidden="true">↗</span></a><button class="button button-secondary" type="button" @click="copy(site.email, '邮箱')">{{ copied === '邮箱' ? '邮箱已复制' : '复制邮箱' }}</button></div></div><div class="contact-card" data-reveal><span class="contact-type">02 / WECHAT</span><h2>微信沟通</h2><p>添加时请备注产品名称或项目方向，便于了解你的需求。</p><p class="contact-value">{{ site.wechat }}</p><button class="button button-secondary" type="button" @click="copy(site.wechat, '微信号')">{{ copied === '微信号' ? '微信号已复制' : '复制微信号' }}</button></div><p class="copy-status" role="status" aria-live="polite">{{ message }}</p></div><aside class="contact-checklist" data-reveal data-reveal-delay="160"><p class="eyebrow">A GOOD START</p><h2>项目咨询<br />建议提供的信息</h2><ol><li v-for="(item, index) in checklist" :key="item"><span>0{{ index + 1 }}</span><p>{{ item }}</p></li></ol><p class="small-note">尚未形成完整方案时，可先说明现有问题与业务目标，再评估可行的实施范围。</p></aside></section><section class="section container faq-section"><div><p class="eyebrow">QUESTIONS & ANSWERS</p><h2>合作咨询常见问题</h2></div><div class="faq-list" data-reveal><details v-for="faq in faqs.slice(0, 3)" :key="faq.question"><summary>{{ faq.question }}<span aria-hidden="true">+</span></summary><p>{{ faq.answer }}</p></details></div></section></template>
<style scoped>
.contact-layout { display: grid; grid-template-columns: 1.1fr .9fr; gap: 48px; }
.consultation-label { font-size: 14px; color: var(--accent); padding-bottom: 20px; }
.contact-card { padding: 36px; border-radius: var(--radius-card); margin-bottom: 24px; background: var(--surface); }
.contact-type { font: 11px/1.5 var(--font-mono); letter-spacing: .1em; color: var(--muted); }
.contact-card h2 { font-size: 28px; margin: 20px 0 16px; }
.contact-card > p:not(.contact-value) { color: var(--muted); font-size: 16px; }
.contact-value { display: block; font-size: clamp(20px, 2vw, 28px); font-weight: 600; margin: 28px 0; overflow-wrap: anywhere; user-select: text; letter-spacing: -.02em; }
.contact-value:hover { color: var(--accent); }
.copy-status { min-height: 32px; font-size: 14px; color: var(--muted); overflow-wrap: anywhere; }
.contact-checklist { margin-top: 43px; padding: 36px; align-self: start; border: 1px solid var(--line); border-radius: var(--radius-card); }
.contact-checklist h2 { font-size: 28px; }
.contact-checklist ol { margin: 28px 0; }
.contact-checklist li { display: flex; align-items: start; gap: 20px; padding-block: 20px; border-bottom: 1px solid var(--line); }
.contact-checklist li > span { font: 12px/2 var(--font-mono); color: var(--accent); }
.contact-checklist li > p { color: var(--muted); font-size: 15px; line-height: 1.8; }
.faq-section { display: grid; grid-template-columns: .8fr 1.2fr; gap: 88px; }
@media (max-width: 1040px) { .contact-layout { gap: 32px; }.contact-card, .contact-checklist { padding: 28px; } }
@media (max-width: 760px) {
  .contact-layout, .faq-section { grid-template-columns: 1fr; gap: 24px; }
  .contact-checklist { margin-top: 0; }
  .contact-card h2, .contact-checklist h2 { font-size: 26px; }
  .contact-card .button { font-size: 14px; padding-inline: 18px; }
}
</style>
