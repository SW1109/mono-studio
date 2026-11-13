# 光年数智网络科技工作室

官方网站：[guangnian.xin](https://guangnian.xin/)。工作室提供网站、业务系统、小程序、桌面工具与自动化开发服务，经营类型为个体工商户，统一社会信用代码为 `92370100MAKQ0BDMX6`。联系方式与经营信息见[工作室信息](https://guangnian.xin/about/#studio-facts)。

本仓库记录工作室自有官网与服务商城的实现。[项目实录](https://guangnian.xin/projects/)对应同一个项目中的官网商城整合、合同付款与支付宝回调、搜索内容建设三个部分，附线上截图、实现依据和验证范围；软件方案中的界面示意单独标注。

Vue 3 + Vite + Vue Router + Vite SSG 官网，公开页面在构建时输出 HTML 正文。ShopXO 商城挂载在同域 `/shop/`，负责商品、会员、订单和支付宝支付；官网不另建交易系统。

## 开发与构建

使用 `.nvmrc` 指定的 Node.js 版本（`nvm use`），其他受支持版本见 `package.json` 的 `engines`；依赖通过 `package-lock.json` 锁定。

```bash
npm ci
npm run dev -- --host 127.0.0.1 --port 4176 --strictPort
```

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4176 --strictPort
```

- `build`：生成静态页面，并检查预渲染正文、SEO、商城配置和启动资源隔离；检查失败返回非零状态。
- `check:build`：检查现有构建产物，不能代替新鲜构建。
- `release:package`：构建并生成白名单发布包，输出到本机 `artifacts/releases/`。
- `orders:prepare`：校验并准备固定版本的 ShopXO 二开源码，详见 [商城部署说明](deploy/shopxo/README.md)。

已清理历史测试、旧 Node/SQLite 交易服务和演示初始化脚本。构建检查保留；它不代表真实支付、退款或浏览器交互已验收。

## 页面与内容

| 路径 | 用途 |
| --- | --- |
| `/` | 工作室、服务、产品与合作流程 |
| `/services/` | 服务范围、交付内容与常见问题 |
| `/products/`、`/products/:slug/` | 可定制方案与现有工具详情 |
| `/guides/`、`/guides/:slug/` | 服务选购、官网建设、源码验收与表格自动化指南 |
| `/projects/`、`/projects/:slug/` | 自有官网与商城的项目实施记录、截图与依据 |
| `/about/`、`/contact/` | 工作室介绍与联系方式 |
| `/lab/` | 用户主动启动的 Cesium 三维演示 |
| `/shop/` | 原生商城商品、登录与结账 |
| `/orders/`、`/checkout/` | 商城账号订单与购买入口 |
| `/service-terms/` | 服务购买与信息使用说明 |
| `/404/` | 无效地址提示 |

站点与联系信息维护于 `src/content/site.js`；服务、产品、方案与选购指南维护于 `src/content/`。公开路径来自 `src/content/paths.js`，路由来自 `src/routes.js`。`src/components/site/` 提供官网组件，`src/styles/` 提供共享样式。搜索信息由 `src/composables/useSiteSeo.js` 与 `src/content/search.js` 维护。

方案介绍和演示画面不作为已交付客户案例，价格及可售状态以商城实际记录为准。官网使用 V5 宣传片；`video/` 保留可编辑工程及其引用的历史制作脚本和素材。

官网和商城统一使用暗色主题。亮色配色已注释保留，外观切换暂时停用，旧浏览器偏好和系统主题不会改变当前外观。`public/theme.js`、`public/theme.css` 和 `public/fonts/` 为共享资源源文件，商城覆盖目录内保留相同副本，构建检查会核对一致性。

视觉以 [Awesome DESIGN.md](https://github.com/VoltAgent/awesome-design-md) 中的 Linear 为主参考，统一近黑底色、分层灰面板、细边框、无衬线字体与少量紫色强调；保留此前 [Figma Site](https://repay-smile-39212411.figma.site/) 参考中的粒子和图片展示。首页粒子曲面使用 Three.js，支持指针响应、离屏暂停、减少动态效果和静态图回退。极光照片为 Justin Verweire / Unsplash（图片 ID `photo-1775255129476-95a1e9624710`），建筑照片为 Shojol Islam / Unsplash（图片 ID `photo-1711288153255-0a65ab00f2df`），保留画面及页面署名。商城 `native.css` 在原生页面样式后加载，覆盖商品、会员中心、订单、购物车、结算及独立弹窗；共享字体资产许可证见 `public/fonts/OFL.txt`。

## 配置与隐私

`.env.production` 仅保存公开域名、商城路径和商品 ID，可进入仓库。开发配置以 `.env.example` 为参考写入本机 `.env.local`。生产构建需配置正式站点与商城地址，缺失时构建失败；只有明确需要未配置版本时才使用 `VITE_ALLOW_UNCONFIGURED_BUILD=1`。

- `VITE_SITE_URL`：仅协议与域名，不带路径、查询或凭据。
- `VITE_BASE_PATH`：默认 `/`；子目录必须以 `/` 开头和结尾。
- `VITE_SHOPXO_ORIGIN`、`VITE_SHOPXO_BASE_PATH`：商城域名与挂载路径。
- `VITE_SHOPXO_PRODUCTS`：可选商品 ID 映射，未映射链接进入商城首页。
- `VITE_CESIUM_PROVIDER`：默认 `local`；外部地图服务按需配置权限、域名与配额。

所有 `VITE_*` 都是浏览器可见配置，不能存放商户私钥或服务端秘密。支付宝商户配置只在商城后台维护。本机环境文件、`secrets/`、订单库、合同文件、备份、截图及 `artifacts/` 不进入版本管理。`.env.local` 已停止跟踪；忽略规则不能移除 Git 历史中的旧内容。

## 静态部署与搜索

官网由 Nginx 托管 `dist/`，商城通过 PHP/MySQL 独立运行。静态站点应优先提供真实文件，未知地址返回 HTTP 404；商城路径使用 [同域挂载配置](deploy/shopxo/nginx-storefront.conf)，不能回退到官网 SPA。

```nginx
root /your/deployment/dist;
index index.html;
error_page 404 /404/index.html;

location / {
    try_files $uri $uri/ =404;
    add_header Cache-Control "no-cache";
}
location /assets/ {
    try_files $uri =404;
    add_header Cache-Control "public, max-age=31536000, immutable";
}
location /cesium/ {
    try_files $uri =404;
    add_header Cache-Control "public, max-age=86400";
}
```

子目录部署时同步修改 `base`、静态目录与 Nginx 路径。正式域名配置后输出 sitemap、robots、llms、canonical、分享图及 JSON-LD；商城商品地图从数据库读取。交易及账号入口标记 `noindex`。这些资源不保证搜索排名或收录。

指南正文维护于 `src/content/guideArticles.js`，项目实录维护于 `src/content/caseStudies.js`，工作室经营信息维护于 `src/content/site.js`。页面、Article / FAQ / Breadcrumb 标记、Markdown 版本及 `llms-full.txt` 共用内容源。新指南和实录自动加入预渲染与 sitemap；发布日期和修改日期只在内容实际发布或修改时更新。项目截图保存在 `public/projects/`，拍摄于 2026-11-13 的公开线上页面，不包含后台、账号或交易资料。`llms.txt` 和 Markdown 是补充阅读格式，搜索与 AI 引用仍以可访问、可验证的公开正文为基础。

合同项目付款属于交易入口，使用 `noindex`，不进入商品 sitemap 或服务报价结构化数据；商城展示和付款功能保留。普通在售服务的价格继续读取数据库，不在 AI 文本文件中复制静态价格。

`public/indexnow.txt` 是 **公开的站点归属验证文件**，不是账号密钥。发布后可按 [IndexNow 协议](https://www.indexnow.org/documentation) 向 `https://api.indexnow.org/indexnow` 提交本次变化的规范 URL，`keyLocation` 为正式域名下的 `/indexnow.txt`。成功接收（200）和等待密钥验证（202）均不代表已经收录；不要重复提交未变化的全站地址。交易页退出索引时可单独提交其公开 URL，不能提交订单号或带个人信息的地址。

Google Search Console、Bing Webmaster Tools、百度搜索资源平台需由站点所有者登录并完成站点验证，再提交官网与商城两份 sitemap、查看真实索引和搜索表现。验证文件或 DNS 记录使用平台实际提供的值，不能自行编造；账号口令和访问令牌不进入源码或构建产物。

普通页面不加载 Cesium，只有主动启动三维演示后才加载地图引擎；首页按需加载粒子动画模块。动画遵守系统减少动态效果偏好，并在离屏或后台暂停。地图授权、真实浏览器交互、部署后的 HTTP 状态和支付联调仍需按发布范围单独验收。

## 支付行为

支付宝异步通知使用原始字段验签，避免 HTML 转义改写签名内容。浏览器回跳只有与服务端已确认支付记录一致时才显示成功；未确认时显示等待确认，不依赖回跳修改订单状态。

合同付款显示支付宝费率 **0.6%**：手续费按输入合同金额计算并四舍五入到分，实付为合同金额加手续费；输入 100.00 元实付 100.60 元，输入 1.00 元实付 1.01 元。服务端独立计算并保存明细，只影响新合同订单。商品、合同文件、商户配置、生产备份及订单数据均由商城实例维护。
