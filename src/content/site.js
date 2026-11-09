export const site = Object.freeze({
  name: "光年数智网络科技工作室",
  shortName: "光年数智",
  email: "nexlyaihub@gmail.com",
  wechat: "feg1735",
  description: "光年数智网络科技工作室，提供产品设计、软件研发与系统集成服务，涵盖企业网站、业务管理系统、小程序、桌面软件与自动化工具。",
  navigation: [
    { label: "首页", to: "/" },
    { label: "开发服务", to: "/services/" },
    { label: "软件产品", to: "/products/" },
    { label: "商品购买", to: "/shop/" },
    { label: "关于光年", to: "/about/" },
    { label: "技术演示", to: "/lab/" },
  ],
  records: [
    { label: "鲁ICP备2026028241号-1", href: "https://beian.miit.gov.cn/" },
    { label: "鲁公网安备 37010102007161号", href: "https://beian.mps.gov.cn/#/query/webSearch?code=37010102007161", police: true },
  ],
});

export const process = [
  { title: "聊清需求", description: "了解使用场景和现有流程，确认要做的功能与验收要求。" },
  { title: "确认方案", description: "一起确定页面、技术方案、费用和时间，写清楚交付内容。" },
  { title: "开发与验证", description: "分阶段提供可运行版本，核对功能，收集反馈并修正问题。" },
  { title: "上线与交接", description: "按约定部署上线，交接源码和资料，确认后续维护安排。" },
];

export const faqs = [
  { question: "需求尚未明确，可以咨询吗？", answer: "可以。请说明业务背景、现有流程与使用人群，工作室可协助梳理核心功能及初步开发范围。" },
  { question: "开发周期与费用如何确定？", answer: "根据功能范围、设计要求、外部系统对接和交付方式评估。具体报价、时间和维护安排以双方确认的方案为准。" },
  { question: "已有系统可以继续优化吗？", answer: "可以先了解现有技术栈、源码情况和问题表现，再评估功能迭代、性能优化或分阶段重构的可行性。" },
  { question: "产品购买和项目定制如何联系？", answer: "通过邮箱或微信联系即可。产品咨询请附上产品名称，定制需求建议说明使用场景、核心功能和预期时间。" },
];
