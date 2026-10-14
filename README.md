<!--
 * @Author: wxs
 * @Date: 2026-09-11 11:36:04
 * @Description:
 * @LastEditTime: 2026-10-08 12:34:48
 * @LastEditors: wxs
-->
# 光年数智网络科技工作室

Vue 3 + Vite + Vue Router + Vite SSG 的多页面官网。公开页面在构建时输出 HTML 正文；页面切换使用客户端路由。首页使用轻量动态工作台示意，不运行 Canvas、Three.js 或鼠标跟随动画。

## 开发与验证

使用 Node.js 24 LTS（项目要求 Node >=22.13）。依赖已由 `package-lock.json` 锁定，新环境使用 `npm ci`；调整依赖时使用 `npm install` 并同步锁文件。

```bash
cd "/Users/wxs/yanjiu/shangwen/mono-studio"
nvm use 24
npm ci
npm test
npm run dev -- --host 127.0.0.1 --port 4176 --strictPort
```

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4176 --strictPort
```

- `npm test`：内容配置、公开路径、Vue 单文件组件 / CSS 编译和源码加载边界回归。不是浏览器交互验收。
- `npm run build`：SSG 新鲜构建后自动检查所有页面正文、产品详情、SEO 与启动资源隔离。任一检查失败会返回非零状态。
- `npm run check:build`：单独检查现有产物，不能代替先构建。
- 依赖变更与更新后的 `package-lock.json` 一起纳入版本管理，发布环境使用 `npm ci`。

### 本轮验证状态

依赖与锁文件已同步，25 项源码回归及新生产构建通过。构建检查覆盖 12 个预渲染页面、产品正文和启动资源隔离。浏览器已验证首屏动画实际播放与手动暂停、滚动入场与离屏冻结、产品详情入口与分类筛选、移动菜单及系统减少动态效果；首页在 360px、768px、1440px 下无水平溢出，检查期间无 3D 资源请求。

完整三维演示的启动、失败恢复、反复退出，以及正式部署环境的 HTTP 404 与性能指标仍需发布前验收。原站包体记录保存在 `scripts/baseline.json`，仅代表构建大小，不代表实测加载速度。

## 页面与职责

| 路径 | 页面 |
| --- | --- |
| `/` | 品牌、服务、精选产品与合作流程 |
| `/services/` | 四类服务、交付范围与常见问题 |
| `/products/` | 9 个可定制方案、分类筛选与现有工具列表 |
| `/products/:slug/` | 定制方案的详细介绍及原有五款工具详情 |
| `/about/` | 工作室介绍与开发理念 |
| `/contact/` | 邮箱、微信、咨询上下文与需求指引 |
| `/lab/` | 用户主动启动的 Cesium 三维演示 |
| `/404/` | 无效地址提示 |

- `src/content/site.js`：名称、导航、联系方式、备案、流程与 FAQ。
- `src/content/services.js`：开发服务信息。
- `src/content/solutions.js`：9 个可定制开发方向，每项包含 `scenarios`、`modules`、`workflow`、`deliverables`、`extensions` 和 `faq`，以及平台、适用人群与边界说明。
- `src/content/products.js`：原有五款工具与完整目录聚合；统一详情路径、首页精选和咨询标题。`kind: "solution"` 表示可定制方案，`kind: "product"` 表示现有工具，不混用身份。
- `src/content/paths.js`：预渲染与 sitemap 路径。
- `src/routes.js`：页面路由与页面描述；`src/App.vue` 只负责布局、页面级 SEO 和切换后的焦点。
- `src/components/site/`：导航、页脚、产品卡片和轻量工作台示意。
- `src/composables/useSiteMotion.js`：统一注册滚动入场与场景可见性，响应系统减少动态效果及后台状态，路由替换与卸载时回收观察器和动画。首屏持续动效可通过“暂停动效”按钮关闭；内容默认可见，不依赖动画才显示。
- `src/styles/main.css`：基础样式、设计变量和共享组件；页面独有样式在页面组件内。

原有产品名称和详情地址保留；新增官网、CRM、进销存、预约小程序、商城、办公审批、数据看板、AI 知识库与自动化方案，均明确标为“可定制方案”，不作为已上线标准产品或客户案例。详情按业务场景、可选模块、流程、交付、扩展与常见问题组织；首页精选和联系页咨询来源读取同一目录，新增条目自动进入预渲染路径。

未核实的评分、用户数、速度提升、价格与履历不展示。卡片插画、功能结构和首页工作台为设计示意，不是实际产品截图。后续完善真实截图、下载地址、功能与平台支持时，只维护相应配置 / 页面，不捏造宣传数据。

## Logo

使用 `/Users/wxs/工作室/iloveimg-converted/` 的 `logo3.jpg` 与 `logi-icon.jpg` 生成派生图片，原文件未修改。

- `src/assets/brand-logo.jpg`：横版标识（660 × 275）。
- `src/assets/brand-mark.png`：保留比例的图标（192 × 162）。
- `public/favicon.png`：64 × 64，等比缩小后补白，不拉伸。

派生图片保留原始比例。正式发布前核对 Logo 的清晰度与留白；不要把 JPG 包装成“矢量 SVG”。

## 部署与 SEO

公开配置参见 `.env.example`：

- `VITE_BASE_PATH=/`：默认部署到域名根目录。子目录例如 `/studio/`，必须以 `/` 开头和结尾，修改后重新构建。
- `VITE_SITE_URL`：只填正式协议与域名，不含路径，例如 `https://your-domain.example`。未确认域名时留空，不生成猜测的 canonical / sitemap。
- 配置正式域名后自动输出 `sitemap.xml`、`robots.txt` 与页面 canonical。404 标记 `noindex`。

SSG 将页面输出为 `dist/services/index.html`、`dist/products/viewturbo/index.html` 等。静态服务器应优先提供真实文件，未知地址返回真正的 HTTP 404，而不是把所有路径回退到首页。

根目录部署的 Nginx 示例（站点目录与 server_name 按实际环境配置）：

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

子目录部署时，静态目录、location 和 error_page 都要使用相同前缀；不要直接套用根目录配置。HTML 不使用长期不可变缓存；仅带内容哈希的 assets 使用 immutable。Cesium 的 Workers / Assets / ThirdParty / Widgets 复制到 `dist/cesium/`，其运行路径随 base 配置，不能相对于深层页面猜测。

## 三维演示

普通页面与 `/lab/` 初始 HTML 不引用引擎。只有点击“启动三维演示”后才加载组件与 Cesium；支持取消、停止和加载失败重试。后台 / 离屏暂停 Viewer 渲染循环，离开页面销毁 Viewer，晚到的图元会回收。取消不能中止浏览器已经开始的 JavaScript 下载，但不会让过期结果重新创建场景。

默认无显式数据源时使用 local 预览；已有 `.env.local` 的显式配置仍生效，未自动改动用户的私有配置。`google` / `ion` 需要相应凭据、权限和地图服务授权，天地图注记也属于外部请求。所有 `VITE_*` 变量是客户端可见的公开配置，**不是保密存储**；必须限制密钥的可用域名、API 与配额。地图版权归属不可隐藏。

联系页面没有后台提交功能；“打开邮件客户端”使用 `mailto:`，微信与邮箱提供复制并在失败时显示手动复制提示。备案号沿用旧站，正式发布前核对主体、域名与展示要求。

## 服务商城与支付宝电脑网站支付

新增 `/shop/`（服务商品）、`/checkout/?service=...`（确认订单）、`/orders/?order=...`（订单结果与查询）和 `/service-terms/`（购买条款、交付与信息使用说明）。商城独立于原有“可定制方案”与尚未核实的工具产品，不将概念方案当成已经交付的商品或客户案例。

`shared/commerce.js` 是服务商品、整数分价格、表单约束与条款版本的共同来源。当前提供软件问题诊断、前端单页面优化、单接口对接三个**待经营者确认**的套餐，建议价格分别为 299、699、999 元；正式售卖前必须确认能实际履行的范围、排期、价格、主体和条款。修改商品后重新构建前端并重启服务端。商品展示可以辅助说明业务，不能代替平台资质审核或真实经营证明。

### 服务端与支付边界

- `server/` 是独立 Node 服务，提供订单 API，并可直接托管构建后的官网；需要 Node >=22.13，建议与原项目保持 Node 24 LTS。SQLite 使用 Node 内置 `node:sqlite`，不增加数据库和支付运行时依赖。
- `server/payments/alipay.mjs` 实现支付宝 OpenAPI 的 **RSA2 普通公钥模式**：`alipay.trade.page.pay` 收银台参数签名、异步通知验签以及 `alipay.trade.query` 查询响应验签。当前**不支持证书模式**，配置里的支付宝公钥不是应用公钥。
- 金额由服务端根据商品计算，不采用客户端传入价格；同时核对用户确认的报价，拒绝价格变化后直接扣款，持久化购买时的服务范围快照；订单创建使用幂等请求标识，SQLite 原子记录通知，校验应用、收款方、订单、金额与交易流水。同步回跳只跳转订单页，不能标记付款；已付款状态不会被晚到通知回退。
- 下单浏览器持有 HttpOnly / SameSite=Lax 会话 Cookie，数据库只保存其哈希；查单须使用同一浏览器。生产 HTTPS 使用 Secure Cookie。写接口校验来源，不开放通用 CORS。订单结果页不进入 sitemap，且 noindex。
- 支付成功表示收款确认，**不表示服务已经交付**。排期、交付、发票、取消和原渠道退款目前由经营者人工处理；没有自动退款或后台履约管理界面。
- 支付提供者通过 `createCheckout`、`query`、`verifyNotification`、`toPaymentEvent` 与订单存储分离。当前只接受 `alipay`，没有可点击的虚假微信支付入口；以后接入微信时需要新增真实通道、对应通知校验和平台配置。

### 本地开发

```bash
cp .env.payment.example .env.payment.local
# 先保持 PAYMENTS_ENABLED=false；不配置密钥也能浏览商城。
npm run server
# 另开终端：Vite 将当前 base 下的 api/commerce 转发到 127.0.0.1:8787。
npm run dev -- --host 127.0.0.1 --port 4176 --strictPort
```

打开 `http://127.0.0.1:4176/shop/`。若调整支付端口，须同步 `vite.config.js` 的代理目标。原有 `.env.local` 不被支付服务加载或修改；仅 `.env.payment.local` 用于服务端。

### 沙箱联调与正式启用

1. 在支付宝开放平台配置自己的应用，并确认已开通**电脑网站支付**。先使用沙箱应用与沙箱账号；不能把沙箱成功当作正式收款通过。
2. 将应用 RSA 私钥与平台提供的**支付宝公钥**保存为 PEM 文件，设置 `ALIPAY_PRIVATE_KEY_PATH`、`ALIPAY_PUBLIC_KEY_PATH`；建议权限 `600`。不要使用 `VITE_*` 存放密钥，不要把密钥、订单库或私密配置提交到仓库。
3. 配置 `ALIPAY_APP_ID`、实际收款方 `ALIPAY_SELLER_ID`、`PAYMENT_MERCHANT_NAME`。确认商品和条款后，设置 `PAYMENT_CATALOG_CONFIRMED=true`、`PAYMENTS_ENABLED=true`；配置缺失时服务端拒绝开启。已开启后若仅暂停新收款，设 `PAYMENTS_ENABLED=false` 并保留完整通道配置，旧订单通知与查询仍可核实；不要为关店删除密钥或订单库。
4. `PAYMENT_PUBLIC_ORIGIN` 为实际对外访问域名（只填协议与域名）；`PAYMENT_BASE_PATH` 与 `VITE_BASE_PATH` 一致。异步通知必须能从公网访问。本地开发可以使用有授权的 HTTPS 联调域名，沙箱下用 `PAYMENT_DEV_ORIGIN` 额外允许本地 Vite 来源；单纯 localhost 无法接收支付宝服务端通知。
5. 签名时自动生成 `${PAYMENT_PUBLIC_ORIGIN}${PAYMENT_BASE_PATH}api/commerce/alipay/notify` 与对应 `return` 地址；回跳后页面查询服务端订单。支付宝控制台中需要配置的站点/回调与应用设置，请按该应用实际要求填写同一对外域名。
6. 正式启用时切换 `ALIPAY_ENV=production`，改用正式应用及公钥、公网 HTTPS 和真实主体；去除不再需要的开发来源。必须用自己的应用完成沙箱联调、通知到达验证、订单核对与经授权的正式小额验收，不能只依靠本地测试。

### 部署方式

原有纯静态部署仍能展示商品，但**不能提供真实下单和付款**。可在 `npm run build` 后用 `npm start` 同时服务官网与订单 API，再由现有 HTTPS 反向代理转发。也可保留原来的静态站点托管，只把 API 转发到 Node：

```nginx
# 示例为域名根目录部署；子目录部署须把两处路径改为对应 base，且不要去掉请求路径。
location ^~ /api/commerce/ {
    proxy_pass http://127.0.0.1:8787;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 30s;
}
```

`data/commerce.sqlite` 及 WAL 文件是持久化交易数据，部署目录切换时应配置固定的数据路径、限制目录权限并做好一致性备份；不能放在静态站点目录，不能在每次发布时删除。当前适合单实例服务、小规模订单；不将 SQLite 文件当作多实例共享数据库。API 默认按连接来源 IP 限流；仅在服务绑定回环且 Nginx 覆盖 `X-Real-IP` 后设置 `PAYMENT_TRUST_PROXY=true`，才能按真实客户端 IP 计数。不信任公网直连提供的转发头。

### 查看待履约订单

服务器运维可在项目目录运行下列只读命令，查看已付款订单及联系资料；请仅在可信终端使用，不将输出转发到公共日志或第三方平台。没有添加公开的无鉴权管理接口。

```bash
npm run orders:list -- --status PAID --limit 20
```

确认排期、交付和退款仍需经营者按真实业务流程处理，支付状态不冒充履约状态。

### 验证范围

`npm test` 包含原网站回归、字段与金额边界、RSA2 请求/通知/响应验签、订单持久化、幂等、浏览器权限隔离、篡改金额、伪造回跳与重复通知等本地测试。测试使用即时生成的 RSA 密钥和本地 HTTP 服务，**不连接支付宝、不创建真实交易**。构建检查继续覆盖 SSG 正文和三维资源隔离；商户资格、真实服务履约、支付宝沙箱/生产支付和线上通知必须在配置实际环境后另行验证。


## 开源订单中心与宝塔部署

推荐保持官网展示与交易系统分离。已添加 **ShopXO 原生页面入口集成**，不导入整套商城代码、不伪造登录或付款成功：

- 配置 `VITE_SHOPXO_ORIGIN` 与 `VITE_SHOPXO_PRODUCTS` 后，服务卡片进入真实 ShopXO 商品页；订单查询进入其账户订单中心。电脑/手机必须登录同一账号，交易只由订单中心持久化。
- 未配置仍沿用现有 Node 链路，不会因为新增入口代码就获得跨设备查询能力。旧 Node 订单不会自动归入 ShopXO 账户；不提供未鉴权的同邮箱查单。
- 官网隐藏 ShopXO 模式下的静态报价，最终价格、主体、交付与条款以订单中心下单确认为准。
- 目前只做网页入口，不含原生 App、小程序、SSO、Vue 内嵌 ShopXO API 或旧库迁移。ShopXO 是否已安装、商品是否上架、手机网站支付是否开通，仍须真实环境验证。

宝塔部署、版本与许可、商品映射和多端验收见 `deploy/shopxo/README.md`。原 Node 链路的经营者 Bearer 鉴权只读接口、systemd/HTTPS 代理、持久数据库与每日备份见 `deploy/linux/README.md`。管理 API 未设置令牌时关闭，示例 Nginx 禁止公网管理访问。

```bash
npm run release:package # 构建官网并生成明确允许清单内的发布包，不包含商户秘密或订单库
npm run orders:backup   # 配置 PAYMENT_BACKUP_DIR 后生成一致性 SQLite 备份
```

当前未连接或部署阿里云服务器，收款仍默认关闭；需要提供实际 SSH 目标、登录方式、官网/订单中心域名，以及确认既有宝塔站点后再发布。
