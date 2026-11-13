const repository = "https://github.com/SW1109/mono-studio";
const paymentRevision = "4fd1d96b097b7617b9ead4e9377fb48dffe81755";
const searchRevision = "a234ee08b34955be6e83c9bd634566a1c95f5979";

// 三篇记录属于同一自有项目，案例中的事实与公开页面、源码保持对应。
export const caseStudies = [
  {
    slug: "studio-commerce", title: "光年数智官网与服务商城整合", category: "网站与商城",
    summary: "把服务介绍、软件方案与原生商城放在同一域名下，保留商品、账号、订单和支付宝流程，并统一电脑与手机上的浏览体验。",
    lead: "光年数智官网负责说明业务、展示方案和提供咨询入口，服务商城负责商品、会员、订单与结账。项目沿用 Vue 官网与 ShopXO 商城，将两个部分整合到 guangnian.xin，并使用同一套品牌、导航和暗色主题。",
    publishedAt: "2026-11-13", updatedAt: "2026-11-13",
    image: "projects/studio-website.webp", imageAlt: "光年数智线上官网首页，包含品牌、服务入口与标注为方案示意的软件展示",
    caption: "官网线上页面实拍，2026-11-13。页面内的软件工作区保留“方案界面示意”标注。",
    gallery: { image: "projects/service-store.webp", alt: "光年数智服务商城的分类目录、搜索入口与真实商品展示", caption: "同域服务商城实拍，2026-11-13。商品名称、价格和可售状态由商城后台维护。" },
    facts: [
      { label: "项目归属", value: "光年数智自有官网与商城" },
      { label: "实施范围", value: "展示网站、服务目录与交易入口" },
      { label: "使用方式", value: "电脑与手机浏览器" },
    ],
    sections: [
      { id: "context", title: "让介绍和购买接得上", paragraphs: ["官网有开发方向、软件方案和选购指南，商城有具体服务商品。访客需要从介绍页找到购买入口，也需要在下单后找到原来的账号与订单。", "整合时保留商城的商品和交易能力，将商城挂到官网的 /shop/ 路径。官网提供清晰入口，商品价格和订单状态继续由商城维护。"] },
      { id: "implementation", title: "沿用现有系统，明确各自职责", paragraphs: ["官网使用 Vue 3 和 Vite SSG，把公开页面在构建时输出为 HTML。商城沿用 ShopXO 的 PHP 与数据库体系，官网导航可以直接进入商品、订单与登录页面。", "两端共用品牌资料、联系方式和主题资源。商品列表、详情、登录、订单与支付弹窗分别做暗色适配；官网的旧订单入口跳转到商城，账号订单保留在同一套系统内。"], items: ["官网：服务范围、方案介绍、指南、工作室信息与咨询入口。", "商城：商品、账号、购物车、结账、订单查询与售后入口。", "公共部分：品牌、导航、联系方式、暗色主题与移动端布局。"] },
      { id: "delivery", title: "交接的是可继续维护的项目", paragraphs: ["公开仓库保留官网源码、商城覆盖文件、补丁、固定版本记录和部署说明。构建过程检查公开页面正文、链接与搜索元信息；商城准备过程检查上游源码和覆盖文件摘要。", "这种交付方式适合已有官网和业务系统需要统一入口、逐步完善体验的项目。更换服务器或继续开发时，可以从明确的版本与说明开始。"], items: ["官网源码、依赖版本和构建命令。", "商城模板与业务补丁，以及对应上游版本。", "公开页面、主题资源、部署规则与服务目录。"] },
    ],
    checks: [
      { title: "公开入口", detail: "官网、商城与商品详情已做线上 HTTP 和链接检查；商品购买入口保留。" },
      { title: "响应式", detail: "官网与相关页面核对电脑、平板和手机尺寸，检查文字溢出、导航及主要操作。" },
      { title: "订单归属", detail: "订单入口使用商城账号体系；官网不另建一份本地订单记录。" },
    ],
    boundary: "这是工作室自有网站的实施记录。完整官网与商城整合包含展示、账号和交易多个部分，具体项目需单独确认范围；标准展示官网套餐不自动包含商城与支付。",
    references: [
      { label: "线上官网", href: "https://guangnian.xin/", detail: "查看实际页面、导航与软件方案说明。" },
      { label: "线上服务商城", href: "https://guangnian.xin/shop/", detail: "查看当前商品、分类与购买入口。" },
      { label: "项目源码与部署说明", href: repository, detail: "查看官网源码、商城覆盖文件和项目说明。" },
    ],
    faqs: [
      { question: "这套官网和商城是已经上线的项目吗？", answer: "是工作室正在使用的自有网站，公开地址为 guangnian.xin，服务商城位于同域 /shop/。本页截图来自线上页面，方案展示区域仍明确标注为界面示意。" },
      { question: "可以用于已有网站与商城的整合吗？", answer: "可以先评估现有技术栈、源码权限、账号与订单流程、部署环境，再明确需要统一的入口和界面。数据迁移、账号合并及支付改造需要单独确认。" },
    ],
    guideSlugs: ["business-website-planning", "software-source-delivery"],
    solutionSlugs: ["business-website", "member-commerce"],
  },
  {
    slug: "contract-payment", title: "合同付款与支付宝回调的处理", category: "支付与系统集成",
    summary: "记录本站合同金额、0.6% 手续费计算，以及付款回跳和异步通知的处理方式，说明展示结果与服务端到账状态如何对应。",
    lead: "本站曾出现收款已到账、浏览器回跳却提示异常的情况。排查围绕原始通知验签、回跳字段和服务端支付记录展开；合同付款同时明确展示合同金额、支付宝手续费与实付金额。",
    publishedAt: "2026-11-13", updatedAt: "2026-11-13",
    image: "projects/contract-payment.webp", imageAlt: "本站合同付款公开页面，展示0.6%费率、合同金额说明与登录后继续入口",
    caption: "合同付款公开入口实拍，2026-11-13。截图时未登录，未上传合同或创建订单。",
    facts: [
      { label: "项目归属", value: "光年数智服务商城" },
      { label: "处理范围", value: "合同金额、回调验签与结果回显" },
      { label: "费用规则", value: "合同金额 + 0.6% 手续费" },
    ],
    sections: [
      { id: "context", title: "到账之后，回跳页面仍然需要核对", paragraphs: ["支付宝的异步通知和浏览器回跳承担不同职责。浏览器回跳可能没有交易状态字段，直接按普通通知处理，容易把待确认状态展示为异常。", "本站的回跳处理先核对已确认的服务端支付记录，包括订单、支付渠道、交易号与金额。记录一致时展示成功；尚未确认时保留“支付结果确认中”的提示，避免引导用户重复付款。"] },
      { id: "signature", title: "验签使用原始字段", paragraphs: ["支付签名依赖收到的原始参数。默认的 HTML 转义可能改写通知中的 JSON 字段，因此本站对支付宝回调读取原始 GET 与 POST 数据，再交由支付插件验签。", "该处理限定在支付宝渠道内。异步通知仍要求有交易状态，金额与订单校验继续执行，浏览器回跳不会单独把订单改成已支付。"] },
      { id: "amount", title: "把金额规则放到服务端", paragraphs: ["合同付款按输入金额计算 0.6% 手续费，四舍五入到分后相加得到实付金额。计算使用整数分，避免浮点误差影响展示和订单金额。", "合同文件与订单信息按授权访问。系统的合同商品占位价格只用于内部商品建模，公开页面显示按合同金额付款，搜索报价数据中也排除了该占位金额。"], items: ["输入 100.00 元，手续费 0.60 元，实付 100.60 元。", "输入 1.00 元，手续费按规则舍入为 0.01 元，实付 1.01 元。", "金额和手续费由服务端重新计算，客户端显示用于提交前核对。"] },
    ],
    checks: [
      { title: "源码核对", detail: "可在公开补丁中查看原始参数验签、回跳待确认状态和支付记录匹配条件。" },
      { title: "金额规则", detail: "后端按整数分计算手续费；案例中的 1.00 元与 100.00 元是金额规则示例。" },
      { title: "公开页面", detail: "合同入口显示 0.6% 费率，要求登录后关联订单与文件，页面不输出占位报价的搜索结构化数据。" },
    ],
    boundary: "这篇记录说明本站的实现与核对范围。案例整理期间未新发起真实支付或退款；复用于其他商户时，需要按其产品权限、配置和实际交易另行验收。",
    references: [
      { label: "本站合同付款入口", href: "https://guangnian.xin/shop/?s=goods/index/id/117.html", detail: "查看公开费率、文件要求和付款流程说明。" },
      { label: "支付宝回调修复记录", href: `${repository}/blob/${paymentRevision}/deploy/shopxo/patches/0006-alipay-callback-verification.patch`, detail: "固定版本的验签与回跳处理补丁。" },
      { label: "合同金额计算实现", href: `${repository}/blob/${paymentRevision}/deploy/shopxo/overlay/app/service/MonoContractService.php`, detail: "固定版本的金额校验、整数分计费与合同处理代码。" },
    ],
    faqs: [
      { question: "支付宝扣款成功，但网页提示确认中怎么办？", answer: "先到订单页查看状态，并联系商家核对服务端交易记录。浏览器回跳不是唯一到账依据，已扣款时不要仅因页面提示再次付款。" },
      { question: "合同金额100元时，0.6%费率如何计算？", answer: "本站按合同金额计算手续费：100.00元乘以0.6%得到0.60元，实付为100.60元。手续费四舍五入到分，最终金额由服务端计算。" },
    ],
    guideSlugs: ["software-source-delivery"],
    solutionSlugs: ["member-commerce"],
  },
  {
    slug: "search-content", title: "让官网内容可以直接读取与检索", category: "搜索与内容基础",
    summary: "记录本站预渲染正文、规范地址、网站地图、文章结构化数据和站长平台接入，区分页面可抓取、地图已发现与实际收录。",
    lead: "官网中的服务范围、选购指南和联系方式需要能被直接读取。本站通过静态预渲染输出正文，再用一致的规范地址、网站地图和结构化数据组织页面，并将官网与商城地图接入 Google 和 Bing。",
    publishedAt: "2026-11-13", updatedAt: "2026-11-13",
    image: "projects/service-guide.webp", imageAlt: "本站企业官网开发指南的线上页面，包含作者、发布日期、目录与可阅读的正文",
    caption: "选购指南线上页面实拍，2026-11-13。文章正文、结构化数据和 Markdown 来自同一内容源。",
    facts: [
      { label: "项目归属", value: "光年数智官网与服务商城" },
      { label: "公开内容", value: "服务、方案、指南与商品" },
      { label: "核对日期", value: "2026-11-13" },
    ],
    sections: [
      { id: "content", title: "先让正文完整出现在页面里", paragraphs: ["官网使用构建时预渲染。服务说明、指南段落和问答保留在输出的 HTML 中；关闭 JavaScript 后仍能阅读主要内容。", "文章的标题、摘要、作者和更新日期与可见正文对应。JSON-LD、Markdown 与 AI 文本资料复用页面内容源，减少改了正文却遗漏机器可读资料的情况。"] },
      { id: "discovery", title: "明确哪些页面应该被发现", paragraphs: ["官网地图包含公开介绍和内容页，商城地图由当前上架商品数据生成。账号、订单与合同付款入口不进入公开收录清单，合同商品的占位金额也不作为服务报价。", "页面设置唯一规范地址，重复的显式 index.html 地址跳转到目录地址，无效页面返回真实的 HTTP 404。商品金额继续从商城读取，避免把旧报价复制到内容汇总中。"] },
      { id: "submission", title: "把平台反馈与实际效果分开记录", paragraphs: ["2026年11月13日首轮接入时，Google 和 Bing 各成功解析了官网地图中的26个页面，以及商城地图中的6个普通服务商品页。Google 的网址检查同时确认首页已经收录。", "这些是当次站长平台反馈，不能据此把所有页面都描述为已收录，也不能据此推断排名或 AI 引用。后续新增的项目实录继续进入网站地图，引用与搜索表现按平台后续数据观察。"], items: ["页面可读取：检查 HTML 正文、链接与返回状态。", "地图可解析：核对平台处理状态和发现的 URL 数量。", "收录与引用：分别查看网址检查、搜索表现及 AI 引用报告。"] },
    ],
    checks: [
      { title: "无脚本阅读", detail: "首页及三篇指南在关闭 JavaScript 的浏览器中检查过，主标题和正文可以读取。" },
      { title: "地图与规范地址", detail: "首轮32个公开页面核对 HTTP 状态、主标题、规范地址与结构化问答，未发现不一致项。" },
      { title: "平台接入", detail: "Google、Bing 均完成域名下的网址前缀或站点归属验证，两份地图处理成功。" },
    ],
    boundary: "平台反馈记录于2026年11月13日的首轮接入阶段。当前页面数量可能随内容增加而变化；本站未把地图解析数量、浏览器检查或模拟访问当作搜索排名与 AI 推荐结果。",
    references: [
      { label: "官网网站地图", href: "https://guangnian.xin/sitemap.xml", detail: "读取当前公开内容地址。" },
      { label: "商城商品地图", href: "https://guangnian.xin/shop/?s=sitemap/index", detail: "读取商城当前可收录的普通服务商品。" },
      { label: "公开内容文本", href: "https://guangnian.xin/llms.txt", detail: "查看服务、工作室、指南与项目实录的资料入口。" },
      { label: "首轮搜索优化实现", href: `${repository}/commit/${searchRevision}`, detail: "查看指南、结构化数据和收录范围调整的源码记录。" },
    ],
    faqs: [
      { question: "网站地图提交成功等于全部页面收录了吗？", answer: "提交成功表示平台接收了地图，解析成功表示发现了其中的网址。是否编入索引、如何排名和是否被 AI 引用，需要分别查看对应平台的实际结果。" },
      { question: "为什么还要提供可见正文和来源链接？", answer: "访客和检索系统都需要理解服务内容及信息依据。本站让正文、问答、文章标记和文本资料保持一致，并提供实际页面或源码链接，方便核对。" },
    ],
    guideSlugs: ["business-website-planning", "software-source-delivery"],
    solutionSlugs: ["business-website", "knowledge-assistant"],
  },
];

export const caseStudyPath = item => `/projects/${item.slug}/`;
export const findCaseStudy = slug => caseStudies.find(item => item.slug === slug);
