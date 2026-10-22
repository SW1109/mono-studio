import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, writeFile, open, symlink, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { assertNodeVersion, nodePolicy } from "../server/node-runtime.mjs";
import { createCommerceServer } from "../server/app.mjs";
import { paymentConfig } from "../server/config.mjs";
import { OrderStore, hashOwner } from "../server/order-store.mjs";
import { serviceOffers, purchaseRules, validatePurchase } from "../shared/commerce.js";
import { boundedResponseText, signedResponsePart } from "../server/payments/signed-response.mjs";
import { commerceRequest } from "../src/api/commerce.js";

const purchase = { serviceId: serviceOffers[0].id, expectedAmountCents: serviceOffers[0].priceCents, contactName: "测试用户", email: "test@example.com", requirements: "一个待排查的测试问题", acceptedTerms: true, termsVersion: purchaseRules.termsVersion };
test("前端按刚确认的目录报价校验，服务端仍按自己的目录拒绝任意价格", () => {
  const changed = { ...purchase, expectedAmountCents: 39900 };
  assert.deepEqual(validatePurchase(changed, [{ ...serviceOffers[0], priceCents: 39900 }]).errors, {});
  assert.match(validatePurchase(changed).errors.serviceId, /价格已调整/);
});
async function listening(server) {
  // Windows may allocate a port forbidden by Fetch when requesting port 0.
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      await new Promise((done, reject) => {
        const failure = error => { server.off("listening", ready); reject(error); };
        const ready = () => { server.off("error", failure); done(); };
        server.once("error", failure).once("listening", ready).listen(32000 + Math.floor(Math.random() * 18000), "127.0.0.1");
      });
      return `http://127.0.0.1:${server.address().port}`;
    } catch (error) { if (error.code !== "EADDRINUSE" || attempt === 7) throw error; }
  }
}

test("Node 运行环境拒绝旧版本、预发行和未审核分支，项目约束同步", async () => {
  for (const version of ["22.13.0", "22.23.3", "24.9.0", "24.22.0", "26.12.0", "24.22.1-rc1", "25.9.0", "27.0.0"]) assert.throws(() => assertNodeVersion(version), /安全版本/);
  for (const version of ["22.23.4", "24.22.1", "24.23.0", "26.12.1"]) assert.equal(assertNodeVersion(version), version);
  assert.equal(JSON.parse(await readFile("package.json", "utf8")).engines.node, nodePolicy.engines);
  assert.doesNotThrow(() => assertNodeVersion());
});

test("先确认浏览器会话再创建订单，丢失创建响应后重试仍只有一单", async () => {
  const store = new OrderStore(":memory:");
  const config = { ...paymentConfig({}), enabled: true, database: ":memory:" };
  const server = createCommerceServer(config, { store, provider: { id: "alipay" } });
  const base = await listening(server) + "/api/commerce";
  const key = randomUUID();
  const submit = cookie => fetch(base + "/orders", { method: "POST", headers: { "Content-Type": "application/json", Origin: config.origin, "Idempotency-Key": key, ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(purchase) });
  try {
    assert.equal((await submit()).status, 401);
    assert.equal(store.db.prepare("SELECT count(*) AS n FROM orders").get().n, 0);
    const catalog = await fetch(base + "/catalog");
    const header = catalog.headers.get("set-cookie");
    assert.match(header, /HttpOnly; SameSite=Lax/);
    await catalog.arrayBuffer();
    const cookie = header.split(";")[0];
    const lost = await submit(cookie);
    assert.equal(lost.status, 201);
    await lost.body.cancel();
    const repeated = await submit(cookie);
    assert.equal(repeated.status, 201);
    assert.ok((await repeated.json()).order.id);
    assert.equal(store.db.prepare("SELECT count(*) AS n FROM orders").get().n, 1);
  } finally { await new Promise(done => server.close(done)); }
});

test("ShopXO 模式即使遗留开关开启也禁止旧链路新下单，仍接收旧单通知", async () => {
  const config = { ...paymentConfig({ PAYMENT_ORDER_CENTER: "shopxo", PAYMENTS_ENABLED: "true" }), database: ":memory:" };
  assert.equal(config.enabled, false);
  const store = new OrderStore(":memory:");
  const order = store.create(validatePurchase(purchase).data, hashOwner("previous-browser"), randomUUID());
  const provider = { id: "alipay", verifyNotification: () => true, toPaymentEvent: () => ({ orderId: order.id, provider: "alipay", amountCents: order.amount_cents, tradeNo: "fixture-payment", status: "PAID" }) };
  const server = createCommerceServer(config, { store, provider });
  const base = await listening(server) + "/api/commerce";
  try {
    const response = await fetch(base + "/orders", { method: "POST", headers: { "Content-Type": "application/json", Origin: config.origin, "Idempotency-Key": randomUUID() }, body: JSON.stringify(purchase) });
    assert.equal(response.status, 503);
    const notify = await fetch(base + "/alipay/notify", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "sign=fixture-only" });
    assert.equal(await notify.text(), "success");
    assert.equal(store.get(order.id).status, "PAID");
  } finally { await new Promise(done => server.close(done)); }
});

test("静态服务支持大文件分段与缓存，并阻止隐藏文件、路径错误和越界链接", async t => {
  const root = await mkdtemp(join(tmpdir(), "mono-static-")), dist = join(root, "dist"), outside = join(root, "private");
  await mkdir(join(dist, "assets"), { recursive: true });
  await mkdir(join(dist, "404")); await mkdir(outside);
  await writeFile(join(dist, "404/index.html"), "not found");
  await writeFile(join(dist, ".env"), "must-not-serve");
  await writeFile(join(outside, "private.txt"), "must-not-serve");
  const file = await open(join(dist, "assets/large.mp4"), "w");
  await file.write("0123456789"); await file.truncate(64 * 1024 * 1024); await file.close();
  let linked = false;
  try { await symlink(outside, join(dist, "leak"), process.platform === "win32" ? "junction" : "dir"); linked = true; }
  catch (error) { if (error.code !== "EPERM") throw error; t.diagnostic("当前系统不允许创建测试链接。"); }
  const server = createCommerceServer({ ...paymentConfig({}), database: ":memory:" }, { dist });
  const base = await listening(server);
  try {
    const head = await fetch(base + "/assets/large.mp4", { method: "HEAD" });
    assert.equal(head.headers.get("content-length"), String(64 * 1024 * 1024));
    assert.equal(await head.text(), "");
    const range = await fetch(base + "/assets/large.mp4", { headers: { Range: "bytes=0-9" } });
    assert.equal(range.status, 206); assert.equal(await range.text(), "0123456789");
    const cached = await fetch(base + "/assets/large.mp4", { headers: { "If-None-Match": head.headers.get("etag") } });
    assert.equal(cached.status, 304); assert.equal(await cached.text(), "");
    for (const path of ["/.env", "/%2eenv", "/missing", ...(linked ? ["/leak/private.txt"] : [])]) {
      const response = await fetch(base + path); assert.equal(response.status, 404); assert.doesNotMatch(await response.text(), /must-not-serve/);
    }
    assert.equal((await fetch(base + "/%ZZ")).status, 400);
  } finally { await new Promise(done => server.close(done)); await rm(root, { recursive: true, force: true }); }
});

test("支付宝仅提取顶层原始签名内容，拒绝重复及转义同名字段并提前终止过大响应", async () => {
  const raw = '{ "code": "10000", "nested": { "text": "中文 }" } }';
  assert.equal(signedResponsePart(`{"decoy":{"result":{"code":"bad"}},"result":${raw},"sign":"x"}`, "result"), raw);
  for (const text of [`{"result":${raw},"result":{},"sign":"x"}`, `{"result":${raw},"r\\u0065sult":{},"sign":"x"}`, `{"result":${raw},"sign":"x","sign":"y"}`]) assert.throws(() => signedResponsePart(text, "result"), /重复/);
  let reads = 0, canceled = false;
  const response = new Response(new ReadableStream({ pull(controller) { reads++; controller.enqueue(new Uint8Array(1024)); }, cancel() { canceled = true; } }));
  await assert.rejects(boundedResponseText(response, 4096), /过大/);
  assert.equal(canceled, true); assert.ok(reads < 10);
});

test("商城拒绝不完整目录和错误订单响应，网络失败给出可恢复提示", async t => {
  let data = {};
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } }));
  for (const value of [{}, { offers: null }, { offers: [{}], paymentsEnabled: true }]) {
    data = value; await assert.rejects(commerceRequest("/catalog"), /数据不完整/);
  }
  data = { order: null }; await assert.rejects(commerceRequest("/orders/GNAAAAAAAAAAAAAAAAAAAA"), /数据不完整/);
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(commerceRequest("/catalog"), error => error.code === "NETWORK" && /网络/.test(error.message));
});
