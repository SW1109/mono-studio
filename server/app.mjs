import { createServer } from "node:http";
import { createHash, randomBytes } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { isIP } from "node:net";
import { createOrderAdmin } from "./order-admin.mjs";
import { serviceOffers, validatePurchase } from "../shared/commerce.js";
import { OrderStore, CommerceError, hashOwner, publicOrder } from "./order-store.mjs";
import { AlipayProvider } from "./payments/alipay.mjs";

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > 16384) { request.resume(); throw new CommerceError("提交内容过大。", 413); }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}
function uniqueForm(body) {
  const fields = {};
  for (const [key, value] of new URLSearchParams(body)) {
    if (Object.hasOwn(fields, key)) throw new CommerceError("重复的通知字段。");
    Object.defineProperty(fields, key, { value, enumerable: true });
  }
  return fields;
}
const orderIdPattern = /^GN[A-Z0-9]{20,45}$/;
const contentTypes = { ".mp4": "video/mp4", ".xml": "application/xml;charset=utf-8", ".txt": "text/plain;charset=utf-8", ".wasm": "application/wasm", ".html": "text/html;charset=utf-8", ".js": "text/javascript;charset=utf-8", ".css": "text/css;charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".ico": "image/x-icon" };

export function createCommerceServer(config, { store = new OrderStore(config.database), provider = config.enabled || config.providerReady ? new AlipayProvider(config) : null, dist = resolve("dist") } = {}) {
  const rates = new Map();
  const refreshes = new Map();
  const lastRefresh = new Map();
  const apiPrefix = `${config.base}api/commerce`;
  const admin = createOrderAdmin(store, config.adminToken);
  const send = (response, status, payload, text = false) => {
    response.writeHead(status, { "Content-Type": text ? "text/plain;charset=utf-8" : "application/json;charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" });
    response.end(text ? payload : JSON.stringify(payload));
  };
  function owner(request, response, create = false) {
    const token = /(?:^|;\s*)gn_commerce=([a-f0-9]{64})(?:;|$)/.exec(request.headers.cookie || "")?.[1];
    if (token) return hashOwner(token);
    if (!create) throw new CommerceError("请使用下单时的浏览器查询订单。", 401);
    const fresh = randomBytes(32).toString("hex");
    response.setHeader("Set-Cookie", `gn_commerce=${fresh}; HttpOnly; SameSite=Lax; Path=${config.base}; Max-Age=2592000${config.secureCookie ? "; Secure" : ""}`);
    return hashOwner(fresh);
  }
  function rateLimit(request) {
    const now = Date.now();
    const peer = request.socket.remoteAddress;
    const realIp = request.headers["x-real-ip"];
    // 只信任回环代理覆盖后的单一 IP；公网直连不能借伪造头绕过限流。
    const address = config.trustProxy && ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(peer) && typeof realIp === "string" && isIP(realIp) ? realIp : peer;
    if (rates.size >= 5000) for (const [key, value] of rates) if (value.until <= now) rates.delete(key);
    if (rates.size >= 5000 && !rates.has(address)) throw new CommerceError("请求较多，请稍后重试。", 429);
    let rate = rates.get(address);
    if (!rate || rate.until <= now) { rate = { count: 0, until: now + 60000 }; rates.set(address, rate); }
    if (++rate.count > 120) throw new CommerceError("请求过于频繁，请稍后重试。", 429);
  }
  async function jsonInput(request) {
    if (!config.allowedOrigins.has(request.headers.origin)) throw new CommerceError("请求来源无效，请从本站发起操作。", 403);
    if (!/^application\/json(?:;|$)/i.test(request.headers["content-type"] || "")) throw new CommerceError("请求格式应为 JSON。", 415);
    try {
      const input = JSON.parse(await readBody(request));
      if (!input || typeof input !== "object" || Array.isArray(input)) throw new CommerceError("请求应为 JSON 对象。");
      return input;
    }
    catch (error) { if (error instanceof CommerceError) throw error; throw new CommerceError("请求 JSON 无效。"); }
  }
  function requirePayments() { if (!config.enabled || !provider) throw new CommerceError("在线收款尚未开放，请先联系工作室确认服务。", 503); }
  async function refresh(order) {
    if (!provider || order.status === "PAID" || order.status === "CLOSED") return order;
    if (refreshes.has(order.id)) return refreshes.get(order.id);
    if (Date.now() - (lastRefresh.get(order.id) || 0) < 5000) return store.get(order.id);
    const task = (async () => {
      const result = await provider.query(order);
      if (!result) return store.get(order.id);
      return store.applyPayment(provider.toPaymentEvent(result, { source: "query", expectedOrderId: order.id }), { source: "query", eventId: `query:${order.id}:${result.trade_no}:${result.trade_status}` });
    })();
    refreshes.set(order.id, task);
    lastRefresh.set(order.id, Date.now());
    if (lastRefresh.size > 5000) for (const [key, time] of lastRefresh) if (Date.now() - time > 60000) lastRefresh.delete(key);
    try { return await task; } finally { refreshes.delete(order.id); }
  }
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");
      if (url.pathname === `${apiPrefix}/health` && request.method === "GET") {
        try { store.ping(); return send(response, 200, { status: "ok" }); }
        catch { return send(response, 503, { status: "unavailable" }); }
      }
      if (url.pathname === `${apiPrefix}/alipay/notify` && request.method === "POST") {
        // 不依赖浏览器回跳判断付款。只有验签、商户和金额均匹配的通知才能改变订单。
        try {
          if (!provider) throw new CommerceError("支付通道尚未配置。", 503);
          if (!/^application\/x-www-form-urlencoded(?:;|$)/i.test(request.headers["content-type"] || "")) throw new CommerceError("通知格式无效。");
          const fields = uniqueForm(await readBody(request));
          if (!provider.verifyNotification(fields)) throw new CommerceError("通知验签失败。");
          const eventId = `notify:${createHash("sha256").update(fields.sign).digest("hex")}`;
          store.applyPayment(provider.toPaymentEvent(fields, { source: "notify" }), { source: "notify", eventId });
          return send(response, 200, "success", true);
        } catch { return send(response, 200, "failure", true); }
      }
      if (url.pathname === `${apiPrefix}/alipay/return` && request.method === "GET") {
        const id = url.searchParams.get("order_id") || url.searchParams.get("out_trade_no") || "";
        const location = `${config.base}orders/${orderIdPattern.test(id) ? `?order=${encodeURIComponent(id)}` : ""}`;
        response.writeHead(303, { Location: location, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
        return response.end();
      }
      if (url.pathname.startsWith(`${apiPrefix}/`)) {
        rateLimit(request);
        if (url.pathname.startsWith(`${apiPrefix}/admin/`)) {
          return send(response, 200, admin(request, url, `${apiPrefix}/admin`));
        }
        if (url.pathname === `${apiPrefix}/catalog` && request.method === "GET") {
          return send(response, 200, { offers: serviceOffers, paymentsEnabled: config.enabled, environment: config.enabled ? config.environment : null, merchantName: config.merchantName, channels: config.enabled ? ["alipay"] : [] });
        }
        if (url.pathname === `${apiPrefix}/orders` && request.method === "GET") {
          try { return send(response, 200, { orders: store.list(owner(request, response)).map(publicOrder) }); }
          catch (error) { if (error.status === 401) return send(response, 200, { orders: [] }); throw error; }
        }
        if (url.pathname === `${apiPrefix}/orders` && request.method === "POST") {
          const body = await jsonInput(request);
          requirePayments();
          const { data, errors } = validatePurchase(body);
          if (Object.keys(errors).length) throw new CommerceError("请检查订单信息。", 422, errors);
          const key = request.headers["idempotency-key"];
          if (typeof key !== "string" || !/^[a-zA-Z0-9_-]{16,80}$/.test(key)) throw new CommerceError("订单请求标识无效。");
          const order = store.create(data, owner(request, response, true), key, provider.id);
          return send(response, 201, { order: publicOrder(order) });
        }
        const match = new RegExp(`^${apiPrefix}/orders/(GN[A-Z0-9]{20,45})(?:/(payment|refresh))?$`).exec(url.pathname);
        if (match) {
          if (!match[2] && request.method === "GET") return send(response, 200, { order: publicOrder(store.owned(match[1], owner(request, response))) });
          if (match[2] && request.method === "POST") {
            const body = await jsonInput(request);
            let order = store.owned(match[1], owner(request, response));
            if (match[2] === "refresh") {
              try { order = await refresh(order); }
              catch { throw new CommerceError("暂时无法向支付宝确认付款，请稍后重试；不要重复付款。", 502); }
              return send(response, 200, { order: publicOrder(order) });
            }
            requirePayments();
            if (body.provider !== "alipay") throw new CommerceError("当前只支持支付宝支付。");
            if (order.status !== "PENDING" || order.expires_at <= Date.now()) throw new CommerceError("订单已付款、关闭或超时，不能继续付款。", 409);
            return send(response, 200, { checkout: provider.createCheckout(order) });
          }
        }
        throw new CommerceError("接口不存在。", 404);
      }
      if (!["GET", "HEAD"].includes(request.method) || !url.pathname.startsWith(config.base)) throw new CommerceError("页面不存在。", 404);
      const relative = decodeURIComponent(url.pathname.slice(config.base.length));
      const filename = resolve(dist, relative.endsWith("/") || !extname(relative) ? `${relative.replace(/\/$/, "")}/index.html`.replace(/^\//, "") : relative);
      if (!filename.startsWith(`${dist}${sep}`)) throw new CommerceError("页面不存在。", 404);
      let data, status = 200, actual = filename;
      try { if (!(await stat(filename)).isFile()) throw new Error(); data = await readFile(filename); }
      catch { status = 404; actual = resolve(dist, "404/index.html"); try { data = await readFile(actual); } catch { return send(response, 404, "请先运行 npm run build 生成官网。", true); } }
      const headers = { "Content-Type": contentTypes[extname(actual)] || "application/octet-stream", "Content-Length": data.length, "Cache-Control": status === 200 && relative.startsWith("assets/") ? "public,max-age=31536000,immutable" : "no-cache", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin" };
      if (status === 200 && extname(actual) === ".mp4") {
        // 视频拖动与部分移动浏览器依赖字节范围请求；仅处理单段媒体请求。
        headers["Accept-Ranges"] = "bytes";
        if (request.method === "GET" && request.headers.range?.startsWith("bytes=")) {
          const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
          const size = data.length;
          let start = 0, end = size - 1;
          if (!range || (!range[1] && !range[2])) start = NaN;
          else if (!range[1]) {
            const suffix = Number(range[2]);
            start = Number.isSafeInteger(suffix) && suffix > 0 ? Math.max(0, size - suffix) : NaN;
          } else {
            start = Number(range[1]);
            if (range[2]) {
              const requestedEnd = Number(range[2]);
              end = Number.isSafeInteger(requestedEnd) ? Math.min(requestedEnd, size - 1) : NaN;
            }
          }
          if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) {
            response.writeHead(416, { ...headers, "Content-Range": `bytes */${size}`, "Content-Length": 0 });
            return response.end();
          }
          data = data.subarray(start, end + 1);
          status = 206;
          headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
          headers["Content-Length"] = data.length;
        }
      }
      response.writeHead(status, headers);
      response.end(request.method === "HEAD" ? undefined : data);
    } catch (error) {
      if (response.headersSent) return response.end();
      if (!(error instanceof CommerceError)) console.error("[commerce]", error.name, "请求处理失败（未记录订单联系信息与密钥）。");
      send(response, error instanceof CommerceError ? error.status : 500, { error: error instanceof CommerceError ? error.message : "服务暂时不可用，请稍后重试。", ...(error.fields ? { fields: error.fields } : {}) });
    }
  });
  server.requestTimeout = 20000;
  server.headersTimeout = 15000;
  server.on("close", () => store.close());
  return server;
}
