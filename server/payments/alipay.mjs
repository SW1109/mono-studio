import { sign, verify } from "node:crypto";
import { centsToAmount, amountToCents } from "../../shared/commerce.js";

export function signatureText(fields, notification = false) {
  return Object.keys(fields).filter(key => key !== "sign" && (!notification || key !== "sign_type") && fields[key] !== "" && fields[key] !== undefined && fields[key] !== null)
    .sort().map(key => `${key}=${fields[key]}`).join("&");
}
export function signRequest(fields, privateKey) {
  return sign("RSA-SHA256", Buffer.from(signatureText(fields), "utf8"), privateKey).toString("base64");
}
export function verifyNotification(fields, publicKey) {
  if (fields.sign_type !== "RSA2" || typeof fields.sign !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(fields.sign) || fields.sign.length > 1024) return false;
  try { return verify("RSA-SHA256", Buffer.from(signatureText(fields, true), "utf8"), publicKey, Buffer.from(fields.sign, "base64")); }
  catch { return false; }
}
function timestamp(date = new Date()) {
  return new Date(date.getTime() + 8 * 3600000).toISOString().slice(0, 19).replace("T", " ");
}

// 查询响应签的是原始 JSON 片段，不可 parse 后重新 stringify；空格、转义会影响验签。
export function extractResponse(text, name) {
  const match = new RegExp(`"${name}"\\s*:\\s*`).exec(text);
  if (!match || text[match.index + match[0].length] !== "{") throw new Error("支付宝响应格式无效。");
  const start = match.index + match[0].length;
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') quoted = false;
    } else if (ch === '"') quoted = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  throw new Error("支付宝响应不完整。");
}
export class AlipayProvider {
  constructor(config, request = fetch) { this.config = config; this.request = request; this.id = "alipay"; }
  parameters(method, business, extra = {}) {
    const fields = { app_id: this.config.appId, method, format: "JSON", charset: "utf-8", sign_type: "RSA2", timestamp: timestamp(), version: "1.0", biz_content: JSON.stringify(business), ...extra };
    return { ...fields, sign: signRequest(fields, this.config.privateKey) };
  }
  createCheckout(order) {
    const remainingMinutes = Math.ceil((order.expires_at - Date.now()) / 60000);
    if (remainingMinutes < 1) throw new Error("订单已超时，请重新下单。");
    return {
      action: this.config.gateway,
      fields: this.parameters("alipay.trade.page.pay", {
        out_trade_no: order.id, total_amount: centsToAmount(order.amount_cents), subject: `光年数智 · ${order.service_name}`,
        product_code: "FAST_INSTANT_TRADE_PAY", timeout_express: `${remainingMinutes}m`, goods_type: "0",
      }, {
        notify_url: `${this.config.origin}${this.config.base}api/commerce/alipay/notify`,
        return_url: `${this.config.origin}${this.config.base}api/commerce/alipay/return?order_id=${order.id}`,
      }),
    };
  }
  verifyNotification(fields) { return verifyNotification(fields, this.config.publicKey); }
  toPaymentEvent(fields, { source, expectedOrderId } = {}) {
    if (fields.app_id && fields.app_id !== this.config.appId) throw new Error("支付应用不匹配。");
    if (fields.seller_id && fields.seller_id !== this.config.sellerId) throw new Error("收款方不匹配。");
    if (source === "notify" && (!fields.app_id || !fields.seller_id)) throw new Error("支付通知缺少商户信息。");
    if (expectedOrderId && fields.out_trade_no !== expectedOrderId) throw new Error("查询响应与请求订单不匹配。");
    const statuses = { TRADE_SUCCESS: "PAID", TRADE_FINISHED: "PAID", TRADE_CLOSED: "CLOSED", WAIT_BUYER_PAY: "PENDING" };
    if (!Object.hasOwn(statuses, fields.trade_status)) throw new Error("交易状态无效。");
    return { orderId: fields.out_trade_no, provider: this.id, amountCents: amountToCents(fields.total_amount), tradeNo: fields.trade_no, status: statuses[fields.trade_status] };
  }
  async query(order) {
    const response = await this.request(this.config.gateway, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: new URLSearchParams(this.parameters("alipay.trade.query", { out_trade_no: order.id })), signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error("支付宝查询暂时不可用，请稍后重试。");
    const text = await response.text();
    if (text.length > 256000) throw new Error("支付宝响应过大。");
    const envelope = JSON.parse(text);
    const responseName = envelope.alipay_trade_query_response ? "alipay_trade_query_response" : "error_response";
    const raw = extractResponse(text, responseName);
    if (!envelope.sign || !verify("RSA-SHA256", Buffer.from(raw, "utf8"), this.config.publicKey, Buffer.from(envelope.sign, "base64"))) throw new Error("支付宝查询响应验签失败。");
    const result = JSON.parse(raw);
    if (result.code === "40004" && result.sub_code === "ACQ.TRADE_NOT_EXIST") return null;
    if (result.code !== "10000") throw new Error("支付宝未能确认交易，请稍后重试或联系工作室。");
    if (result.out_trade_no !== order.id) throw new Error("支付宝查询响应与请求订单不匹配。");
    return result;
  }
}
