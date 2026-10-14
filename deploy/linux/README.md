# 现有 Node 订单 API：单实例 Linux 部署准备

这是原 Node 订单链路的部署方案。若选择 `deploy/shopxo/README.md` 的独立订单中心，官网只需部署静态 `dist/`，不要再开放 Node 新交易来复制 ShopXO 订单。

## 发布前

- 先确认服务器和域名、现有宝塔站点与数据并备份。此目录仅提供配置模板，没有执行远端命令。
- 要求 Linux/systemd，Node >=22.13；使用符合该要求且仍受支持的 Node 版本，核对 `command -v node`，再修改两个 service 文件的 `ExecStart`。宝塔 Node 管理器的路径不一定是 `/usr/bin/node`。
- 运行 `npm run release:package` 在本机生成发布包。包中 Node 后端仅使用内置模块，无需在服务器安装前端编译依赖；不包含密钥、私密配置、SQLite 数据或 node_modules。
- 后端只能绑定回环 `127.0.0.1:8787`。公网只开放既有 HTTPS 网站；SSH 仅允许运维来源。不要向公网开放 8787 或数据库端口。

## 路径与权限

| 用途 | 固定位置 |
|---|---|
| 发布版本 | `/opt/mono-studio/releases/<release-id>` |
| 当前程序链接 | `/opt/mono-studio/current` |
| 环境配置 | `/etc/mono-studio/payment.env` |
| 支付密钥 | `/etc/mono-studio/secrets/` |
| 持久订单库 | `/var/lib/mono-studio/commerce.sqlite` |
| 一致性备份 | `/var/backups/mono-studio/` |

以独立非登录用户 `mono-studio` 运行。程序归 root 所有、服务用户只读；数据和备份目录归服务用户所有、权限 700。环境文件和密钥权限 640，root 所有、组为服务用户；不能放进 Nginx 静态目录。先确认这些路径/用户没有其他业务用途，再创建。不要对现有目录无差别递归改权限。

复制 `payment.env.example` 到服务端固定配置位置，填写实际 HTTPS 域名及真实 base。用 `openssl rand -hex 32` 生成管理令牌；若留空，经营者 HTTP 查询接口关闭。无支付凭据时仍可运行查单/健康检查，但不允许新收费下单。不能用测试订单冒充经营记录。

## 首次启动与代理

1. 将发布包上传到已确认服务器并核对本地/远端 SHA-256；在新 releases 目录解压。不要直接覆盖 current，或把包解压到订单数据目录。
2. 填好配置、确认程序路径和文件权限后，建立 current 链接；安装三个 service/timer 模板到 `/etc/systemd/system/`。
3. 执行 `systemctl daemon-reload`、`systemctl enable --now mono-studio`，查看 `systemctl status mono-studio` 与服务日志。收款默认关闭。
4. 本机请求 `http://127.0.0.1:8787/api/commerce/health` 应返回 HTTP 200 和 `{"status":"ok"}`；健康检查会实际访问订单表，不返回客户资料或凭据。
5. 将 `nginx-api.conf` 的 location 合并进已有宝塔 HTTPS 站点；不要替换整个配置。执行该站点实际 Nginx 的 `nginx -t`，通过后 reload，并检查公网 health/catalog。子目录部署必须同步模板路径及前端 base。
6. 执行 `systemctl start mono-studio-backup`，验证备份与恢复，再 `systemctl enable --now mono-studio-backup.timer`。备份采用 `VACUUM INTO` 生成包含 WAL 已提交数据的一致快照，权限 600，并验证完整性；默认不自动删除旧备份，需另设容量、保留和异地策略。

## 经营者只读订单查询

默认 Nginx 返回 404，不在公网暴露管理接口。通过 `ssh -L 8788:127.0.0.1:8787 用户@实际服务器` 建立隧道后，访问本地 8788，携带 `Authorization: Bearer <管理令牌>`：

- `GET /api/commerce/admin/orders?page=1&pageSize=20&status=PAID`
- `GET /api/commerce/admin/orders?orderId=<实际订单号>`
- `GET /api/commerce/admin/orders/<实际订单号>`：包括支付宝交易号与核验事件。

令牌不能放 URL、浏览器本地存储或官网 JS；仅在可信运维客户端使用。支持 PENDING/PAID/CLOSED、精确订单号、分页（每页最多 100）。返回购买时的服务快照与联系信息，不暴露 owner hash/幂等凭证；不允许编辑金额、直接标记付款或退款。

客户原有 `/orders/` 的权限隔离保持不变；它依赖原下单浏览器，跨设备账户查询请选择 ShopXO 方案。两者不能混为一谈。

## 升级、备份恢复与回滚

- 发布到新目录，保留旧版本；先备份数据库/记录旧 current，再原子切换 current 并 restart。健康或网站验收失败时回指旧程序并 restart；不要为回滚程序覆盖支付发生后的数据库。
- 数据库恢复属于单独的事故操作：关闭新收款并停止服务，保留故障时的完整数据库/WAL，验证备份后恢复到新数据路径，核对丢失区间的支付宝账单和交易后再启用。不能仅删除 WAL，也不能把旧备份覆盖仍运行的库。
- SQLite 当前只支持单实例单本地持久盘，不做多副本负载均衡。多实例或规模增长时应设计共享数据库迁移。
- 实际服务器、宝塔配置合并、TLS、支付通知和真实交易均尚未执行验收。
