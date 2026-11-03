import { site, faqs } from "./site.js";
import { serviceGuide } from "./guides.js";
import { services } from "./services.js";
import { products, productPath } from "./products.js";

// JSON-LD 会出现在 HTML 的 script 中，转义标签边界，避免内容被解析为可执行标记。
export function serializeStructuredData(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

export function buildSearchGraph({ origin, base = "/", path, title, description, product }) {
  if (!origin) return null;
  const root = `${origin}${base}`;
  const canonical = `${origin}${base.replace(/\/$/, "")}${path}`;
  const organizationId = `${root}#organization`;
  const websiteId = `${root}#website`;
  const pageType = path === "/about/" ? "AboutPage" : path === "/contact/" ? "ContactPage" : ["/services/", "/products/"].includes(path) ? "CollectionPage" : "WebPage";
  const page = {
    "@type": pageType, "@id": `${canonical}#webpage`, url: canonical, name: title,
    description, inLanguage: "zh-CN", isPartOf: { "@id": websiteId }, about: { "@id": organizationId },
  };
  const graph = [
    {
      "@type": "Organization", "@id": organizationId, name: site.name, alternateName: site.shortName,
      url: root, logo: `${root}favicon.png`, description: site.description, email: site.email,
      contactPoint: { "@type": "ContactPoint", email: site.email, contactType: "customer service", availableLanguage: "Chinese" },
    },
    { "@type": "WebSite", "@id": websiteId, url: root, name: site.shortName, inLanguage: "zh-CN", publisher: { "@id": organizationId } },
    page,
  ];
  if (path !== "/") {
    const crumbs = [{ "@type": "ListItem", position: 1, name: "首页", item: root }];
    if (product) crumbs.push({ "@type": "ListItem", position: 2, name: "软件产品与定制方案", item: `${root}products/` });
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
  const questions = path === "/services/" ? faqs : path === "/contact/" ? faqs.slice(0, 3) : path === "/guides/" ? serviceGuide.faqs : product?.kind === "solution" ? product.details.faq : [];
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
    graph.push({ "@type": "Article", "@id": `${canonical}#guide`, headline: serviceGuide.title, description: serviceGuide.summary, inLanguage: "zh-CN", author: { "@id": organizationId }, publisher: { "@id": organizationId }, dateModified: serviceGuide.updatedAt, mainEntityOfPage: { "@id": page["@id"] } });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
