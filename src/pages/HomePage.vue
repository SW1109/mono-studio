<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import SiteNavLink from "../components/site/SiteNavLink.vue";
import SiteIcon from "../components/site/SiteIcon.vue";
import { services } from "../content/services.js";
import { featuredProducts, productPath } from "../content/products.js";
import { caseStudies, caseStudyPath } from "../content/caseStudies.js";
import { process, site } from "../content/site.js";
import { onSmoothScroll, startSmoothScroll } from "../composables/smoothScroll.js";
import { splitTitle } from "../composables/splitTitle.js";

// 每个章节对应背景里的一种光点形态与主色；文字内容仍来自 content/，SSR 输出完整可读。
const palette = ["#9ba5ff", "#7fb2ff", "#91cfb4", "#e7c07c", "#c3a0ff", "#f0a6c8"];
const headlines = {
  web: "让业务，在浏览器里运转。",
  miniapp: "把服务，装进用户的手机。",
  desktop: "重复的操作，交给顺手的工具。",
  automation: "让数据，在系统之间自己流动。",
};
const chapters = services.map((service, index) => {
  const headline = headlines[service.id] || service.title;
  return {
    ...service,
    anchor: `home-${service.id}`,
    headline,
    lines: splitTitle(headline),
    scene: index + 1,
    color: palette[index + 1],
    side: index % 2 ? "right" : "left",
  };
});
const heroChars = [..."光年数智"];
const marqueeTop = ["网站与管理系统", "WEB", "小程序与 H5", "MOBILE", "桌面工具软件", "DESKTOP", "自动化与系统集成", "AUTOMATION"];
const marqueeBottom = ["源码交接", "SOURCE", "分阶段验收", "MILESTONES", "直接沟通", "DIRECT", "按约定交付", "DELIVERY"];
const specs = [
  { label: "沟通方式", value: "直接与开发者讨论业务、确认界面、核对版本" },
  { label: "服务方式", value: site.identity.serviceMode },
  { label: "范围与费用", value: "功能范围、费用和排期在开工前确认" },
  { label: "验收方式", value: "分阶段提供可运行版本，按约定逐项验收" },
  { label: "交付内容", value: "源码、部署说明与项目资料交接" },
];
const works = featuredProducts.slice(0, 3);
const rail = [
  ...chapters.map(chapter => ({ id: chapter.anchor, number: chapter.number, label: chapter.title })),
  { id: "home-process", number: "05", label: "项目协作" },
  { id: "home-work", number: "06", label: "方案与实录" },
  { id: "home-contact", number: "07", label: "项目咨询" },
];

const root = ref(null);
const canvas = ref(null);
const progressBar = ref(null);
const active = ref("top");
const hud = computed(() => rail.find(item => item.id === active.value));

let scene;
let lenis;
let context;
let skewTo;
let disposed = false;
let pendingState = { index: 0, color: palette[0], side: "left", scale: 1, dim: 1 };
const cleanups = [];

function sceneState(section) {
  return {
    index: Number(section.dataset.scene) || 0,
    color: section.dataset.color || palette[0],
    side: section.dataset.side || "center",
    scale: Number(section.dataset.scale) || 1,
    dim: Number(section.dataset.dim) || 1,
  };
}

function activate(section, gsap) {
  active.value = section.id;
  pendingState = sceneState(section);
  scene?.go(pendingState.index, pendingState);
  if (gsap) gsap.to(root.value, { "--home-light": pendingState.color, duration: 0.9, ease: "power2.out", overwrite: "auto" });
  else root.value?.style.setProperty("--home-light", pendingState.color);
}

function jump(event, id) {
  const target = document.getElementById(id);
  if (!target || !lenis) return;
  event.preventDefault();
  lenis.scrollTo(target, { offset: id === "top" ? 0 : -24, duration: 1.6 });
}

onMounted(async () => {
  const html = document.documentElement;
  html.dataset.page = "home";
  const syncTop = () => html.toggleAttribute("data-home-top", window.scrollY < 24);
  syncTop();
  window.addEventListener("scroll", syncTop, { passive: true });
  cleanups.push(() => {
    window.removeEventListener("scroll", syncTop);
    delete html.dataset.page;
    html.removeAttribute("data-home-top");
  });

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 三维背景失败时保留静态光晕，不影响任何内容与导航。
  import("../components/home/lightyear-scene.js")
    .then(({ createLightyearScene }) => {
      if (disposed || !canvas.value) return;
      scene = createLightyearScene(canvas.value, { reduced });
      scene.go(pendingState.index, pendingState);
    })
    .catch(() => { if (canvas.value) canvas.value.hidden = true; });

  let gsap;
  let ScrollTrigger;
  try {
    [{ gsap }, { ScrollTrigger }, lenis] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger"), startSmoothScroll()]);
  } catch {
    return; // 动效库不可用时，页面按普通文档滚动阅读。
  }
  if (disposed || !root.value) return;
  gsap.registerPlugin(ScrollTrigger);

  // 平滑滚动由全站共用（App 中启动），这里只接入 ScrollTrigger 与背景扰动。
  if (lenis) {
    cleanups.push(onSmoothScroll(event => {
      ScrollTrigger.update();
      scene?.setVelocity(event.velocity);
      skewTo?.(gsap.utils.clamp(-8, 8, event.velocity * -0.35));
    }));
  }

  context = gsap.context(() => {
    gsap.to(progressBar.value, { scaleX: 1, ease: "none", scrollTrigger: { trigger: root.value, start: "top top", end: "bottom bottom", scrub: true } });

    const triggers = [...root.value.querySelectorAll("[data-scene]")].map(section => ScrollTrigger.create({
      trigger: section,
      start: "top 55%",
      end: "bottom 55%",
      onToggle: self => { if (self.isActive) activate(section, gsap); },
    }));
    ScrollTrigger.refresh();
    const current = triggers.find(trigger => trigger.isActive);
    if (current) activate(current.trigger, gsap);

    if (reduced) return;

    const lineIn = { clipPath: "inset(0% 0% 0% 0%)", yPercent: 0 };
    const lineOut = { clipPath: "inset(100% 0% 0% 0%)", yPercent: 60 };

    // 首屏：逐字翻起，副标题按行升起，其余信息随后淡入。
    gsap.timeline({ defaults: { ease: "expo.out" } })
      .fromTo(".hero-char", { yPercent: 115, rotateX: -75, opacity: 0 }, { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.6, stagger: 0.08 })
      .fromTo(".hero-title .line-inner", lineOut, { ...lineIn, duration: 1.4 }, 0.35)
      .from("[data-hero-fade]", { opacity: 0, y: 28, duration: 1.2, stagger: 0.08 }, 0.55)
      .from(".hero-index a", { opacity: 0, y: 20, duration: 1, stagger: 0.06 }, 0.75);
    gsap.to(".hero-word", { yPercent: -18, scale: 0.94, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".home-hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero-foot", { yPercent: -30, opacity: 0, ease: "none", scrollTrigger: { trigger: ".home-hero", start: "35% top", end: "bottom top", scrub: true } });

    // 横向字带：滚动推动方向相反的两行，滚动速度带来倾斜。
    for (const band of gsap.utils.toArray(".marquee-band")) {
      gsap.fromTo(band.querySelector(".row-a .marquee-track"), { xPercent: 0 }, { xPercent: -32, ease: "none", scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.fromTo(band.querySelector(".row-b .marquee-track"), { xPercent: -32 }, { xPercent: 0, ease: "none", scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: true } });
    }
    skewTo = gsap.quickTo(".marquee-track", "skewX", { duration: 0.6, ease: "power3.out" });

    for (const chapter of gsap.utils.toArray(".home-chapter")) {
      const block = chapter.querySelector(".chapter-block");
      gsap.timeline({ scrollTrigger: { trigger: block, start: "top 80%", once: true } })
        .from(chapter.querySelector(".chapter-eyebrow"), { opacity: 0, x: -24, duration: 0.9, ease: "power3.out" })
        .fromTo(chapter.querySelectorAll(".chapter-title .line-inner"), lineOut, { ...lineIn, duration: 1.3, stagger: 0.12, ease: "expo.out" }, 0.05)
        .from(chapter.querySelectorAll("[data-item]"), { opacity: 0, y: 30, duration: 1, stagger: 0.06, ease: "power3.out" }, 0.35);
      gsap.fromTo(chapter.querySelector(".chapter-ghost"), { yPercent: 30, scale: 0.86 }, { yPercent: -30, scale: 1.08, ease: "none", scrollTrigger: { trigger: chapter, start: "top bottom", end: "bottom top", scrub: true } });
    }

    gsap.fromTo(".process-head .line-inner", lineOut, { ...lineIn, duration: 1.3, stagger: 0.12, ease: "expo.out", scrollTrigger: { trigger: ".home-process", start: "top 70%", once: true } });
    gsap.from(".home-process [data-item]", { opacity: 0, y: 32, duration: 1.1, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: ".home-process", start: "top 70%", once: true } });
    gsap.from(".process-steps li", { opacity: 0, y: 60, duration: 1.1, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".process-steps", start: "top 82%", once: true } });
    gsap.fromTo(".step-bar", { scaleX: 0 }, { scaleX: 1, ease: "none", stagger: 0.3, scrollTrigger: { trigger: ".process-steps", start: "top 75%", end: "bottom 40%", scrub: true } });
    gsap.from(".spec-sheet > div", { opacity: 0, x: -32, duration: 0.9, stagger: 0.06, ease: "power3.out", scrollTrigger: { trigger: ".spec-sheet", start: "top 82%", once: true } });

    gsap.fromTo(".home-work .work-heading .line-inner", lineOut, { ...lineIn, duration: 1.3, stagger: 0.12, ease: "expo.out", scrollTrigger: { trigger: ".home-work", start: "top 70%", once: true } });
    gsap.from(".home-work [data-item]", { opacity: 0, y: 32, duration: 1.1, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: ".home-work", start: "top 70%", once: true } });
    for (const list of gsap.utils.toArray(".work-list")) {
      gsap.from(list.querySelectorAll("li"), { opacity: 0, y: 40, duration: 1, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: list, start: "top 85%", once: true } });
    }

    gsap.fromTo(".contact-title .line-inner", lineOut, { ...lineIn, duration: 1.5, stagger: 0.14, ease: "expo.out", scrollTrigger: { trigger: ".home-contact", start: "top 65%", once: true } });
    gsap.from(".home-contact [data-item]", { opacity: 0, y: 24, duration: 1, stagger: 0.08, ease: "power3.out", delay: 0.3, scrollTrigger: { trigger: ".home-contact", start: "top 65%", once: true } });
  }, root.value);

  // 键盘聚焦到尚未播放入场动画的内容时，立即显示。
  const reveal = event => {
    for (const tween of gsap.getTweensOf(event.target.closest("[data-item], li, [data-hero-fade], .hero-index a") || [])) tween.progress(1);
  };
  root.value.addEventListener("focusin", reveal);
  cleanups.push(() => root.value?.removeEventListener("focusin", reveal));
});

onBeforeUnmount(() => {
  disposed = true;
  skewTo = undefined;
  context?.revert();
  lenis = undefined;
  scene?.dispose();
  cleanups.forEach(cleanup => cleanup());
});
</script>

<template>
  <div ref="root" class="home" :style="{ '--home-light': palette[0] }">
    <div class="home-stage" aria-hidden="true">
      <div class="stage-glow"></div>
      <canvas ref="canvas"></canvas>
      <div class="stage-vignette"></div>
      <div class="stage-grain"></div>
    </div>
    <div class="home-progress" aria-hidden="true"><span ref="progressBar"></span></div>

    <nav class="chapter-rail" :class="{ 'is-hidden': active === 'top' }" aria-label="首页章节">
      <a v-for="item in rail" :key="item.id" :href="`#${item.id}`" :class="{ 'is-active': active === item.id }" :aria-current="active === item.id ? 'true' : undefined" @click="jump($event, item.id)">
        <span class="rail-label">{{ item.label }}</span><span class="rail-num">{{ item.number }}</span><span class="rail-dot"></span>
      </a>
    </nav>
    <div class="home-hud" :class="{ 'is-hidden': !hud }" aria-hidden="true"><span class="hud-swatch"></span><span>{{ hud?.number || "00" }}</span><span>{{ hud?.label || "光年数智" }}</span></div>

    <section id="top" class="home-hero" data-scene="0" :data-color="palette[0]" data-side="left" aria-labelledby="home-title">
      <div class="home-shell hero-shell">
        <p class="home-eyebrow hero-eyebrow" data-hero-fade><i></i>独立软件工作室 · GUANGNIAN DIGITAL · {{ site.domain }}</p>
        <h1 id="home-title" class="hero-title">
          <span class="sr-only">光年数智，把想法做成软件。</span>
          <span class="hero-word" aria-hidden="true"><span v-for="(char, index) in heroChars" :key="index" class="char-mask"><span class="hero-char">{{ char }}</span></span></span>
          <span class="line-mask" aria-hidden="true"><span class="line-inner hero-title-sub">把想法，<em>做成软件。</em></span></span>
        </h1>
        <div class="hero-foot">
          <p class="hero-lead" data-hero-fade>网站、管理系统、小程序与自动化。<br />直接与开发者沟通，按约定交付源码与部署说明。</p>
          <div class="pill-row" data-hero-fade>
            <SiteNavLink class="pill pill-primary" to="/shop/">选购技术服务 <span aria-hidden="true">↗</span></SiteNavLink>
            <a class="pill pill-ghost" :href="`#${chapters[0].anchor}`" @click="jump($event, chapters[0].anchor)">定制开发 <span aria-hidden="true">↓</span></a>
          </div>
        </div>
      </div>
      <nav class="home-shell hero-index" aria-label="开发服务">
        <a v-for="chapter in chapters" :key="chapter.id" :href="`#${chapter.anchor}`" :style="{ '--chip': chapter.color }" @click="jump($event, chapter.anchor)"><span>{{ chapter.number }}</span><strong>{{ chapter.title }}</strong><em>{{ chapter.tag }}</em></a>
      </nav>
    </section>

    <div class="marquee-band" aria-hidden="true">
      <div class="marquee-row row-a"><div class="marquee-track"><template v-for="n in 3" :key="n"><span v-for="word in marqueeTop" :key="`${n}-${word}`">{{ word }}<i>✦</i></span></template></div></div>
      <div class="marquee-row row-b"><div class="marquee-track"><template v-for="n in 3" :key="n"><span v-for="word in marqueeBottom" :key="`${n}-${word}`">{{ word }}<i>/</i></span></template></div></div>
    </div>

    <section v-for="chapter in chapters" :id="chapter.anchor" :key="chapter.id" class="home-chapter" :class="`is-${chapter.side}`" :data-scene="chapter.scene" :data-color="chapter.color" :data-side="chapter.side" :aria-labelledby="`${chapter.anchor}-title`">
      <span class="chapter-ghost" aria-hidden="true">{{ chapter.number }}</span>
      <div class="home-shell">
        <div class="chapter-block">
          <p class="home-eyebrow chapter-eyebrow"><i></i>{{ chapter.number }} / {{ chapter.title }} · {{ chapter.tag }}</p>
          <h2 :id="`${chapter.anchor}-title`" class="chapter-title">
            <span v-for="(line, index) in chapter.lines" :key="line" class="line-mask"><span class="line-inner" :class="{ 'is-accent': index === chapter.lines.length - 1 }">{{ line }}</span></span>
          </h2>
          <p class="chapter-body" data-item>{{ chapter.description }}</p>
          <dl class="chapter-meta" data-item><dt>适用场景</dt><dd>{{ chapter.scenarios }}</dd></dl>
          <ul class="chapter-deliverables">
            <li v-for="(item, index) in chapter.deliverables" :key="item" data-item><span>0{{ index + 1 }}</span>{{ item }}</li>
          </ul>
          <RouterLink class="chapter-link" :to="`/services/#${chapter.id}`" data-item><span>查看{{ chapter.title }}服务</span><SiteIcon name="arrow" /></RouterLink>
        </div>
      </div>
    </section>

    <section id="home-process" class="home-process" data-scene="5" :data-color="palette[5]" data-side="center" data-scale="0.9" data-dim="0.5" aria-labelledby="home-process-title">
      <div class="home-shell">
        <div class="process-head">
          <div>
            <p class="home-eyebrow" data-item><i></i>05 / 项目协作 · PROCESS</p>
            <h2 id="home-process-title" class="mega-title">
              <span class="line-mask"><span class="line-inner">每一步，</span></span>
              <span class="line-mask"><span class="line-inner is-accent">都有明确交付。</span></span>
            </h2>
          </div>
          <p class="section-lead" data-item>范围、费用和时间提前确认。<br />分阶段看版本，按约定逐项验收。</p>
        </div>
        <ol class="process-steps">
          <li v-for="(step, index) in process" :key="step.title"><i class="step-bar"></i><span class="step-num">0{{ index + 1 }}</span><h3>{{ step.title }}</h3><p>{{ step.description }}</p></li>
        </ol>
        <dl class="spec-sheet">
          <div v-for="(row, index) in specs" :key="row.label"><span>{{ String(index + 1).padStart(2, "0") }}</span><dt>{{ row.label }}</dt><dd>{{ row.value }}</dd></div>
        </dl>
      </div>
    </section>

    <section id="home-work" class="home-work" data-scene="0" :data-color="palette[0]" data-side="right" data-scale="0.75" data-dim="0.4" aria-labelledby="home-work-title">
      <div class="home-shell">
        <p class="home-eyebrow" data-item><i></i>06 / 方案与实录 · SELECTED WORK</p>
        <h2 id="home-work-title" class="mega-title work-heading">
          <span class="line-mask"><span class="line-inner">从常见需求，</span></span>
          <span class="line-mask"><span class="line-inner is-accent">找到起点。</span></span>
        </h2>
        <div class="work-group">
          <p class="work-label" data-item><span>软件方案 · SOLUTIONS</span><RouterLink to="/products/">全部方案 ↗</RouterLink></p>
          <ul class="work-list">
            <li v-for="(item, index) in works" :key="item.slug"><RouterLink :to="productPath(item)"><span class="work-idx">0{{ index + 1 }}</span><strong>{{ item.name }}</strong><span class="work-summary">{{ item.summary }}</span><span class="work-cat">{{ item.category }}</span><SiteIcon name="arrow" /></RouterLink></li>
          </ul>
          <p class="work-note">界面为方案示意。功能、周期与交付范围，以项目约定为准。</p>
        </div>
        <div class="work-group">
          <p class="work-label" data-item><span>本站项目实录 · CASE RECORDS</span><RouterLink to="/projects/">全部实录 ↗</RouterLink></p>
          <ul class="work-list">
            <li v-for="(item, index) in caseStudies" :key="item.slug"><RouterLink :to="caseStudyPath(item)"><span class="work-idx">0{{ index + 1 }}</span><strong>{{ item.title }}</strong><span class="work-summary">{{ item.summary }}</span><span class="work-cat">本站实录 · {{ item.category }}</span><SiteIcon name="arrow" /></RouterLink></li>
          </ul>
        </div>
      </div>
    </section>

    <div class="marquee-band is-outro" aria-hidden="true">
      <div class="marquee-row row-a"><div class="marquee-track"><template v-for="n in 3" :key="n"><span v-for="word in ['开始一个项目', 'LET’S BUILD', '聊聊你的想法', 'GET IN TOUCH']" :key="`${n}-${word}`">{{ word }}<i>✦</i></span></template></div></div>
      <div class="marquee-row row-b"><div class="marquee-track"><template v-for="n in 3" :key="n"><span v-for="word in ['光年数智', 'GUANGNIAN', 'DESIGN', 'BUILD', 'KEEP GOING']" :key="`${n}-${word}`">{{ word }}<i>/</i></span></template></div></div>
    </div>

    <section id="home-contact" class="home-contact" data-scene="5" :data-color="palette[0]" data-side="center" data-scale="1.2" aria-labelledby="home-contact-title">
      <div class="contact-inner">
        <p class="home-eyebrow" data-item><i></i>07 / 项目咨询 · CONTACT</p>
        <h2 id="home-contact-title" class="contact-title">
          <span class="line-mask"><span class="line-inner">有个项目，</span></span>
          <span class="line-mask"><span class="line-inner is-accent">一起聊聊。</span></span>
        </h2>
        <p class="section-lead" data-item>说说你想做什么、遇到了什么问题，以及希望什么时候完成。</p>
        <div class="pill-row" data-item>
          <RouterLink class="pill pill-primary pill-lg" to="/contact/">联系工作室 <span aria-hidden="true">↗</span></RouterLink>
          <SiteNavLink class="pill pill-ghost pill-lg" to="/shop/">进入服务商城 <span aria-hidden="true">↗</span></SiteNavLink>
        </div>
        <p class="contact-direct" data-item><a :href="`mailto:${site.email}`">{{ site.email }}</a><i>·</i><span>微信 {{ site.wechat }}</span><i>·</i><RouterLink to="/guides/">服务选购指南</RouterLink></p>
      </div>
    </section>
  </div>
</template>

<style>
/* 首页顶部时导航透明，露出三维舞台。Lenis 全局规则见 styles/main.css。 */
:root[data-page="home"] .site-header { transition: background .35s ease, border-color .35s ease; }
:root[data-page="home"][data-home-top] .site-header { background: transparent; border-bottom-color: transparent; -webkit-backdrop-filter: none; backdrop-filter: none; }
</style>

<style scoped>
.home { position: relative; overflow-x: clip; --hair: rgba(255, 255, 255, .08); --home-light: #9ba5ff; --display-weight: 700; }
.home > section, .home > .marquee-band { position: relative; z-index: 1; }
.home-shell { width: min(1360px, calc(100% - 112px)); margin-inline: auto; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

/* 背景舞台 */
.home-stage { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.home-stage canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; opacity: 0; transition: opacity 1.6s ease; }
.home-stage canvas[data-ready] { opacity: 1; }
.stage-glow { position: absolute; inset: 0; background: radial-gradient(40% 50% at 70% 44%, color-mix(in srgb, var(--home-light) 18%, transparent), transparent 72%); }
.stage-vignette { position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, transparent 50%, rgba(8, 9, 11, .9) 100%); }
.stage-grain { position: absolute; inset: 0; opacity: .06; mix-blend-mode: overlay; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
.home-progress { position: fixed; inset: 0 0 auto; height: 2px; z-index: 40; pointer-events: none; }
.home-progress span { display: block; height: 100%; background: var(--home-light); transform: scaleX(0); transform-origin: 0 50%; box-shadow: 0 0 14px var(--home-light); }

/* 通用排版：大字号、紧字距、渐变强调 */
.home-eyebrow { display: flex; align-items: center; gap: 12px; font: 500 11px/1.6 var(--font-mono); letter-spacing: .18em; text-transform: uppercase; color: var(--home-light); margin-bottom: 28px; }
.home-eyebrow > i { width: 28px; height: 1px; flex-shrink: 0; background: currentColor; box-shadow: 0 0 8px currentColor; }
.home h2 { font-family: var(--font-display); font-weight: var(--display-weight); letter-spacing: -.03em; line-height: 1.06; }
.is-accent, .hero-title-sub em { font-style: normal; background: linear-gradient(100deg, #fff 0%, var(--home-light) 55%, color-mix(in srgb, var(--home-light) 55%, #fff) 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
.mega-title { font-size: clamp(40px, 5.2vw, 88px); }
.section-lead { font-size: 17px; line-height: 1.9; color: var(--muted); max-width: 440px; }
.line-mask { display: block; overflow: hidden; padding-bottom: .1em; margin-bottom: -.06em; }
.line-inner { display: block; will-change: clip-path, transform; }
.pill-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.pill { position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 10px; height: 52px; padding: 0 26px; border-radius: 999px; border: 1px solid transparent; font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; isolation: isolate; transition: transform .3s var(--ease-out), box-shadow .3s ease, border-color .3s ease, color .3s ease; }
.pill > span { font-size: 16px; line-height: 1; transition: transform .3s var(--ease-out); }
.pill::before { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; background: var(--home-light); transform: translateY(101%); transition: transform .45s var(--ease-out); }
.pill:hover { transform: translateY(-2px); box-shadow: 0 0 40px color-mix(in srgb, var(--home-light) 50%, transparent), 0 8px 22px rgba(0, 0, 0, .5); }
.pill:hover::before { transform: none; }
.pill:hover > span { transform: translate(3px, -3px); }
.pill:active { transform: translateY(0); }
.pill-primary { background: #f4f5f7; color: #08090b; }
.pill-primary:hover { color: #08090b; }
.pill-ghost { background: rgba(15, 16, 18, .45); border-color: rgba(255, 255, 255, .16); color: var(--ink); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }
.pill-ghost:hover { color: #08090b; border-color: var(--home-light); }
.pill-lg { height: 60px; padding: 0 34px; font-size: 15px; }

/* 章节导航与状态 */
.chapter-rail { position: fixed; right: 24px; top: 50%; z-index: 25; display: flex; flex-direction: column; gap: 14px; transform: translateY(-50%); transition: opacity .4s ease; }
.chapter-rail.is-hidden { opacity: 0; pointer-events: none; }
.chapter-rail a { display: flex; align-items: center; justify-content: flex-end; gap: 10px; min-height: 22px; font: 11px/1 var(--font-mono); color: var(--muted); }
.rail-label { font: 12px/1 var(--theme-font-body); color: var(--ink); opacity: 0; transform: translateX(6px); transition: opacity .25s ease, transform .25s ease; white-space: nowrap; }
.rail-num { opacity: .6; transition: color .25s ease, opacity .25s ease; }
.rail-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--theme-line-strong); transition: all .3s ease; }
.chapter-rail a:hover .rail-label, .chapter-rail a:focus-visible .rail-label, .chapter-rail a.is-active .rail-label { opacity: 1; transform: none; }
.chapter-rail a:hover .rail-num, .chapter-rail a.is-active .rail-num { color: var(--ink); opacity: 1; }
.chapter-rail a.is-active .rail-dot { width: 10px; height: 10px; background: var(--home-light); box-shadow: 0 0 12px var(--home-light); }
.home-hud { position: fixed; left: 24px; bottom: 24px; z-index: 25; display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: 1px solid var(--hair); border-radius: 999px; background: rgba(15, 16, 18, .72); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); font: 11px/1 var(--font-mono); letter-spacing: .06em; color: var(--muted); pointer-events: none; transition: opacity .3s ease, transform .3s ease; }
.home-hud span:last-child { color: var(--ink); letter-spacing: 0; font-family: var(--theme-font-body); }
.home-hud.is-hidden { opacity: 0; transform: translateY(8px); }
.hud-swatch { width: 8px; height: 8px; border-radius: 50%; background: var(--home-light); box-shadow: 0 0 10px var(--home-light); }

/* 首屏：超大标题压住星系，底部是四项服务索引 */
.home-hero { min-height: 100svh; display: flex; flex-direction: column; justify-content: flex-end; padding-top: 112px; background: linear-gradient(90deg, rgba(8, 9, 11, .72), rgba(8, 9, 11, .25) 46%, transparent 66%); }
.hero-shell { padding-bottom: 6vh; }
.hero-title { font-family: var(--font-display); font-weight: var(--display-weight); line-height: .95; margin-bottom: 36px; }
.hero-word { display: flex; font-size: clamp(72px, 11vw, 188px); letter-spacing: -.04em; perspective: 900px; transform-origin: 0 100%; }
.char-mask { display: inline-block; overflow: hidden; padding: .04em .015em .1em; margin-bottom: -.08em; }
.hero-word { position: relative; }
.hero-char { display: inline-block; transform-origin: 50% 100%; background: linear-gradient(180deg, #ffffff 28%, color-mix(in srgb, var(--home-light) 65%, #ffffff) 100%); -webkit-background-clip: text; background-clip: text; color: transparent; will-change: transform; }
.hero-title-sub { margin-top: .3em; font-size: clamp(24px, 2.8vw, 46px); font-weight: 600; letter-spacing: -.02em; color: var(--ink); }
.hero-foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 40px; flex-wrap: wrap; }
.hero-lead { max-width: 460px; font-size: 17px; line-height: 1.85; color: var(--muted); }
.hero-index { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid var(--hair); }
.hero-index a { position: relative; display: grid; grid-template-columns: auto 1fr; gap: 4px 14px; padding: 22px 20px 28px 0; color: var(--muted); transition: color .3s ease; }
.hero-index a + a { padding-left: 20px; border-left: 1px solid var(--hair); }
.hero-index a::before { content: ""; position: absolute; top: -1px; left: 0; right: 0; height: 1px; background: var(--chip); transform: scaleX(0); transform-origin: 0 50%; transition: transform .5s var(--ease-out); box-shadow: 0 0 10px var(--chip); }
.hero-index a:hover { color: var(--ink); }
.hero-index a:hover::before { transform: none; }
.hero-index span { grid-row: span 2; font: 11px/1.9 var(--font-mono); color: var(--chip); }
.hero-index strong { font-size: 15px; font-weight: 500; color: var(--ink); }
.hero-index em { font: normal 10px/1.6 var(--font-mono); letter-spacing: .12em; text-transform: uppercase; }

/* 横向字带 */
.marquee-band { padding-block: 12vh; overflow: hidden; transform: rotate(-3deg) scale(1.04); pointer-events: none; user-select: none; }
.marquee-band.is-outro { transform: rotate(2.5deg) scale(1.04); padding-block: 8vh; }
.marquee-row { white-space: nowrap; }
.marquee-track { display: inline-flex; will-change: transform; }
.marquee-track span { display: inline-flex; align-items: center; gap: .35em; padding-right: .35em; font: var(--display-weight) clamp(48px, 6.4vw, 112px)/1.08 var(--font-display); letter-spacing: -.03em; }
.marquee-track i { font-style: normal; font-size: .4em; color: var(--home-light); text-shadow: 0 0 24px var(--home-light); -webkit-text-stroke: 0; }
.row-a span { color: var(--ink); }
.row-b span { color: transparent; -webkit-text-stroke: 1.2px rgba(255, 255, 255, .28); }
.row-b i { color: color-mix(in srgb, var(--home-light) 60%, transparent); text-shadow: none; }

/* 服务章节：文字吸附，背景光点随章节变形 */
.home-chapter { min-height: 140vh; display: flex; flex-direction: column; padding-block: 22vh 16vh; overflow-x: clip; }
.home-chapter.is-left { background: linear-gradient(90deg, rgba(8, 9, 11, .85), rgba(8, 9, 11, .45) 40%, transparent 62%); }
.home-chapter.is-right { background: linear-gradient(270deg, rgba(8, 9, 11, .85), rgba(8, 9, 11, .45) 40%, transparent 62%); }
.home-chapter > .home-shell { flex: 1; display: flex; align-items: flex-start; }
.home-chapter.is-right > .home-shell { justify-content: flex-end; }
.chapter-block { position: sticky; top: clamp(88px, 16vh, 160px); width: 100%; max-width: 640px; }
.home-chapter.is-right .chapter-block { margin-right: 40px; }
.chapter-ghost { position: absolute; top: 6vh; z-index: -1; font: 800 clamp(200px, 28vw, 480px)/.9 var(--font-display); letter-spacing: -.07em; background: linear-gradient(180deg, color-mix(in srgb, var(--home-light) 14%, transparent), transparent 75%); -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-stroke: 1.5px color-mix(in srgb, var(--home-light) 26%, transparent); pointer-events: none; user-select: none; }
.home-chapter.is-left .chapter-ghost { right: 2vw; }
.home-chapter.is-right .chapter-ghost { left: 2vw; }
.chapter-title { font-size: clamp(34px, 3.6vw, 58px); margin-bottom: 28px; }
.chapter-body { max-width: 480px; font-size: 16px; line-height: 1.9; color: var(--muted); margin-bottom: 32px; }
.chapter-meta { max-width: 520px; padding-top: 18px; border-top: 1px solid var(--hair); }
.chapter-meta dt { margin-bottom: 6px; font: 10px/1.6 var(--font-mono); letter-spacing: .16em; color: var(--muted); }
.chapter-meta dd { font-size: 14px; line-height: 1.8; }
.chapter-deliverables { max-width: 520px; display: grid; grid-template-columns: 1fr 1fr; column-gap: 28px; margin-top: 24px; border-top: 1px solid var(--hair); }
.chapter-deliverables li { display: flex; align-items: baseline; gap: 12px; padding: 15px 0; border-bottom: 1px solid var(--hair); font-size: 14px; }
.chapter-deliverables li span { flex-shrink: 0; font: 10px/1 var(--font-mono); color: var(--home-light); }
.chapter-link { display: inline-flex; align-items: center; gap: 14px; min-height: 52px; margin-top: 28px; padding: 0 22px 0 0; font-size: 15px; font-weight: 500; }
.chapter-link span { background: linear-gradient(currentColor, currentColor) 0 100% / 0 1px no-repeat; transition: background-size .45s var(--ease-out); }
.chapter-link:hover span { background-size: 100% 1px; }
.chapter-link svg { width: 38px; height: 38px; padding: 11px; border: 1px solid color-mix(in srgb, var(--home-light) 50%, transparent); border-radius: 50%; color: var(--home-light); transition: transform .35s var(--ease-out), background .35s ease, color .35s ease; }
.chapter-link:hover svg { transform: rotate(45deg); background: var(--home-light); color: #08090b; }

/* 项目协作 */
.home-process { padding-block: 20vh 14vh; background: linear-gradient(180deg, transparent, rgba(8, 9, 11, .82) 14%, rgba(8, 9, 11, .82) 86%, transparent); }
.process-head { display: grid; grid-template-columns: 1.5fr 1fr; align-items: end; gap: 56px; margin-bottom: 80px; }
.process-steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 32px; }
.process-steps li { position: relative; padding-top: 32px; }
.process-steps li::before, .step-bar { position: absolute; top: 0; left: 0; right: 0; height: 1px; }
.process-steps li::before { content: ""; background: var(--hair); }
.step-bar { background: var(--home-light); transform-origin: 0 50%; box-shadow: 0 0 12px var(--home-light); }
.step-num { display: block; font: 800 clamp(56px, 6vw, 104px)/.9 var(--font-display); letter-spacing: -.06em; color: transparent; -webkit-text-stroke: 1.2px rgba(255, 255, 255, .32); transition: color .4s ease, -webkit-text-stroke-color .4s ease; }
.process-steps li:hover .step-num { color: var(--home-light); -webkit-text-stroke-color: var(--home-light); }
.process-steps h3 { margin: 24px 0 12px; font-size: 21px; font-weight: 600; }
.process-steps p { font-size: 15px; line-height: 1.85; color: var(--muted); }
.spec-sheet { margin-top: 120px; border-top: 1px solid var(--line); }
.spec-sheet > div { display: grid; grid-template-columns: 64px 220px minmax(0, 1fr); align-items: baseline; gap: 16px; padding: 22px 0; border-bottom: 1px solid var(--hair); transition: padding .4s var(--ease-out), background .4s ease; }
.spec-sheet > div:hover { padding-left: 16px; background: linear-gradient(90deg, color-mix(in srgb, var(--home-light) 9%, transparent), transparent 70%); }
.spec-sheet span { font: 11px/1 var(--font-mono); color: var(--home-light); }
.spec-sheet dt { font-size: 16px; font-weight: 600; }
.spec-sheet dd { font: 14px/1.7 var(--font-mono); color: var(--muted); }

/* 方案与实录：整行大字列表 */
.home-work { padding-block: 16vh; background: linear-gradient(180deg, transparent, rgba(8, 9, 11, .85) 12%, rgba(8, 9, 11, .85) 88%, transparent); }
.work-group { margin-top: 88px; }
.work-group + .work-group { margin-top: 72px; }
.work-label { display: flex; justify-content: space-between; gap: 16px; padding-bottom: 18px; border-bottom: 1px solid var(--line); font: 11px/1.6 var(--font-mono); letter-spacing: .14em; color: var(--muted); }
.work-label a { color: var(--ink); letter-spacing: 0; }
.work-label a:hover { color: var(--home-light); }
.work-list a { position: relative; display: grid; grid-template-columns: 64px minmax(0, 1.15fr) minmax(0, 1fr) 150px 40px; align-items: center; gap: 24px; padding: 32px 0; border-bottom: 1px solid var(--hair); isolation: isolate; transition: padding .5s var(--ease-out); }
.work-list a::before { content: ""; position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, color-mix(in srgb, var(--home-light) 16%, transparent), transparent 75%); transform: scaleX(0); transform-origin: 0 50%; transition: transform .6s var(--ease-out); }
.work-list a:hover { padding-left: 20px; }
.work-list a:hover::before { transform: none; }
.work-idx { font: 12px/1 var(--font-mono); color: var(--home-light); }
.work-list strong { font: 600 clamp(20px, 1.9vw, 30px)/1.25 var(--font-display); letter-spacing: -.02em; transition: color .3s ease; }
.work-list a:hover strong { color: #fff; }
.work-summary { font-size: 14px; line-height: 1.8; color: var(--muted); }
.work-cat { justify-self: end; font: 10px/1.6 var(--font-mono); letter-spacing: .1em; color: var(--muted); text-align: right; }
.work-list svg { justify-self: end; width: 40px; height: 40px; padding: 12px; border: 1px solid var(--hair); border-radius: 50%; color: var(--muted); transition: transform .4s var(--ease-out), color .3s ease, background .3s ease, border-color .3s ease; }
.work-list a:hover svg { transform: rotate(45deg); color: #08090b; background: var(--home-light); border-color: var(--home-light); }
.work-note { margin-top: 18px; font-size: 12px; line-height: 1.8; color: var(--muted); }

/* 项目咨询 */
.home-contact { min-height: 100svh; display: grid; place-items: center; padding-block: 12vh 18vh; text-align: center; }
.contact-inner { display: flex; flex-direction: column; align-items: center; padding: 40px 32px; background: radial-gradient(ellipse 60% 58% at 50% 50%, rgba(8, 9, 11, .78), rgba(8, 9, 11, .35) 62%, transparent); }
.contact-inner .home-eyebrow { justify-content: center; }
.contact-title { font-size: clamp(56px, 8vw, 140px); line-height: .98; letter-spacing: -.045em; margin-bottom: 36px; }
.home-contact .section-lead { margin-bottom: 40px; }
.home-contact .pill-row { justify-content: center; }
.contact-direct { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 10px 14px; margin-top: 40px; font: 13px/1.6 var(--font-mono); color: var(--muted); }
.contact-direct a:hover { color: var(--ink); }
.contact-direct i { font-style: normal; color: var(--theme-line-strong); }

@media (max-width: 1280px) {
  .work-list a { grid-template-columns: 48px minmax(0, 1fr) minmax(0, 1fr) 40px; }
  .work-cat { display: none; }
}
@media (max-width: 1120px) {
  .process-steps { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 56px; }
  .chapter-rail { right: 14px; }
  .chapter-rail a.is-active:not(:hover):not(:focus-visible) .rail-label { opacity: 0; }
  .hero-index { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hero-index a:nth-child(3) { padding-left: 0; border-left: 0; }
  .hero-index a:nth-child(n + 3) { border-top: 1px solid var(--hair); }
  .chapter-block { max-width: 560px; padding: 32px; border: 1px solid var(--hair); border-radius: 20px; background: rgba(15, 16, 18, .7); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); }
}
@media (max-width: 900px) {
  .process-head { grid-template-columns: 1fr; gap: 24px; }
  .work-list a { grid-template-columns: 40px minmax(0, 1fr) 40px; row-gap: 8px; }
  .work-summary { grid-column: 2; grid-row: 2; }
  .work-list svg { grid-column: 3; grid-row: 1 / span 2; }
}
@media (max-width: 760px) {
  .home-shell { width: calc(100% - 40px); }
  .chapter-rail, .home-hud { display: none; }
  .home-hero { padding-top: 40svh; background: linear-gradient(180deg, transparent, transparent 30%, rgba(8, 9, 11, .85) 52%, #08090b 86%); }
  .hero-shell { padding-bottom: 28px; }
  .hero-word { font-size: clamp(60px, 18vw, 84px); }
  .hero-title { margin-bottom: 24px; }
  .hero-title-sub { font-size: 22px; }
  .hero-lead { font-size: 15px; }
  .hero-foot { gap: 24px; }
  .pill-row { width: 100%; flex-direction: column; align-items: stretch; }
  .pill, .pill-lg { width: 100%; height: 52px; }
  .hero-index a { padding: 16px 12px 18px 0; }
  .hero-index a + a { padding-left: 12px; }
  .hero-index strong { font-size: 13px; }
  .hero-index em { display: none; }
  .marquee-band { padding-block: 64px; }
  .marquee-track span { font-size: 40px; }
  .home-chapter { min-height: 0; padding-block: 56vh 10vh; }
  .home-chapter.is-left, .home-chapter.is-right { background: none; }
  .home-chapter.is-right > .home-shell { justify-content: flex-start; }
  .chapter-block, .home-chapter.is-right .chapter-block { position: relative; top: auto; max-width: none; margin-right: 0; padding: 24px; border-radius: 18px; background: rgba(15, 16, 18, .8); }
  .chapter-ghost { top: 10vh; font-size: 62vw; }
  .chapter-title { font-size: 28px; margin-bottom: 20px; }
  .chapter-body { font-size: 15px; }
  .chapter-deliverables { grid-template-columns: 1fr; }
  .mega-title { font-size: clamp(32px, 9.5vw, 44px); }
  .home-process, .home-work { padding-block: 96px; background: rgba(8, 9, 11, .9); }
  .process-head { margin-bottom: 56px; }
  .process-steps { grid-template-columns: 1fr; gap: 40px; }
  .step-num { font-size: 64px; }
  .spec-sheet { margin-top: 72px; }
  .spec-sheet > div { grid-template-columns: 36px minmax(0, 1fr); gap: 6px 12px; }
  .spec-sheet dd { grid-column: 2; }
  .work-group { margin-top: 56px; }
  .work-list a { padding: 24px 0; grid-template-columns: 28px minmax(0, 1fr) 36px; gap: 8px 12px; }
  .work-list svg { width: 36px; height: 36px; padding: 11px; }
  .contact-inner { padding: 20px 4px; }
  .contact-title { font-size: clamp(44px, 13vw, 62px); }
}
@media (prefers-reduced-motion: reduce) {
  .pill, .pill::before, .rail-dot, .rail-label, .home-hud, .chapter-rail, .work-list a, .work-list a::before, .home-stage canvas, .hero-index a::before, .spec-sheet > div { transition: none; }
}
</style>
