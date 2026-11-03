# 光年数智网络科技工作室

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
| `/guides/` | 服务选购、源码、排期与验收指南 |
| `/about/`、`/contact/` | 工作室介绍与联系方式 |
| `/lab/` | 用户主动启动的 Cesium 三维演示 |
| `/shop/` | 原生商城商品、登录与结账 |
| `/orders/`、`/checkout/` | 商城账号订单与购买入口 |
| `/service-terms/` | 服务购买与信息使用说明 |
| `/404/` | 无效地址提示 |

站点与联系信息维护于 `src/content/site.js`；服务、产品、方案与选购指南维护于 `src/content/`。公开路径来自 `src/content/paths.js`，路由来自 `src/routes.js`。`src/components/site/` 提供官网组件，`src/styles/` 提供共享样式。搜索信息由 `src/composables/useSiteSeo.js` 与 `src/content/search.js` 维护。

方案介绍和演示画面不作为已交付客户案例，价格及可售状态以商城实际记录为准。官网使用 V5 宣传片；`video/` 保留可编辑工程及其引用的历史制作脚本和素材。

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

普通页面不加载 Cesium，只有主动启动三维演示后才加载引擎。动画遵守系统减少动态效果偏好，并在离屏或后台暂停。地图授权、真实浏览器交互、部署后的 HTTP 状态和支付联调仍需按发布范围单独验收。

## 支付行为

支付宝异步通知使用原始字段验签，避免 HTML 转义改写签名内容。浏览器回跳只有与服务端已确认支付记录一致时才显示成功；未确认时显示等待确认，不依赖回跳修改订单状态。

合同付款显示支付宝费率 **0.6%**：手续费按输入合同金额计算并四舍五入到分，实付为合同金额加手续费；输入 100.00 元实付 100.60 元，输入 1.00 元实付 1.01 元。服务端独立计算并保存明细，只影响新合同订单。商品、合同文件、商户配置、生产备份及订单数据均由商城实例维护。
