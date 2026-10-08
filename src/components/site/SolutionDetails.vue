<script setup>
import SiteIcon from "./SiteIcon.vue";

defineProps({ details: { type: Object, required: true } });
</script>

<template>
  <section id="scenarios" class="section container" aria-labelledby="scenarios-title">
    <div class="section-heading" data-reveal>
      <div><p class="eyebrow">WHERE IT FITS</p><h2 id="scenarios-title">哪些场景，适合从这里开始？</h2></div>
    </div>
    <div class="scenario-grid">
      <article v-for="(scenario, index) in details.scenarios" :key="scenario.title" class="scenario-card" data-reveal :data-reveal-delay="index * 80">
        <span class="step-number">0{{ index + 1 }}</span><h3>{{ scenario.title }}</h3><p>{{ scenario.description }}</p>
      </article>
    </div>
  </section>

  <section id="modules" class="section section-soft" aria-labelledby="modules-title">
    <div class="container">
      <div class="section-heading" data-reveal>
        <div><p class="eyebrow">FUNCTIONAL MODULES</p><h2 id="modules-title">功能拆清楚，范围才清楚。</h2><p class="section-description">下面是可选的常见模块，不代表必须全部开发。先确认核心需求，再确定每个模块的规则与边界。</p></div>
      </div>
      <div class="module-grid">
        <article v-for="(module, index) in details.modules" :key="module.title" class="module-card" data-reveal :data-reveal-delay="index % 3 * 80">
          <span class="module-number">{{ String(index + 1).padStart(2, '0') }}</span><h3>{{ module.title }}</h3><p>{{ module.description }}</p>
        </article>
      </div>
    </div>
  </section>

  <section id="workflow" class="section container workflow-section" aria-labelledby="workflow-title">
    <div class="section-heading" data-reveal>
      <div><p class="eyebrow">BUSINESS FLOW</p><h2 id="workflow-title">软件如何连接业务的每一步。</h2><p class="section-description">以典型流程帮助理解系统，实际状态、角色和异常处理会按你的业务确认。</p></div>
    </div>
    <ol class="solution-flow">
      <li v-for="(step, index) in details.workflow" :key="step" data-reveal :data-reveal-delay="index * 80"><span class="flow-number">0{{ index + 1 }}</span><h3>{{ step }}</h3><SiteIcon v-if="index < details.workflow.length - 1" name="arrow" /></li>
    </ol>
  </section>

  <section id="delivery" class="section section-soft" aria-labelledby="delivery-title">
    <div class="container delivery-grid">
      <div class="delivery-card" data-reveal>
        <p class="eyebrow">DELIVERY & HANDOVER</p><h2 id="delivery-title">不只做页面，也明确交付。</h2>
        <p class="section-description">具体交付物、源码归属、部署环境、验收方式和维护范围在项目约定中确认。</p>
        <ul class="check-list"><li v-for="item in details.deliverables" :key="item"><SiteIcon name="check" />{{ item }}</li></ul>
      </div>
      <div class="extension-card" data-reveal data-reveal-delay="120">
        <p class="eyebrow">ROOM TO GROW</p><h3>后续可以怎样扩展？</h3>
        <p>核心流程稳定后，再根据使用反馈选择需要连接的模块。</p>
        <ul><li v-for="item in details.extensions" :key="item"><SiteIcon name="layers" />{{ item }}</li></ul>
        <p class="small-note">扩展功能不默认包含在基础范围内；外部平台、服务费用与授权条件需要单独评估。</p>
      </div>
    </div>
  </section>

  <section id="questions" class="section container solution-faq" aria-labelledby="questions-title">
    <div data-reveal><p class="eyebrow">BEFORE WE START</p><h2 id="questions-title">开始之前，<br />你可能想了解。</h2></div>
    <div class="faq-list" data-reveal data-reveal-delay="120"><details v-for="faq in details.faq" :key="faq.question"><summary>{{ faq.question }}<span aria-hidden="true">+</span></summary><p>{{ faq.answer }}</p></details></div>
  </section>
</template>

<style scoped>
.scenario-grid, .module-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
.scenario-card { border-top: 1px solid #cfdced; padding: 24px 8px 0 0; }
.scenario-card h3 { font-size: 18px; margin: 20px 0 12px; }
.scenario-card p, .module-card p { font-size: 13px; color: var(--muted); line-height: 1.95; }
.module-card { background: white; border: 1px solid var(--line); border-radius: 12px; padding: 28px; }
.module-number { display: block; font: 11px/1.5 ui-monospace, monospace; color: #8098b9; margin-bottom: 24px; }
.module-card h3 { font-size: 17px; margin-bottom: 14px; }
.solution-flow { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border: 1px solid var(--line); border-radius: 12px; background: white; }
.solution-flow li { position: relative; padding: 28px; }
.solution-flow li + li { border-left: 1px solid var(--line); }
.flow-number { display: inline-grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--accent-soft); color: var(--accent); font: 12px/1 ui-monospace, monospace; }
.solution-flow h3 { font-size: 15px; margin-top: 22px; }
.solution-flow svg { position: absolute; width: 16px; height: 16px; color: #a0b3ce; top: 39px; right: 22px; }
.delivery-grid { display: grid; grid-template-columns: 1.1fr .9fr; gap: 56px; align-items: start; }
.delivery-card h2 { font-size: 30px; }
.delivery-card .check-list { margin-top: 28px; gap: 18px; }
.extension-card { padding: 30px; background: white; border: 1px solid var(--line); border-radius: 12px; }
.extension-card h3 { font-size: 22px; margin-bottom: 14px; }
.extension-card > p:not(.eyebrow) { font-size: 12px; line-height: 1.9; color: var(--muted); }
.extension-card ul { display: grid; gap: 18px; margin: 24px 0; }
.extension-card li { display: flex; align-items: start; gap: 12px; font-size: 13px; }
.extension-card li svg { width: 17px; height: 17px; flex-shrink: 0; margin-top: 3px; color: #6e91c4; }
.solution-faq { display: grid; grid-template-columns: .8fr 1.2fr; gap: 70px; }
@media (max-width: 1000px) { .module-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.module-card { padding: 24px; }.delivery-grid { gap: 32px; }.solution-flow li { padding: 24px 20px; } }
@media (max-width: 760px) {
  .scenario-grid, .module-grid { grid-template-columns: 1fr; gap: 22px; }
  .scenario-card { padding-top: 20px; }.scenario-card h3 { margin-top: 14px; }
  .module-number { margin-bottom: 16px; }
  .solution-flow { grid-template-columns: 1fr 1fr; }.solution-flow li { padding: 22px; }
  .solution-flow li:nth-child(3) { border-left: 0; }.solution-flow li:nth-child(n+3) { border-top: 1px solid var(--line); }
  .solution-flow svg { top: 33px; right: 16px; }
  .delivery-grid, .solution-faq { grid-template-columns: 1fr; gap: 32px; }.delivery-card h2 { font-size: 26px; }.extension-card { padding: 24px; }
}
</style>