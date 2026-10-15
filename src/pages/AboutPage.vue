<script setup>
import PageHeading from "../components/site/PageHeading.vue";
import ContactBanner from "../components/site/ContactBanner.vue";
import { services } from "../content/services.js";
import SiteIcon from "../components/site/SiteIcon.vue";
import StudioFilm from "../components/site/StudioFilm.vue";
const principles = [
  { number: "01", title: "需求分析", description: "梳理使用场景、角色与核心流程，明确功能范围、约束条件及验收要求。" },
  { number: "02", title: "架构与交互", description: "按模块组织功能与数据流，统一界面与交互规则，兼顾操作效率和后续维护。" },
  { number: "03", title: "阶段评审", description: "以可运行版本核对阶段成果，记录反馈、变更事项及待确认问题。" },
  { number: "04", title: "维护与迭代", description: "结合实际运行情况评估后续改进；维护内容、响应安排与新增功能另行确认。" },
];
</script>

<template>
  <div class="about-opening">
    <PageHeading class="about-heading" eyebrow="ABOUT GUANGNIAN" title="专注软件设计与研发" current="关于光年" description="光年数智网络科技工作室，提供软件产品研发、定制开发与系统集成服务。" />
    <section class="about-film-stage" aria-label="光年数智工作室宣传片">
      <StudioFilm />
    </section>
  </div>
  <section class="container about-intro">
    <div data-reveal>
      <p class="eyebrow">光年数智网络科技工作室</p>
      <h2>产品设计<br />与工程实践</h2>
      <p class="intro-signature" aria-hidden="true">Thoughtfully designed.<br />Precisely engineered.</p>
    </div>
    <div class="about-intro-copy glass-panel" data-reveal data-reveal-delay="120">
      <p>光年数智是一家专注软件设计与研发的工作室，业务涵盖企业网站、业务管理系统、小程序、桌面软件与自动化工具。</p>
      <p>项目工作包括需求分析、界面与交互设计、功能开发、测试验证以及部署交接。服务范围和验收要求在项目方案中明确约定。</p>
    </div>
  </section>
  <section class="section section-soft">
    <div class="container">
      <div class="section-heading" data-reveal><div><p class="eyebrow">WHAT WE BELIEVE</p><h2>项目实施原则</h2></div><span class="principle-note">清晰的过程，可核对的成果。</span></div>
      <div class="principle-grid">
        <article v-for="(item, index) in principles" :key="item.number" class="glass-panel" data-reveal :data-reveal-delay="index % 2 * 100">
          <div class="principle-top"><span class="step-number">{{ item.number }}</span><SiteIcon name="arrow" /></div>
          <h3>{{ item.title }}</h3><p>{{ item.description }}</p>
        </article>
      </div>
    </div>
  </section>
  <section class="section container">
    <div class="section-heading" data-reveal><div><p class="eyebrow">OUR FOCUS</p><h2>研发与服务方向</h2><p class="section-description">围绕网站、移动端、桌面应用与自动化，提供设计、开发及系统对接服务。</p></div></div>
    <div class="focus-grid"><div v-for="service in services" :key="service.id" class="glass-panel" data-reveal><span class="icon-tile"><SiteIcon :name="service.icon" /></span><h3>{{ service.title }}</h3></div></div>
  </section>
  <ContactBanner />
</template>

<style scoped>
.about-opening { position: relative; isolation: isolate; }
.about-opening::before { content: ''; position: absolute; inset: -112px 0 30%; z-index: -1; background: radial-gradient(ellipse at 18% 60%, rgba(213, 178, 237, .22), transparent 50%), radial-gradient(ellipse at 86% 15%, rgba(239, 214, 246, .32), transparent 55%); pointer-events: none; }
.about-heading { text-align: center; padding-bottom: 44px; }
.about-heading :deep(.breadcrumbs) { justify-content: center; margin-bottom: 36px; }
.about-heading :deep(.eyebrow) { justify-content: center; width: fit-content; margin-inline: auto; padding: 7px 18px; border: 1px solid rgba(255, 255, 255, .9); border-radius: var(--radius-pill); background: rgba(255, 255, 255, .65); color: var(--accent); }
.about-heading :deep(h1) { font-size: clamp(32px, 3.6vw, 50px); max-width: none; font-weight: 400; color: var(--accent); letter-spacing: -.025em; }
.about-heading :deep(.page-description) { margin-inline: auto; font-size: 17px; }
/* 控制舞台宽度并去掉视频背后的大面积模糊，保持完整 16:9 和全屏观看能力。 */
.about-film-stage { width: min(1120px, calc(100% - 64px)); margin-inline: auto; padding: 8px; border: 1px solid var(--glass-line); border-radius: 32px; background: var(--glass-bg-strong); box-shadow: var(--glass-shadow); }
.about-film-stage :deep(.studio-film) { border: 0; border-radius: 28px; background: transparent; }
.about-film-stage :deep(figcaption) { padding: 22px 28px; }
.about-intro { display: grid; grid-template-columns: .9fr 1.1fr; gap: 96px; align-items: center; padding-block: 96px; }
.about-intro h2 { color: var(--accent); font-size: clamp(30px, 3vw, 40px); font-weight: 400; line-height: 1.5; }
.intro-signature { font: italic 22px/1.6 Georgia, serif; color: var(--muted); margin-top: 30px; }
.about-intro-copy { padding: 40px; border-radius: var(--radius-card); }
.about-intro-copy p { color: var(--muted); font-size: 17px; line-height: 1.95; }
.about-intro-copy p + p { margin-top: 24px; }
.principle-note { color: var(--muted); font-size: 14px; }
.principle-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
.principle-grid article { padding: 40px; border-radius: var(--radius-card); }
.principle-top { display: flex; align-items: center; justify-content: space-between; }
.principle-top svg { width: 20px; height: 20px; color: var(--accent); }
.principle-grid h3 { margin: 28px 0 16px; font-size: 22px; font-weight: 500; }
.principle-grid p { font-size: 15px; color: var(--muted); line-height: 1.8; }
.focus-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px; }
.focus-grid > div { display: flex; flex-direction: column; align-items: start; gap: 24px; padding: 28px; border-radius: 22px; }
.focus-grid h3 { font-size: 18px; }
@media (max-width: 1040px) { .about-intro { gap: 48px; }.focus-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 760px) {
  .about-opening::before { top: -100px; }
  .about-heading { padding-bottom: 32px; }
  .about-heading :deep(.breadcrumbs) { margin-bottom: 28px; }
  .about-heading :deep(.page-description) { font-size: 16px; }
  .about-film-stage { width: calc(100% - 24px); padding: 5px; border-radius: 28px; }
  .about-film-stage :deep(.studio-film) { border-radius: 22px; }
  .about-film-stage :deep(figcaption) { padding: 16px; }
  .about-intro { grid-template-columns: 1fr; gap: 28px; padding-block: 64px; }
  .about-intro-copy { padding: 28px; }
  .about-intro-copy p { font-size: 16px; }
  .intro-signature { font-size: 20px; margin-top: 20px; }
  .principle-grid { grid-template-columns: 1fr; gap: 16px; }
  .principle-grid article { padding: 28px; }
  .principle-grid h3 { font-size: 23px; }
  .focus-grid { gap: 16px; }
  .focus-grid > div { padding: 24px; }
  .focus-grid h3 { font-size: 16px; }
}
@media (max-width: 380px) { .focus-grid { grid-template-columns: 1fr; }.focus-grid > div { flex-direction: row; align-items: center; gap: 16px; } }
</style>
