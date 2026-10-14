import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { once } from "node:events";
import { startBrowser } from "./cdp.mjs";

const root = process.env.FILM_ROOT || dirname(fileURLToPath(import.meta.url));
const project = resolve(root, "../..");
const spec = JSON.parse(await readFile(join(root, "spec.json"), "utf8"));
const ffmpeg = process.env.FFMPEG_BIN || "/opt/homebrew/bin/ffmpeg";
const prefix = `studio-film-v${spec.version}`;
const output = join(project, `src/assets/media/${prefix}.mp4`);
const command = process.argv[2] || "stills";
const assets = {
  "/": "index.html", "/index.html": "index.html", "/scene.js": "scene.js", "/spec.json": "spec.json", "/earth.js": "earth.js",
  "/assets/earth/day.jpg": "assets/earth/day.jpg", "/assets/earth/clouds.jpg": "assets/earth/clouds.jpg",
  "/brand-logo.jpg": join(project, "src/assets/brand-logo.jpg"),
  ...Object.fromEntries(["home-desktop", "home-mobile", "services-desktop", "services-mobile"].map(name => [`/assets/${name}.png`, `assets/${name}.png`])),
};
async function serve() {
  const server = createServer(async (req, res) => {
    const path = new URL(req.url, "http://127.0.0.1").pathname;
    if (!assets[path]) { res.writeHead(404); res.end(); return; }
    try {
      const file = assets[path].startsWith("/") ? assets[path] : join(root, assets[path]);
      const buffer = await readFile(file);
      res.setHeader("Content-Type", path.endsWith(".js") ? "text/javascript" : path.endsWith(".json") ? "application/json" : path.endsWith(".png") ? "image/png" : path.endsWith(".jpg") ? "image/jpeg" : "text/html");
      res.setHeader("Cache-Control", "no-store"); res.end(buffer);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  return { server, url: `http://127.0.0.1:${server.address().port}/?render=1` };
}
async function frame(browser, n, format = "image/png") {
  const data = await browser.evaluate(`window.encodeFrame(${n},${JSON.stringify(format)})`);
  return Buffer.from(data, "base64");
}
async function capture() {
  const browser = await startBrowser();
  const inventory = [];
  try {
    await browser.call("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    for (const [name, path, w, h] of [["home-desktop", "/", 1440, 840], ["home-mobile", "/", 390, 844], ["services-desktop", "/services/", 1440, 840], ["services-mobile", "/services/", 390, 844]]) {
      await browser.viewport(w, h, 2);
      console.log(`Capturing ${name}...`);
      await browser.navigate(`http://127.0.0.1:4176${path}`);
      const state = await browser.evaluate(`new Promise(resolve => setTimeout(async () => { const visibleImages = [...document.images].filter(i=>{const r=i.getBoundingClientRect();return r.width>0&&r.height>0&&r.top<innerHeight&&r.bottom>0}); await Promise.race([Promise.all(visibleImages.map(i => i.decode().catch(() => {}))),new Promise(r=>setTimeout(r,5000))]); document.getAnimations().forEach(a => { try { a.finish(); } catch { a.cancel(); } }); resolve({title:document.title, width:innerWidth, height:innerHeight, brokenImages:visibleImages.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.alt), heading:document.querySelector('h1')?.textContent, overflow:document.documentElement.scrollWidth>innerWidth}); },700))`);
      if (state.brokenImages.length || state.overflow) throw new Error(`Screenshot state invalid: ${name}: ${JSON.stringify(state)}`);
      const screenshot = await browser.call("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
      const target = join(root, "assets", `${name}.png`);
      await writeFile(target, Buffer.from(screenshot.data, "base64"));
      inventory.push({ name, publicRoute: path, viewport: { width: w, height: h, dpr: 2 }, captured: "2026-10-14", ...state });
      console.log(`Captured ${name}: ${target}`);
    }
    await writeFile(join(root, "assets/sources.json"), JSON.stringify(inventory, null, 2) + "\n");
  } finally { await browser.close(); }
}
async function mux(input, audio, target) {
  const child = spawn(ffmpeg, ["-y", "-hide_banner", "-loglevel", "warning", "-i", input, "-i", audio, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", String(spec.duration), "-movflags", "+faststart", target], { stdio: ["ignore", "ignore", "inherit"] });
  const [code] = await once(child, "exit"); if (code !== 0) throw new Error(`FFmpeg mux failed: ${code}`);
}
if (command === "capture") await capture();
else {
  await mkdir(join(root, "qa"), { recursive: true });
  const { server, url } = await serve();
  const browser = await startBrowser();
  try {
    await browser.navigate(url);
    if (!await browser.evaluate("new Promise(resolve => { let tries=0; const timer=setInterval(() => { if(window.filmReady || ++tries>150) { clearInterval(timer); resolve(Boolean(window.filmReady)); } },100); })")) throw new Error("Film did not initialize");
    const dimensions = await browser.evaluate("window.getFilmAssets()");
    console.log("Loaded assets:", JSON.stringify(dimensions));
    if (command === "serve") {
      console.log(`Editable canvas preview: ${url.replace("?render=1", "")}`);
      await new Promise(resolve => process.once("SIGINT", resolve));
    } else if (command === "stills") {
      const frames = process.argv.slice(3).map(Number);
      const selected = frames.length ? frames : [120, 300, 540, 780, 930, 1110, 1350, 1590, 1830];
      const review = [];
      for (const n of selected) {
        const state = await browser.evaluate(`window.renderFrame(${n})`);
        const target = join(root, "qa", `f${String(n).padStart(4, "0")}.png`);
        await writeFile(target, await frame(browser, n));
        review.push(state); console.log(`${target}: overflow=${state.overflow.length}`);
      }
      await writeFile(join(root, "qa/still-checks.json"), JSON.stringify({ dimensions, frames: review }, null, 2) + "\n");
      if (review.some(state => state.overflow.length)) process.exitCode = 1;
    } else if (command === "render") {
      if (dimensions.loaded.length !== 5) throw new Error("Capture all four real website screenshots before rendering");
      const intermediate = join(root, "qa/visual-master.mp4");
      const encoder = spawn(ffmpeg, ["-y", "-hide_banner", "-loglevel", "warning", "-f", "image2pipe", "-vcodec", "mjpeg", "-framerate", String(spec.fps), "-i", "pipe:0", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", intermediate], { stdio: ["pipe", "ignore", "inherit"] });
      let encoderFailure;
      encoder.stdin.on("error", error => { encoderFailure = error; });
      const encoderDone = once(encoder, "exit");
      const total = spec.duration * spec.fps;
      for (let n = 0; n < total; n++) {
        if (encoderFailure) throw encoderFailure;
        const buffer = await frame(browser, n, "image/jpeg");
        if (!encoder.stdin.write(buffer)) await once(encoder.stdin, "drain");
        if (n % 150 === 0) console.log(`Rendering ${n}/${total} (${Math.round(n / total * 100)}%)`);
      }
      encoder.stdin.end();
      const [code] = await encoderDone;
      if (code !== 0) throw new Error(`FFmpeg visual render failed: ${code}`);
      await mux(intermediate, join(root, "assets/mix.wav"), output);
      await mux(intermediate, join(root, "assets/sfx.wav"), join(root, `${prefix}-nobgm.mp4`));
      const poster = spawn(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", "-ss", "61", "-i", output, "-frames:v", "1", "-c:v", "libwebp", "-quality", "94", join(project, `src/assets/media/${prefix}-poster.webp`)], { stdio: ["ignore", "ignore", "inherit"] });
      const [posterCode] = await once(poster, "exit"); if (posterCode) throw new Error("Poster generation failed");
      console.log(`Finished: ${output}`);
    } else throw new Error(`Unknown command: ${command}`);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
