<script setup>
import { RouterLink } from "vue-router";
import { site } from "../../content/site.js";
</script>

<template>
  <section id="studio-facts" class="studio-identity container" aria-labelledby="studio-identity-title">
    <div class="section-heading"><div><p class="eyebrow">光年数智</p><h2 id="studio-identity-title">工作室与主体信息</h2></div></div>
    <p class="identity-intro">{{ site.name }}提供网站、业务系统、小程序与自动化开发服务。官方网站为 <a :href="`https://${site.domain}/`">{{ site.domain }}</a>，服务商品、项目实录和联系方式均由本站提供。</p>
    <dl class="identity-facts">
      <div><dt>工作室名称</dt><dd>{{ site.name }}</dd></div>
      <div><dt>经营类型</dt><dd>{{ site.identity.businessType }}</dd></div>
      <div><dt>统一社会信用代码</dt><dd class="identity-code">{{ site.identity.creditCode }}</dd></div>
      <div><dt>服务方式</dt><dd>{{ site.identity.serviceMode }}</dd></div>
      <div><dt>联系邮箱</dt><dd><a :href="`mailto:${site.email}`">{{ site.email }}</a></dd></div>
      <div><dt>联系微信</dt><dd>{{ site.wechat }}</dd></div>
    </dl>
    <div class="identity-links"><RouterLink to="/projects/">查看本站项目实录</RouterLink><RouterLink to="/service-terms/">服务与售后约定</RouterLink><a href="https://www.gsxt.gov.cn/" target="_blank" rel="noopener noreferrer">企业信用信息查询入口</a><a :href="site.repository" target="_blank" rel="noopener noreferrer">项目公开源码</a></div>
    <p class="identity-updated">信息更新于 <time :datetime="site.identity.updatedAt">{{ site.identity.updatedAt }}</time></p>
  </section>
</template>

<style scoped>
.studio-identity { padding-block: 64px; border-block: 1px solid var(--line); scroll-margin-top: 104px; }
.studio-identity h2 { font-size: 32px; line-height: 1.5; }
.identity-intro { max-width: 850px; font-size: 16px; line-height: 1.9; color: var(--muted); }
.identity-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0 40px; margin-top: 32px; }
.identity-facts > div { min-width: 0; border-top: 1px solid var(--line); padding-block: 24px; }
.identity-facts dt { font-size: 12px; color: var(--muted); margin-bottom: 12px; }
.identity-facts dd { font-size: 16px; line-height: 1.8; overflow-wrap: anywhere; }
.identity-code { font-family: var(--font-mono); }
.identity-links { display: flex; flex-wrap: wrap; gap: 16px 28px; margin-top: 20px; font-size: 13px; }
.identity-links a, .identity-intro a { text-decoration: underline; text-underline-offset: 5px; }
.identity-updated { margin-top: 24px; font-size: 12px; color: var(--muted); }
@media (max-width: 900px) { .identity-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 24px; } }
@media (max-width: 520px) { .identity-facts { grid-template-columns: 1fr; }.studio-identity h2 { font-size: 25px; }.studio-identity { padding-block: 40px; } }
</style>
