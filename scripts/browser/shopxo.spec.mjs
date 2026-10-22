import { test, expect } from "@playwright/test";
import { serviceOffers } from "../../shared/commerce.js";

test("ShopXO 页面使用原生商品和账号入口，不查询旧商城或展示静态报价", async ({ page }) => {
  const requests = [], errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/api/commerce/**", route => { requests.push(route.request().url()); return route.abort(); });
  await page.goto("/shop/");
  const product = page.getByRole("link", { name: "前往订单中心确认" }).first();
  const url = new URL(await product.getAttribute("href"));
  expect(url.origin).toBe("https://orders.example.com");
  expect(url.searchParams.get("id")).toBe("101");
  await expect(page.locator(".offer-price")).toHaveCount(0);
  await page.goto("/checkout/?service=technical-review");
  await expect(page.getByRole("link", { name: /查看 软件问题诊断/ })).toBeVisible();
  await expect(page.locator(".purchase-form")).toHaveCount(0);
  await page.goto("/orders/");
  await expect(page.getByRole("link", { name: /登录订单中心查询/ })).toBeVisible();
  expect(requests).toEqual([]); expect(errors).toEqual([]);
});

test("旧 GN 订单仍能查付款状态，ShopXO 模式不提供旧渠道付款按钮", async ({ page }) => {
  const id = "GNCCCCCCCCCCCCCCCCCCCC";
  const order = { id, serviceId: serviceOffers[0].id, serviceName: "旧订单服务", amountCents: 29900, contactName: "测试用户", email: "test@example.com", requirements: "历史订单测试", status: "PENDING", createdAt: Date.now(), expiresAt: Date.now() + 60000, expired: false, serviceSnapshot: serviceOffers[0] };
  await page.route("**/api/commerce/orders/**", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ order }) }));
  await page.goto(`/orders/?order=${id}`);
  await expect(page.getByRole("heading", { name: "旧订单服务" })).toBeVisible();
  await expect(page.getByRole("button", { name: "继续支付宝支付" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "刷新支付结果" })).toBeEnabled();
  await page.getByRole("link", { name: "查看最近订单" }).click();
  await expect(page.getByRole("link", { name: /登录订单中心查询/ })).toBeVisible();
});
