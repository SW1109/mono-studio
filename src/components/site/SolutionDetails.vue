<script setup>
import SiteIcon from "./SiteIcon.vue";

defineProps({ details: { type: Object, required: true } });
</script>

<template>
  <section id="scenarios" class="section container" aria-labelledby="scenarios-title">
    <div class="section-heading" data-reveal>
      <div><p class="eyebrow">WHERE IT FITS</p><h2 id="scenarios-title">适用业务场景</h2></div>
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
        <div><p class="eyebrow">FUNCTIONAL MODULES</p><h2 id="modules-title">功能模块与开发范围</h2><p class="section-description">以下为可选功能模块，不默认全部包含。具体模块、业务规则与开发范围在项目方案中确认。</p></div>
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
      <div><p class="eyebrow">BUSINESS FLOW</p><h2 id="workflow-title">典型业务流程</h2><p class="section-description">以下为流程参考，实际状态、角色权限及异常处理规则按业务需求确认。</p></div>
    </div>
    <ol class="solution-flow">
      <li v-for="(step, index) in details.workflow" :key="step" data-reveal :data-reveal-delay="index * 80"><span class="flow-number">0{{ index + 1 }}</span><h3>{{ step }}</h3><SiteIcon v-if="index < details.workflow.length - 1" name="arrow" /></li>
    </ol>
  </section>

  <section id="delivery" class="section section-soft" aria-labelledby="delivery-title">
    <div class="container delivery-grid">
      <div class="delivery-card" data-reveal>
        <p class="eyebrow">DELIVERY & HANDOVER</p><h2 id="delivery-title">交付内容与验收约定</h2>
        <p class="section-description">具体交付物、源码归属、部署环境、验收方式和维护范围在项目约定中确认。</p>
        <ul class="check-list"><li v-for="item in details.deliverables" :key="item"><SiteIcon name="check" />{{ item }}</li></ul>
      </div>
      <div class="extension-card" data-reveal data-reveal-delay="120">
        <p class="eyebrow">ROOM TO GROW</p><h3>后续扩展方向</h3>
        <p>在基础流程验证后，可按实际需求评估新增模块及系统对接。</p>
        <ul><li v-for="item in details.extensions" :key="item"><SiteIcon name="layers" />{{ item }}</li></ul>
        <p class="small-note">扩展功能不默认包含在基础范围内；外部平台、服务费用与授权条件需要单独评估。</p>
      </div>
    </div>
  </section>

  <section id="questions" class="section container solution-faq" aria-labelledby="questions-title">
    <div data-reveal><p class="eyebrow">BEFORE WE START</p><h2 id="questions-title">方案咨询<br />常见问题</h2></div>
    <div class="faq-list" data-reveal data-reveal-delay="120"><details v-for="faq in details.faq" :key="faq.question"><summary>{{ faq.question }}<span aria-hidden="true">+</span></summary><p>{{ faq.answer }}</p></details></div>
  </section>
</template>

<style scoped>
.scenario-grid, .module-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
.scenario-card { border-top: 1px solid var(--line); padding: 28px 8px 0 0; }
.scenario-card h3 { font-size: 23px; margin: 24px 0 16px; }
.scenario-card p, .module-card p { font-size: 15px; color: var(--muted); line-height: 1.8; }
.module-card { background: var(--canvas); border-radius: var(--radius-card); padding: 32px; }
.module-number { display: block; font: 12px/1.5 var(--font-mono); color: var(--muted); margin-bottom: 28px; }
.module-card h3 { font-size: 22px; margin-bottom: 16px; }
.solution-flow { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border: 1px solid var(--line); border-radius: var(--radius-card); background: var(--canvas); overflow: hidden; }
.solution-flow li { position: relative; padding: 32px; }
.solution-flow li + li { border-left: 1px solid var(--line); }
.flow-number { display: inline-grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: var(--accent-soft); color: var(--accent); font: 13px/1 var(--font-mono); }
.solution-flow h3 { font-size: 19px; margin-top: 24px; }
.solution-flow svg { position: absolute; width: 16px; height: 16px; color: var(--muted); top: 44px; right: 24px; }
.delivery-grid { display: grid; grid-template-columns: 1.1fr .9fr; gap: 64px; align-items: start; }
.delivery-card .check-list { margin-top: 32px; gap: 20px; }
.extension-card { padding: 36px; background: var(--canvas); border-radius: var(--radius-card); }
.extension-card h3 { font-size: 26px; margin-bottom: 16px; }
.extension-card > p:not(.eyebrow) { font-size: 15px; line-height: 1.8; color: var(--muted); }
.extension-card ul { display: grid; gap: 20px; margin: 28px 0; }
.extension-card li { display: flex; align-items: start; gap: 14px; font-size: 16px; }
.extension-card li svg { width: 18px; height: 18px; flex-shrink: 0; margin-top: 4px; color: var(--accent); }
.solution-faq { display: grid; grid-template-columns: .8fr 1.2fr; gap: 88px; }
@media (max-width: 1040px) {
  .module-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .module-card { padding: 28px; }
  .delivery-grid, .solution-faq { gap: 40px; }
  .solution-flow li { padding: 28px 24px; }
}
@media (max-width: 760px) {
  .scenario-grid, .module-grid { grid-template-columns: 1fr; gap: 24px; }
  .scenario-card h3 { margin-top: 20px; }
  .module-number { margin-bottom: 20px; }
  .solution-flow { grid-template-columns: 1fr 1fr; }
  .solution-flow li { padding: 24px; }
  .solution-flow li:nth-child(3) { border-left: 0; }
  .solution-flow li:nth-child(n+3) { border-top: 1px solid var(--line); }
  .solution-flow svg { top: 36px; right: 18px; }
  .delivery-grid, .solution-faq { grid-template-columns: 1fr; gap: 32px; }
  .extension-card { padding: 28px; }
}
</style>
