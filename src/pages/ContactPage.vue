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
const checklist = ["你希望解决什么问题，现有流程是怎样的？", "谁会使用这个软件，在哪些设备或场景下使用？", "最需要的核心功能，以及已有系统或参考资料。", "期望的交付时间与预算范围（如果已有计划）。"];
</script>
<template><PageHeading eyebrow="GET IN TOUCH" title="聊聊你的下一个想法。" current="联系合作" description="软件产品、定制开发或技术合作，都可以从一封邮件、一次交流开始。" /><section class="container contact-layout"><div><p class="consultation-label">{{ subject }}</p><div class="contact-card" data-reveal><span class="contact-type">01 / EMAIL</span><h2>写一封邮件</h2><p>适合描述完整需求、发送资料与交流合作方案。</p><a class="contact-value" :href="mailHref">{{ site.email }}</a><div class="button-row"><a class="button button-primary" :href="mailHref">打开邮件客户端 <span aria-hidden="true">↗</span></a><button class="button button-secondary" type="button" @click="copy(site.email, '邮箱')">{{ copied === '邮箱' ? '邮箱已复制' : '复制邮箱' }}</button></div></div><div class="contact-card" data-reveal><span class="contact-type">02 / WECHAT</span><h2>微信沟通</h2><p>添加时请备注产品名称或项目方向，便于了解你的需求。</p><p class="contact-value">{{ site.wechat }}</p><button class="button button-secondary" type="button" @click="copy(site.wechat, '微信号')">{{ copied === '微信号' ? '微信号已复制' : '复制微信号' }}</button></div><p class="copy-status" role="status" aria-live="polite">{{ message }}</p></div><aside class="contact-checklist" data-reveal data-reveal-delay="160"><p class="eyebrow">A GOOD START</p><h2>不必准备完美，<br />有这些信息就很好。</h2><ol><li v-for="(item, index) in checklist" :key="item"><span>0{{ index + 1 }}</span><p>{{ item }}</p></li></ol><p class="small-note">还没有清晰方案也没关系。先说说问题，我们一起梳理下一步。</p></aside></section><section class="section container faq-section"><div><p class="eyebrow">QUESTIONS & ANSWERS</p><h2>关于沟通与合作。</h2></div><div class="faq-list" data-reveal><details v-for="faq in faqs.slice(0, 3)" :key="faq.question"><summary>{{ faq.question }}<span aria-hidden="true">+</span></summary><p>{{ faq.answer }}</p></details></div></section></template>
<style scoped>
.contact-layout { display: grid; grid-template-columns: 1.1fr .9fr; gap: 48px; }.consultation-label { font-size: 12px; color: var(--accent); padding-bottom: 16px; }.contact-card { border: 1px solid var(--line); padding: 30px; border-radius: 12px; margin-bottom: 18px; background: white; }.contact-type { font: 10px/1.5 ui-monospace, monospace; letter-spacing: .1em; color: var(--muted); }.contact-card h2 { font-size: 23px; margin: 16px 0 12px; }.contact-card > p:not(.contact-value) { color: var(--muted); font-size: 13px; }.contact-value { display: block; font-size: clamp(17px, 2vw, 23px); font-weight: 500; margin: 25px 0; overflow-wrap: anywhere; user-select: text; }.copy-status { min-height: 28px; font-size: 12px; color: var(--muted); overflow-wrap: anywhere; }.contact-checklist { margin-top: 34px; padding: 36px; align-self: start; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; }.contact-checklist h2 { font-size: 25px; }.contact-checklist ol { margin: 28px 0; }.contact-checklist li { display: flex; align-items: start; gap: 16px; padding-block: 18px; border-bottom: 1px solid var(--line); }.contact-checklist li span { font: 11px/2 ui-monospace, monospace; color: var(--accent); }.contact-checklist li p { color: var(--muted); font-size: 13px; line-height: 1.85; }.faq-section { display: grid; grid-template-columns: .8fr 1.2fr; gap: 80px; }
@media (max-width: 760px) { .contact-layout, .faq-section { grid-template-columns: 1fr; gap: 24px; }.contact-card, .contact-checklist { padding: 24px; }.contact-checklist { margin-top: 0; }.contact-card .button { font-size: 11px; padding-inline: 14px; } }
</style>