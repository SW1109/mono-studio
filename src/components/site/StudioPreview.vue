<script setup>
import { computed, shallowRef } from "vue";
import SiteIcon from "./SiteIcon.vue";

const selected = shallowRef("workspace");
const previews = [
  { id: "workspace", label: "业务工作台", icon: "web", title: "业务管理与项目协作", subtitle: "按功能模块组织需求、设计与开发信息。", modules: ["需求与范围", "界面与交互", "开发与验证"] },
  { id: "mobile", label: "移动端服务", icon: "mobile", title: "移动端服务与预约管理", subtitle: "服务项目展示、预约确认与进度查询。", modules: ["服务展示", "预约流程", "进度查询"] },
  { id: "automation", label: "自动化流程", icon: "workflow", title: "自动化任务与流程编排", subtitle: "按任务规则组织输入、处理与结果输出。", modules: ["准备输入", "处理任务", "整理结果"] },
];
const active = computed(() => previews.find(item => item.id === selected.value));
</script>

<template>
  <figure class="studio-preview glass-panel" data-reveal aria-label="可切换的软件界面设计示意">
    <div class="preview-topline">
      <span class="preview-signature">GUANGNIAN / SOFTWARE ENGINEERING</span>
      <div class="preview-switcher" role="group" aria-label="切换界面示意">
        <button v-for="item in previews" :key="item.id" type="button" :aria-pressed="selected === item.id" @click="selected = item.id">{{ item.label }}</button>
      </div>
    </div>
    <div class="preview-stage">
      <div class="preview-window">
        <div class="preview-titlebar" aria-hidden="true">
          <span class="window-dots"><i></i><i></i><i></i></span><span>guangnian.studio / {{ selected }}</span><SiteIcon name="layers" />
        </div>
        <div class="preview-workspace" aria-hidden="true">
          <aside class="preview-sidebar">
            <span class="preview-monogram">G.</span>
            <span v-for="item in previews" :key="item.id" class="preview-sidebar-item" :class="{ 'is-selected': selected === item.id }"><SiteIcon :name="item.icon" />{{ item.label }}</span>
            <span class="preview-sidebar-footer">DESIGN / ENGINEERING</span>
          </aside>
          <div class="preview-content">
            <p class="preview-kicker">APPLICATION INTERFACE</p>
            <h2>{{ active.title }}</h2>
            <p class="preview-subtitle">{{ active.subtitle }}</p>
            <template v-if="selected === 'workspace'">
              <div class="preview-modules">
                <div v-for="(label, index) in active.modules" :key="label"><span>0{{ index + 1 }}</span><SiteIcon :name="previews[index].icon" /><strong>{{ label }}</strong><small>{{ ['需求分析', '产品设计', '功能开发'][index] }}</small></div>
              </div>
              <div class="preview-list">
                <div class="preview-list-heading"><strong>项目阶段与任务</strong><span>协作流程示意</span></div>
                <div v-for="(label, index) in active.modules" :key="label" class="preview-list-row"><span class="preview-row-icon"><SiteIcon name="check" /></span><span>{{ label }}</span><span class="preview-progress"><i :style="{ width: `${92 - index * 22}%` }"></i></span><small>{{ ['规划', '设计', '开发'][index] }}</small></div>
              </div>
            </template>
            <div v-else-if="selected === 'mobile'" class="preview-mobile-flow">
              <div class="preview-service-tile"><SiteIcon name="mobile" /><strong>移动端服务入口</strong><span>小程序 / H5</span></div>
              <ol><li v-for="(label, index) in active.modules" :key="label"><span>0{{ index + 1 }}</span><strong>{{ label }}</strong><SiteIcon name="arrow" /></li></ol>
            </div>
            <div v-else class="preview-automation">
              <p><span class="preview-code-label">WORKFLOW</span><span>任务输入、执行与输出</span></p>
              <div v-for="(label, index) in active.modules" :key="label"><span>0{{ index + 1 }}</span><SiteIcon :name="['files', 'workflow', 'check'][index]" /><strong>{{ label }}</strong><small>{{ ['Input', 'Process', 'Output'][index] }}</small></div>
              <code><span>await</span> workflow.run();</code>
            </div>
          </div>
        </div>
      </div>
      <div class="preview-companion" aria-hidden="true">
        <div class="preview-phone">
          <div class="preview-phone-camera"></div>
          <div class="preview-phone-body">
            <div class="preview-phone-top"><span>光年服务</span><SiteIcon name="layers" /></div>
            <p class="preview-phone-kicker">MOBILE SERVICE</p>
            <strong class="preview-phone-title">移动服务<br />与业务管理</strong>
            <div class="preview-phone-feature"><SiteIcon :name="active.icon" /><span>{{ active.label }}</span></div>
            <div class="preview-phone-list"><span v-for="label in active.modules" :key="label">{{ label }}<SiteIcon name="arrow" /></span></div>
            <span class="preview-phone-action">了解服务 →</span>
            <div class="preview-phone-navigation"><SiteIcon name="web" /><SiteIcon name="layers" /><SiteIcon name="mobile" /></div>
          </div>
          <div class="preview-phone-indicator"></div>
        </div>
        <span class="preview-companion-label">同一个想法，多端的体验。</span>
      </div>
    </div>
    <figcaption><span role="status" aria-live="polite">{{ active.label }} · 界面设计示意，非已上线产品截图</span><span class="preview-caption-note">SOFTWARE INTERFACE CONCEPT.</span></figcaption>
  </figure>
</template>

<style scoped>
.studio-preview { margin: 0; position: relative; isolation: isolate; background: var(--glass-bg); border-radius: var(--radius-card); padding: 28px 40px 24px; }
.preview-topline { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.preview-signature { font: 10px/1.6 var(--font-mono); letter-spacing: .08em; color: var(--muted); }
.preview-switcher { border: 1px solid var(--glass-line); display: flex; gap: 4px; padding: 4px; border-radius: var(--radius-pill); background: rgba(234, 219, 245, .55); }
.preview-switcher button { min-height: 44px; padding: 8px 18px; border: 0; border-radius: var(--radius-pill); background: transparent; font-size: 13px; color: var(--muted); transition: color .2s, background .2s; }
.preview-switcher button[aria-pressed="true"] { background: var(--canvas); color: var(--ink); }
.preview-stage { display: grid; grid-template-columns: minmax(0, 1fr) 180px; gap: 48px; align-items: center; padding-block: 36px; max-width: 1080px; margin-inline: auto; }
.preview-window { background: rgba(255, 255, 255, .85); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; box-shadow: 0 16px 36px rgba(88, 48, 118, .07); }
.preview-titlebar { height: 38px; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: rgba(250, 244, 253, .76); border-bottom: 1px solid var(--line); color: var(--muted); font: 10px/1.5 var(--font-mono); }
.preview-titlebar > svg { width: 14px; height: 14px; }
.window-dots { display: flex; gap: 5px; }
.window-dots i { width: 6px; height: 6px; background: var(--line); border-radius: 50%; }
.preview-workspace { display: flex; min-height: 350px; }
.preview-sidebar { width: 132px; padding: 24px 14px; flex-shrink: 0; border-right: 1px solid var(--line); display: flex; flex-direction: column; gap: 8px; }
.preview-monogram { font-size: 24px; font-weight: 600; letter-spacing: -.08em; margin-bottom: 20px; color: var(--accent); }
.preview-sidebar-item { display: flex; align-items: center; gap: 8px; font-size: 10px; color: var(--muted); padding: 10px 6px; border-radius: 5px; }
.preview-sidebar-item.is-selected { background: var(--accent-soft); color: var(--accent); }
.preview-sidebar-item svg { width: 14px; height: 14px; flex-shrink: 0; }
.preview-sidebar-footer { margin-top: auto; font: 7px/1.8 var(--font-mono); letter-spacing: .04em; color: var(--muted); }
.preview-content { padding: 30px; flex: 1; min-width: 0; }
.preview-kicker { font: 8px/1.5 var(--font-mono); letter-spacing: .04em; color: var(--muted); }
.preview-content h2 { font-size: 22px; margin-top: 8px; letter-spacing: -.04em; }
.preview-subtitle { color: var(--muted); font-size: 10px; margin-top: 8px; }
.preview-modules { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 24px; }
.preview-modules > div { position: relative; background: rgba(243, 232, 250, .65); border: 1px solid rgba(255, 255, 255, .9); border-radius: var(--radius-sm); padding: 14px; }
.preview-modules > div > span { position: absolute; right: 12px; top: 12px; font: 8px/1 var(--font-mono); color: var(--muted); }
.preview-modules svg { width: 20px; height: 20px; color: var(--accent); margin-bottom: 12px; }
.preview-modules strong { display: block; font-size: 11px; font-weight: 600; }
.preview-modules small { display: block; font-size: 9px; color: var(--muted); margin-top: 4px; }
.preview-list { margin-top: 24px; }
.preview-list-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; font-size: 11px; }
.preview-list-heading > span { font-size: 8px; color: var(--muted); }
.preview-list-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-top: 1px solid var(--line); font-size: 10px; }
.preview-row-icon svg { width: 12px; height: 12px; color: var(--accent); }
.preview-progress { margin-left: auto; width: 72px; height: 4px; background: var(--surface); border-radius: 2px; }
.preview-progress i { display: block; height: 100%; background: var(--accent); border-radius: inherit; }
.preview-list-row small { width: 32px; font-size: 8px; color: var(--muted); text-align: right; }
.preview-companion { display: grid; justify-items: center; gap: 16px; }
/* 手机机身始终等比；只缩放宽度，不单独改变高度或拉伸屏幕。 */
.preview-phone { width: 164px; aspect-ratio: 9 / 19.5; border: 6px solid var(--dark); border-radius: 26px; padding: 20px 8px 16px; position: relative; background: var(--canvas); box-shadow: 0 16px 36px rgba(88, 48, 118, .07); }
.preview-phone-camera { width: 40px; height: 9px; position: absolute; top: 6px; left: calc(50% - 20px); background: var(--dark); border-radius: var(--radius-pill); }
.preview-phone-body { height: 100%; display: flex; flex-direction: column; }
.preview-phone-top { display: flex; align-items: center; justify-content: space-between; font-size: 9px; font-weight: 600; }
.preview-phone-top svg { width: 12px; height: 12px; }
.preview-phone-kicker { font: 6px/1.5 var(--font-mono); color: var(--muted); margin-top: 16px; }
.preview-phone-title { font-size: 18px; line-height: 1.4; letter-spacing: -.04em; margin-top: 8px; }
.preview-phone-feature { display: flex; align-items: center; gap: 8px; background: var(--accent-soft); padding: 10px; border-radius: var(--radius-sm); margin-top: 12px; font-size: 9px; color: var(--accent); }
.preview-phone-feature svg { width: 16px; height: 16px; }
.preview-phone-list { display: grid; gap: 8px; margin-block: 12px; }
.preview-phone-list > span { display: flex; align-items: center; justify-content: space-between; font-size: 8px; color: var(--muted); }
.preview-phone-list svg { width: 11px; height: 11px; }
.preview-phone-action { border-radius: var(--radius-pill); background: var(--accent); color: var(--canvas); font-size: 8px; padding: 8px; text-align: center; }
.preview-phone-navigation { display: flex; justify-content: space-around; border-top: 1px solid var(--line); padding-top: 10px; margin-top: auto; color: var(--muted); }
.preview-phone-navigation svg { width: 13px; height: 13px; }
.preview-phone-indicator { position: absolute; width: 48px; height: 3px; bottom: 5px; left: calc(50% - 24px); background: var(--dark); border-radius: var(--radius-pill); }
.preview-companion-label { font-size: 10px; color: var(--muted); white-space: nowrap; }
.studio-preview::before { content: ''; position: absolute; inset: 0; z-index: -1; border-radius: inherit; background: radial-gradient(ellipse at 75% 0%, rgba(213, 173, 238, .26), transparent 70%); pointer-events: none; }
.studio-preview figcaption { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-top: 20px; border-top: 1px solid var(--line); font-size: 11px; color: var(--muted); }
.preview-caption-note { font: 9px/1.8 var(--font-mono); letter-spacing: .08em; }
.preview-mobile-flow { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; }
.preview-service-tile { border-radius: var(--radius-sm); padding: 24px 18px; background: var(--accent-soft); color: var(--accent); display: flex; flex-direction: column; }
.preview-service-tile svg { width: 32px; height: 32px; margin-bottom: 20px; }
.preview-service-tile strong { font-size: 15px; }
.preview-service-tile > span { font-size: 10px; margin-top: 10px; }
.preview-mobile-flow li { display: flex; align-items: center; gap: 12px; padding: 18px 0; border-bottom: 1px solid var(--line); font-size: 11px; }
.preview-mobile-flow li > span { font: 9px/1.5 var(--font-mono); color: var(--muted); }
.preview-mobile-flow li > svg { width: 12px; height: 12px; margin-left: auto; color: var(--accent); }
.preview-automation { background: var(--dark); color: var(--on-dark); border-radius: var(--radius-sm); padding: 18px; margin-top: 24px; }
.preview-automation > p { display: flex; justify-content: space-between; gap: 12px; font-size: 9px; color: var(--muted-on-dark); margin-bottom: 14px; }
.preview-code-label { font: 8px/1.8 var(--font-mono); color: var(--accent-on-dark); }
.preview-automation > div { display: flex; align-items: center; gap: 12px; font-size: 10px; padding: 10px 0; }
.preview-automation > div > span { color: var(--muted-on-dark); font: 8px/1.5 var(--font-mono); }
.preview-automation svg { width: 14px; height: 14px; color: var(--accent-on-dark); }
.preview-automation small { margin-left: auto; color: var(--muted-on-dark); font: 8px/1.5 var(--font-mono); }
.preview-automation code { display: block; border-top: 1px solid rgba(255, 255, 255, .15); margin-top: 14px; padding-top: 14px; font: 11px/1.5 var(--font-mono); }
.preview-automation code > span { color: var(--accent-on-dark); }
@media (max-width: 1120px) {
  .preview-stage { gap: 28px; grid-template-columns: minmax(0, 1fr) 164px; }
  .preview-sidebar { width: 112px; padding-inline: 10px; }
  .preview-content { padding: 24px; }
  .preview-content h2 { font-size: 20px; }
}
@media (max-width: 900px) {
  .preview-signature { display: none; }
  .preview-topline { justify-content: center; }
  .preview-sidebar { width: 60px; align-items: center; }
  .preview-sidebar-item { font-size: 0; padding: 12px; }
  .preview-sidebar-footer { display: none; }
  .preview-content { padding: 24px 18px; }
  .preview-companion-label { font-size: 9px; }
  .preview-modules { gap: 8px; }
  .preview-modules > div { padding: 12px 10px; }
}
@media (max-width: 760px) {
  .studio-preview { padding: 20px 20px 16px; }
  .preview-stage { grid-template-columns: minmax(0, 1fr); padding-block: 24px; }
  .preview-companion { display: none; }
  .preview-caption-note { display: none; }
  .preview-workspace { min-height: 324px; }
  .preview-content h2 { font-size: 20px; }
}
@media (max-width: 480px) {
  .studio-preview { padding: 16px 12px; }
  .preview-switcher button { padding: 8px 12px; font-size: 12px; }
  .preview-sidebar { display: none; }
  .preview-content { padding: 22px 16px; }
  .preview-titlebar { padding-inline: 12px; font-size: 8px; }
  .preview-subtitle { font-size: 10px; }
  .preview-content h2 { font-size: 19px; }
  .preview-modules { gap: 6px; }
  .preview-modules strong { font-size: 10px; }
  .studio-preview figcaption { font-size: 10px; }
  .preview-mobile-flow { gap: 12px; }
  .preview-service-tile { padding-inline: 14px; }
  .preview-service-tile strong { font-size: 13px; }
}
</style>
