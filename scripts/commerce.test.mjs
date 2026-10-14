import assert from "node:assert/strict";
import { test } from "node:test";
import { generateKeyPairSync, sign, verify, randomUUID } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { serviceOffers, purchaseRules, validatePurchase, centsToAmount, amountToCents } from "../shared/commerce.js";
import { paymentConfig } from "../server/config.mjs";
import { AlipayProvider, signatureText, signRequest, verifyNotification, extractResponse } from "../server/payments/alipay.mjs";
import { OrderStore, hashOwner } from "../server/order-store.mjs";
import { createCommerceServer } from "../server/app.mjs";

// 测试只用即时生成的 RSA 密钥，不调用支付宝，不创建真实交易。
const merchant = generateKeyPairSync("rsa", { modulusLength: 2048 });
const platform = generateKeyPairSync("rsa", { modulusLength: 2048 });
const config = { ...paymentConfig({}), enabled: true, merchantName: "测试主体（非实际商户）", appId: "2026101000000000", sellerId: "2088000000000000", privateKey: merchant.privateKey, publicKey: platform.publicKey, database: ":memory:" };
const purchase = { serviceId: serviceOffers[0].id, expectedAmountCents: serviceOffers[0].priceCents, contactName: "测试联系人", email: "buyer@example.com", requirements: "排查一个可以复现的页面错误。", acceptedTerms: true, termsVersion: purchaseRules.termsVersion };
function notification(order, extra = {}) {
  const fields = { app_id: config.appId, seller_id: config.sellerId, out_trade_no: order.id, total_amount: centsToAmount(order.amount_cents), trade_status: "TRADE_SUCCESS", trade_no: "202610100000001", sign_type: "RSA2", notify_id: randomUUID(), ...extra };
  return { ...fields, sign: sign("RSA-SHA256", Buffer.from(signatureText(fields, true)), platform.privateKey).toString("base64") };
}
function paymentEvent(fields) { return new AlipayProvider(config).toPaymentEvent(fields, { source: "notify" }); }
function makeOrder(store) { return store.create(validatePurchase(purchase).data, hashOwner("a".repeat(64)), randomUUID()); }

test("服务目录有具体范围、正整数分价格、交付与排除项", () => {
  assert.equal(serviceOffers.length, 3);
  assert.equal(new Set(serviceOffers.map(item => item.id)).size, 3);
  for (const item of serviceOffers) {
    assert.ok(Number.isSafeInteger(item.priceCents) && item.priceCents > 0);
    assert.ok(item.scope && item.delivery && item.preparation && item.exclusions && item.deliverables.length);
  }
});
test("金额按整数分转换，拒绝负数、超精度与非金额内容", () => {
  assert.equal(centsToAmount(29900), "299.00"); assert.equal(centsToAmount(1), "0.01");
  assert.equal(amountToCents("299"), 29900); assert.equal(amountToCents("299.0"), 29900); assert.equal(amountToCents("0.01"), 1);
  for (const value of ["-1", "1.001", "NaN", "1e3", 299]) assert.throws(() => amountToCents(value));
  assert.throws(() => centsToAmount(1.2));
});
test("表单必填、长度上限、邮箱、条款版本均在服务端验证", () => {
  assert.deepEqual(validatePurchase(purchase).errors, {});
  assert.ok(validatePurchase({ ...purchase, expectedAmountCents: 1 }).errors.serviceId);
  assert.equal(Object.keys(validatePurchase({}).errors).length, 5);
  assert.ok(validatePurchase({ ...purchase, contactName: "a".repeat(41), email: "bad", requirements: "a".repeat(1001), termsVersion: "old" }).errors.contactName);
  assert.ok(validatePurchase({ ...purchase, acceptedTerms: "true" }).errors.acceptedTerms);
  assert.deepEqual(validatePurchase({ ...purchase, contactName: "a".repeat(40), requirements: "a".repeat(1000) }).errors, {});
  assert.equal(validatePurchase({ ...purchase, amountCents: 1, status: "PAID", contactName: "  联系人  " }).data.contactName, "联系人");
});
test("配置默认关闭收款，正式环境拒绝不完整配置和本地域名", () => {
  assert.equal(paymentConfig({}).enabled, false);
  assert.throws(() => paymentConfig({ PAYMENT_BASE_PATH: "/bad" }));
  assert.throws(() => paymentConfig({ PAYMENTS_ENABLED: "true" }), /确认/);
  assert.throws(() => paymentConfig({ PAYMENTS_ENABLED: "true", PAYMENT_CATALOG_CONFIRMED: "true", PAYMENT_MERCHANT_NAME: "真实主体", ALIPAY_APP_ID: config.appId, ALIPAY_SELLER_ID: config.sellerId, ALIPAY_ENV: "production" }), /公网 HTTPS/);
});
test("正式配置可以加载 PEM 密钥，私钥不通过公共配置返回", async () => {
  const directory = await mkdtemp(join(tmpdir(), "mono-keys-"));
  try {
    const privatePath = join(directory, "private.pem"), publicPath = join(directory, "public.pem");
    await writeFile(privatePath, merchant.privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600 });
    await writeFile(publicPath, platform.publicKey.export({ type: "spki", format: "pem" }), { mode: 0o600 });
    const ready = paymentConfig({ PAYMENTS_ENABLED: "true", PAYMENT_CATALOG_CONFIRMED: "true", PAYMENT_MERCHANT_NAME: "经营者确认的主体", ALIPAY_ENV: "production", PAYMENT_PUBLIC_ORIGIN: "https://merchant.example.com", ALIPAY_APP_ID: config.appId, ALIPAY_SELLER_ID: config.sellerId, ALIPAY_PRIVATE_KEY_PATH: privatePath, ALIPAY_PUBLIC_KEY_PATH: publicPath });
    assert.equal(ready.enabled, true); assert.equal(ready.secureCookie, true); assert.equal(ready.privateKey.asymmetricKeyType, "rsa");
  } finally { await rm(directory, { recursive: true, force: true }); }
});
test("RSA2 请求签名包含 sign_type，通知验签排除 sign_type", () => {
  const fields = { z: "最后", a: "中文&=", sign_type: "RSA2", empty: "" };
  assert.equal(signatureText(fields), "a=中文&=&sign_type=RSA2&z=最后");
  const signature = signRequest(fields, merchant.privateKey);
  assert.ok(verify("RSA-SHA256", Buffer.from(signatureText(fields)), merchant.publicKey, Buffer.from(signature, "base64")));
  const store = new OrderStore(":memory:");
  try {
    const fields = notification(makeOrder(store));
    assert.ok(verifyNotification(fields, platform.publicKey));
    assert.ok(!verifyNotification({ ...fields, total_amount: "0.01" }, platform.publicKey));
    assert.ok(!verifyNotification({ ...fields, sign_type: "RSA" }, platform.publicKey));
  } finally { store.close(); }
});
test("支付收银台签名参数采用服务端金额、真实接口、回调地址与订单号", () => {
  const store = new OrderStore(":memory:");
  try {
    const order = makeOrder(store), checkout = new AlipayProvider(config).createCheckout(order);
    const business = JSON.parse(checkout.fields.biz_content);
    assert.equal(checkout.fields.method, "alipay.trade.page.pay"); assert.equal(business.product_code, "FAST_INSTANT_TRADE_PAY");
    assert.equal(business.total_amount, "299.00"); assert.equal(business.out_trade_no, order.id);
    assert.match(checkout.fields.notify_url, /api\/commerce\/alipay\/notify$/);
    assert.ok(verify("RSA-SHA256", Buffer.from(signatureText(checkout.fields)), merchant.publicKey, Buffer.from(checkout.fields.sign, "base64")));
    assert.throws(() => new AlipayProvider(config).createCheckout({ ...order, expires_at: Date.now() - 1 }));
  } finally { store.close(); }
});
test("查询响应提取保留空格、Unicode 与字符串中的大括号", () => {
  const raw = '{ "code": "10000", "msg": "中文 } \\\" {" }';
  const text = `{"alipay_trade_query_response":${raw},"sign":"x"}`;
  assert.equal(extractResponse(text, "alipay_trade_query_response"), raw);
  assert.throws(() => extractResponse('{"x":', "x"));
});
test("查询响应验签拒绝篡改，不从重复 JSON 键取未验签业务结果", async () => {
  const store = new OrderStore(":memory:");
  try {
    const order = makeOrder(store);
    const raw = '{ "code": "10000", "trade_status": "TRADE_SUCCESS", "out_trade_no": "' + order.id + '", "total_amount": "299.00", "trade_no": "123456" }';
    const signature = sign("RSA-SHA256", Buffer.from(raw), platform.privateKey).toString("base64");
    let text = `{"alipay_trade_query_response":${raw},"sign":"${signature}"}`;
    const provider = new AlipayProvider(config, async () => new Response(text));
    assert.equal((await provider.query(order)).total_amount, "299.00");
    text = text.replace("299.00", "0.01"); await assert.rejects(provider.query(order), /验签/);
    text = `{"alipay_trade_query_response":${raw},"alipay_trade_query_response":{"code":"10000","total_amount":"0.01"},"sign":"${signature}"}`;
    assert.equal((await provider.query(order)).total_amount, "299.00");
    const foreign = JSON.stringify({ code: "10000", out_trade_no: "another-order", total_amount: "299.00" });
    const foreignSign = sign("RSA-SHA256", Buffer.from(foreign), platform.privateKey).toString("base64");
    text = `{"alipay_trade_query_response":${foreign},"sign":"${foreignSign}"}`;
    await assert.rejects(provider.query(order), /请求订单不匹配/);
  } finally { store.close(); }
});
test("订单创建幂等，忽略客户端价格，隔离浏览器查询权限", () => {
  const store = new OrderStore(":memory:");
  try {
    const data = validatePurchase(purchase).data, owner = hashOwner("owner"), key = randomUUID();
    const first = store.create(data, owner, key);
    assert.equal(store.create(data, owner, key).id, first.id); assert.equal(first.amount_cents, 29900); assert.equal(JSON.parse(first.service_snapshot).scope, serviceOffers[0].scope);
    assert.throws(() => store.create({ ...data, requirements: "另一需求" }, owner, key), /不一致/);
    assert.throws(() => store.owned(first.id, hashOwner("stranger")), /不属于/);
  } finally { store.close(); }
});
test("付款核对应用、收款方、订单和金额；重复通知不重复入账", () => {
  const store = new OrderStore(":memory:");
  try {
    const order = makeOrder(store), fields = notification(order), options = { source: "notify", eventId: "notify:test", sellerId: config.sellerId, appId: config.appId };
    for (const extra of [{ app_id: "wrong" }, { seller_id: "wrong" }, { total_amount: "0.01" }, { out_trade_no: "missing" }, { trade_no: "" }]) assert.throws(() => store.applyPayment(paymentEvent({ ...fields, ...extra }), options));
    assert.equal(store.get(order.id).status, "PENDING");
    const paid = store.applyPayment(paymentEvent(fields), options);
    assert.equal(paid.status, "PAID"); assert.equal(store.applyPayment(paymentEvent(fields), options).paid_at, paid.paid_at);
    assert.equal(store.db.prepare("SELECT COUNT(*) AS count FROM payment_events").get().count, 1);
    store.applyPayment(paymentEvent({ ...fields, trade_status: "TRADE_CLOSED" }), { ...options, eventId: "notify:late" });
    assert.equal(store.get(order.id).status, "PAID");
    assert.throws(() => store.applyPayment(paymentEvent({ ...fields, trade_no: "different" }), { ...options, eventId: "notify:wrong" }));
  } finally { store.close(); }
});
test("订单库跨服务重启仍保留付款记录", async () => {
  const directory = await mkdtemp(join(tmpdir(), "mono-commerce-")), file = join(directory, "orders.sqlite");
  let store;
  try {
    store = new OrderStore(file); const order = makeOrder(store); store.close();
    store = new OrderStore(file); assert.equal(store.get(order.id).amount_cents, 29900);
  } finally { store?.close(); await rm(directory, { recursive: true, force: true }); }
});

test("HTTP 全链路：下单、收银台、通知、查询与异常边界（无真实交易）", async t => {
  const store = new OrderStore(":memory:");
  const real = new AlipayProvider(config);
  const provider = { id: "alipay", createCheckout: order => real.createCheckout(order), verifyNotification: fields => real.verifyNotification(fields), toPaymentEvent: (fields, options) => real.toPaymentEvent(fields, options), query: async () => null };
  const server = createCommerceServer(config, { store, provider });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/commerce`;
  let cookie = "", order;
  async function api(path, { method = "GET", body, headers = {}, ...rest } = {}) {
    return fetch(base + path, { method, redirect: "manual", headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body !== undefined ? { "Content-Type": "application/json", Origin: config.origin } : {}), ...headers }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), ...rest });
  }
  try {
    await t.test("目录不会暴露应用私钥、支付宝公钥或联系人", async () => {
      const response = await api("/catalog"), text = await response.text(); assert.equal(response.status, 200); assert.doesNotMatch(text, /PRIVATE KEY|PUBLIC KEY|privateKey|contactName/);
    });
    await t.test("跨站请求、无效 JSON 与字段超限被拒绝", async () => {
      assert.equal((await api("/orders", { method: "POST", body: purchase, headers: { Origin: "https://attacker.invalid" } })).status, 403);
      assert.equal((await api("/orders", { method: "POST", body: null })).status, 400);
      assert.equal((await api("/orders", { method: "POST", body: { ...purchase, requirements: "x".repeat(1001) }, headers: { "Idempotency-Key": randomUUID() } })).status, 422);
    });
    await t.test("超大请求明确返回 413，通知与输入均不绕过请求体上限", async () => {
      const response = await api("/orders", { method: "POST", body: { ...purchase, requirements: "x".repeat(20000) } });
      assert.equal(response.status, 413);
      const notify = await fetch(base + "/alipay/notify", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "x=" + "y".repeat(20000) });
      assert.equal(await notify.text(), "failure");
    });
    await t.test("用户确认的价格变化时拒绝直接扣款", async () => {
      const result = await api("/orders", { method: "POST", body: { ...purchase, expectedAmountCents: 1 }, headers: { "Idempotency-Key": randomUUID() } });
      assert.equal(result.status, 422); assert.match((await result.json()).fields.serviceId, /价格已调整/);
    });
    await t.test("下单时客户端篡改金额无效，会话 Cookie 为 HttpOnly", async () => {
      const response = await api("/orders", { method: "POST", body: { ...purchase, amountCents: 1, status: "PAID" }, headers: { "Idempotency-Key": randomUUID() } });
      assert.equal(response.status, 201); assert.match(response.headers.get("set-cookie"), /HttpOnly; SameSite=Lax/);
      cookie = response.headers.get("set-cookie").split(";")[0]; order = (await response.json()).order;
      assert.equal(order.amountCents, 29900); assert.equal(order.status, "PENDING");
    });
    await t.test("本人查询与未实现的微信渠道边界", async () => {
      assert.equal((await api(`/orders/${order.id}`)).status, 200);
      assert.equal((await api(`/orders/${order.id}`, { headers: { Cookie: "gn_commerce=" + "b".repeat(64) } })).status, 404);
      assert.equal((await api(`/orders/${order.id}/payment`, { method: "POST", body: { provider: "wechat" } })).status, 400);
      const response = await api(`/orders/${order.id}/payment`, { method: "POST", body: { provider: "alipay" } }); assert.equal(response.status, 200);
      assert.equal(JSON.parse((await response.json()).checkout.fields.biz_content).total_amount, "299.00");
    });
    await t.test("伪造回跳只跳转订单页，不修改付款状态", async () => {
      const response = await api(`/alipay/return?order_id=${order.id}&trade_status=TRADE_SUCCESS`);
      assert.equal(response.status, 303); assert.equal(response.headers.get("location"), `/orders/?order=${order.id}`); assert.equal(store.get(order.id).status, "PENDING");
    });
    await t.test("未验签、错误金额与重复字段通知均返回 failure", async () => {
      for (const body of [new URLSearchParams({ ...notification(store.get(order.id)), sign: "wrong" }).toString(), new URLSearchParams(notification(store.get(order.id), { total_amount: "0.01" })).toString(), new URLSearchParams(notification(store.get(order.id), { app_id: "wrong" })).toString(), new URLSearchParams(notification(store.get(order.id), { seller_id: "wrong" })).toString(), new URLSearchParams(notification(store.get(order.id))).toString() + "&total_amount=299.00"]) {
        const response = await fetch(base + "/alipay/notify", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }); assert.equal(await response.text(), "failure");
      }
      assert.equal(store.get(order.id).status, "PENDING");
    });
    await t.test("本地订单超时不能再支付，但仍接受已经发生的真实付款通知", async () => {
      const result = await api("/orders", { method: "POST", body: purchase, headers: { "Idempotency-Key": randomUUID() } });
      const expired = (await result.json()).order;
      store.db.prepare("UPDATE orders SET expires_at=? WHERE id=?").run(Date.now() - 1000, expired.id);
      assert.equal((await api(`/orders/${expired.id}/payment`, { method: "POST", body: { provider: "alipay" } })).status, 409);
      const body = new URLSearchParams(notification(store.get(expired.id), { trade_no: "202610100000002" })).toString();
      assert.equal(await (await fetch(base + "/alipay/notify", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body })).text(), "success");
      assert.equal(store.get(expired.id).status, "PAID");
    });
    await t.test("漏通知时由主动查单恢复付款状态，响应须匹配请求订单", async () => {
      const result = await api("/orders", { method: "POST", body: purchase, headers: { "Idempotency-Key": randomUUID() } });
      const recoverable = (await result.json()).order;
      provider.query = async item => notification(item, { trade_no: "202610100000003" });
      const refreshed = await api(`/orders/${recoverable.id}/refresh`, { method: "POST", body: {} });
      assert.equal(refreshed.status, 200); assert.equal((await refreshed.json()).order.status, "PAID");
      const another = (await (await api("/orders", { method: "POST", body: purchase, headers: { "Idempotency-Key": randomUUID() } })).json()).order;
      provider.query = async () => notification(store.get(recoverable.id));
      assert.equal((await api(`/orders/${another.id}/refresh`, { method: "POST", body: {} })).status, 502);
      assert.equal(store.get(another.id).status, "PENDING");
    });
    await t.test("合法通知入账、重复通知成功响应，已付订单不能再次支付", async () => {
      const body = new URLSearchParams(notification(store.get(order.id))).toString();
      for (let i = 0; i < 2; i++) {
        const response = await fetch(base + "/alipay/notify", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }); assert.equal(await response.text(), "success");
      }
      assert.equal((await (await api(`/orders/${order.id}`)).json()).order.status, "PAID");
      assert.equal((await api(`/orders/${order.id}/payment`, { method: "POST", body: { provider: "alipay" } })).status, 409);
    });
  } finally { await new Promise(resolve => server.close(resolve)); }
});
test("关闭收款时目录可读，但禁止创建收费订单", async () => {
  const server = createCommerceServer({ ...config, enabled: false });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/commerce`;
  try {
    assert.equal((await (await fetch(base + "/catalog")).json()).paymentsEnabled, false);
    assert.deepEqual((await (await fetch(base + "/orders")).json()).orders, []);
    const result = await fetch(base + "/orders", { method: "POST", headers: { "Content-Type": "application/json", Origin: config.origin }, body: JSON.stringify(purchase) }); assert.equal(result.status, 503);
  } finally { await new Promise(resolve => server.close(resolve)); }
});


test("暂停新收款仍处理已经发生的旧订单付款通知", async () => {
  const store = new OrderStore(":memory:"), order = makeOrder(store);
  const provider = new AlipayProvider(config);
  const server = createCommerceServer({ ...config, enabled: false }, { store, provider });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/commerce`;
  try {
    const response = await fetch(base + "/alipay/notify", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(notification(order)).toString() });
    assert.equal(await response.text(), "success"); assert.equal(store.get(order.id).status, "PAID");
    assert.equal((await (await fetch(base + "/catalog")).json()).paymentsEnabled, false);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

// 管理查询不会开放付款状态写入；测试不依赖远端账号或商户密钥。
test("经营者查询配置拒绝弱令牌，留空则关闭管理入口", () => {
  assert.equal(paymentConfig({}).adminToken, "");
  for (const token of ["password", "a".repeat(63), "A".repeat(64)]) assert.throws(() => paymentConfig({ PAYMENT_ADMIN_TOKEN: token }), /PAYMENT_ADMIN_TOKEN/);
  assert.equal(paymentConfig({ PAYMENT_ADMIN_TOKEN: "a".repeat(64) }).adminToken.length, 64);
});

test("经营者查询：鉴权、过滤分页、详情、只读与健康检查", async t => {
  const token = "b".repeat(64), store = new OrderStore(":memory:");
  const first = makeOrder(store), second = store.create(validatePurchase(purchase).data, hashOwner("c".repeat(64)), randomUUID());
  store.applyPayment(paymentEvent(notification(first)), { source: "notify", eventId: "admin-test-payment" });
  const server = createCommerceServer({ ...config, enabled: false, adminToken: token }, { store, provider: null });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/commerce`;
  const admin = (path = "/admin/orders", options = {}) => fetch(base + path, { ...options, headers: { Authorization: `Bearer ${token}`, ...options.headers } });
  try {
    await t.test("健康检查不泄漏支付开关、密钥和客户数量", async () => {
      const response = await fetch(base + "/health");
      assert.equal(response.status, 200); assert.deepEqual(await response.json(), { status: "ok" });
    });
    await t.test("客户 Cookie、错误令牌和 URL 令牌不能获得管理权限", async () => {
      for (const headers of [{}, { Cookie: `gn_commerce=${"a".repeat(64)}` }, { Authorization: "Bearer wrong" }, { Authorization: `Bearer ${"c".repeat(64)}` }]) {
        assert.equal((await fetch(base + `/admin/orders?token=${token}`, { headers })).status, 401);
      }
    });
    await t.test("支持状态、订单号、稳定分页及总数，不暴露内部授权凭证", async () => {
      const response = await admin("/admin/orders?page=1&pageSize=1");
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "no-store");
      const result = await response.json();
      assert.deepEqual(result.pagination, { page: 1, pageSize: 1, total: 2, totalPages: 2 });
      const next = await (await admin("/admin/orders?page=2&pageSize=1")).json();
      assert.notEqual(result.orders[0].id, next.orders[0].id);
      for (const row of [...result.orders, ...next.orders]) for (const field of ["owner_hash", "idempotency_key", "fingerprint"]) assert.equal(Object.hasOwn(row, field), false);
      assert.equal((await (await admin("/admin/orders?status=PAID")).json()).orders[0].id, first.id);
      assert.equal((await (await admin(`/admin/orders?orderId=${second.id}`)).json()).orders[0].id, second.id);
      assert.deepEqual((await (await admin("/admin/orders?page=99")).json()).orders, []);
    });
    await t.test("非法枚举、页码、超限、注入和重复参数映射为字段错误", async () => {
      for (const query of ["status=UNKNOWN", "page=0", "page=-1", "page=1.5", "page=9007199254740991&pageSize=100", "pageSize=101", "pageSize=", "status=PAID&status=PENDING", "orderId=' OR 1=1", "unknown=1", "__proto__=1"]) {
        const response = await admin(`/admin/orders?${query}`);
        assert.equal(response.status, 422, query);
        assert.ok(Object.keys((await response.json()).fields).length, query);
      }
    });
    await t.test("详情返回真实核验记录，不允许编辑金额和付款状态", async () => {
      const result = await (await admin(`/admin/orders/${first.id}`)).json();
      assert.equal(result.order.tradeNo, "202610100000001");
      assert.equal(result.paymentEvents[0].source, "notify");
      assert.equal(result.paymentEvents[0].status, "PAID");
      assert.equal((await admin(`/admin/orders/${first.id}`, { method: "POST" })).status, 405);
      assert.equal(store.get(first.id).amount_cents, first.amount_cents);
      assert.equal((await admin(`/admin/orders/GN${"F".repeat(20)}`)).status, 404);
    });
    await t.test("公开目录不暴露经营者令牌，无客户凭证仍看不到别人的订单", async () => {
      assert.equal(JSON.stringify(await (await fetch(base + "/catalog")).json()).includes(token), false);
      assert.deepEqual((await (await fetch(base + "/orders")).json()).orders, []);
      assert.equal((await fetch(base + `/orders/${first.id}`)).status, 401);
    });
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test("未启用管理令牌时，即使带 Bearer 也返回 404", async () => {
  const server = createCommerceServer({ ...config, enabled: false, adminToken: "" }, { provider: null });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/commerce/admin/orders`, { headers: { Authorization: `Bearer ${"a".repeat(64)}` } });
    assert.equal(response.status, 404);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test("代理 IP 限流只有显式开启回环信任才按覆盖后的 IP 区分", async () => {
  for (const trustProxy of [false, true]) {
    const server = createCommerceServer({ ...config, enabled: false, trustProxy }, { provider: null });
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${server.address().port}/api/commerce`;
    try {
      for (let i = 0; i < 120; i++) assert.equal((await fetch(base + "/catalog", { headers: { "X-Real-IP": "192.0.2.1" } })).status, 200);
      assert.equal((await fetch(base + "/catalog", { headers: { "X-Real-IP": "192.0.2.1" } })).status, 429);
      assert.equal((await fetch(base + "/catalog", { headers: { "X-Real-IP": "192.0.2.2" } })).status, trustProxy ? 200 : 429);
      assert.equal((await fetch(base + "/health")).status, 200);
    } finally { await new Promise(resolve => server.close(resolve)); }
  }
});

test("在线 SQLite 备份包含 WAL 交易、验证完整性且不泄露文件权限", async () => {
  const { backupOrders } = await import("../server/backup.mjs");
  const { DatabaseSync } = await import("node:sqlite");
  const { stat, readdir } = await import("node:fs/promises");
  const directory = await mkdtemp(join(tmpdir(), "mono-backup-"));
  const store = new OrderStore(join(directory, "source.sqlite"));
  try {
    const order = makeOrder(store);
    store.applyPayment(paymentEvent(notification(order)), { source: "notify", eventId: "backup-payment" });
    const target = backupOrders(join(directory, "source.sqlite"), join(directory, "backups"));
    assert.equal((await stat(target)).mode & 0o777, 0o600);
    const backup = new DatabaseSync(target, { readOnly: true });
    try {
      assert.equal(backup.prepare("SELECT status FROM orders WHERE id=?").get(order.id).status, "PAID");
      assert.equal(backup.prepare("SELECT COUNT(*) AS count FROM payment_events").get().count, 1);
    } finally { backup.close(); }
    assert.throws(() => backupOrders(join(directory, "missing.sqlite"), join(directory, "backups")), /不存在/);
    assert.equal((await readdir(join(directory, "backups"))).length, 1);
  } finally { store.close(); await rm(directory, { recursive: true, force: true }); }
});

test("ShopXO 入口仅使用有效 HTTPS 域名和完整真实商品映射", async () => {
  const { createShopxoOrderCenter } = await import("../shared/order-center.js");
  const mapping = Object.fromEntries(serviceOffers.map((offer, index) => [offer.id, index + 101]));
  assert.equal(createShopxoOrderCenter("", ""), null);
  const center = createShopxoOrderCenter("https://orders.example.com", JSON.stringify(mapping));
  for (const offer of serviceOffers) {
    const url = new URL(center.products[offer.id]);
    assert.equal(url.origin, center.origin);
    assert.equal(url.searchParams.get("s"), "/index/goods/index");
    assert.equal(url.searchParams.get("id"), String(mapping[offer.id]));
  }
  assert.equal(new URL(center.ordersUrl).searchParams.get("s"), "/index/order/index");
  for (const origin of ["http://orders.example.com", "https://user:password@orders.example.com", "https://orders.example.com/path", "https://orders.example.com/?token=x", "https://orders.example.com/#a", "not-a-domain"]) assert.throws(() => createShopxoOrderCenter(origin, JSON.stringify(mapping)));
  for (const value of ["not-json", "null", "[]", "{}", JSON.stringify({ ...mapping, [serviceOffers[0].id]: 0 }), JSON.stringify({ ...mapping, [serviceOffers[0].id]: "101" }), JSON.stringify({ ...mapping, [serviceOffers[0].id]: 102 })]) assert.throws(() => createShopxoOrderCenter("https://orders.example.com", value));
  assert.throws(() => createShopxoOrderCenter("", JSON.stringify(mapping)));
});

test("静态 MP4 提供正确类型和字节分段，支持播放、拖动及范围边界", async () => {
  const directory = await mkdtemp(join(tmpdir(), "mono-film-http-"));
  const bytes = Buffer.from("0123456789");
  await mkdir(join(directory, "assets"));
  await writeFile(join(directory, "assets", "film.mp4"), bytes);
  const server = createCommerceServer({ ...config, enabled: false }, { provider: null, dist: directory });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}/assets/film.mp4`;
  try {
    const full = await fetch(url);
    assert.equal(full.status, 200);
    assert.equal(full.headers.get("content-type"), "video/mp4");
    assert.equal(full.headers.get("content-length"), "10");
    assert.equal(full.headers.get("accept-ranges"), "bytes");
    assert.equal(await full.text(), "0123456789");
    for (const [range, content, position] of [["bytes=0-1", "01", "0-1"], ["bytes=7-", "789", "7-9"], ["bytes=-3", "789", "7-9"], ["bytes=8-99", "89", "8-9"], ["bytes=-99", "0123456789", "0-9"]]) {
      const response = await fetch(url, { headers: { Range: range } });
      assert.equal(response.status, 206);
      assert.equal(response.headers.get("content-range"), `bytes ${position}/10`);
      assert.equal(response.headers.get("content-length"), String(content.length));
      assert.equal(await response.text(), content);
    }
    for (const range of ["bytes=10-", "bytes=5-3", "bytes=-0", "bytes=-", "bytes=0-1,4-5", "bytes=9007199254740992-", "bytes=0-9007199254740992"]) {
      const response = await fetch(url, { headers: { Range: range } });
      assert.equal(response.status, 416, range);
      assert.equal(response.headers.get("content-range"), "bytes */10");
      assert.equal(await response.text(), "");
    }
    const head = await fetch(url, { method: "HEAD", headers: { Range: "bytes=0-1" } });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get("content-length"), "10");
    assert.equal(await head.text(), "");
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});
