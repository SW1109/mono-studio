export async function commerceRequest(path, { method = "GET", body, signal, idempotencyKey } = {}) {
  const response = await fetch(`${import.meta.env.BASE_URL}api/commerce${path}`, {
    method, credentials: "same-origin", signal,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
    const error = new Error(data.error || "订单服务暂时不可用，请稍后重试或联系工作室。");
    error.fields = data.fields;
    error.status = response.status;
    throw error;
  }
  return data;
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
