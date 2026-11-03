import { createShopxoOrderCenter } from "../../shared/order-center.js";

export const orderCenter = createShopxoOrderCenter(import.meta.env.VITE_SHOPXO_ORIGIN, import.meta.env.VITE_SHOPXO_PRODUCTS, { allowLocalPreview: import.meta.env.DEV, basePath: import.meta.env.VITE_SHOPXO_BASE_PATH || "/" });
