import { createShopxoOrderCenter } from "../../shared/order-center.js";

export const orderCenter = createShopxoOrderCenter(import.meta.env.VITE_SHOPXO_ORIGIN, import.meta.env.VITE_SHOPXO_PRODUCTS);
