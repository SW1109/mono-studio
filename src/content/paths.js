import { products, productPath } from "./products.js";
import { guideArticles, guidePath } from "./guideArticles.js";

export const publicPaths = ["/", "/services/", "/products/", "/about/", "/contact/", "/lab/", "/shop/", "/service-terms/", "/guides/", ...products.map(productPath), ...guideArticles.map(guidePath)];
export const noindexPaths = ["/checkout/", "/orders/", "/404/"];
export const prerenderPaths = [...publicPaths, ...noindexPaths];
