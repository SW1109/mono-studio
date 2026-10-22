# Vue 官网与 ShopXO 服务订单中心

官网负责展示；ShopXO 统一管理账号、商品、订单、售后与支付，通过原生页面跳转接入。旧 Node 订单保留原浏览器凭证查询和通知，不能按同邮箱自动绑定新账号。

## 源码、依赖与准备

`upstream.lock.json` 固定官方仓库 https://github.com/gongfuxiang/shopxo 的提交 `e55db292b07b3406049b41dad216da6fa568ac57`（v6.9.1）、官方归档和关键文件 SHA-256。它是二开基线，不代表最新官方版本或全量安全认证。核心 MIT 许可证保留，商店插件及独立客户端另按其授权处理。

```bash
npm run orders:prepare -- --output /全新目录/订单中心 --require-php
# 支持同一官方归档离线校验，以及安装锁定依赖：
npm run orders:prepare -- --archive /路径/shopxo.tar.gz --output /全新目录/订单中心 --composer /可信路径/composer.phar --require-php
```

流程校验归档、拒绝目录穿越和链接、应用精确补丁、校验输出并复制带摘要的扩展。Windows 不依赖 GNU patch。已有输出目录拒绝覆盖，避免破坏订单、配置和安装状态。`--php` 或 `PHP_BINARY` 可指定 PHP；Windows 若存在隔离的 `artifacts/order-center/php-runtime/php.exe`，脚本会自动使用。

本补丁的 PHP 安全版本基线为 **8.3.36 / 8.4.27 / 8.5.12 或对应分支的更新补丁版本**，本机完整交易回归使用 8.3.36；8.4/8.5 还需在目标环境验证应用兼容性。PHP 8.2 不符合本项目要求，未审核的新分支及预发行版会被拒绝。还需 PDO MySQL、OpenSSL、curl、mbstring、GD、ZIP、XML、fileinfo 等扩展；Composer 核对实际要求。**上游归档自带旧 vendor 一律移除**，新清单和锁位于 `dependencies/`，已更新框架、ORM、PHPMailer、PhpSpreadsheet 等。未传 `--composer` 时须进入输出目录执行：

```bash
composer install --no-dev --no-interaction --no-scripts --prefer-dist
composer check-platform-reqs --no-dev
composer audit --locked --no-dev
php think service:discover
```

不安装开发调试组件，不执行未知安装脚本。`mono-source-manifest.json` 记录文件摘要、PHP 检查及依赖安装/扫描状态；无 PHP 时只能准备源码，状态明确为未检查。准备命令不安装数据库、不创建用户、不上架商品、不开启真实收款。

### 2026-10-21 PHP 远程代码执行漏洞与宝塔部署

PHP 官方与宝塔 2026-10-21 公告涉及 **CVE-2026-109618 和 CVE-2026-109619 两项严重漏洞**，影响包括 PHP-FPM、Apache mod_php 等执行模式，可能导致未经身份验证的远程代码执行。不能只排查 Windows CGI。官方要求升级 PHP；2026-10-22 核对的修复版本已写入 `php-security-policy.json`，这是这些漏洞的最低版本要求，不代表未来无需再更新。公告：

- PHP：https://www.php.net/archive/2026.php
- 宝塔：https://docs.bt.cn/notices/php-nodejs-security-update-2026-10-21/

`orders:prepare` 在下载或处理源码前检查本次 PHP 版本，Composer 约束与 `test:shopxo` 也拒绝低于各分支修复线的环境。`composer audit` 只检查依赖，不能证明 PHP 引擎已修复。发行版回补补丁不按版本号猜测放行，须另行核对供应商公告。

宝塔部署时完成以下步骤：

1. 备份站点、数据库和 PHP 配置，在**软件商店 → 已安装**先点击**更新软件列表 / 支付状态**，再对站点实际使用的 PHP 点击**更新**，随后在网站设置中确认 PHP 版本绑定。所有对外站点所用 PHP 均须核对；面板或 WAF 更新不能证明 PHP 引擎已升级。
2. 在该 PHP 的实际 `php.ini` 中合并 `php-production.ini`，设置 `session.upload_progress.enabled=0`；PHP 8.5 同时设置 `fatal_error_backtraces=0`。检查 FPM 池是否覆盖这些值。应用代码里的 `ini_set()` 和 FPM 的 `.user.ini` 晚于相关请求解析，不能作为漏洞修复。
3. 在维护窗口重启实际使用的 PHP-FPM/Apache/PHP-CGI 服务，确认旧工作进程全部退出。多节点、容器和其他 PHP 分支逐一更新。仅替换磁盘文件或只重启 Nginx 不等于更新了已运行的 PHP。
4. 对照网站配置核对 FPM socket 和对应二进制，执行下面的版本及配置检查。CLI 检查不会替你验证网站 FPM 进程，不向公网放置 `phpinfo()` 或诊断页面。

```bash
# 仓库中检查选定 PHP；本机 Windows 隔离 PHP 可自动找到：
npm run check:php -- --php /www/server/php/83/bin/php
# 准备后的站点根目录自带独立 PHP 检查，无需 Node；路径按实际安装调整：
/www/server/php/83/bin/php -c /www/server/php/83/etc/php.ini /站点源码/php-runtime-check.php --require-hardening
/www/server/php/83/sbin/php-fpm -v
```

运行配置输出只含版本、二进制/配置文件路径和两项选定开关，不输出完整环境变量或商户配置。关闭上述功能是官方临时缓解与额外防护，**必须同时升级运行时**。本项目页面上传使用普通请求，不依赖 PHP session 上传进度功能；上传和支付回调仍需在实际网站做冒烟验证。

## 已补齐的支付流程

- 先校验全部订单归属，再处理零元订单、库存检查与支付方式变更；用户更新同时约束归属和待付状态。发起支付必须满足通道启用、对用户开放与适用终端条件，关闭新收款仍允许旧通知和查单。
- 通知强制核对原支付日志的通道、业务类型、整数分金额和交易号，已付重放也核对身份。InnoDB 事务内锁支付日志和按 ID 排序的订单，并读取最新状态；支付日志仅一次成功写入，避免重复扣库存和增加销量。
- 关闭订单收到真实付款时登记收款并保留关闭状态，不恢复交付。重复支付、支付后改价进入 `MONO_REVIEW:` 队列；金额变化时不把旧款当足额付款，待核对期间阻止该订单继续付款。
- 默认关闭虚拟商品付款后的自动交付。远程服务先人工联系、确认资料与排期，实际完成后后台交付，再由客户确认；付款不等于履约。
- 新售后的退款号由支付单与持久化售后 ID 派生。同额不同售后使用不同请求号，同一售后重试保持原号。退款前锁售后与主订单、核对累计上限；支付宝订单固定原路退款，避免不确定结果后改走钱包。
- 退款验签且交易号、支付单、金额匹配后才登记成功。网络失败会查询同一退款请求，仍不确定则保留待处理状态。同步响应按原始 JSON 字节验签，拒绝重复封装键、异常结构及过大响应。

事务不能撤销短信、邮件和第三方发货调用。外部插件须用支付日志 ID/售后 ID 作幂等键，另行验收外部去重与重试。数据库回归使用可计数的库存、消息和网关适配器，不代表任意商店插件已通过验收。

### 历史退款升级

`config/mono_payment.php` 的 `refund_v2_from` 是新退款方案启用时间。**升级和恢复必须保留首次启用值，不要用重新准备源码生成的值覆盖已有配置。** 更早售后拒绝自动换号退款，防止旧请求已经退过款却再次生成新号。历史不确定退款只能明确查询原请求号，核对支付宝回执后迁移；不要删除日志、修改售后 ID 或换渠道绕过保护。

## 漏通知与异常收款处理入口

`mono-payments.php` 只允许 CLI，HTTP 返回 404；输出不含私钥、数据库凭据和客户联系方式。

```bash
php mono-payments.php issues
# 默认只查询，加 --apply 才将已验签结果交给原生幂等处理：
php mono-payments.php reconcile --log-no=实际支付单号
php mono-payments.php reconcile --log-no=实际支付单号 --apply
# 独立文件锁防重叠，游标轮转覆盖最近 7 天未付日志：
php mono-payments.php reconcile --scheduled --limit=20 --apply
php mono-payments.php refund-query --aftersale-id=实际编号
php mono-payments.php refund-query --aftersale-id=实际编号 --refund-request-no=历史原请求号
```

将定时核对命令设为每分钟一次的宝塔任务，使用实际 PHP 路径、站点工作目录和私有日志。超过 7 天的疑似漏单用 `--log-no` 定向处理。任务不关闭网关交易、不根据超时猜测支付成功。

异常款先在支付宝商户后台核对并原路全额退款，再使用实际退款请求号核对回执：

```bash
php mono-payments.php resolve-issue --log-no=原支付单 --refund-request-no=已退款请求号
php mono-payments.php resolve-issue --log-no=原支付单 --refund-request-no=已退款请求号 --apply
```

只有验签、交易号、原请求号、成功状态与全额退款金额匹配，才记录原生退款回执并标记 `MONO_RESOLVED:`，并发执行不重复登记。该操作不发起退款、不改订单金额、不恢复关闭订单，也不代替正常售后履约状态核对。保留原订单和交易凭据，不通过清空记录消除告警。

## 账号、商品与官网入口

首次在独立测试站点完成原生数据库/管理员安装，使用独立普通数据库账号。配置注册、登录及必要邮件投递，实际验收账号 A/B 订单隔离与跨设备登录。

`mono-service-catalog.json` 是三项服务的待确认资料，不是已入库商品。后台创建真实商品，填写范围、资料要求、排期、交付、排除项和退款说明；远程服务使用虚拟销售并保留手动交付设置，不伪造快递物流。确认价格与经营主体后上架。

在 **ShopXO 后台 → 支付方式 → 支付宝** 配置环境、应用 ID、真实收款方 PID、应用私钥与支付宝公钥，凭据须属于同一环境。默认沙箱；开通并验收手机网站支付后才开 WAP。本次适配普通公钥 `Alipay`，未适配 `AlipayCert`、微信、原生 App、小程序或 SSO。

商户配置仍存于原生数据库，并向有支付管理权限的管理员回显；限制后台、数据库和备份权限。凭据不能进入 VITE_*、官网产物或 Git。已有实例须备份后迁移支付配置定义，不卸载仍接收历史通知的插件。

```dotenv
VITE_SHOPXO_ORIGIN=https://your-verified-order-domain.example
VITE_SHOPXO_PRODUCTS={"technical-review":101,"page-improvement":102,"api-integration":103}
```

数字是格式示例，须换成实际且不同的商品 ID。配置全部映射后重新构建官网，核对原生商品和订单路由。官网隐藏静态价格，实时金额、收款方和期限以订单中心确认页为准；条款按模式说明账号查询。旧 GN 订单号链接仍查询 Node 服务，旧通道保留历史通知/查单并关闭新下单。

旧 Node 服务设置 `PAYMENT_ORDER_CENTER=shopxo`，服务端强制关闭新下单与签发付款参数。官网与 API 同目录部署时也会读取 `dist/site-build.json` 自动识别 ShopXO 模式；分开部署时必须显式设置。旧通道凭据保留，以便继续验签和核对历史订单。

## 部署与备份恢复

1. 使用独立 HTTPS 子域名，运行目录指向 `public/`。合并 `nginx-hardening.conf` 并执行实际 `nginx -t`，保留现有 TLS/ACME 配置；后台限制运维来源，支付通知保持可达。
2. 应用 `php-production.ini`，关闭调试和错误详情；后台 Cookie 设置 Secure、HttpOnly、SameSite=Lax。锁定安装入口，上传目录禁脚本执行；不跨官网域共享登录 Cookie。
3. 按锁安装依赖并 audit。新目录发布，保留已有数据库、上传、商户配置与 `config/mono_payment.php`，不能覆盖整站。
4. MySQL 用一致性逻辑备份，上传与私有配置单独保存。InnoDB 示例：`mysqldump --defaults-extra-file=/私有目录/backup.cnf --single-transaction --routines --events --triggers --no-tablespaces 数据库名`。凭据文件权限 600，输出到站点外并另存可信位置；不复制运行中的 MySQL 数据目录冒充备份。
5. 恢复到隔离的新数据库，核对订单、支付、售后、退款与配置，并补核备份后支付宝交易。代码回滚不回滚收款后的数据，不能用旧库覆盖运行库来回滚程序。

```bash
npm test
npm run build
npm audit --audit-level=moderate
npm run check:php
# SHOPXO_SOURCE 指定已准备并安装依赖的输出，PHP_BINARY 可指定 PHP：
npm run test:shopxo
# SHOPXO_TEST_CONFIG 为隔离 MySQL 的私有 JSON（hostname/hostport/username/password）：
node --test scripts/shopxo-db.test.mjs
```

检查包含源码摘要、PHP 语法、依赖安装版本、支付边界及随机 `mono_test_*` 库上的并发回归。已增加 Windows/Linux 网站 CI 和 PHP 8.3/MySQL 回归。真实账号 HTTP、商户沙箱/正式交易、手机支付、外部插件、域名/TLS、计划任务及远端恢复仍需对应部署环境验收；本地测试不会创建真实交易。
