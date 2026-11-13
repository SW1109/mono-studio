<script setup>
import { RouterLink } from "vue-router";
import { caseStudies } from "../content/caseStudies.js";
import CaseStudyCards from "../components/site/CaseStudyCards.vue";
import PageHeading from "../components/site/PageHeading.vue";
import ContactBanner from "../components/site/ContactBanner.vue";
</script>

<template>
  <PageHeading eyebrow="项目实录" title="光年数智项目实录" current="项目实录" description="围绕光年数智自有官网与服务商城，记录系统整合、支付处理和搜索内容建设。每篇附实际页面、核对范围与公开资料。" />
  <section class="container project-records" aria-labelledby="project-records-title"><p class="project-record-note">以下三篇属于同一个自有项目的不同实施部分。<RouterLink to="/products/">软件定制方案</RouterLink>中的界面示意，另作功能方向介绍。</p><h2 id="project-records-title" class="project-records-title">官网与商城的实施记录</h2><CaseStudyCards :items="caseStudies" /></section>
  <ContactBanner title="聊聊你正在解决的问题。" description="说明已有系统、使用场景与需要完成的工作，一起明确实施范围和交付方式。" />
</template>

<style scoped>
.project-records { padding-bottom: 80px; }
.project-records-title { font-size: 24px; font-weight: 500; line-height: 1.6; margin-bottom: 28px; }
.project-record-note { font-size: 14px; line-height: 1.9; color: var(--muted); margin-bottom: 32px; padding-block: 20px; border-block: 1px solid var(--line); }
.project-record-note a { color: var(--ink); text-decoration: underline; text-underline-offset: 4px; }
@media (max-width: 640px) { .project-records { padding-bottom: 48px; } }
</style>
