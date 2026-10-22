// Parse structure first, then retain the exact top-level value bytes for RSA verification.
export function signedResponsePart(text, name) {
  const envelope = JSON.parse(text);
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) throw new Error("支付宝响应格式无效。");
  let index = 0;
  const whitespace = () => { while (/\s/.test(text[index] || "!") && index < text.length) index++; };
  const stringEnd = start => {
    for (let i = start + 1; i < text.length; i++) {
      if (text[i] === "\\") i++;
      else if (text[i] === '"') return i + 1;
    }
    throw new Error("支付宝响应不完整。");
  };
  const valueEnd = start => {
    if (text[start] === '"') return stringEnd(start);
    if (text[start] === "{" || text[start] === "[") {
      let depth = 0;
      for (let i = start; i < text.length; i++) {
        if (text[i] === '"') i = stringEnd(i) - 1;
        else if (text[i] === "{" || text[i] === "[") depth++;
        else if ((text[i] === "}" || text[i] === "]") && --depth === 0) return i + 1;
      }
      throw new Error("支付宝响应不完整。");
    }
    let end = start;
    while (end < text.length && !/[\s,}]/.test(text[end])) end++;
    return end;
  };
  whitespace(); index++;
  const names = new Set();
  let raw;
  for (;;) {
    whitespace();
    if (text[index] === "}") break;
    const end = stringEnd(index), key = JSON.parse(text.slice(index, end));
    if (names.has(key)) throw new Error("支付宝响应含重复字段。");
    names.add(key);
    index = end; whitespace(); index++; whitespace();
    const start = index;
    index = valueEnd(start);
    if (key === name) raw = text.slice(start, index);
    whitespace();
    if (text[index] === "}") break;
    index++;
  }
  if (!raw || raw[0] !== "{") throw new Error("支付宝响应缺少有效业务结果。");
  if (names.has("error_response") && names.has("alipay_trade_query_response")) throw new Error("支付宝响应包含冲突的业务结果。");
  return raw;
}

export async function boundedResponseText(response, limit = 256000) {
  const declared = response.headers.get("content-length");
  if (declared && /^\d+$/.test(declared) && Number(declared) > limit) {
    await response.body?.cancel();
    throw new Error("支付宝响应过大。");
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return Buffer.concat(chunks, size).toString("utf8");
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new Error("支付宝响应过大。"); }
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
}
