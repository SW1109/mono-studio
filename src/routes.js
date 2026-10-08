export { publicPaths, prerenderPaths } from "./content/paths.js";

export const routes = [
  { path: "/", component: () => import("./pages/HomePage.vue"), meta: { title: "把想法，构建成好用的软件" } },
  { path: "/services/", component: () => import("./pages/ServicesPage.vue"), meta: { title: "开发服务", description: "网站与管理系统、小程序与 H5、桌面软件和自动化开发服务。从需求沟通到方案、开发与交付。" } },
  { path: "/products/", component: () => import("./pages/ProductsPage.vue"), meta: { title: "软件产品与定制方案", description: "探索企业官网、客户 CRM、进销存、预约小程序、会员商城、办公审批、数据看板、AI 知识库与自动化等定制开发方案，了解适用场景、功能模块和交付边界。" } },
  { path: "/products/:slug/", component: () => import("./pages/ProductDetailPage.vue"), meta: { title: "产品详情" } },
  { path: "/about/", component: () => import("./pages/AboutPage.vue"), meta: { title: "关于光年", description: "了解光年数智网络科技工作室的开发理念与协作方式，让软件产品与定制开发服务实际需求。" } },
  { path: "/contact/", component: () => import("./pages/ContactPage.vue"), meta: { title: "联系合作", description: "联系光年数智工作室，沟通产品使用、软件定制与技术合作需求。" } },
  { path: "/lab/", component: () => import("./pages/LabPage.vue"), meta: { title: "技术演示", description: "体验独立的三维空间技术演示。仅在主动启动后加载三维引擎。" } },
  { path: "/404/", component: () => import("./pages/NotFoundPage.vue"), meta: { title: "页面未找到", noindex: true } },
  { path: "/:pathMatch(.*)*", component: () => import("./pages/NotFoundPage.vue"), meta: { title: "页面未找到", noindex: true } },
];