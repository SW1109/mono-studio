import { serviceOffers } from "./commerce.js";

// 只集成经过审阅的 ShopXO 原生页面，不把账户令牌或支付密钥交给官网。
export function createShopxoOrderCenter(origin, products) {
  if (!origin) {
    if (products) throw new Error("配置 ShopXO 商品前，请先设置 VITE_SHOPXO_ORIGIN。");
    return null;
  }
  let url;
  try { url = new URL(origin); } catch { throw new Error("VITE_SHOPXO_ORIGIN 应为订单中心的 HTTPS 域名。"); }
  if (url.protocol !== "https:" || url.origin !== origin || url.username || url.password) throw new Error("VITE_SHOPXO_ORIGIN 只允许 HTTPS 协议与域名，不含路径或凭据。");
  let mapping;
  try { mapping = JSON.parse(products); } catch { throw new Error("VITE_SHOPXO_PRODUCTS 应为服务标识与实际 ShopXO 商品 ID 的 JSON 对象。"); }
  if (!mapping || typeof mapping !== "object" || Array.isArray(mapping)) throw new Error("ShopXO 商品映射应为 JSON 对象。");
  const ids = serviceOffers.map(offer => offer.id);
  if (Object.keys(mapping).length !== ids.length || ids.some(id => !Object.hasOwn(mapping, id) || !Number.isSafeInteger(mapping[id]) || mapping[id] <= 0) || new Set(Object.values(mapping)).size !== ids.length) {
    throw new Error("请为每个服务配置一个不同的、真实存在的 ShopXO 正整数商品 ID。");
  }
  const page = (route, id) => {
    const target = new URL("/index.php", origin);
    target.searchParams.set("s", `/index/${route}/index`);
    if (id !== undefined) target.searchParams.set("id", String(id));
    return target.href;
  };
  return Object.freeze({
    origin, ordersUrl: page("order"),
    products: Object.freeze(Object.fromEntries(ids.map(id => [id, page("goods", mapping[id])]))),
  });
}
