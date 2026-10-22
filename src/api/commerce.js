import { readCommerceJson, validateCommerceResponse } from "./commerce-response.js";

export async function commerceRequest(path, { method = "GET", body, signal, idempotencyKey, timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const cancel = () => controller.abort(signal.reason);
  if (signal?.aborted) cancel();
  else signal?.addEventListener("abort", cancel, { once: true });
  const timeout = setTimeout(() => controller.abort(new DOMException("订单请求超时", "TimeoutError")), timeoutMs);
  try {
    const response = await fetch(`${import.meta.env?.BASE_URL || "/"}api/commerce${path}`, {
      method, credentials: "same-origin", signal: controller.signal,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const type = response.headers.get("content-type")?.includes("application/json");
    let data;
    try { data = type ? await readCommerceJson(response) : null; }
    catch (failure) { if (controller.signal.aborted) throw failure; }
    if (!response.ok || !data || typeof data !== "object" || Array.isArray(data)) {
      const error = new Error(typeof data?.error === "string" ? data.error : "订单服务暂时不可用，请稍后重试或联系工作室。");
      error.fields = data?.fields;
      error.status = response.status;
      throw error;
    }
    return validateCommerceResponse(path, method, data);
  } catch (error) {
    if (!signal?.aborted && controller.signal.reason?.name === "TimeoutError") {
      const failure = new Error("订单服务响应超时，请重试查询。如已付款，请先确认订单结果，避免重复付款。");
      failure.code = "TIMEOUT";
      throw failure;
    }
    if (!controller.signal.aborted && error instanceof TypeError && !error.status) {
      const failure = new Error("网络连接中断，请检查网络后重试查询；如已提交订单或付款，请先查看订单结果。");
      failure.code = "NETWORK";
      throw failure;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
  }
}
export function submitAlipayCheckout(checkout) {
  const allowed = ["https://openapi.alipay.com/gateway.do", "https://openapi-sandbox.dl.alipaydev.com/gateway.do"];
  if (!allowed.includes(checkout?.action) || !checkout.fields || typeof checkout.fields.sign !== "string") throw new Error("支付宝收银台参数无效，请联系工作室。");
  // 用原生表单提交已签名参数，不在页面插入支付接口返回的 HTML。
  const form = document.createElement("form");
  form.method = "POST";
  form.action = checkout.action;
  form.acceptCharset = "UTF-8";
  form.hidden = true;
  for (const [name, value] of Object.entries(checkout.fields)) {
    const input = document.createElement("input");
    input.type = "hidden"; input.name = name; input.value = String(value);
    form.append(input);
  }
  document.body.append(form);
  try { HTMLFormElement.prototype.submit.call(form); } finally { form.remove(); }
}
