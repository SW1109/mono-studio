import { solutions } from "./solutions.js";

export { solutions };

// 现有工具保留详情地址，与按需求开发的软件方案分别展示。
export const existingProducts = [
  {
    slug: "viewturbo", name: "ViewTurbo", category: "浏览效率", icon: "web", accent: "blue", featured: true,
    headline: "专注浏览，让工具回归效率。",
    summary: "面向重度浏览场景的效率工具，关注浏览过程中的操作体验与工作流。",
    description: "浏览器承载着越来越多的日常工作。ViewTurbo 围绕浏览体验构建功能，帮助整理使用流程，让工具更好地配合你的工作习惯。",
    capabilities: ["面向浏览场景的工具设计", "关注日常操作与工作流", "支持沟通具体使用需求"],
    audience: "需要频繁处理网页与在线工作的用户",
    note: "功能、平台支持及获取方式请通过咨询确认，不展示未经核实的性能数据。",
  },
  {
    slug: "autoclick-pro", name: "AutoClick Pro", category: "自动化", icon: "workflow", accent: "violet", featured: true,
    headline: "少一些重复，多一些专注。",
    summary: "用于桌面重复操作的自动化工具，围绕点击与任务流程构建可复用的操作。",
    description: "重复执行的桌面操作不必每次从头开始。AutoClick Pro 为日常自动化场景提供工具，让流程整理与任务执行更加直接。",
    capabilities: ["桌面重复操作自动化", "围绕任务组织操作流程", "按实际场景咨询配置方式"],
    audience: "存在重复桌面操作的办公与运营场景",
    note: "具体识别能力、系统支持与版本功能以实际产品说明为准。",
  },
  {
    slug: "clipstack", name: "ClipStack", category: "办公效率", icon: "layers", accent: "green", featured: true,
    headline: "让复制过的内容，随时可用。",
    summary: "剪贴板历史与片段管理工具，帮助整理常用内容，减少来回寻找与重复输入。",
    description: "从临时复制到经常复用，内容管理可以更有条理。ClipStack 围绕剪贴板与片段使用场景设计，让常用信息更方便取回。",
    capabilities: ["剪贴板历史管理", "常用内容片段整理", "面向日常工作的快速取用"],
    audience: "经常整理资料、写作或处理内容的用户",
    note: "支持的内容类型、快捷键与平台范围请咨询确认。",
  },
  {
    slug: "watchdog", name: "Watchdog", category: "监控工具", icon: "activity", accent: "orange", featured: false,
    headline: "关注变化，不必反复查看。",
    summary: "网页与接口变动监控工具，帮助关注指定信息的变化。",
    description: "需要持续留意的信息，不一定要靠手动刷新。Watchdog 围绕网页与接口变化组织监控任务，帮助及时发现值得关注的更新。",
    capabilities: ["网页与接口变动监控", "面向关注事项组织任务", "按需求确认通知集成"],
    audience: "需要持续关注网页或接口变化的业务场景",
    note: "通知渠道、检查频率与可监控范围以实际配置为准。",
  },
  {
    slug: "renamex", name: "RenameX", category: "文件工具", icon: "files", accent: "blue", featured: false,
    headline: "给文件一个有条理的名字。",
    summary: "批量文件重命名工具，围绕命名规则与文件整理减少重复劳动。",
    description: "当文件数量增加，逐个命名会变得繁琐。RenameX 提供面向批量重命名的工作方式，帮助统一命名规则，让资料更容易整理。",
    capabilities: ["批量文件重命名", "按规则组织文件名称", "面向素材与文档整理"],
    audience: "需要整理素材、文档与大量文件的用户",
    note: "命名规则、预览方式与支持平台请通过产品咨询确认。",
  },
].map(product => ({ ...product, kind: "product" }));

export const products = [...solutions, ...existingProducts];
export const featuredProducts = solutions.filter(solution => solution.featured);
export const productPath = (product) => `/products/${product.slug}/`;
export const findProduct = (slug) => products.find((product) => product.slug === slug);
export const productInquiry = (product) => ({ path: "/contact/", query: { product: product.name } });
export const productInquirySubject = (product) => `${product.kind === "solution" ? "方案咨询" : "产品咨询"}：${product.name}`;