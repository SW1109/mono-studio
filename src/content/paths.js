import { products, productPath } from "./products.js";

export const publicPaths = ["/", "/services/", "/products/", "/about/", "/contact/", "/lab/", "/shop/", "/service-terms/", ...products.map(productPath)];
export const noindexPaths = ["/checkout/", "/orders/", "/404/"];
export const prerenderPaths = [...publicPaths, ...noindexPaths];