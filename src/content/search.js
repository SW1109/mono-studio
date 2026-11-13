import { site, faqs, studioFaqs } from "./site.js";
import { serviceGuide } from "./guides.js";
import { services } from "./services.js";
import { products, productPath } from "./products.js";
import { guideArticles, guidePath } from "./guideArticles.js";
import { caseStudies, caseStudyPath } from "./caseStudies.js";

// JSON-LD 会出现在 HTML 的 script 中，转义标签边界，避免内容被解析为可执行标记。
export function serializeStructuredData(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

export function buildSearchGraph({ origin, base = "/", path, title, description, product, guide, study }) {
  if (!origin) return null;
  const root = `${origin}${base}`;
  const canonical = `${origin}${base.replace(/\/$/, "")}${path}`;
  const organizationId = `${root}#organization`;
  const websiteId = `${root}#website`;
  const pageType = path === "/about/" ? "AboutPage" : path === "/contact/" ? "ContactPage" : ["/services/", "/products/", "/projects/"].includes(path) ? "CollectionPage" : "WebPage";
  const page = {
    "@type": pageType, "@id": `${canonical}#webpage`, url: canonical, name: title,
    description, inLanguage: "zh-CN", isPartOf: { "@id": websiteId }, about: { "@id": organizationId },
  };
  const graph = [
    {
      "@type": "Organization", "@id": organizationId, name: site.name, alternateName: site.shortName,
      url: root, logo: `${root}favicon.png`, description: site.description, email: site.email,
      identifier: { "@type": "PropertyValue", propertyID: "统一社会信用代码", value: site.identity.creditCode },
      contactPoint: { "@type": "ContactPoint", email: site.email, url: `${root}contact/`, contactType: "customer service", availableLanguage: "Chinese" },
    },
    { "@type": "WebSite", "@id": websiteId, url: root, name: site.shortName, inLanguage: "zh-CN", publisher: { "@id": organizationId } },
    page,
  ];
  if (path !== "/") {
    const crumbs = [{ "@type": "ListItem", position: 1, name: "首页", item: root }];
    if (product) crumbs.push({ "@type": "ListItem", position: 2, name: "软件产品与定制方案", item: `${root}products/` });
    if (guide) crumbs.push({ "@type": "ListItem", position: 2, name: serviceGuide.title, item: `${root}guides/` });
    if (study) crumbs.push({ "@type": "ListItem", position: 2, name: "项目实录", item: `${root}projects/` });
    crumbs.push({ "@type": "ListItem", position: crumbs.length + 1, name: product?.name || title, item: canonical });
    graph.push({ "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumb`, itemListElement: crumbs });
    page.breadcrumb = { "@id": `${canonical}#breadcrumb` };
  }
  // 列表与页面使用同一份内容，只描述实际展示的服务和方案，不额外编造报价。
  if (path === "/services/" || path === "/products/") {
    const entries = path === "/services/" ? services.map(service => ({
      "@type": "Service", "@id": `${canonical}#${service.id}`, name: service.title,
      description: service.description, url: `${canonical}#${service.id}`, provider: { "@id": organizationId },
    })) : products.map(item => ({ "@type": "WebPage", "@id": `${root}${productPath(item).slice(1)}#webpage`, name: item.name, url: `${root}${productPath(item).slice(1)}` }));
    graph.push(...entries);
    const list = { "@type": "ItemList", "@id": `${canonical}#list`, name: title, numberOfItems: entries.length, itemListElement: entries.map((entry, index) => ({ "@type": "ListItem", position: index + 1, item: { "@id": entry["@id"] } })) };
    graph.push(list);
    page.mainEntity = { "@id": list["@id"] };
  }
  // 定制方向仅描述为服务，不给未公开售卖的工具编造价格、库存或用户评价。
  if (product?.kind === "solution") {
    const id = `${canonical}#service`;
    graph.push({ "@type": "Service", "@id": id, name: product.name, description: product.summary, url: canonical, provider: { "@id": organizationId } });
    page.mainEntity = { "@id": id };
  }
  if (path === "/about/") {
    page.mainEntity = { "@id": organizationId };
    page.dateModified = site.identity.updatedAt;
  }
  if (path === "/projects/") {
    const listId = `${canonical}#projects`;
    graph.push({ "@type": "ItemList", "@id": listId, name: "光年数智自有项目实施记录", numberOfItems: caseStudies.length, itemListElement: caseStudies.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.title, url: `${root}${caseStudyPath(item).slice(1)}` })) });
    page.mainEntity = { "@id": listId };
  }
  const questions = study?.faqs || guide?.faqs || (path === "/about/" ? studioFaqs : path === "/services/" ? faqs : path === "/contact/" ? faqs.slice(0, 3) : path === "/guides/" ? serviceGuide.faqs : product?.kind === "solution" ? product.details.faq : []);
  if (questions.length) {
    // 保留页面主体，FAQ 作为独立节点，避免用问答覆盖服务或目录的 mainEntity。
    const faqId = `${canonical}#faq`;
    graph.push({ "@type": "FAQPage", "@id": faqId, mainEntity: questions.map(item => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) });
    page.hasPart = [...(page.hasPart ? [page.hasPart] : []), { "@id": faqId }];
  }
  if (path === "/guides/") {
    page.dateModified = serviceGuide.updatedAt;
    page.author = { "@id": organizationId };
    page.mainEntity = { "@id": `${canonical}#guide` };
    graph.push({ "@type": "Article", "@id": `${canonical}#guide`, headline: serviceGuide.title, description: serviceGuide.summary, inLanguage: "zh-CN", author: { "@id": organizationId }, publisher: { "@id": organizationId }, image: `${root}social-card.png`, dateModified: serviceGuide.updatedAt, mainEntityOfPage: { "@id": page["@id"] } });
    graph.push({ "@type": "ItemList", "@id": `${canonical}#articles`, name: "项目选购与交付指南", numberOfItems: guideArticles.length, itemListElement: guideArticles.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.title, url: `${origin}${base.replace(/\/$/, "")}${guidePath(item)}` })) });
    page.hasPart = [...(page.hasPart || []), { "@id": `${canonical}#articles` }];
  }
  if (guide) {
    const articleId = `${canonical}#article`;
    page.mainEntity = { "@id": articleId };
    page.dateModified = guide.updatedAt;
    graph.push({
      "@type": "Article", "@id": articleId, url: canonical, headline: guide.title,
      description: guide.summary, abstract: guide.answer, articleSection: guide.category,
      inLanguage: "zh-CN", image: `${root}social-card.png`,
      author: { "@type": "Organization", "@id": organizationId, name: site.name, url: `${root}about/` },
      publisher: { "@id": organizationId }, datePublished: guide.publishedAt, dateModified: guide.updatedAt,
      mainEntityOfPage: { "@id": page["@id"] },
    });
  }
  if (study) {
    const articleId = `${canonical}#article`;
    page.mainEntity = { "@id": articleId };
    page.dateModified = study.updatedAt;
    graph.push({
      "@type": "Article", "@id": articleId, url: canonical, headline: study.title,
      description: study.summary, abstract: study.lead, genre: "自有项目实施记录", articleSection: study.category,
      inLanguage: "zh-CN", image: `${root}${study.image}`,
      author: { "@type": "Organization", "@id": organizationId, name: site.name, url: `${root}about/` },
      publisher: { "@id": organizationId }, datePublished: study.publishedAt, dateModified: study.updatedAt,
      mainEntityOfPage: { "@id": page["@id"] },
      citation: study.references.map(reference => ({ "@type": "CreativeWork", name: reference.label, url: reference.href })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
