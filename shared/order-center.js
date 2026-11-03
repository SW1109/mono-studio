// 商品和账号流程沿用 ShopXO；可挂载到官网子目录，避免跨站跳转。
export function createShopxoOrderCenter(origin, products, { allowLocalPreview = false, basePath = "/" } = {}) {
  if (!origin) {
    if (products) throw new Error("配置 ShopXO 商品前，请先设置 VITE_SHOPXO_ORIGIN。");
    return null;
  }
  let url;
  try { url = new URL(origin); } catch { throw new Error("VITE_SHOPXO_ORIGIN 应为订单中心的 HTTPS 域名。"); }
  // 本地预览仅对开发服务器开放；正式构建继续要求 HTTPS。
  const localPreview = allowLocalPreview && url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
  if ((!localPreview && url.protocol !== "https:") || url.origin !== origin || url.username || url.password) throw new Error("VITE_SHOPXO_ORIGIN 只允许 HTTPS 协议与域名，不含路径或凭据。");
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(basePath)) throw new Error("VITE_SHOPXO_BASE_PATH 必须是以 / 开头和结尾的目录，如 /shop/。");
  let mapping = {};
  if (products) {
    try { mapping = JSON.parse(products); } catch { throw new Error("VITE_SHOPXO_PRODUCTS 应为服务标识与实际 ShopXO 商品 ID 的 JSON 对象。"); }
    if (!mapping || typeof mapping !== "object" || Array.isArray(mapping)) throw new Error("ShopXO 商品映射应为 JSON 对象。");
    if (Object.entries(mapping).some(([id, value]) => !id.trim() || !Number.isSafeInteger(value) || value <= 0)) throw new Error("ShopXO 商品 ID 必须是实际商品的正整数 ID。");
  }
  const page = (route, id) => {
    const target = new URL(`${basePath}index.php`, origin);
    target.searchParams.set("s", `/${route}/index`);
    if (id !== undefined) target.searchParams.set("id", String(id));
    return target.href;
  };
  // 商品映射可选；不配置单品链接时进入完整商城，新增商品无需重建官网。
  return Object.freeze({
    origin, basePath, shopUrl: page("index"), ordersUrl: page("order"),
    products: Object.freeze(Object.fromEntries(Object.entries(mapping).map(([id, value]) => [id, page("goods", value)]))),
  });
}
