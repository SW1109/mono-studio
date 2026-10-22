const record = value => value !== null && typeof value === "object" && !Array.isArray(value);
const amount = value => Number.isSafeInteger(value) && value > 0;
const order = value => record(value) && /^GN[A-Z0-9]{20,45}$/.test(value.id)
  && ["PENDING", "PAID", "CLOSED"].includes(value.status) && amount(value.amountCents)
  && ["serviceId", "serviceName", "contactName", "email", "requirements"].every(key => typeof value[key] === "string")
  && Number.isSafeInteger(value.createdAt) && Number.isSafeInteger(value.expiresAt)
  && typeof value.expired === "boolean" && record(value.serviceSnapshot);
const offer = value => record(value) && typeof value.id === "string" && amount(value.priceCents)
  && ["name", "summary", "scope", "delivery", "preparation", "exclusions"].every(key => typeof value[key] === "string")
  && Array.isArray(value.deliverables) && value.deliverables.every(item => typeof item === "string");

export function validateCommerceResponse(path, method, data) {
  let valid = record(data);
  if (path === "/catalog") valid = valid && Array.isArray(data.offers) && data.offers.every(offer)
    && new Set(data.offers.map(item => item.id)).size === data.offers.length
    && typeof data.paymentsEnabled === "boolean" && typeof data.merchantName === "string"
    && [null, "sandbox", "production"].includes(data.environment);
  else if (path === "/orders" && method === "GET") valid = valid && Array.isArray(data.orders) && data.orders.every(order);
  else if (path === "/orders" || /^\/orders\/[^/]+(?:\/refresh)?$/.test(path)) {
    valid = valid && order(data.order);
    if (valid && path !== "/orders") valid = data.order.id === decodeURIComponent(path.split("/")[2]);
  } else if (/\/payment$/.test(path)) valid = valid && record(data.checkout) && record(data.checkout.fields) && typeof data.checkout.action === "string";
  if (!valid) throw new Error("订单服务返回的数据不完整，请重新查询或联系工作室；如已付款，请勿重复支付。");
  return data;
}

export async function readCommerceJson(response) {
  const limit = 256000;
  if (Number(response.headers.get("content-length")) > limit) {
    await response.body?.cancel();
    throw new Error("订单服务响应异常，请稍后重试。");
  }
  if (!response.body) return null;
  const reader = response.body.getReader(), chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new Error("订单服务响应异常，请稍后重试。"); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder().decode(bytes));
  } finally { reader.releaseLock(); }
}
