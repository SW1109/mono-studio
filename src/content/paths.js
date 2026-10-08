import { products, productPath } from "./products.js";

export const publicPaths = ["/", "/services/", "/products/", "/about/", "/contact/", "/lab/", ...products.map(productPath)];
export const prerenderPaths = [...publicPaths, "/404/"];