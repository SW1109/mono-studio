import { readFileSync } from "node:fs";
import { createPrivateKey, createPublicKey } from "node:crypto";
import { resolve } from "node:path";

export function paymentConfig(env = process.env) {
  const enabled = env.PAYMENTS_ENABLED === "true";
  const adminToken = env.PAYMENT_ADMIN_TOKEN || "";
  if (adminToken && !/^[a-f0-9]{64}$/.test(adminToken)) throw new Error("PAYMENT_ADMIN_TOKEN 必须为 32 字节随机值的小写十六进制字符串；不可使用支付私钥。");
  const environment = env.ALIPAY_ENV || "sandbox";
  if (!["sandbox", "production"].includes(environment)) throw new Error("ALIPAY_ENV 只能为 sandbox 或 production。");
  const origin = env.PAYMENT_PUBLIC_ORIGIN || "http://127.0.0.1:4176";
  const parsed = new URL(origin);
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.origin !== origin || parsed.username || parsed.password) throw new Error("PAYMENT_PUBLIC_ORIGIN 必须是仅含协议和域名的站点地址。");
  const base = env.PAYMENT_BASE_PATH || "/";
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) throw new Error("PAYMENT_BASE_PATH 必须与 VITE_BASE_PATH 一致，如 / 或 /studio/。");
  const port = Number(env.PAYMENT_PORT || 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PAYMENT_PORT 无效。");
  const config = {
    enabled, environment, origin, base, port, host: env.PAYMENT_HOST || "127.0.0.1",
    adminToken, trustProxy: env.PAYMENT_TRUST_PROXY === "true",
    merchantName: (env.PAYMENT_MERCHANT_NAME || "").trim(),
    database: resolve(env.PAYMENT_DATABASE_PATH || "data/commerce.sqlite"),
    appId: env.ALIPAY_APP_ID || "", sellerId: env.ALIPAY_SELLER_ID || "",
    gateway: environment === "production" ? "https://openapi.alipay.com/gateway.do" : "https://openapi-sandbox.dl.alipaydev.com/gateway.do",
    allowedOrigins: new Set([origin]), secureCookie: parsed.protocol === "https:",
  };
  // 沙箱联调可以显式允许本地 Vite；正式收款不开放跨站写入来源。
  if (environment === "sandbox" && env.PAYMENT_DEV_ORIGIN) config.allowedOrigins.add(new URL(env.PAYMENT_DEV_ORIGIN).origin);
  const hasCredentials = config.appId && config.sellerId && env.ALIPAY_PRIVATE_KEY_PATH && env.ALIPAY_PUBLIC_KEY_PATH;
  // 暂停新收款时，已配置的通道仍须核实旧订单；不能因关店丢失付款通知。
  if (!enabled && !hasCredentials) return config;
  if (enabled && (env.PAYMENT_CATALOG_CONFIRMED !== "true" || !config.merchantName)) throw new Error("启用收款前必须确认服务、价格与条款，并填写真实经营主体名称。");
  if (!/^\d{16}$/.test(config.appId) || !/^2088\d{12}$/.test(config.sellerId)) throw new Error("请填写有效的 ALIPAY_APP_ID 与收款方 ALIPAY_SELLER_ID。");
  if (environment === "production" && (parsed.protocol !== "https:" || /^(localhost|127\.|\[::1\])/.test(parsed.hostname))) throw new Error("正式支付必须配置公网 HTTPS 域名。");
  if (!env.ALIPAY_PRIVATE_KEY_PATH || !env.ALIPAY_PUBLIC_KEY_PATH) throw new Error("请通过服务端 PEM 文件配置应用私钥和支付宝公钥；不要使用 VITE_* 变量存放密钥。");
  config.privateKey = createPrivateKey(readFileSync(resolve(env.ALIPAY_PRIVATE_KEY_PATH)));
  config.publicKey = createPublicKey(readFileSync(resolve(env.ALIPAY_PUBLIC_KEY_PATH)));
  for (const key of [config.privateKey, config.publicKey]) {
    if (key.asymmetricKeyType !== "rsa" || key.asymmetricKeyDetails.modulusLength < 2048) throw new Error("RSA2 模式需要至少 2048 位的 RSA 密钥。");
  }
  config.providerReady = true;
  return config;
}
