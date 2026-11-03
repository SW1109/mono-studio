# Vue 官网与 ShopXO 商城部署

官网发布 `dist/`，ShopXO 管理商品、会员、订单与支付，通过 Nginx 挂载到同域 `/shop/`。服务器使用 PHP/MySQL 运行商城，Node.js 仅用于构建和源码准备。旧 Node 支付 API 与 SQLite 服务已移除。

## 来源与源码准备

上游为 [gongfuxiang/shopxo](https://github.com/gongfuxiang/shopxo)，保留 MIT 许可证。二开基于 v6.9.2 固定提交，来源、归档 SHA-256、补丁和覆盖文件摘要记录在 `upstream.lock.json`；独立插件授权须另行核对。

```bash
npm ci
npm run orders:prepare
# 输出目录已存在时会拒绝覆盖，可另选全新目录：
npm run orders:prepare -- --output artifacts/order-center/shopxo-next
# 本地官方归档同样必须匹配锁定摘要：
npm run orders:prepare -- --archive /absolute/path/to/source.tar.gz --output /absolute/path/to/new-source
```

准备过程校验归档、路径和文件摘要，应用补丁，复制 `overlay/`，生成来源清单、服务目录与官网导航，并在本机存在 PHP 时检查语法。该过程不安装数据库、不导入商品、不启用收款。修改补丁或覆盖文件后同步锁文件摘要，再用全新目录验证。

`nginx-security.conf`、`nginx-storefront.conf`、`nginx-seo.conf` 分别用于私有路径保护、同域挂载和规范地址。按部署目录、域名及 PHP socket 调整后合并到现有站点配置，保留 TLS 与支付回调规则，并先执行 `nginx -t`。

## 安装与升级

将准备好的源码部署到商城独立目录，配置 PHP/MySQL，完成官方安装并保留安装锁。数据库密码、商户参数和随机后台入口只保存在实例与受保护的本地资料中；不要将完整运行目录或数据库导出提交到仓库。

v6.9.1 升级到 v6.9.2 使用锁定的 `upgrades/6.9.1-to-6.9.2.php`，准备源码时输出为 `MONO-STUDIO-UPGRADE-6.9.2.php`。先备份数据库、源码、上传文件、合同及实例 JSON 配置，在隔离副本验证后按脚本帮助执行，保留旧目录以便回滚。不要覆盖运行实例的数据库连接配置和支付参数。

商城 Web 进程仅需写缓存、会话、上传和合同目录；源码及维护器由部署账号管理。安装后封闭安装入口，私有目录不对公网开放。PHP 上传限制应支持合同文件大小，`post_max_size` 应留出请求余量。

## 目录与站点维护

以下维护器只允许 CLI 执行，默认检查模式；写入时须提供本次有效的 SQL gzip 备份：

```bash
php MONO-STUDIO-CATALOG.php
php MONO-STUDIO-CATALOG.php --apply --backup=/private/database.sql.gz
php MONO-STUDIO-CONTRACT.php
php MONO-STUDIO-CONTRACT.php --apply --backup=/private/database.sql.gz
php MONO-STUDIO-SITE-CONFIG.php
php MONO-STUDIO-SITE-CONFIG.php --apply --backup=/private/database.sql.gz
```

- `CATALOG` 按服务编码维护目录基线，保留商品 ID、订单、会员和支付参数；遇到不支持的数据停止执行。日常价格、库存及上下架由后台维护。
- `CONTRACT` 识别或创建合同付款商品，生成实例专用的 `mono-contract-payment.json`；其中包含下载签名密钥，不得提交。
- `SITE-CONFIG` 维护公开站点配置、分类、商品参数和帮助内容；公开基线来自 `mono-site-config.json`，不配置商户私钥。

执行顺序为 catalog → contract → site-config。按实际缓存驱动刷新商品、配置和模板缓存，保留会话与合同文件。旧演示初始化器已移除，不使用演示数据重置运行实例。

官网导航和联系方式从 `src/content/site.js` 生成到 `mono-site-navigation.json`，修改后重新准备并同步。商品 sitemap、canonical 和结构化数据从商城数据库读取；账号、订单及结账页面使用 `noindex`。

## 合同付款与费率

合同商品只走专用表单：上传合同、填写合同编号和金额，再进入商城原生支付宝收银台。标准商品购买和购物车流程会拒绝缺少合同凭据的请求。

实例配置控制金额范围、文件类型和大小，表单与后端读取同一来源。默认合同金额范围为 1.00–200,000.00 元，文件支持 PDF/JPG/PNG，最大 10MB；上线前以实际实例配置核对。合同保存于私有 `runtime/contracts/`，下载使用签名入口，须备份合同目录及其签名配置。

支付宝费率为 **0.6%**，手续费按整数分计算并四舍五入：

| 输入合同金额 | 手续费 | 实付金额 |
| --- | --- | --- |
| 1.00 元 | 0.01 元 | 1.01 元 |
| 100.00 元 | 0.60 元 | 100.60 元 |

后端独立计算实付，签名凭据包含费用明细，订单扩展保留合同原金额及手续费。只影响新合同订单，普通固定价商品及历史订单不变。客户填写的合同与金额仍需商家人工核验。

## 支付配置与回调

支付宝参数仅在商城后台配置。官方插件使用 RSA2，按商户实际权限选择沙箱或正式环境、电脑或手机网站支付；后台填写应用 ID、收款方 PID、应用私钥及支付宝公钥。第三方插件需核对服务商协议、依赖和授权，不能因源码存在就视为已接通。

部署时先预建官方支付入口，保持源码由部署账号拥有：

```bash
php MONO-STUDIO-PAYMENTS.php --prepare
```

默认订单通知与回跳路径为：

```text
^/payment_default_order_(?:alipay|jeepayalipay|epaylinksalipay)_(?:respond|notify)\.php$
```

若使用 PHP 白名单，在最终拒绝其他 PHP 的规则之前，为这些入口设置与 `index.php` 相同的 FastCGI 及 `try_files $uri =404`。不要给上传目录开放 PHP 执行。

异步通知必须对原始字段验签并核对应用、收款方、订单号和金额；处理成功返回纯字符串 `success`，重复通知幂等。`0006-alipay-callback-verification.patch` 防止框架 HTML 转义改变通知字段。浏览器回跳不确认付款，只有已确认支付日志与当前订单、渠道、交易号和金额一致才显示成功，否则显示等待确认。

保留订单金额核对设置，不能为联调关闭金额校验。新装支付宝插件时核对新增配置字段；运行实例应通过备份和迁移更新，不卸载仍接收旧订单通知的插件。真实支付、异步到账与退款需在授权环境单独验收，源码准备和构建检查不替代支付验收。

## 备份与发布

`ops/backup-mall.sh` 用于生产备份，通过 `SRC` 和 `DEST` 环境变量显式提供商城源码目录与私有备份目录。保护文件权限，定时执行并定期验证恢复；不要把备份放入公开目录。源码更新前记录当前版本及摘要，保留上一版源码、官网产物、数据库与实例配置。

官网运行 `npm run release:package` 生成白名单发布包；商城使用准备好的独立源码，按改动范围同步补丁、覆盖文件及生成导航。发布后检查首页、商品、登录、合同表单、原生订单链接、静态资源和 HTTP 404；支付改动额外核对通知、回跳与幂等。

本地环境文件、`secrets/`、`data/`、整个 `artifacts/`、数据库备份、合同与密钥均由 `.gitignore` 排除。公开仓库只保留可复现源码与通用部署步骤，生产账号、内部路径、交易记录和验收截图不在此维护。
