import { open, realpath } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { pipeline } from "node:stream/promises";
import { CommerceError } from "./order-store.mjs";

const types = { ".mp4": "video/mp4", ".xml": "application/xml;charset=utf-8", ".txt": "text/plain;charset=utf-8", ".wasm": "application/wasm", ".html": "text/html;charset=utf-8", ".js": "text/javascript;charset=utf-8", ".css": "text/css;charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".ico": "image/x-icon" };

export function byteRange(value, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2])) return null;
  const first = Number(match[1]), last = Number(match[2]);
  const start = match[1] ? first : Math.max(0, size - last);
  const end = match[1] && match[2] ? Math.min(last, size - 1) : size - 1;
  if (!Number.isSafeInteger(first) || !Number.isSafeInteger(last) || (!match[1] && last <= 0)
      || !Number.isSafeInteger(start) || start < 0 || start >= size || end < start) return null;
  return { start, end };
}

async function openInside(root, name) {
  const actual = await realpath(resolve(root, name));
  if (!actual.startsWith(root + sep)) throw new CommerceError("页面不存在。", 404);
  const file = await open(actual, "r");
  try {
    const info = await file.stat();
    if (!info.isFile()) throw new CommerceError("页面不存在。", 404);
    return { file, info, actual };
  } catch (error) { await file.close(); throw error; }
}

export async function serveStatic(request, response, pathname, { dist, base }) {
  let relative;
  try { relative = decodeURIComponent(pathname.slice(base.length)); }
  catch { throw new CommerceError("页面地址格式无效。", 400); }
  if (relative.includes("\\") || relative.includes("\0") || relative.split("/").some(part => part.startsWith("."))) throw new CommerceError("页面不存在。", 404);
  const filename = relative.endsWith("/") || !extname(relative) ? `${relative.replace(/\/$/, "")}/index.html`.replace(/^\//, "") : relative;
  let root;
  try { root = await realpath(dist); }
  catch { throw new CommerceError("请先运行 npm run build 生成官网。", 404); }
  let entry, status = 200;
  try { entry = await openInside(root, filename); }
  catch (error) {
    if (!["ENOENT", "ENOTDIR"].includes(error.code) && error.status !== 404) throw error;
    status = 404;
    try { entry = await openInside(root, "404/index.html"); }
    catch { throw new CommerceError("页面不存在。", 404); }
  }
  const { file, info, actual } = entry;
  try {
    const etag = `W/"${info.size.toString(16)}-${Math.trunc(info.mtimeMs).toString(16)}"`;
    const headers = {
      "Content-Type": types[extname(actual)] || "application/octet-stream", "Content-Length": info.size,
      "Cache-Control": status === 200 && relative.startsWith("assets/") ? "public,max-age=31536000,immutable" : "no-cache",
      "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "X-Frame-Options": "SAMEORIGIN",
      "ETag": etag, "Last-Modified": info.mtime.toUTCString(),
    };
    const match = request.headers["if-none-match"];
    if (status === 200 && match && (match === "*" || match.split(",").some(item => item.trim().replace(/^W\//, "") === etag.replace(/^W\//, "")))) {
      delete headers["Content-Length"];
      response.writeHead(304, headers); response.end(); return;
    }
    let range;
    if (status === 200 && extname(actual) === ".mp4") {
      headers["Accept-Ranges"] = "bytes";
      const ifRange = request.headers["if-range"];
      const date = ifRange ? Date.parse(ifRange) : NaN;
      const useRange = !ifRange || (Number.isFinite(date) && Math.floor(info.mtimeMs / 1000) * 1000 <= date);
      if (request.method === "GET" && request.headers.range?.startsWith("bytes=") && useRange) {
        range = byteRange(request.headers.range, info.size);
        if (!range) {
          response.writeHead(416, { ...headers, "Content-Range": `bytes */${info.size}`, "Content-Length": 0 }); response.end(); return;
        }
        status = 206;
        headers["Content-Range"] = `bytes ${range.start}-${range.end}/${info.size}`;
        headers["Content-Length"] = range.end - range.start + 1;
      }
    }
    response.writeHead(status, headers);
    if (request.method === "HEAD" || info.size === 0) { response.end(); return; }
    await pipeline(file.createReadStream({ ...range, autoClose: false }), response);
  } finally { await file.close(); }
}
