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

使用 Node.js 24 LTS（项目要求 Node >=22.12）。依赖已由 `package-lock.json` 锁定，新环境使用 `npm ci`；调整依赖时使用 `npm install` 并同步锁文件。

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
