<script setup>
import { RouterLink } from "vue-router";
import { services } from "../content/services.js";
import { process, faqs } from "../content/site.js";
import PageHeading from "../components/site/PageHeading.vue";
import SiteIcon from "../components/site/SiteIcon.vue";
import ContactBanner from "../components/site/ContactBanner.vue";
</script>

<template>
  <PageHeading eyebrow="DEVELOPMENT SERVICES" title="面向业务，构建软件。" current="开发服务" description="从一个具体问题开始，找到适合你的技术方案。我们关注软件如何被使用，也关注它如何被持续维护。" />
  <div class="container service-details"><article v-for="service in services" :id="service.id" :key="service.id" class="service-detail" data-reveal><div><span class="icon-tile"><SiteIcon :name="service.icon" /></span><p class="eyebrow">{{ service.number }} / {{ service.tag }}</p><h2>{{ service.title }}</h2><p class="section-description">{{ service.description }}</p></div><div class="service-scope"><h3>适用场景</h3><p>{{ service.scenarios }}</p><h3>可沟通的交付内容</h3><ul class="check-list"><li v-for="item in service.deliverables" :key="item"><SiteIcon name="check" />{{ item }}</li></ul><RouterLink class="text-link" :to="{ path: '/contact/', query: { service: service.title } }">沟通这类需求 <span aria-hidden="true">↗</span></RouterLink></div></article></div>
  <section id="process" class="section section-soft"><div class="container"><div class="section-heading" data-reveal><div><p class="eyebrow">HOW WE WORK</p><h2>让协作清晰，让进度可见。</h2></div></div><ol class="process-grid"><li v-for="(step, index) in process" :key="step.title" data-reveal :data-reveal-delay="index * 80"><span class="step-number">0{{ index + 1 }}</span><h3>{{ step.title }}</h3><p>{{ step.description }}</p></li></ol><p class="small-note">具体交付范围、源码归属、费用、时间与维护安排，在项目方案中共同确认。</p></div></section>
  <section class="section container faq-section"><div><p class="eyebrow">BEFORE WE START</p><h2>开始之前，<br />你可能想知道。</h2></div><div class="faq-list" data-reveal><details v-for="faq in faqs" :key="faq.question"><summary>{{ faq.question }}<span aria-hidden="true">+</span></summary><p>{{ faq.answer }}</p></details></div></section>
  <ContactBanner />
</template>
<style scoped>
.service-details { padding-bottom: 40px; }.service-detail { padding: 48px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 100px; border-top: 1px solid var(--line); scroll-margin-top: 100px; }.service-detail .icon-tile { margin-bottom: 26px; }.service-detail .eyebrow { margin-bottom: 12px; }.service-detail .section-description { max-width: 410px; margin-top: 18px; }.service-scope { padding: 28px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }.service-scope h3 { font-size: 13px; margin-bottom: 10px; }.service-scope > p { font-size: 13px; color: var(--muted); margin-bottom: 25px; }.service-scope .text-link { margin-top: 24px; }.faq-section { display: grid; grid-template-columns: .8fr 1.2fr; gap: 100px; }
@media (max-width: 760px) { .service-detail, .faq-section { grid-template-columns: 1fr; gap: 28px; }.service-detail { padding: 32px 0; }.service-scope { padding: 24px; } }
</style>