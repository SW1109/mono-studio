import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
process.env.FILM_ROOT = dirname(fileURLToPath(import.meta.url));
await import("../studio-film-v3/audio.mjs");
