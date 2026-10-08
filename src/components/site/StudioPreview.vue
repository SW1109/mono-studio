<script setup>
import { ref } from "vue";
import SiteIcon from "./SiteIcon.vue";

const paused = ref(false);
</script>

<template>
  <figure class="studio-preview" data-reveal data-reveal-delay="240" data-motion-scene :data-scene-paused="paused" aria-label="软件工作台设计示意，并非产品截图">
    <div class="preview-orbit orbit-one motion-loop" aria-hidden="true"><span></span></div>
    <div class="preview-orbit orbit-two motion-loop" aria-hidden="true"><span></span></div>
    <div class="preview-blueprint" aria-hidden="true"><span>GN / WORKSPACE</span><span>IDEA → DESIGN → BUILD</span></div>
    <div class="preview-window motion-loop">
      <div class="preview-titlebar">
        <span class="window-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>guangnian / workspace</span><SiteIcon name="layers" />
      </div>
      <div class="preview-workspace">
        <aside aria-hidden="true"><span class="preview-monogram">G.</span><SiteIcon name="web" /><SiteIcon name="workflow" /><SiteIcon name="files" /></aside>
        <div class="preview-content">
          <div class="preview-section-label">IDEA → SOFTWARE</div>
          <h2>构建你的下一步<span class="preview-dot motion-loop" aria-hidden="true"></span></h2>
          <p>从需求出发，为真实场景创造价值。</p>
          <div class="preview-modules">
            <div><SiteIcon name="web" /><strong>用户体验</strong><span>清晰 · 易用</span><i class="module-light motion-loop" aria-hidden="true"></i></div>
            <div><SiteIcon name="workflow" /><strong>业务流程</strong><span>连接 · 高效</span><i class="module-light motion-loop" aria-hidden="true"></i></div>
          </div>
          <div class="preview-code">
            <div><span class="code-line-number">01</span><code><span>const</span> idea = <em>"有用的想法"</em>;</code></div>
            <div><span class="code-line-number">02</span><code><span>await</span> build(idea);<i class="code-cursor motion-loop" aria-hidden="true"></i></code></div>
            <div><span class="code-line-number">03</span><code class="code-comment">// 为日常，构建更好的工具。</code></div>
          </div>
          <div class="preview-flow" aria-label="示意流程：想法、设计、实现">
            <span><i class="flow-light motion-loop" aria-hidden="true"></i>想法</span><b aria-hidden="true">→</b>
            <span><i class="flow-light motion-loop" aria-hidden="true"></i>设计</span><b aria-hidden="true">→</b>
            <span><i class="flow-light motion-loop" aria-hidden="true"></i>实现</span>
          </div>
          <div class="preview-status"><span><SiteIcon name="check" />以交付为目标</span><span>从想法到实现 ↗</span></div>
        </div>
      </div>
    </div>
    <div class="preview-floating motion-loop">
      <div class="floating-icon"><SiteIcon name="check" /></div>
      <div><strong>让技术，落地成价值</strong><span>Software that makes sense.</span></div>
    </div>
    <figcaption>
      <span>工作台视觉示意 · 非产品截图</span>
      <button class="preview-motion-toggle" type="button" :aria-pressed="paused" @click="paused = !paused"><span aria-hidden="true">{{ paused ? '▷' : 'Ⅱ' }}</span>{{ paused ? '播放动效' : '暂停动效' }}</button>
      <span class="reduced-motion-note">已减少动态效果</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.studio-preview { position: relative; isolation: isolate; margin: 0; padding: 54px 0 50px 20px; }
.preview-orbit { position: absolute; border: 1px solid #d5e0f0; border-radius: 50%; pointer-events: none; z-index: -1; }
.preview-orbit span { position: absolute; left: 50%; top: -4px; width: 8px; height: 8px; background: #8fb3f1; border: 2px solid #f4f8ff; border-radius: 50%; box-shadow: 0 0 0 5px #2563eb0a; }
.orbit-one { width: 104%; aspect-ratio: 1; top: 0; left: 2%; animation: orbit-turn 28s linear infinite; }
.orbit-two { width: 85%; aspect-ratio: 1; top: 8%; left: 12%; border-style: dashed; animation: orbit-turn 38s linear infinite reverse; }
.orbit-two span { background: #8ccdbf; left: 25%; top: 6%; }
.preview-blueprint { position: absolute; inset: 8px 0 auto 24px; display: flex; justify-content: space-between; color: #7f98bb; font: 8px/1.5 ui-monospace, monospace; letter-spacing: .1em; }
.preview-window { position: relative; background: white; border: 1px solid #dbe5f2; border-radius: 16px; overflow: hidden; box-shadow: 0 28px 64px -24px #263b683b; transform: rotate(-2deg); animation: workspace-float 8s ease-in-out infinite; }
.preview-titlebar { height: 44px; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; gap: 18px; background: #fbfcfe; border-bottom: 1px solid #edf0f5; color: #798498; font: 10px/1.5 ui-monospace, monospace; }
.preview-titlebar > svg { width: 16px; height: 16px; }
.window-dots { display: flex; gap: 5px; }
.window-dots i { width: 6px; height: 6px; border-radius: 50%; background: #ccd5e0; }
.window-dots i:first-child { background: #e6b3af; }.window-dots i:nth-child(2) { background: #e8d2a3; }.window-dots i:last-child { background: #a9d3c2; }
.preview-workspace { display: flex; min-height: 355px; }
.preview-workspace aside { display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 22px 13px; background: #fafbfe; border-right: 1px solid #edf0f5; color: #9ba8bc; }
.preview-workspace aside svg { width: 18px; height: 18px; }
.preview-monogram { width: 26px; height: 26px; border-radius: 7px; background: #2463eb; color: white; text-align: center; font: 700 17px/26px system-ui; }
.preview-content { padding: 28px 24px 16px; flex: 1; min-width: 0; }
.preview-section-label { color: #5b7fa8; font: 9px/1.5 ui-monospace, monospace; letter-spacing: .16em; }
.preview-content h2 { font-size: 22px; letter-spacing: -.04em; margin: 8px 0; }
.preview-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #2463eb; margin-left: 6px; animation: status-pulse 3s ease-in-out infinite; }
.preview-content > p { color: #8490a4; font-size: 10px; }
.preview-modules { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 22px 0 18px; }
.preview-modules > div { position: relative; overflow: hidden; display: grid; grid-template-columns: 24px 1fr; gap: 4px 9px; background: #f7f9fe; border: 1px solid #e8eef8; border-radius: 8px; padding: 13px; }
.preview-modules svg { width: 20px; height: 20px; grid-row: span 2; color: #4b7ccc; }
.preview-modules strong { font-size: 10px; }.preview-modules span { font-size: 9px; color: #8592a8; }
.module-light { position: absolute; inset: auto 12px 0; height: 2px; background: #82aaff; transform-origin: left; animation: module-build 6s ease-in-out infinite; }
.preview-modules > div:nth-child(2) .module-light { animation-delay: -3s; }
.preview-code { background: #172235; border-radius: 9px; padding: 14px 12px; font: 10px/2.2 ui-monospace, monospace; color: #d5e0f1; white-space: nowrap; }
.code-line-number { color: #66778d; margin-right: 15px; }.preview-code code span { color: #91b4ff; }.preview-code em { color: #94dbc3; font-style: normal; }.code-comment { color: #8392a6; }
.code-cursor { display: inline-block; width: 5px; height: 12px; vertical-align: -2px; margin-left: 5px; background: #91b4ff; animation: cursor-blink 1.4s steps(2, jump-none) infinite; }
.preview-flow { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; gap: 8px; font-size: 9px; color: #6d81a0; }
.preview-flow > span { display: flex; align-items: center; gap: 6px; }.preview-flow b { font-weight: 400; color: #b9c9df; }
.flow-light { width: 5px; height: 5px; border-radius: 50%; background: #3c79ec; animation: flow-step 6s ease-in-out infinite; }
.preview-flow > span:nth-of-type(2) .flow-light { animation-delay: -4s; }.preview-flow > span:nth-of-type(3) .flow-light { animation-delay: -2s; }
.preview-status { display: flex; justify-content: space-between; align-items: center; gap: 10px; font-size: 9px; color: #8592a5; margin-top: 17px; }
.preview-status span:first-child { display: flex; align-items: center; gap: 5px; color: #488975; }.preview-status svg { width: 11px; height: 11px; }
.preview-floating { position: absolute; right: -12px; bottom: 112px; display: flex; align-items: center; gap: 12px; background: white; padding: 15px 20px; border: 1px solid #dce7f6; border-radius: 12px; box-shadow: 0 14px 28px -14px #26497840; animation: badge-float 6s ease-in-out infinite; }
.floating-icon { width: 34px; height: 34px; padding: 9px; color: #2463eb; background: #eff5ff; border-radius: 50%; }.floating-icon svg { width: 100%; height: 100%; }
.preview-floating strong { display: block; font-size: 12px; }.preview-floating span { color: #94a0b3; font: 9px/1.8 ui-monospace, monospace; }
.studio-preview figcaption { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 9px; color: #7c879a; margin: 35px 0 0 10px; }
.preview-motion-toggle { display: inline-flex; align-items: center; gap: 6px; border: 1px solid #dfe7f3; background: #ffffffad; border-radius: 20px; padding: 5px 10px; font-size: 9px; color: #62789a; min-height: 30px; }
.preview-motion-toggle:hover { color: var(--accent); border-color: #adc6ef; }.preview-motion-toggle > span { font-size: 12px; }
.reduced-motion-note { display: none; }
@keyframes workspace-float { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-10px) rotate(-1deg); } }
@keyframes badge-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(9px); } }
@keyframes orbit-turn { to { transform: rotate(360deg); } }
@keyframes status-pulse { 0%, 100% { opacity: .5; transform: scale(.8); } 50% { opacity: 1; transform: scale(1.2); } }
@keyframes module-build { 0%, 100% { transform: scaleX(.15); opacity: .3; } 50% { transform: scaleX(1); opacity: 1; } }
@keyframes cursor-blink { 0% { opacity: 0; } 100% { opacity: 1; } }
@keyframes flow-step { 0%, 36%, 100% { opacity: .3; transform: scale(1); } 16% { opacity: 1; transform: scale(1.4); } }
@media (max-width: 600px) {
  .studio-preview { padding: 36px 0 30px; }.preview-content { padding: 22px 16px 16px; }.preview-content h2 { font-size: 19px; }
  .preview-modules > div { padding: 10px 8px; grid-template-columns: 18px 1fr; }.preview-floating { right: 0; bottom: 88px; padding: 12px 16px; }
  .preview-window { transform: none; animation-name: badge-float; }.preview-status span:last-child { display: none; }.preview-blueprint { left: 4px; }
  .studio-preview figcaption { margin-left: 0; }.preview-orbit { max-width: 100%; }
}
</style>