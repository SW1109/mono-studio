export { publicPaths, prerenderPaths } from "./content/paths.js";

export const routes = [
  { path: "/", component: () => import("./pages/HomePage.vue"), meta: { title: "软件研发与产品设计" } },
  { path: "/services/", component: () => import("./pages/ServicesPage.vue"), meta: { title: "开发服务", description: "网站与管理系统、小程序与 H5、桌面软件及自动化开发服务，涵盖需求分析、方案设计、开发验证与部署交接。" } },
  { path: "/products/", component: () => import("./pages/ProductsPage.vue"), meta: { title: "软件产品与定制方案", description: "涵盖企业官网、客户 CRM、进销存、预约小程序、会员商城、办公审批、数据看板、AI 知识库与自动化等定制开发方向，介绍适用场景、功能模块与交付范围。" } },
  { path: "/products/:slug/", component: () => import("./pages/ProductDetailPage.vue"), meta: { title: "产品详情" } },
  { path: "/shop/", component: () => import("./pages/ServiceShopPage.vue"), meta: { title: "服务商城", description: "软件问题诊断、前端单页面优化与单接口对接服务，了解明确的范围、价格与交付方式。" } },
  { path: "/checkout/", component: () => import("./pages/CheckoutPage.vue"), meta: { title: "确认服务订单", noindex: true } },
  { path: "/orders/", component: () => import("./pages/OrderPage.vue"), meta: { title: "订单查询", noindex: true } },
  { path: "/service-terms/", component: () => import("./pages/ServiceTermsPage.vue"), meta: { title: "服务购买条款与隐私说明" } },
  { path: "/about/", component: () => import("./pages/AboutPage.vue"), meta: { title: "关于光年", description: "了解光年数智网络科技工作室的产品设计、软件研发、项目协作与交付方式。" } },
  { path: "/contact/", component: () => import("./pages/ContactPage.vue"), meta: { title: "联系合作", description: "联系光年数智工作室，沟通产品使用、软件定制与技术合作需求。" } },
  { path: "/lab/", component: () => import("./pages/LabPage.vue"), meta: { title: "技术演示", description: "体验独立的三维空间技术演示。仅在主动启动后加载三维引擎。" } },
  { path: "/404/", component: () => import("./pages/NotFoundPage.vue"), meta: { title: "页面未找到", noindex: true } },
  { path: "/:pathMatch(.*)*", component: () => import("./pages/NotFoundPage.vue"), meta: { title: "页面未找到", noindex: true } },
];