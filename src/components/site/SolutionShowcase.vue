<script setup>
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import { solutions, productPath } from "../../content/products.js";
import SiteIcon from "./SiteIcon.vue";
import architecture from "../../assets/visuals/architecture.jpg";

const categories = [
  { slug: "customer-crm", label: "业务管理", icon: "users" },
  { slug: "business-website", label: "企业官网", icon: "web" },
  { slug: "booking-miniapp", label: "移动服务", icon: "mobile" },
];
const activeIndex = ref(0);
const tabs = ref([]);
const selected = computed(() => solutions.find(item => item.slug === categories[activeIndex.value].slug));
const modules = computed(() => selected.value.details.modules.slice(0, 4));

function handleTabKey(event, index) {
  let next = index;
  if (event.key === "ArrowRight") next = (index + 1) % categories.length;
  else if (event.key === "ArrowLeft") next = (index + categories.length - 1) % categories.length;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = categories.length - 1;
  else return;
  event.preventDefault();
  activeIndex.value = next;
  tabs.value[next]?.focus();
}
</script>

<template>
  <div class="solution-showcase" aria-label="定制软件方案预览">
    <div class="showcase-toolbar">
      <div class="showcase-wordmark"><SiteIcon name="layers" /><span>光年 / 软件方案</span></div>
      <span class="showcase-note">方案界面示意</span>
    </div>
    <div class="showcase-tabs" role="tablist" aria-label="方案类型">
      <button v-for="(category, index) in categories" :id="`solution-tab-${index}`" :key="category.slug" :ref="el => tabs[index] = el" type="button" role="tab" :aria-selected="activeIndex === index" :tabindex="activeIndex === index ? 0 : -1" aria-controls="solution-preview" @click="activeIndex = index" @keydown="handleTabKey($event, index)"><SiteIcon :name="category.icon" />{{ category.label }}</button>
      <RouterLink to="/products/" class="showcase-all">全部方案 <SiteIcon name="arrow" /></RouterLink>
    </div>
    <div id="solution-preview" role="tabpanel" :aria-labelledby="`solution-tab-${activeIndex}`" tabindex="0" class="showcase-workspace">
      <aside class="showcase-sidebar" aria-label="方案组成">
        <span class="sidebar-label">项目工作区</span>
        <p class="sidebar-current"><SiteIcon :name="selected.icon" />{{ selected.category }}</p>
        <span class="sidebar-label sidebar-section">开发内容</span>
        <span v-for="module in modules" :key="module.title" class="sidebar-module"><SiteIcon name="layers" />{{ module.title }}</span>
        <p class="sidebar-bottom">按业务流程定制<br />电脑与移动端适配</p>
      </aside>
      <div :key="selected.slug" class="showcase-main" :class="`showcase-${selected.slug}`">
        <div class="workspace-heading"><div><p class="workspace-caption">{{ selected.category }} / 方案概览</p><h2>{{ selected.name }}</h2></div><RouterLink :to="productPath(selected)" class="workspace-open" :aria-label="`查看${selected.name}详情`"><SiteIcon name="arrow" /></RouterLink></div>
        <p class="workspace-description">{{ selected.summary }}</p>
        <div v-if="selected.slug === 'business-website'" class="website-preview"><img :src="architecture" alt="自然光穿过建筑天窗" width="1280" height="1920" loading="lazy" /><div><span>WEBSITE & CONTENT</span><strong>品牌、内容与业务，<br />在一个网站相遇。</strong><p>响应式页面 · 内容管理 · 咨询入口</p></div></div>
        <div v-else class="workspace-modules">
          <div class="module-table-heading"><span>功能模块</span><span>范围说明</span></div>
          <div v-for="(module, index) in modules" :key="module.title" class="workspace-module"><span class="module-index">0{{ index + 1 }}</span><SiteIcon :name="selected.icon" /><strong>{{ module.title }}</strong><p>{{ module.description }}</p><SiteIcon class="module-check" name="check" /></div>
        </div>
        <div class="workspace-delivery"><span>交付内容</span><p>{{ selected.details.deliverables.slice(0, 2).join(' / ') }}</p></div>
      </div>
    </div>
    <div class="showcase-footer"><span>从你的业务流程开始</span><RouterLink :to="productPath(selected)">了解{{ categories[activeIndex].label }}方案 <span aria-hidden="true">↗</span></RouterLink></div>
  </div>
</template>

<style scoped>
.solution-showcase { overflow: hidden; border: 1px solid var(--theme-line-strong); border-radius: 8px; background: var(--surface); box-shadow: 0 24px 80px #0004; }
.showcase-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 22px; border-bottom: 1px solid var(--line); }
.showcase-wordmark { display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 500; }
.showcase-wordmark svg { width: 18px; height: 18px; color: var(--muted); }
.showcase-note { color: var(--muted); font-size: 11px; }
.showcase-tabs { display: flex; align-items: center; gap: 8px; padding: 0 20px; border-bottom: 1px solid var(--line); background: var(--surface); }
.showcase-tabs button { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 50px; padding: 10px 18px; border: 0; border-bottom: 2px solid transparent; border-radius: 0; background: transparent; color: var(--muted); font-size: 13px; }
.showcase-tabs button[aria-selected="true"] { color: var(--ink); border-bottom-color: var(--accent); }
.showcase-tabs button:hover { color: var(--ink); background: var(--surface-inset); }
.showcase-tabs svg { width: 15px; height: 15px; flex-shrink: 0; }
.showcase-all { display: flex; align-items: center; gap: 12px; min-height: 44px; margin-left: auto; font-size: 12px; color: var(--muted); }
.showcase-workspace { display: grid; grid-template-columns: 208px minmax(0, 1fr); min-height: 370px; }
.showcase-workspace:focus-visible { outline-offset: -3px; }
.showcase-sidebar { position: relative; display: flex; flex-direction: column; gap: 6px; padding: 24px 18px; border-right: 1px solid var(--line); background: var(--surface); }
.sidebar-label { font-size: 10px; color: var(--muted); margin-bottom: 6px; padding-inline: 10px; }
.sidebar-current, .sidebar-module { display: flex; align-items: center; gap: 10px; padding: 8px 10px; font-size: 11px; }
.sidebar-current { border-radius: 4px; background: var(--surface-inset); color: var(--ink); }
.sidebar-module { color: var(--muted); }
.sidebar-current svg, .sidebar-module svg { width: 14px; height: 14px; flex-shrink: 0; }
.sidebar-section { margin-top: 24px; }
.sidebar-bottom { margin-top: auto; padding: 28px 10px 0; color: var(--muted); font-size: 10px; line-height: 1.8; }
.showcase-main { min-width: 0; padding: 28px 32px 20px; background: var(--canvas); animation: showcase-enter .25s ease-out; }
.workspace-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.workspace-caption { font-size: 10px; color: var(--muted); margin-bottom: 6px; }
.workspace-heading h2 { font-size: 22px; font-weight: 500; }
.workspace-open { display: grid; place-items: center; flex-shrink: 0; width: 36px; height: 36px; border: 1px solid var(--line); border-radius: 6px; }
.workspace-open:hover { background: var(--surface-inset); }
.workspace-open svg { width: 15px; height: 15px; }
.workspace-description { margin-top: 12px; font-size: 12px; color: var(--muted); line-height: 1.8; max-width: 680px; }
.workspace-modules { margin-top: 24px; }
.module-table-heading { display: grid; grid-template-columns: minmax(160px, 1fr) 1.55fr; color: var(--muted); font-size: 10px; border-bottom: 1px solid var(--line); padding: 0 12px 10px; }
.workspace-module { display: grid; grid-template-columns: 20px 16px minmax(120px, 1fr) 1.7fr 16px; align-items: center; gap: 12px; padding: 14px 12px; border-bottom: 1px solid var(--line); }
.workspace-module svg { width: 14px; height: 14px; color: var(--muted); }
.module-index { color: var(--muted); font: 9px/1.5 var(--font-mono); }
.workspace-module strong { font-size: 12px; font-weight: 400; }
.workspace-module p { font-size: 11px; color: var(--muted); display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.workspace-module .module-check { color: var(--accent); }
.workspace-delivery { display: flex; align-items: start; gap: 18px; margin-top: 22px; font-size: 10px; color: var(--muted); }
.workspace-delivery > span { flex-shrink: 0; }
.workspace-delivery p { line-height: 1.7; }
.showcase-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 13px 22px; background: var(--surface-inset); border-top: 1px solid var(--line); font-size: 11px; color: var(--muted); }
.showcase-footer a { display: inline-flex; align-items: center; gap: 16px; min-height: 28px; color: var(--ink); }
.website-preview { position: relative; overflow: hidden; height: 208px; margin-top: 20px; background: #18191a; }
.website-preview img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 30%; }
.website-preview > div { position: absolute; inset: 0; padding: 26px 28px; background: #0003; color: #fff; }
.website-preview span { font: 8px/1.5 var(--font-mono); }
.website-preview strong { display: block; font-size: 24px; font-weight: 500; margin-block: 14px; line-height: 1.4; }
.website-preview p { font-size: 10px; }
@keyframes showcase-enter { from { opacity: .5; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@media (max-width: 1120px) { .showcase-workspace { grid-template-columns: 176px minmax(0, 1fr); } .showcase-main { padding: 24px; } .workspace-module { grid-template-columns: 16px 14px minmax(100px, 1fr) 1.2fr 14px; gap: 8px; padding-inline: 0; } }
@media (max-width: 760px) {
  .showcase-toolbar { padding: 12px 14px; } .showcase-wordmark { font-size: 11px; } .showcase-note { font-size: 9px; }
  .showcase-tabs { padding: 0 8px; gap: 0; } .showcase-tabs button { min-height: 46px; flex: 1; padding: 10px 6px; font-size: 11px; gap: 6px; } .showcase-tabs svg { width: 13px; height: 13px; } .showcase-all { display: none; }
  .showcase-workspace { display: block; min-height: 354px; } .showcase-sidebar { display: none; } .showcase-main { padding: 20px 16px 16px; }
  .workspace-heading h2 { font-size: 17px; } .workspace-caption { font-size: 9px; } .workspace-open { width: 32px; height: 32px; }
  .workspace-description { font-size: 11px; min-height: 60px; } .workspace-modules { margin-top: 18px; } .module-table-heading { display: none; }
  .workspace-module { grid-template-columns: 18px 14px 1fr 14px; gap: 8px; padding-block: 12px; } .workspace-module p { display: none; } .workspace-module strong { font-size: 11px; }
  .workspace-delivery { margin-top: 16px; font-size: 9px; gap: 12px; } .showcase-footer { padding: 10px 14px; font-size: 10px; } .showcase-footer > span { display: none; } .showcase-footer a { margin-left: auto; }
  .website-preview { height: 192px; } .website-preview > div { padding: 20px; } .website-preview strong { font-size: 20px; }
}
@media (prefers-reduced-motion: reduce) { .showcase-main { animation: none; } }
</style>
