export { publicPaths, prerenderPaths } from "./content/paths.js";

export const routes = [
  { path: "/", component: () => import("./pages/HomePage.vue"), meta: { title: "网站开发与软件技术服务", description: "光年数智提供企业官网、业务管理系统、前端优化、接口对接与数据自动化服务，明确服务范围，交付源码与实施说明。" } },
  { path: "/services/", component: () => import("./pages/ServicesPage.vue"), meta: { title: "网站、小程序与软件定制开发服务", description: "网站与管理系统、小程序与 H5、桌面软件及自动化开发服务，涵盖需求分析、方案设计、开发验证与部署交接。" } },
  { path: "/products/", component: () => import("./pages/ProductsPage.vue"), meta: { title: "软件产品与定制方案", description: "涵盖企业官网、客户 CRM、进销存、预约小程序、会员商城、办公审批、数据看板、AI 知识库与自动化等定制开发方向，介绍适用场景、功能模块与交付范围。" } },
  { path: "/products/:slug/", component: () => import("./pages/ProductDetailPage.vue"), meta: { title: "产品详情" } },
  { path: "/shop/", component: () => import("./pages/ServiceShopPage.vue"), meta: { title: "商品购买", description: "选购光年软件技术服务，在同一网站登录账号、确认商品与查询订单。" } },
  { path: "/checkout/", component: () => import("./pages/OrderCenterPage.vue"), props: { mode: "checkout" }, meta: { title: "前往商城下单", noindex: true } },
  { path: "/orders/", component: () => import("./pages/OrderCenterPage.vue"), props: { mode: "orders" }, meta: { title: "订单查询", noindex: true } },
  { path: "/service-terms/", component: () => import("./pages/ServiceTermsPage.vue"), meta: { title: "服务购买条款与隐私说明", description: "了解光年数智软件技术服务的购买流程、交付验收、范围变更、取消退款、售后处理与个人信息使用规则。" } },
  { path: "/about/", component: () => import("./pages/AboutPage.vue"), meta: { title: "关于光年", description: "了解光年数智网络科技工作室的产品设计、软件研发、项目协作与交付方式。" } },
  { path: "/contact/", component: () => import("./pages/ContactPage.vue"), meta: { title: "联系合作", description: "联系光年数智工作室，沟通产品使用、软件定制与技术合作需求。" } },
  { path: "/guides/", component: () => import("./pages/GuidesPage.vue"), meta: { title: "软件技术服务选购指南", description: "了解网站开发、接口对接、自动化及 SEO 服务的范围、费用、源码交付、排期与售后，选择适合当前项目的技术服务。" } },
  { path: "/lab/", component: () => import("./pages/LabPage.vue"), meta: { title: "技术演示", description: "体验独立的三维空间技术演示。仅在主动启动后加载三维引擎。" } },
  { path: "/404/", component: () => import("./pages/NotFoundPage.vue"), meta: { title: "页面未找到", noindex: true } },
  { path: "/:pathMatch(.*)*", component: () => import("./pages/NotFoundPage.vue"), meta: { title: "页面未找到", noindex: true } },
];