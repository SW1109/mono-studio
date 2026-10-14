<script setup>
import { RouterLink } from "vue-router";
import PageHeading from "../components/site/PageHeading.vue";
import { site } from "../content/site.js";
import { purchaseRules } from "../../shared/commerce.js";
import "../styles/commerce.css";
</script>
<template>
  <PageHeading eyebrow="SERVICE TERMS" title="让服务与约定，都清楚可见。" current="服务购买条款" :description="`服务购买条款与订单信息使用说明 · 版本 ${purchaseRules.termsVersion}`" />
  <article class="container commerce-terms">
    <section><h2>01 / 服务内容与经营信息</h2><p>本站提供远程软件技术服务。每个套餐的范围、交付物、排期条件和排除项以商品页面及双方确认的订单为准，不销售未经确认的软件授权、不保证第三方平台审核结果。在线收款仅在经营者确认商品定价、条款和真实经营主体后开放，主体信息在商城和确认订单页公示。</p></section>
    <section><h2>02 / 下单与付款</h2><p>请在付款前核对所选服务、价格与联系方式。订单有效期 {{ purchaseRules.orderMinutes }} 分钟，通过支付宝收银台完成付款。付款状态由服务端核实，不以浏览器回跳页面作为付款凭证。本站不收集支付宝账号密码，也不收取页面之外未确认的额外费用。</p></section>
    <section><h2>03 / 资料、排期与交付</h2><p>付款后由工作室人工联系确认必要资料和排期；交付周期从资料齐备、双方确认排期后开始计算。请确保对提供的源码、接口和资料具有合法使用权限，并自行脱敏。超出套餐范围的需求先另行协商，未经确认不自动追加费用。</p></section>
    <section><h2>04 / 取消、退款与问题反馈</h2><p>尚未开始服务时，可通过下方联系方式申请取消并协商退款；无法承接或无法满足双方确认范围时，先与你沟通调整或退款。服务已经开始的，结合实际完成情况与双方约定协商处理。页面说明不排除适用法律赋予消费者的权利。当前退款由经营者人工审核并通过原支付渠道办理，不宣称已提供自动退款功能。</p></section>
    <section><h2>05 / 订单信息与隐私</h2><p>为沟通与交付，订单记录包含联系人、邮箱、需求说明、服务、金额、付款状态及必要交易信息。浏览器使用 HttpOnly 订单会话 Cookie，以限制订单查询范围；不用于广告追踪。请勿在需求说明中提交口令、密钥、完整身份信息或敏感业务数据。</p><p>订单信息仅用于服务履约、售后与必要交易记录，由经营者管理。可通过邮箱申请查询、更正或在适用范围内删除个人信息；依法需要保留的交易记录按实际义务处理。支付信息由支付宝依据其自身规则处理。</p></section>
    <section><h2>06 / 联系与发票</h2><p>工作室：{{ site.name }}。邮箱：<a :href="`mailto:${site.email}`">{{ site.email }}</a>；微信：{{ site.wechat }}。如需咨询、取消、退款或发票，请提供订单号，由经营者确认处理方式；不要通过公开渠道发送支付凭据中的敏感信息。</p><RouterLink class="text-link" to="/contact/">联系工作室 <span aria-hidden="true">↗</span></RouterLink></section>
  </article>
</template>
