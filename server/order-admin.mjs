import { timingSafeEqual } from "node:crypto";
import { paymentStatuses } from "../shared/commerce.js";
import { CommerceError, publicOrder } from "./order-store.mjs";

const orderIdPattern = /^GN[A-Z0-9]{20,45}$/;
// 沿用履约 CLI 每次最多 100 条的边界，避免一次返回整库的客户资料。
export const adminQueryRules = Object.freeze({ defaultPageSize: 20, maxPageSize: 100 });

export function parseOrderQuery(searchParams) {
  const allowed = ["status", "orderId", "page", "pageSize"], errors = Object.create(null);
  for (const key of searchParams.keys()) {
    if (!allowed.includes(key) || searchParams.getAll(key).length !== 1) errors[key] = "查询参数未知或重复。";
  }
  const status = searchParams.get("status"), orderId = searchParams.get("orderId");
  if (status !== null && !Object.hasOwn(paymentStatuses, status)) errors.status = "订单状态必须为 PENDING、PAID 或 CLOSED。";
  if (orderId !== null && !orderIdPattern.test(orderId)) errors.orderId = "请输入有效的订单编号。";
  const number = (key, fallback) => {
    const raw = searchParams.get(key);
    if (raw === null) return fallback;
    const value = Number(raw);
    if (!/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(value)) errors[key] = "请输入正整数。";
    return value;
  };
  const page = number("page", 1), pageSize = number("pageSize", adminQueryRules.defaultPageSize);
  if (pageSize > adminQueryRules.maxPageSize) errors.pageSize = `每页最多 ${adminQueryRules.maxPageSize} 条。`;
  if (!Number.isSafeInteger((page - 1) * pageSize)) errors.page = "页码超出允许范围。";
  if (Object.keys(errors).length) throw new CommerceError("请检查订单查询条件。", 422, errors);
  return { status, orderId, page, pageSize };
}

export function createOrderAdmin(store, token) {
  const expected = /^[a-f0-9]{64}$/.test(token || "") ? Buffer.from(token, "hex") : null;
  return (request, url, prefix) => {
    if (!expected) throw new CommerceError("接口不存在。", 404);
    // 管理令牌只经 Authorization 头传入，不接受 URL、Cookie 或客户订单凭证。
    const provided = /^Bearer ([a-f0-9]{64})$/.exec(request.headers.authorization || "")?.[1];
    if (!provided || !timingSafeEqual(expected, Buffer.from(provided, "hex"))) throw new CommerceError("管理身份验证失败。", 401);
    if (request.method !== "GET") throw new CommerceError("订单管理仅支持只读查询。", 405);
    if (url.pathname === `${prefix}/orders`) {
      const result = store.queryForAdmin(parseOrderQuery(url.searchParams));
      return { ...result, orders: result.orders.map(publicOrder) };
    }
    const id = url.pathname.slice(`${prefix}/orders/`.length);
    if (url.pathname.startsWith(`${prefix}/orders/`) && orderIdPattern.test(id)) {
      const order = store.get(id);
      if (!order) throw new CommerceError("订单不存在。", 404);
      return { order: { ...publicOrder(order), tradeNo: order.trade_no }, paymentEvents: store.paymentHistory(id) };
    }
    throw new CommerceError("接口不存在。", 404);
  };
}
