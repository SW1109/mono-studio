<script setup>
import { RouterLink } from "vue-router";
</script>

<template>
  <section class="studio-hero" aria-labelledby="studio-hero-title">
    <div class="container hero-layout">
      <div class="hero-copy">
        <p class="eyebrow" data-reveal><span class="eyebrow-dot" aria-hidden="true"></span>GUANGNIAN · SOFTWARE STUDIO</p>
        <h1 id="studio-hero-title" data-reveal data-reveal-delay="80">专注软件研发<br /><span>设计与工程并重</span></h1>
        <p class="hero-description" data-reveal data-reveal-delay="160">产品设计、软件研发与系统集成。<br />网站、业务系统、小程序与自动化。</p>
        <div class="button-row" data-reveal data-reveal-delay="240">
          <RouterLink class="button button-primary" to="/services/">了解开发服务 <span aria-hidden="true">↗</span></RouterLink>
          <RouterLink class="button button-secondary" to="/products/">查看软件方案 <span aria-hidden="true">→</span></RouterLink>
        </div>
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
          </defs>
          <ellipse cx="309" cy="438" rx="210" ry="30" fill="url(#hero-purple-ground)" />
          <circle cx="302" cy="240" r="206" stroke="#b88ed3" stroke-opacity=".24" stroke-dasharray="2 10" />
          <circle cx="302" cy="240" r="176" stroke="#c29cda" stroke-opacity=".22" />
          <ellipse cx="308" cy="245" rx="227" ry="91" transform="rotate(-32 308 245)" stroke="url(#hero-purple-ring)" stroke-width="38" />
          <circle cx="308" cy="236" r="137" fill="url(#hero-purple-sphere)" />
          <path d="M198 196C221 135 298 105 354 128" stroke="#fff8ff" stroke-opacity=".5" stroke-width="1.5" stroke-linecap="round" />
          <path d="M109 319C126 359 229 342 354 269C445 216 495 164 500 145" stroke="url(#hero-purple-front)" stroke-width="38" stroke-linecap="round" />
          <path d="M109 306C141 336 235 316 348 251C427 205 479 158 490 142" stroke="#fff8ff" stroke-opacity=".7" stroke-width="1.2" stroke-linecap="round" />
          <circle cx="143" cy="116" r="6" fill="#aa72d1" /><circle cx="480" cy="354" r="4" fill="#b486d4" />
          <path d="M482 92v14m-7-7h14M127 383v10m-5-5h10" stroke="#ae80cb" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <RouterLink class="hero-statement glass-panel" to="/about/">
          <div><p>DESIGN MEETS ENGINEERING</p><strong>光年数智 · 软件研发工作室</strong></div>
          <span class="hero-statement-symbol" aria-hidden="true">↗</span>
        </RouterLink>
      </div>
      <div class="hero-bottom">
        <div class="hero-notes" aria-label="工作室服务"><span>产品研发</span><span>定制开发</span><span>持续迭代</span></div>
        <a class="hero-scroll" href="#capabilities">探索服务内容 <span aria-hidden="true">↓</span></a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.studio-hero { overflow: hidden; color: var(--ink); border-radius: 0 0 36px 36px; background: radial-gradient(ellipse at 82% 34%, rgba(204, 159, 237, .45), transparent 52%), radial-gradient(ellipse at 20% 90%, rgba(238, 214, 249, .6), transparent 55%), linear-gradient(125deg, #fcf9ff, #f6edfc 48%, #e9d8f6); }
.hero-layout { min-height: min(840px, 100svh); display: grid; grid-template-columns: 1.05fr 1fr; grid-template-rows: 1fr auto; align-items: center; column-gap: 48px; row-gap: 32px; padding-block: 148px 28px; }
.hero-copy { min-width: 0; }
.hero-copy .eyebrow { color: var(--muted); margin-bottom: 28px; letter-spacing: .13em; font-size: 11px; }
.hero-copy .eyebrow-dot { background: var(--accent); box-shadow: 0 0 0 5px rgba(158, 99, 197, .1); }
.hero-copy h1 { font-size: clamp(38px, 3.8vw, 56px); line-height: 1.45; font-weight: 500; letter-spacing: -.035em; }
.hero-copy h1 > span { color: var(--accent); }
.hero-description { color: var(--muted); font-size: 16px; line-height: 2; margin-top: 28px; }
.hero-copy .button-row { margin-top: 32px; gap: 14px; }
.hero-copy .button { min-height: 46px; font-size: 14px; padding: 10px 22px; }
.hero-copy .button-secondary { background: rgba(255, 255, 255, .72); border-color: var(--line); }
.hero-copy .button-secondary:hover { background: var(--canvas); border-color: var(--accent); }
.hero-visual { position: relative; min-width: 0; padding-bottom: 24px; }
.hero-orbit { width: 100%; height: auto; }
.hero-statement { width: min(330px, 90%); margin: -22px 0 0 auto; position: relative; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 20px 22px; border-radius: 20px; text-align: left; }
.hero-statement-symbol { flex-shrink: 0; width: 36px; height: 36px; display: grid; place-items: center; border: 1px solid var(--line); border-radius: 50%; font-size: 18px; color: var(--accent); }
.hero-statement p { color: var(--muted); font: 9px/1.8 var(--font-mono); letter-spacing: .1em; }
.hero-statement strong { display: block; font-weight: 400; font-size: 14px; margin-top: 8px; }
.hero-statement:hover { border-color: var(--accent); }
.hero-bottom { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding-top: 20px; border-top: 1px solid var(--line); }
.hero-notes { display: flex; flex-wrap: wrap; gap: 10px; }
.hero-notes > span { padding: 4px 0; font-size: 11px; color: var(--muted); letter-spacing: .04em; }
.hero-notes > span + span { border-left: 1px solid var(--line); padding-left: 16px; margin-left: 6px; }
.hero-scroll { display: flex; align-items: center; gap: 20px; min-height: 44px; font-size: 12px; color: var(--accent); }
.hero-scroll > span { width: 38px; height: 38px; display: grid; place-items: center; background: rgba(255, 255, 255, .65); border: 1px solid var(--line); border-radius: 50%; font-size: 18px; }
.hero-scroll:hover { text-decoration: underline; text-underline-offset: 5px; }
@media (min-width: 761px) and (max-height: 800px) {
  .hero-layout { padding-top: 120px; gap: 24px; }
  .hero-orbit { max-height: 390px; }
  .hero-copy h1 { font-size: clamp(36px, 3.6vw, 50px); }
}
@media (max-width: 1040px) {
  .hero-layout { column-gap: 20px; }
  .hero-copy .eyebrow { letter-spacing: .05em; font-size: 10px; }
  .hero-copy .button { padding-inline: 18px; gap: 10px; }
  .hero-statement { padding: 16px; gap: 12px; width: 100%; }
  .hero-statement strong { font-size: 12px; }
}
@media (max-width: 760px) {
  .studio-hero { border-radius: 0 0 28px 28px; }
  .hero-layout { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto; min-height: 0; padding-block: 142px 24px; row-gap: 28px; }
  .hero-copy .eyebrow { font-size: 9px; letter-spacing: .08em; margin-bottom: 22px; }
  .hero-copy h1 { font-size: clamp(30px, 8.5vw, 44px); }
  .hero-description { font-size: 15px; margin-top: 20px; }
  .hero-copy .button-row { gap: 10px; margin-top: 24px; }
  .hero-copy .button { font-size: 13px; padding-inline: 17px; }
  .hero-visual { width: 100%; max-width: 420px; margin-inline: auto; padding-bottom: 0; }
  .hero-orbit { max-height: 280px; }
  .hero-statement { width: min(310px, 92%); margin-top: -18px; }
  .hero-statement strong { font-size: 13px; }
  .hero-bottom { gap: 12px; padding-top: 16px; }
  .hero-notes { gap: 6px; }
  .hero-notes > span { font-size: 10px; }
  .hero-notes > span + span { padding-left: 12px; margin-left: 6px; }
  .hero-scroll { gap: 8px; font-size: 0; }
}
@media (max-width: 380px) {
  .hero-copy .button { padding-inline: 12px; gap: 8px; }
}
</style>
