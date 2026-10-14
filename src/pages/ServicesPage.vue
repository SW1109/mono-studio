<script setup>
import { RouterLink } from "vue-router";
import { services } from "../content/services.js";
import { process, faqs } from "../content/site.js";
import PageHeading from "../components/site/PageHeading.vue";
import SiteIcon from "../components/site/SiteIcon.vue";
import ContactBanner from "../components/site/ContactBanner.vue";
</script>

<template>
  <PageHeading eyebrow="DEVELOPMENT SERVICES" title="软件开发与系统集成" current="开发服务" description="提供网站、管理系统、小程序、桌面软件及自动化开发服务，按项目范围明确技术方案、开发安排与交付内容。" />
  <nav class="container service-nav" aria-label="开发服务方向"><a v-for="service in services" :key="service.id" :href="`#${service.id}`">{{ service.title }} <span aria-hidden="true">↓</span></a></nav>
  <div class="container service-details">
    <article v-for="(service, index) in services" :id="service.id" :key="service.id" class="service-detail" data-reveal :data-reveal-delay="index % 2 * 80">
      <div class="service-detail-heading"><span class="step-number">{{ service.number }}</span><span class="icon-tile"><SiteIcon :name="service.icon" /></span></div>
      <p class="eyebrow">{{ service.tag }}</p><h2>{{ service.title }}</h2><p class="section-description">{{ service.description }}</p>
      <div class="service-scope"><h3>适用场景</h3><p>{{ service.scenarios }}</p><h3>可约定的交付内容</h3><ul class="check-list"><li v-for="item in service.deliverables" :key="item"><SiteIcon name="check" />{{ item }}</li></ul></div>
      <RouterLink class="text-link" :to="{ path: '/contact/', query: { service: service.title } }">咨询开发需求 <span aria-hidden="true">↗</span></RouterLink>
    </article>
  </div>
  <section id="process" class="section section-soft"><div class="container"><div class="section-heading" data-reveal><div><p class="eyebrow">HOW WE WORK</p><h2>项目协作与交付流程</h2></div></div><ol class="process-grid"><li v-for="(step, index) in process" :key="step.title" data-reveal :data-reveal-delay="index * 60"><span class="step-number">0{{ index + 1 }}</span><h3>{{ step.title }}</h3><p>{{ step.description }}</p></li></ol><p class="small-note">具体交付范围、源码归属、费用、时间与维护安排，在项目方案中共同确认。</p></div></section>
  <section class="section container faq-section"><div><p class="eyebrow">BEFORE WE START</p><h2>项目合作<br />常见问题</h2></div><div class="faq-list" data-reveal><details v-for="faq in faqs" :key="faq.question"><summary>{{ faq.question }}<span aria-hidden="true">+</span></summary><p>{{ faq.answer }}</p></details></div></section>
  <section class="section section-soft"><div class="container fixed-service-section"><div><p class="eyebrow">FIXED-SCOPE SERVICES</p><h2>专项技术服务</h2><p class="section-description">提供软件诊断、单页面优化与单接口对接服务。购买前请核对服务范围、价格与交付约定。</p></div><RouterLink class="button button-primary" to="/shop/">查看服务商品 <span aria-hidden="true">↗</span></RouterLink></div></section>
  <ContactBanner />
</template>

<style scoped>
.service-nav { display: flex; flex-wrap: wrap; gap: 12px; padding-bottom: 40px; }
.service-nav a { display: inline-flex; align-items: center; gap: 16px; border: 1px solid var(--line); border-radius: var(--radius-pill); padding: 10px 18px; font-size: 14px; min-height: 44px; color: var(--muted); }
.service-nav a:hover { border-color: var(--accent); color: var(--accent); }
.service-details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; padding-bottom: 96px; }
.service-detail { display: flex; flex-direction: column; align-items: start; padding: 40px; border-radius: var(--radius-card); background: var(--surface); scroll-margin-top: 104px; }
.service-detail-heading { display: flex; align-items: center; justify-content: space-between; width: 100%; margin-bottom: 32px; }
.service-detail .eyebrow { margin-bottom: 14px; }
.service-detail h2 { font-size: 32px; }
.service-detail .section-description { font-size: 16px; margin-top: 20px; }
.service-scope { padding-block: 28px; margin-top: 28px; border-top: 1px solid var(--line); width: 100%; }
.service-scope h3 { font-size: 14px; margin-bottom: 12px; }
.service-scope > p { font-size: 15px; color: var(--muted); margin-bottom: 28px; }
.service-detail > .text-link { margin-top: auto; }
.faq-section { display: grid; grid-template-columns: .8fr 1.2fr; gap: 88px; }
.fixed-service-section { display: flex; align-items: center; justify-content: space-between; gap: 56px; }
.fixed-service-section .section-description { max-width: 600px; }
.fixed-service-section > .button { flex-shrink: 0; }
@media (max-width: 1040px) { .service-detail { padding: 32px; }.service-detail h2 { font-size: 28px; }.faq-section { gap: 48px; } }
@media (max-width: 760px) {
  .service-nav { gap: 10px; padding-bottom: 32px; }
  .service-nav a { font-size: 13px; padding-inline: 16px; }
  .service-details, .faq-section { grid-template-columns: 1fr; gap: 24px; }
  .service-details { padding-bottom: 64px; }
  .service-detail { padding: 28px; }
  .service-detail h2 { font-size: 28px; }
  .fixed-service-section { flex-direction: column; align-items: start; gap: 28px; }
}
</style>
