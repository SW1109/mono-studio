import { products, productPath } from "./products.js";
import { guideArticles, guidePath } from "./guideArticles.js";
import { caseStudies, caseStudyPath } from "./caseStudies.js";

export const publicPaths = ["/", "/services/", "/products/", "/about/", "/contact/", "/lab/", "/shop/", "/service-terms/", "/guides/", "/projects/", ...products.map(productPath), ...guideArticles.map(guidePath), ...caseStudies.map(caseStudyPath)];
export const noindexPaths = ["/checkout/", "/orders/", "/404/"];
export const prerenderPaths = [...publicPaths, ...noindexPaths];
