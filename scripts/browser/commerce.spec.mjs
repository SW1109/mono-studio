import { test, expect } from "@playwright/test";
import { serviceOffers } from "../../shared/commerce.js";

const catalog = { offers: serviceOffers, paymentsEnabled: true, environment: "sandbox", merchantName: "浏览器回归测试" };
const a = "GNAAAAAAAAAAAAAAAAAAAA", b = "GNBBBBBBBBBBBBBBBBBBBB";
const order = (id, name = "测试服务") => ({ id, serviceId: serviceOffers[0].id, serviceName: name, amountCents: 29900, contactName: "测试用户", email: "test@example.com", requirements: "回归测试，不是真实订单", status: "PENDING", createdAt: Date.now(), expiresAt: Date.now() + 60000, expired: false, serviceSnapshot: serviceOffers[0] });
const json = (route, data, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });

test("移动导航可键盘关闭，主要页面不溢出且不加载三维引擎", async ({ page }) => {
  const errors = [], heavy = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => { if (/cesium-engine|CesiumExperience|CesiumGlobe|\/cesium\//.test(request.url())) heavy.push(request.url()); });
  await page.route("**/api/commerce/catalog", route => json(route, catalog));
  await page.route("**/api/commerce/orders", route => json(route, { orders: [] }));
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "打开导航菜单" });
  await toggle.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(toggle).toBeFocused();
  for (const path of ["/", "/services/", "/products/", "/shop/", "/checkout/", "/orders/", "/contact/"]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]); expect(heavy).toEqual([]);
});

test("目录格式错误显示重试入口，重新检查后恢复且保留表单内容", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/commerce/catalog", route => json(route, ++calls === 1 ? {} : catalog));
  await page.goto("/checkout/");
  await expect(page.getByRole("alert")).toContainText("数据不完整");
  await page.getByLabel("联系人", { exact: false }).fill("测试联系人");
  await page.getByRole("button", { name: "重新检查" }).click();
  await expect(page.getByRole("button", { name: "确认订单并前往支付宝" })).toBeEnabled();
  await expect(page.getByLabel("联系人", { exact: false })).toHaveValue("测试联系人");
});

test("请求失败重试复用同一幂等标识，已有订单显示查询入口", async ({ page }) => {
  const keys = [];
  await page.route("**/api/commerce/catalog", route => json(route, catalog));
  await page.route("**/api/commerce/orders", async route => {
    keys.push(route.request().headers()["idempotency-key"]);
    if (keys.length === 1) return route.abort("failed");
    return json(route, { order: order(a) }, 201);
  });
  await page.route("**/api/commerce/orders/*/payment", route => json(route, { error: "支付测试暂停" }, 503));
  await page.goto("/checkout/");
  await page.getByLabel("联系人", { exact: false }).fill("测试联系人");
  await page.getByLabel("联系邮箱", { exact: false }).fill("test@example.com");
  await page.getByLabel("需求说明", { exact: false }).fill("一个测试问题，请检查重试流程");
  await page.getByRole("checkbox").check();
  const submit = page.getByRole("button", { name: "确认订单并前往支付宝" });
  await submit.click();
  await expect(page.getByRole("alert")).toContainText("网络连接中断");
  await submit.click();
  await expect(page.getByRole("alert")).toContainText("支付测试暂停");
  await expect(page.getByRole("link", { name: `查看订单 ${a}` })).toBeVisible();
  expect(keys).toHaveLength(2); expect(keys[0]).toBe(keys[1]);
});

test("服务价格刷新后按新报价提交，服务端字段错误会定位输入框", async ({ page }) => {
  let calls = 0, submitted;
  const offers = serviceOffers.map((item, index) => index === 0 ? { ...item, priceCents: 39900 } : item);
  await page.route("**/api/commerce/catalog", route => json(route, { ...catalog, offers }));
  await page.route("**/api/commerce/orders", route => {
    calls++; submitted = route.request().postDataJSON();
    return json(route, { error: "请检查订单信息", fields: { email: "请更换可用邮箱" } }, 422);
  });
  await page.goto("/checkout/");
  await expect(page.locator(".commerce-summary .commerce-total")).toContainText("399.00");
  await page.getByLabel("联系人", { exact: false }).fill("测试联系人");
  await page.getByLabel("联系邮箱", { exact: false }).fill("test@example.com");
  await page.getByLabel("需求说明", { exact: false }).fill("检查报价变动后的下单流程");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "确认订单并前往支付宝" }).click();
  await expect(page.getByLabel("联系邮箱", { exact: false })).toBeFocused();
  await expect(page.locator("#contact-email-error")).toHaveText("请更换可用邮箱");
  expect(calls).toBe(1); expect(submitted.expectedAmountCents).toBe(39900);
});

test("付款查询期间切换订单，不会提交旧订单或新订单的付款请求", async ({ page }) => {
  const errors = []; let refreshes = 0, payments = 0, release;
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/api/commerce/orders**", async route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/payment")) { payments++; return json(route, { error: "不应发起支付" }, 500); }
    if (url.pathname.endsWith("/refresh") && url.pathname.includes(a)) {
      refreshes++;
      if (refreshes === 2) await new Promise(done => { release = done; });
      return json(route, { order: order(a, "服务 A") }).catch(() => {});
    }
    if (url.pathname.endsWith("/orders")) return json(route, { orders: [order(b, "服务 B")] });
    return json(route, { order: order(url.pathname.includes(a) ? a : b, url.pathname.includes(a) ? "服务 A" : "服务 B") });
  });
  await page.goto(`/orders/?order=${a}`);
  const pay = page.getByRole("button", { name: "继续支付宝支付" });
  await expect(pay).toBeEnabled();
  await expect.poll(() => refreshes).toBe(1);
  await pay.click();
  await expect.poll(() => refreshes).toBe(2);
  await page.getByRole("link", { name: "查看最近订单" }).click();
  await page.getByRole("link", { name: /服务 B/ }).click();
  release();
  await expect(page.locator("h2.commerce-title")).toHaveText("服务 B");
  expect(payments).toBe(0); expect(errors).toEqual([]);
});
