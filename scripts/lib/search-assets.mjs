import { site, faqs } from "../../src/content/site.js";
import { services } from "../../src/content/services.js";
import { serviceGuide } from "../../src/content/guides.js";
import { guideArticles, guidePath } from "../../src/content/guideArticles.js";
import { products, productPath } from "../../src/content/products.js";

const questionsText = questions => questions.flatMap(item => [`### ${item.question}`, item.answer, ""]).join("\n\n");

export function guideMarkdown(guide, root) {
  return [
    `# ${guide.title}`, `原文：${root}${guidePath(guide).slice(1)}`, `作者：${site.name}（${root}about/）`,
    `发布日期：${guide.publishedAt}；更新日期：${guide.updatedAt}`, guide.summary,
    "## 先看结论", guide.answer,
    ...guide.sections.flatMap(section => [`## ${section.title}`, ...section.paragraphs, ...(section.items ? [section.items.map(item => `- ${item}`).join("\n")] : [])]),
    "## 常见问题", questionsText(guide.faqs),
    `服务范围与价格：${root}shop/`, `交付与售后条款：${root}service-terms/`,
  ].join("\n\n") + "\n";
}

export function searchTextAssets({ origin, base, orderCenter }) {
  const root = `${origin}${base}`;
  const productSitemap = orderCenter ? `${orderCenter.origin}${orderCenter.basePath}?s=sitemap/index` : "";
  const directory = [
    `# ${site.name}`, `> ${site.description}`,
    "工作室提供远程软件技术服务。具体价格、范围、周期和售后以当前商城商品页及双方约定为准。方案示意和工具介绍不代表已完成的客户案例。合同付款入口的占位金额不属于服务报价。",
    "## 服务与工作室",
    `- [开发服务](${root}services/): 网站、管理系统、小程序、桌面工具与自动化的服务范围。`,
    `- [软件方案](${root}products/): 按需求定制的功能方向与适用场景。`,
    `- [服务商城](${root}shop/): 当前商品、价格、交付清单与购买说明。`,
    `- [关于工作室](${root}about/): 工作方式、协作与交付原则。`,
    `- [联系工作室](${root}contact/): 邮箱 ${site.email}；微信 ${site.wechat}。`,
    `- [服务与隐私条款](${root}service-terms/): 购买、验收、取消、售后和信息处理。`,
    "## 项目指南",
    `- [服务选购指南](${root}guides/): 按现有问题选择服务，核对资料、范围与交付物。`,
    ...guideArticles.map(guide => `- [${guide.title}](${root}${guidePath(guide).slice(1)}): ${guide.summary}`),
    "## 文本与来源",
    `- [公开内容文本汇总](${root}llms-full.txt): 由页面使用的内容源生成；每节附原文地址。`,
    ...guideArticles.map(guide => `- [${guide.title}（Markdown）](${root}${guidePath(guide).slice(1)}index.md)`),
    `- [官网站点地图](${root}sitemap.xml)`,
    ...(productSitemap ? [`- [在售服务站点地图](${productSitemap}): 由商城当前上架记录生成，不含账号、订单和合同付款入口。`] : []),
  ].join("\n\n") + "\n";

  // 与可见页面共用内容源；不在 AI 文本中复制可能过期的商品价格或交易数据。
  const full = [
    `# ${site.name}`, `原文：${root}`, site.description,
    `联系方式：${root}contact/；邮箱 ${site.email}；微信 ${site.wechat}。`,
    `商品现价与范围：${root}shop/；交付和售后规则：${root}service-terms/。`,
    "## 开发服务", `原文：${root}services/`,
    ...services.flatMap(service => [`### ${service.title}`, service.description, `适用场景：${service.scenarios}`, `可约定的交付内容：${service.deliverables.join("、")}。`]),
    "## 合作问答", questionsText(faqs),
    `## ${serviceGuide.title}`, `原文：${root}guides/`, `更新日期：${serviceGuide.updatedAt}`, serviceGuide.summary,
    ...serviceGuide.sections.flatMap(section => [`### ${section.title}`, ...section.paragraphs, ...(section.options ? section.options.map(option => `- ${option.need}：${option.service}。准备 ${option.preparation}；交付 ${option.result}。`) : [])]),
    questionsText(serviceGuide.faqs),
    ...guideArticles.map(guide => guideMarkdown(guide, root)),
    "## 软件方案与工具", `原文：${root}products/`,
    ...products.flatMap(product => [`### ${product.name}`, `原文：${root}${productPath(product).slice(1)}`, product.summary, product.description, `适用人群：${product.audience}`, product.note]),
  ].join("\n\n") + "\n";
  return [
    { fileName: "llms.txt", source: directory }, { fileName: "llms-full.txt", source: full },
    ...guideArticles.map(guide => ({ fileName: `${guidePath(guide).slice(1)}index.md`, source: guideMarkdown(guide, root) })),
  ];
}
