<script setup>
import { RouterLink } from "vue-router";
</script>

<template>
  <section class="studio-hero" aria-labelledby="studio-hero-title" data-motion-scene>
    <!-- 背景层只做静态渐变 + 受场景控制的循环动效；离屏、隐藏标签页与减弱动效时自动停止。 -->
    <div class="hero-field" aria-hidden="true">
      <span class="hero-grid"></span>
      <span class="hero-glow hero-glow-a motion-loop"></span>
      <span class="hero-glow hero-glow-b motion-loop"></span>
    </div>
    <div class="container hero-layout">
      <div class="hero-copy">
        <p class="eyebrow hero-kicker" data-reveal><span class="kicker-bracket" aria-hidden="true">[</span><span class="eyebrow-dot motion-loop"></span>GUANGNIAN · SOFTWARE STUDIO<span class="kicker-bracket" aria-hidden="true">]</span></p>
        <h1 id="studio-hero-title" data-reveal data-reveal-delay="80">专注软件研发<br /><span class="hero-title-accent">设计与工程并重</span></h1>
        <p class="hero-description" data-reveal data-reveal-delay="160">产品设计、软件研发与系统集成。<br />网站、业务系统、小程序与自动化。</p>
        <div class="button-row" data-reveal data-reveal-delay="240">
          <RouterLink class="button button-primary" to="/services/">了解开发服务 <span aria-hidden="true">↗</span></RouterLink>
          <RouterLink class="button button-secondary" to="/products/">查看软件方案 <span aria-hidden="true">→</span></RouterLink>
        </div>
        <dl class="hero-specs" data-reveal data-reveal-delay="320">
          <div><dt>交付形态</dt><dd>远程人工实施</dd></div>
          <div><dt>源码归属</dt><dd>项目完整交接</dd></div>
          <div><dt>验收方式</dt><dd>按约定范围验收</dd></div>
        </dl>
      </div>
      <div class="hero-visual">
        <!-- 静态矢量在窄屏上独立排版，不再依赖整屏图片调色、模糊或持续渲染。 -->
        <svg class="hero-orbit" viewBox="0 0 600 500" fill="none" aria-hidden="true" focusable="false">
          <defs>
            <radialGradient id="hero-purple-sphere" cx=".3" cy=".2" r=".86">
              <stop stop-color="#fff8ff" /><stop offset=".3" stop-color="#eacbfa" /><stop offset=".67" stop-color="#ba83df" /><stop offset="1" stop-color="#74419e" />
            </radialGradient>
            <linearGradient id="hero-purple-ring" x1="113" y1="138" x2="478" y2="365" gradientUnits="userSpaceOnUse">
              <stop stop-color="#e1bbf5" /><stop offset=".32" stop-color="#faf1ff" /><stop offset=".56" stop-color="#cba0e9" /><stop offset="1" stop-color="#9758c7" />
            </linearGradient>
            <linearGradient id="hero-purple-front" x1="127" y1="326" x2="495" y2="194" gradientUnits="userSpaceOnUse">
              <stop stop-color="#9253bc" /><stop offset=".43" stop-color="#c397e3" /><stop offset=".7" stop-color="#f5e6ff" /><stop offset="1" stop-color="#ae72d2" />
            </linearGradient>
            <radialGradient id="hero-purple-ground">
              <stop stop-color="#c9a4e4" stop-opacity=".48" /><stop offset="1" stop-color="#dbc1ef" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="hero-halo" cx=".5" cy=".5" r=".5">
              <stop stop-color="#e6c8fa" stop-opacity=".55" /><stop offset=".62" stop-color="#e6c8fa" stop-opacity=".16" /><stop offset="1" stop-color="#e6c8fa" stop-opacity="0" />
            </radialGradient>
          </defs>
          <circle class="hero-halo" cx="302" cy="238" r="248" fill="url(#hero-halo)" />
          <ellipse cx="309" cy="438" rx="210" ry="30" fill="url(#hero-purple-ground)" />
          <g class="hero-ring-dashes motion-loop">
            <circle cx="302" cy="240" r="206" stroke="#b88ed3" stroke-opacity=".26" stroke-dasharray="2 10" />
            <circle cx="302" cy="240" r="228" stroke="#c29cda" stroke-opacity=".18" stroke-dasharray="1 16" />
          </g>
          <g class="hero-ring-ticks motion-loop">
            <circle cx="302" cy="240" r="176" stroke="#c29cda" stroke-opacity=".22" />
            <path d="M302 56v14M486 240h-14M302 424v-14M118 240h14" stroke="#a97bd0" stroke-opacity=".5" stroke-width="1.5" stroke-linecap="round" />
          </g>
          <g class="hero-sphere-body motion-loop">
            <ellipse cx="308" cy="245" rx="227" ry="91" transform="rotate(-32 308 245)" stroke="url(#hero-purple-ring)" stroke-width="38" />
            <circle cx="308" cy="236" r="137" fill="url(#hero-purple-sphere)" />
            <path d="M198 196C221 135 298 105 354 128" stroke="#fff8ff" stroke-opacity=".5" stroke-width="1.5" stroke-linecap="round" />
            <path d="M109 319C126 359 229 342 354 269C445 216 495 164 500 145" stroke="url(#hero-purple-front)" stroke-width="38" stroke-linecap="round" />
            <path d="M109 306C141 336 235 316 348 251C427 205 479 158 490 142" stroke="#fff8ff" stroke-opacity=".7" stroke-width="1.2" stroke-linecap="round" />
          </g>
          <circle class="hero-satellite motion-loop" cx="143" cy="116" r="6" fill="#aa72d1" />
          <circle cx="480" cy="354" r="4" fill="#b486d4" />
          <path d="M482 92v14m-7-7h14M127 383v10m-5-5h10" stroke="#ae80cb" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <RouterLink class="hero-statement glass-panel" to="/about/">
          <div><p>DESIGN MEETS ENGINEERING</p><strong>光年数智 · 软件研发工作室</strong></div>
          <span class="hero-statement-symbol" aria-hidden="true">↗</span>
        </RouterLink>
      </div>
      <div class="hero-bottom">
        <nav class="hero-jumps" aria-label="首页内容导航">
          <a href="#capabilities">服务能力</a><a href="#solutions">软件方案</a><a href="#process">合作流程</a>
        </nav>
        <a class="hero-scroll" href="#capabilities">探索服务内容 <span aria-hidden="true">↓</span></a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.studio-hero { position: relative; isolation: isolate; overflow: hidden; color: var(--ink); border-radius: 0 0 36px 36px; background: radial-gradient(ellipse at 82% 34%, rgba(204, 159, 237, .45), transparent 52%), radial-gradient(ellipse at 20% 90%, rgba(238, 214, 249, .6), transparent 55%), linear-gradient(125deg, #fcf9ff, #f6edfc 48%, #e9d8f6); }
.hero-field { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
.hero-grid { position: absolute; inset: -10% -6%; background-image: linear-gradient(rgba(119, 66, 176, .12) 1px, transparent 1px), linear-gradient(90deg, rgba(119, 66, 176, .12) 1px, transparent 1px); background-size: 72px 72px; -webkit-mask-image: radial-gradient(ellipse 74% 66% at 66% 44%, #000 12%, transparent 76%); mask-image: radial-gradient(ellipse 74% 66% at 66% 44%, #000 12%, transparent 76%); }
.hero-glow { position: absolute; border-radius: 50%; filter: blur(70px); }
.hero-glow-a { width: 46%; aspect-ratio: 1; right: 4%; top: 12%; background: radial-gradient(circle, rgba(196, 145, 235, .5), transparent 68%); }
.hero-glow-b { width: 38%; aspect-ratio: 1; left: -6%; bottom: -12%; background: radial-gradient(circle, rgba(238, 214, 249, .75), transparent 70%); }
.hero-layout { position: relative; min-height: min(840px, 100svh); display: grid; grid-template-columns: 1.05fr 1fr; grid-template-rows: 1fr auto; align-items: center; column-gap: 48px; row-gap: 32px; padding-block: 148px 28px; }
.hero-copy { min-width: 0; }
.hero-kicker { color: var(--muted); margin-bottom: 28px; letter-spacing: .16em; font-size: 11px; gap: 12px; }
.kicker-bracket { color: var(--accent); opacity: .5; }
.hero-kicker .eyebrow-dot { background: var(--accent); box-shadow: 0 0 0 5px rgba(158, 99, 197, .1); animation: hero-pulse 3.2s ease-in-out infinite; }
@keyframes hero-pulse { 50% { box-shadow: 0 0 0 8px rgba(158, 99, 197, .04); } }
.hero-copy h1 { font-size: clamp(42px, 4.6vw, 68px); line-height: 1.16; font-weight: 600; letter-spacing: -.042em; }
.hero-title-accent { display: inline-block; position: relative; color: var(--accent); background: linear-gradient(96deg, #5f2f9b, #7c46b8 46%, #a76bd4); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.hero-description { color: var(--muted); font-size: 16px; line-height: 2; margin-top: 28px; }
.hero-copy .button-row { margin-top: 34px; gap: 14px; }
.hero-copy .button { min-height: 46px; font-size: 14px; padding: 10px 22px; }
.hero-copy .button-secondary { background: rgba(255, 255, 255, .72); border-color: var(--line); }
.hero-copy .button-secondary:hover { background: var(--canvas); border-color: var(--accent); }
.hero-specs { display: flex; flex-wrap: wrap; gap: 0 34px; margin-top: 44px; padding-top: 22px; border-top: 1px solid var(--line); }
.hero-specs > div { display: grid; gap: 5px; }
.hero-specs dt { font: 10px/1.6 var(--font-mono); letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
.hero-specs dd { font-size: 13.5px; color: var(--ink); }
.hero-visual { position: relative; min-width: 0; padding-bottom: 24px; }
.hero-orbit { width: 100%; height: auto; }
.hero-halo { opacity: .8; }
.hero-ring-dashes, .hero-ring-ticks { transform-box: view-box; transform-origin: 302px 240px; }
.hero-ring-dashes { animation: hero-spin 96s linear infinite; }
.hero-ring-ticks { animation: hero-spin-reverse 132s linear infinite; }
.hero-sphere-body { transform-box: view-box; transform-origin: 308px 240px; animation: hero-float 11s ease-in-out infinite; }
.hero-satellite { transform-box: view-box; transform-origin: 308px 240px; animation: hero-spin 26s linear infinite; }
@keyframes hero-spin { to { transform: rotate(360deg); } }
@keyframes hero-spin-reverse { to { transform: rotate(-360deg); } }
@keyframes hero-float { 50% { transform: translate3d(0, -9px, 0); } }
.hero-statement { width: min(330px, 90%); margin: -22px 0 0 auto; position: relative; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 20px 22px; border-radius: 20px; text-align: left; }
.hero-statement-symbol { flex-shrink: 0; width: 36px; height: 36px; display: grid; place-items: center; border: 1px solid var(--line); border-radius: 50%; font-size: 18px; color: var(--accent); }
.hero-statement p { color: var(--muted); font: 9px/1.8 var(--font-mono); letter-spacing: .1em; }
.hero-statement strong { display: block; font-weight: 400; font-size: 14px; margin-top: 8px; }
.hero-statement:hover { border-color: var(--accent); }
.hero-bottom { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding-top: 20px; border-top: 1px solid var(--line); }
.hero-jumps { display: flex; flex-wrap: wrap; gap: 10px; }
.hero-jumps > a { padding: 4px 0; font-size: 11px; color: var(--muted); letter-spacing: .04em; transition: color .2s; }
.hero-jumps > a:hover { color: var(--accent); }
.hero-jumps > a + a { border-left: 1px solid var(--line); padding-left: 16px; margin-left: 6px; }
.hero-scroll { display: flex; align-items: center; gap: 20px; min-height: 44px; font-size: 12px; color: var(--accent); }
.hero-scroll > span { width: 38px; height: 38px; display: grid; place-items: center; background: rgba(255, 255, 255, .65); border: 1px solid var(--line); border-radius: 50%; font-size: 18px; }
.hero-scroll:hover { text-decoration: underline; text-underline-offset: 5px; }
@media (min-width: 761px) and (max-height: 800px) {
  .hero-layout { padding-top: 120px; gap: 24px; }
  .hero-orbit { max-height: 390px; }
  .hero-copy h1 { font-size: clamp(38px, 4vw, 54px); }
  .hero-specs { margin-top: 30px; }
}
@media (max-width: 1040px) {
  .hero-layout { column-gap: 20px; }
  .hero-copy h1 { font-size: clamp(36px, 5.4vw, 48px); }
  .hero-kicker { letter-spacing: .08em; font-size: 10px; }
  .hero-copy .button { padding-inline: 18px; gap: 10px; }
  .hero-specs { gap: 0 22px; }
  .hero-statement { padding: 16px; gap: 12px; width: 100%; }
  .hero-statement strong { font-size: 12px; }
}
@media (max-width: 760px) {
  .studio-hero { border-radius: 0 0 28px 28px; }
  .hero-layout { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto; min-height: 0; padding-block: 142px 24px; row-gap: 28px; }
  .hero-grid { background-size: 54px 54px; }
  .hero-glow-a { width: 68%; right: -10%; top: 6%; }
  .hero-copy h1 { font-size: clamp(32px, 9vw, 46px); line-height: 1.2; }
  .hero-kicker { font-size: 9px; letter-spacing: .1em; margin-bottom: 22px; }
  .hero-description { font-size: 15px; margin-top: 20px; }
  .hero-copy .button-row { gap: 10px; margin-top: 24px; }
  .hero-copy .button { font-size: 13px; padding-inline: 17px; }
  .hero-specs { margin-top: 28px; padding-top: 18px; gap: 14px 20px; }
  .hero-specs > div { min-width: 96px; }
  .hero-visual { width: 100%; max-width: 420px; margin-inline: auto; padding-bottom: 0; }
  .hero-orbit { max-height: 280px; }
  .hero-statement { width: min(310px, 92%); margin-top: -18px; }
  .hero-statement strong { font-size: 13px; }
  .hero-bottom { gap: 12px; padding-top: 16px; }
  .hero-jumps { gap: 6px; }
  .hero-jumps > a { font-size: 10px; }
  .hero-jumps > a + a { padding-left: 12px; margin-left: 6px; }
  .hero-scroll { gap: 8px; font-size: 0; }
}
@media (max-width: 380px) {
  .hero-copy .button { padding-inline: 12px; gap: 8px; }
}
</style>
