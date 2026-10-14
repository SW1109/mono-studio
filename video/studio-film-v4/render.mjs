import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
// 两个版本共用渲染管线，但保留各自的分镜、素材和成片。
process.env.FILM_ROOT = dirname(fileURLToPath(import.meta.url));
await import("../studio-film-v3/render.mjs");
