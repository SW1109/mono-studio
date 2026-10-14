<script setup>
import { computed } from "vue";
import SiteIcon from "./SiteIcon.vue";

const props = defineProps({ product: { type: Object, required: true }, large: { type: Boolean, default: false } });
// 示意内容来自当前方案的真实模块名称，不编造客户截图、交易数或已上线状态。
const labels = computed(() => props.product.capabilities.slice(0, 3));
const layout = computed(() => {
  if (["calendar", "shopping"].includes(props.product.icon)) return "mobile";
  if (props.product.icon === "web") return "website";
  if (["workflow", "desktop", "files", "activity", "layers"].includes(props.product.icon)) return "workflow";
  return "dashboard";
});
</script>

<template>
  <div class="product-visual" :class="[`visual-${layout}`, { 'visual-large': large }]" aria-hidden="true">
    <span class="visual-caption">{{ product.kind === 'solution' ? 'CUSTOM SOFTWARE / CONCEPT' : 'SOFTWARE TOOL / CONCEPT' }}</span>
    <div v-if="layout === 'mobile'" class="visual-phone">
      <span class="visual-phone-camera"></span>
      <div class="visual-phone-content"><span class="visual-phone-name">{{ product.category }}</span><SiteIcon :name="product.icon" /><strong>{{ product.kind === 'solution' ? '移动服务\n与在线业务' : product.name }}</strong><div v-for="label in labels" :key="label" class="visual-phone-row"><span>{{ label }}</span><SiteIcon name="arrow" /></div><span class="visual-phone-cta">了解服务 →</span></div>
      <span class="visual-phone-indicator"></span>
    </div>
    <div v-else class="visual-browser">
      <div class="visual-browser-bar"><span><i></i><i></i><i></i></span><span>{{ product.kind === 'solution' ? 'guangnian / concept' : product.name }}</span></div>
      <div v-if="layout === 'website'" class="visual-website-content"><span class="visual-mini-brand">G.</span><p>WEBSITE DESIGN.</p><strong>{{ product.kind === 'solution' ? '企业网站\n与内容展示' : product.name }}</strong><span class="visual-mini-cta">探索更多 ↗</span><div class="visual-website-tiles"><span v-for="label in labels" :key="label">{{ label }}</span></div></div>
      <div v-else-if="layout === 'dashboard'" class="visual-dashboard-content">
        <div class="visual-rail"><SiteIcon :name="product.icon" /><i></i><i></i><i></i></div>
        <div class="visual-dashboard-main"><strong>{{ product.category }}</strong><div class="visual-chart"><span v-for="(height, index) in [32, 54, 45, 72, 62, 86, 70]" :key="index" :style="{ height: `${height}%` }"></span></div><div v-for="label in labels" :key="label" class="visual-data-row"><span>{{ label }}</span><i></i></div></div>
      </div>
      <div v-else class="visual-workflow-content"><p>WORKFLOW AUTOMATION.</p><strong>{{ product.kind === 'solution' ? '业务流程编排' : product.name }}</strong><div v-for="(label, index) in labels" :key="label" class="visual-flow-row"><span>0{{ index + 1 }}</span><SiteIcon :name="['files', product.icon, 'check'][index]" /><span>{{ label }}</span><i></i></div></div>
    </div>
    <span class="visual-footnote">{{ product.kind === 'solution' ? '方案界面示意' : '功能方向示意' }}<span>↗</span></span>
  </div>
</template>

<style scoped>
/* 显式宽度避免比例与最小高度反推宽度；窄屏也要完整展示等比机身。 */
.product-visual { --visual-ink: var(--ink); --visual-muted: var(--muted); --visual-line: var(--line); position: relative; overflow: hidden; display: grid; place-items: center; width: 100%; min-width: 0; min-height: 280px; aspect-ratio: 1.38; background: radial-gradient(ellipse at 80% 10%, rgba(191, 180, 245, .4), transparent 70%), rgba(223, 231, 252, .56); padding: 40px 36px 32px; }
.visual-caption { position: absolute; left: 24px; top: 18px; font: 8px/1.5 var(--font-mono); letter-spacing: .08em; color: var(--visual-muted); }
.visual-footnote { position: absolute; left: 24px; right: 24px; bottom: 14px; display: flex; justify-content: space-between; font-size: 10px; color: var(--visual-muted); }
.visual-footnote > span { font-size: 15px; color: var(--accent); }
.visual-browser { width: 100%; background: var(--canvas); border: 1px solid var(--line); border-radius: var(--radius-sm); overflow: hidden; box-shadow: 3px 5px 20px rgba(0, 0, 0, .08); }
.visual-browser-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 9px 12px; background: var(--pearl); border-bottom: 1px solid var(--line); color: var(--muted); font: 7px/1.5 var(--font-mono); }
.visual-browser-bar > span:first-child { display: flex; gap: 4px; }
.visual-browser-bar i { display: block; width: 4px; height: 4px; border-radius: 50%; background: var(--line); }
.visual-website-content { padding: 12px 18px 16px; text-align: center; }
.visual-mini-brand { display: block; text-align: left; font-size: 11px; color: var(--accent); font-weight: 600; }
.visual-website-content p { font: 6px/1.5 var(--font-mono); margin: 8px 0; color: var(--muted); letter-spacing: .08em; }
.visual-website-content > strong { font-size: 22px; line-height: 1.3; letter-spacing: -.06em; white-space: pre-line; display: block; }
.visual-mini-cta { display: inline-block; border-radius: var(--radius-pill); padding: 4px 9px; margin-top: 10px; background: var(--accent); color: var(--canvas); font-size: 6px; }
.visual-website-tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin-top: 18px; }
.visual-website-tiles > span { display: grid; place-items: center; height: 28px; font-size: 6px; padding: 5px; background: var(--surface); color: var(--muted); border-radius: 3px; overflow: hidden; }
.visual-dashboard-content { display: flex; }
.visual-rail { width: 36px; border-right: 1px solid var(--line); display: flex; flex-direction: column; align-items: center; gap: 18px; padding-top: 16px; flex-shrink: 0; }
.visual-rail > svg { width: 14px; height: 14px; color: var(--accent); }
.visual-rail i { width: 10px; height: 2px; background: var(--line); }
.visual-dashboard-main { flex: 1; min-width: 0; padding: 14px 16px; }
.visual-dashboard-main > strong { font-size: 12px; }
.visual-chart { display: flex; gap: 7px; align-items: end; height: 68px; margin-block: 10px; border-bottom: 1px solid var(--line); }
.visual-chart > span { flex: 1; background: var(--accent-soft); border-radius: 2px 2px 0 0; }
.visual-chart > span:nth-child(2n) { background: var(--accent); opacity: .65; }
.visual-data-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--line); font-size: 7px; color: var(--muted); }
.visual-data-row i { width: 22px; height: 4px; background: var(--accent-soft); border-radius: 2px; flex-shrink: 0; }
.visual-workflow { background: var(--dark); --visual-muted: var(--muted-on-dark); }
.visual-workflow .visual-caption { color: var(--muted-on-dark); }
.visual-workflow-content { padding: 18px; }
.visual-workflow-content p { font: 6px/1.5 var(--font-mono); letter-spacing: .04em; color: var(--muted); margin-bottom: 6px; }
.visual-workflow-content > strong { font-size: 17px; display: block; margin-bottom: 16px; }
.visual-flow-row { display: flex; align-items: center; gap: 10px; border-top: 1px solid var(--line); padding-block: 10px; color: var(--muted); font-size: 8px; }
.visual-flow-row > span:first-child { font: 7px/1.5 var(--font-mono); }
.visual-flow-row svg { width: 12px; height: 12px; color: var(--accent); flex-shrink: 0; }
.visual-flow-row i { margin-left: auto; width: 4px; height: 4px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
.visual-mobile { padding-block: 34px 30px; }
.visual-phone { width: 98px; aspect-ratio: 9 / 19.5; border: 4px solid var(--dark); border-radius: 18px; padding: 17px 7px 15px; position: relative; background: var(--canvas); box-shadow: 3px 5px 20px rgba(0, 0, 0, .12); }
.visual-phone-camera { position: absolute; width: 24px; height: 5px; top: 4px; left: calc(50% - 12px); background: var(--dark); border-radius: var(--radius-pill); }
.visual-phone-content { height: 100%; display: flex; flex-direction: column; }
.visual-phone-name { display: block; font-size: 5px; color: var(--muted); }
.visual-phone-content > svg { width: 20px; height: 20px; color: var(--accent); margin-block: 14px 8px; }
.visual-phone-content > strong { font-size: 13px; line-height: 1.4; white-space: pre-line; letter-spacing: -.03em; }
.visual-phone-row { display: flex; align-items: center; justify-content: space-between; gap: 4px; padding-block: 7px; border-bottom: 1px solid var(--line); font-size: 5px; color: var(--muted); }
.visual-phone-row > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.visual-phone-row > svg { width: 8px; height: 8px; flex-shrink: 0; }
.visual-phone-cta { margin-top: auto; padding: 5px; background: var(--accent); color: var(--canvas); font-size: 5px; border-radius: var(--radius-pill); text-align: center; }
.visual-phone-indicator { position: absolute; width: 28px; height: 2px; bottom: 4px; left: calc(50% - 14px); background: var(--dark); border-radius: 2px; }
.visual-large { min-height: 460px; aspect-ratio: 1.2; padding: 64px 48px 48px; border-radius: var(--radius-card); }
.visual-large .visual-caption { font-size: 10px; top: 24px; }
.visual-large .visual-footnote { font-size: 12px; bottom: 20px; }
.visual-large .visual-browser { max-width: 440px; }
.visual-large .visual-browser-bar { font-size: 9px; padding: 12px 16px; }
.visual-large .visual-website-content { padding: 20px 28px 24px; }
.visual-large .visual-website-content p { font-size: 8px; margin-block: 14px; }
.visual-large .visual-website-content > strong { font-size: 36px; }
.visual-large .visual-mini-cta { font-size: 9px; padding: 6px 12px; }
.visual-large .visual-website-tiles { margin-top: 24px; }
.visual-large .visual-website-tiles > span { font-size: 8px; height: 44px; }
.visual-large .visual-chart { height: 112px; margin-block: 20px; }
.visual-large .visual-dashboard-main { padding: 24px; }
.visual-large .visual-dashboard-main > strong { font-size: 18px; }
.visual-large .visual-data-row { font-size: 10px; padding-block: 10px; }
.visual-large .visual-workflow-content { padding: 28px; }
.visual-large .visual-workflow-content > strong { font-size: 26px; }
.visual-large .visual-workflow-content p { font-size: 8px; }
.visual-large .visual-flow-row { font-size: 11px; padding-block: 18px; }
.visual-large .visual-phone { width: 152px; border-width: 5px; border-radius: 26px; padding: 24px 12px 20px; }
.visual-large .visual-phone-camera { width: 40px; height: 7px; left: calc(50% - 20px); top: 6px; }
.visual-large .visual-phone-name { font-size: 8px; }
.visual-large .visual-phone-content > svg { width: 30px; height: 30px; margin-block: 20px 14px; }
.visual-large .visual-phone-content > strong { font-size: 21px; }
.visual-large .visual-phone-row { font-size: 8px; padding-block: 10px; }
.visual-large .visual-phone-cta { font-size: 8px; padding: 8px; }
@media (max-width: 760px) {
  .visual-large { min-height: 432px; padding: 56px 32px 44px; }
}
@media (max-width: 380px) {
  .product-visual:not(.visual-large) { padding-inline: 28px; aspect-ratio: 1.2; }
  .visual-large { padding-inline: 24px; }
  .visual-caption { font-size: 7px; }
}
</style>
