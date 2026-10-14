import { createEarthRenderer } from "/earth.js";
const spec = await (await fetch("/spec.json")).json();
const canvas = document.querySelector("#stage");
const ctx = canvas.getContext("2d", { alpha: false });
const { width: W, height: H, fps, shots } = spec;
const C = spec.palette;
const font = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
const images = {};
const bounds = [];
const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const ease = n => 1 - Math.pow(1 - clamp(n), 4);
const smooth = n => { const p = clamp(n); return p * p * (3 - 2 * p); };
const reveal = (t, delay = 0, duration = 1.2) => ease((t - delay) / duration);
const imageFiles = { brand: "/brand-logo.jpg", home: "/assets/home-desktop.png", mobile: "/assets/home-mobile.png", services: "/assets/services-desktop.png", servicesMobile: "/assets/services-mobile.png" };
await Promise.all(Object.entries(imageFiles).map(async ([key, src]) => {
  const image = new Image(); image.src = src;
  try { await image.decode(); images[key] = image; } catch { /* styleframe 阶段尚未采集的实景图不影响无截图镜头。 */ }
}));
await document.fonts.ready;
const earth = await createEarthRenderer();
window.earthInfo = earth.dimensions;

function group(opacity, fn) { ctx.save(); ctx.globalAlpha *= clamp(opacity); fn(); ctx.restore(); }
function rect(x, y, w, h, r = 0, color = "white", stroke = "") {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (color) { ctx.fillStyle = color; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}
function line(points, color, width = 2) {
  ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.stroke();
}
function text(value, x, y, size = 42, color = C.ink, weight = 500, align = "left") {
  ctx.font = `${weight} ${size}px ${font}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "alphabetic";
  ctx.fillText(value, x, y);
  const metrics = ctx.measureText(value);
  const matrix = ctx.getTransform();
  const startX = x - (align === "center" ? metrics.width / 2 : align === "right" ? metrics.width : 0);
  const corners = [new DOMPoint(startX, y - (metrics.actualBoundingBoxAscent || size)), new DOMPoint(startX + metrics.width, y + metrics.actualBoundingBoxDescent)].map(point => point.matrixTransform(matrix));
  if (ctx.globalAlpha > 0.8) bounds.push({ value, size, x: corners[0].x, y: corners[0].y, right: corners[1].x, bottom: corners[1].y });
}
function animatedText(value, x, y, size, t, delay = 0, color = C.ink, weight = 600, align = "left") {
  const p = reveal(t, delay); group(p, () => text(value, x, y + (1 - p) * 36, size, color, weight, align));
}
function background(dark = false, glowX = 1380) {
  ctx.fillStyle = dark ? C.night : C.paper; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(glowX, dark ? 420 : 470, 30, glowX, 500, 950);
  glow.addColorStop(0, dark ? "rgba(29,77,112,0.32)" : "rgba(232,242,252,0.86)");
  glow.addColorStop(1, dark ? "rgba(16,27,42,0)" : "rgba(245,245,247,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
}
function chrome(shot, index, dark = false) {
  const ink = dark ? "#d5dce5" : "#6a6a70";
  text("光年数智", 120, 94, 34, dark ? "#ffffff" : C.ink, 600);
  text(`${String(index + 1).padStart(2, "0")} / ${shot.chapter}`, 1800, 94, 32, ink, 400, "right");
  line([[120, 998], [1800, 998]], dark ? "#ffffff20" : "#1d1d1f14", 1);
}
function bottomCaption(value, t, delay = 1.5, dark = false) {
  animatedText(value, 120, 945, 40, t, delay, dark ? "#cdd7e4" : "#56565c", 400);
}

// 真实 NASA 地表与云层使用 WebGL 球面投影；轨道只作低密度技术意象。
function globe(t, x, y, radius, opacity = 1) {
  group(opacity, () => {
    ctx.save();
    ctx.save(); ctx.translate(x, y + radius + 26); ctx.scale(1, .16);
    const shadow = ctx.createRadialGradient(0, 0, 10, 0, 0, radius * .9);
    shadow.addColorStop(0, "#233a5f22"); shadow.addColorStop(1, "#233a5f00");
    ctx.fillStyle = shadow; ctx.fillRect(-radius, -radius, radius * 2, radius * 2); ctx.restore();
    // 科技感来自轨道与光照，不在地表铺满经纬线，避免退回线框球。
    ctx.save(); ctx.translate(x, y); ctx.rotate(-.33);
    ctx.beginPath(); ctx.ellipse(0, 0, radius * 1.19, radius * .72, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "#0066cc28"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    earth.draw(ctx, t, x, y, radius);
    const a = -.7 + t * .022;
    const nx = x + Math.cos(a) * radius * 1.17, ny = y + Math.sin(a) * radius * .79;
    ctx.beginPath(); ctx.arc(nx, ny, 4.5, 0, Math.PI * 2); ctx.fillStyle = "#3688ce"; ctx.fill();
    ctx.beginPath(); ctx.arc(nx, ny, 10, 0, Math.PI * 2); ctx.strokeStyle = "#0066cc45"; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  });
}
function icon(type, x, y, size = 62, color = C.accent) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 64, size / 64); ctx.strokeStyle = color; ctx.lineWidth = 2.8; ctx.lineJoin = "round"; ctx.lineCap = "round";
  ctx.beginPath();
  if (type === "web") { ctx.roundRect(5, 10, 54, 43, 7); ctx.moveTo(5, 23); ctx.lineTo(59, 23); ctx.moveTo(14, 17); ctx.lineTo(17, 17); ctx.moveTo(24, 17); ctx.lineTo(27, 17); }
  if (type === "mobile") { ctx.roundRect(17, 3, 30, 58, 7); ctx.moveTo(27, 10); ctx.lineTo(37, 10); ctx.moveTo(29, 53); ctx.lineTo(35, 53); }
  if (type === "desktop") { ctx.roundRect(4, 7, 56, 39, 5); ctx.moveTo(32, 46); ctx.lineTo(32, 56); ctx.moveTo(18, 57); ctx.lineTo(46, 57); }
  if (type === "automation") { ctx.roundRect(4, 23, 15, 18, 3); ctx.roundRect(45, 23, 15, 18, 3); ctx.roundRect(24, 1, 16, 16, 3); ctx.roundRect(24, 47, 16, 16, 3); ctx.moveTo(19, 32); ctx.lineTo(45, 32); ctx.moveTo(32, 17); ctx.lineTo(32, 47); }
  ctx.stroke(); ctx.restore();
}
function drawContained(image, x, y, w, h) {
  if (!image) return;
  const scale = Math.min(w / image.naturalWidth, h / image.naturalHeight);
  const dw = image.naturalWidth * scale, dh = image.naturalHeight * scale;
  ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}
function browserWindow(image, x, y, w, scale = 1, nextImage, mix = 0) {
  const ratio = 840 / 1440;
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  const height = w * ratio + 48;
  ctx.shadowColor = "#253a4f25"; ctx.shadowBlur = 60; ctx.shadowOffsetY = 30;
  rect(0, 0, w, height, 22, "#ffffff"); ctx.shadowColor = "transparent";
  ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, w, height, 22); ctx.clip();
  rect(0, 0, w, 48, 0, "#e9e9ed");
  ["#d8a8a5", "#dfcca5", "#a4bea7"].forEach((color, i) => { ctx.beginPath(); ctx.arc(26 + i * 23, 24, 5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); });
  if (image) ctx.drawImage(image, 0, 48, w, w * ratio);
  if (nextImage && mix > 0) group(mix, () => ctx.drawImage(nextImage, 0, 48, w, w * ratio));
  ctx.restore(); ctx.restore();
}
function phone(image, x, y, screenW = 245, scale = 1, nextImage, mix = 0) {
  // 390×844 实际移动端视口等比缩放；外壳留边，不改变屏幕长宽比。
  const inset = 11, screenH = screenW * 844 / 390, outerW = screenW + inset * 2, outerH = screenH + inset * 2;
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.shadowColor = "#17253f38"; ctx.shadowBlur = 45; ctx.shadowOffsetY = 25;
  rect(0, 0, outerW, outerH, 39, "#2a2c32"); ctx.shadowColor = "transparent";
  rect(4, 4, outerW - 8, outerH - 8, 35, "#73757c");
  ctx.save(); ctx.beginPath(); ctx.roundRect(inset, inset, screenW, screenH, 29); ctx.clip();
  ctx.fillStyle = "white"; ctx.fillRect(inset, inset, screenW, screenH);
  if (image) ctx.drawImage(image, inset, inset, screenW, screenH);
  if (nextImage && mix > 0) group(mix, () => ctx.drawImage(nextImage, inset, inset, screenW, screenH));
  ctx.restore();
  line([[outerW / 2 - 24, outerH - 17], [outerW / 2 + 24, outerH - 17]], "#202027", 4);
  ctx.restore();
}

const scenes = {
  context(t, shot) {
    background();
    const p = reveal(t, .25, 3.1);
    globe(t, 1390, 516 - (1 - p) * 32, 354 * (.9 + p * .1), p);
    animatedText(shot.title[0], 120, 390, 94, t, .4);
    animatedText(shot.title[1], 120, 516, 94, t, .72, C.accent);
    animatedText("连接服务、流程与数据。", 125, 632, 42, t, 1.35, "#65656b", 400);
    bottomCaption(shot.caption, t, 1.8);
    animatedText("地球影像：NASA Earth Observatory", 1150, 945, 32, t, 1.8, "#65656b", 400);
  },
  industry(t, shot) {
    background(false, 900);
    animatedText(shot.title[0], 120, 221, 48, t, .2);
    animatedText("软件业务收入", 124, 331, 42, t, .45, "#65656b", 400);
    const p = reveal(t, .55, 1.6);
    group(p, () => {
      text((15.48 * p).toFixed(2), 104, 625 + (1 - p) * 35, 250, C.accent, 600);
      text("万亿元", 800, 613, 62, C.accent, 500);
    });
    line([[1080, 348], [1080, 666]], "#c9d1d9", 1.5);
    animatedText("同比增长", 1200, 395, 42, t, .85, "#65656b", 400);
    group(reveal(t, 1.05, 1.4), () => text("13.2%", 1190, 613, 145, C.ink, 600));
    animatedText("数据来源：工信部《2025年软件业运行情况》（2026.01.30）", 120, 785, 34, t, 1.15, "#5d5d63", 400);
    animatedText("2025 完整年度行业数据 · 非工作室经营数据", 120, 842, 34, t, 1.35, "#5d5d63", 400);
    bottomCaption(shot.caption, t, 1.7);
  },
  services(t, shot) {
    background();
    animatedText(shot.title[0], 120, 394, 80, t, .25);
    animatedText(shot.title[1], 120, 504, 80, t, .6, C.accent);
    animatedText("软件产品研发 · 定制开发", 124, 618, 40, t, 1.25, "#65656b", 400);
    const items = [["网站与管理系统", "web", "网站 / 业务后台"], ["小程序与 H5", "mobile", "移动服务 / 预约流程"], ["桌面工具软件", "desktop", "办公工具 / 文件处理"], ["自动化与系统集成", "automation", "任务编排 / 接口对接"]];
    items.forEach(([title, type, subtitle], i) => {
      const p = reveal(t, .55 + i * .24, 1.3), x = 940 + (i % 2) * 425, y = 238 + Math.floor(i / 2) * 305;
      group(p, () => {
        ctx.save(); ctx.translate(x + (1 - p) * 45, y + (1 - p) * 35);
        rect(0, 0, 398, 270, 24, "#ffffff", "#e4e7eb"); icon(type, 28, 25, 62);
        text(title, 28, 154, title.length > 8 ? 36 : 38, C.ink, 600);
        text(subtitle, 28, 219, 32, "#65656b", 400); ctx.restore();
      });
    });
    bottomCaption(shot.caption, t, 1.8);
  },
  experience(t, shot) {
    background(false, 1050);
    animatedText(shot.title[0], 120, 211, 84, t, .25);
    const p = reveal(t, .45, 1.8), switcher = smooth((t - 5.4) / .7);
    const x = 156, y = 272 + (1 - p) * 38, w = 1010;
    group(p, () => {
      browserWindow(images.home, x, y, w, 1, images.services, switcher);
      phone(images.mobile, 1410 + (1 - p) * 45, 283 + (1 - p) * 35, 275, 1, images.servicesMobile, switcher);
    });
    bottomCaption(shot.caption, t, 1.7);
  },
  engineering(t, shot) {
    background(true, 1280);
    animatedText(shot.title[0], 120, 373, 91, t, .3, "#ffffff");
    animatedText(shot.title[1], 120, 494, 91, t, .65, "#9bcbef");
    animatedText("Vue 3 · Node.js · 自动化测试", 125, 615, 39, t, 1.3, "#a7b7c9", 400);
    const layers = [["界面与状态", "结构 / 交互"], ["接口与权限", "契约 / 校验"], ["数据与集成", "业务 / 流转"], ["测试与交付", "验证 / 迭代"]];
    layers.forEach(([title, tag], i) => {
      const p = reveal(t, .65 + i * .4, 1.3), x = 1150 + (3 - i) * 26, y = 252 + i * 140;
      group(p, () => {
        ctx.save(); ctx.translate(x + (1 - p) * 80, y + (1 - p) * 18);
        rect(0, 0, 505, 110, 17, "#183047", "#6f98bb70");
        text(`0${i + 1}`, 25, 66, 34, "#8cbee2", 400);
        text(title, 93, 66, 40, "#ffffff", 500);
        text(tag, 483, 68, 32, "#a6bacb", 400, "right"); ctx.restore();
      });
      if (i < 3) group(reveal(t, 1.4 + i * .4), () => line([[x + 56, y + 111], [x + 56, y + 140]], "#6b9dc1", 2));
    });
    animatedText("工程方法示意", 1270, 872, 32, t, 1.6, "#a6bacb", 400);
    bottomCaption(shot.caption, t, 1.9, true);
  },
  delivery(t, shot) {
    background(false, 960);
    animatedText(shot.title[0], 120, 231, 84, t, .25);
    const items = [["需求分析", "范围与验收"], ["方案设计", "架构与交互"], ["开发与验证", "功能与版本"], ["交付与迭代", "部署与维护"]];
    const p = reveal(t, .7, 3);
    line([[242, 441], [1675, 441]], "#cbd6e1", 3);
    line([[242, 441], [242 + 1433 * p, 441]], C.accent, 4);
    items.forEach(([title, detail], i) => {
      const x = 242 + i * 477.67, enter = reveal(t, .55 + i * .6, 1.1);
      group(enter, () => {
        ctx.beginPath(); ctx.arc(x, 441, 24, 0, Math.PI * 2); ctx.fillStyle = "#f5f5f7"; ctx.fill(); ctx.strokeStyle = C.accent; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, 441, 6, 0, Math.PI * 2); ctx.fillStyle = C.accent; ctx.fill();
        text(`0${i + 1}`, x, 367, 56, C.accent, 500, "center");
        text(title, x, 562 + (1 - enter) * 25, 50, C.ink, 600, "center");
        text(detail, x, 631 + (1 - enter) * 25, 36, "#65656b", 400, "center");
      });
    });
    animatedText("以可运行版本核对成果，以约定范围完成交付。", 120, 816, 48, t, 2.5, "#56565c", 400);
    bottomCaption(shot.caption, t, 2.7);
  },
  vision(t, shot) {
    background(false, 1400);
    group(.72 * reveal(t, .2, 2.8), () => {
      const horizonY = 727;
      for (let i = -15; i <= 15; i++) {
        line([[1380 + i * 4.4, horizonY], [1380 + i * 80, 988]], "#0066cc10", 1.2);
      }
      for (let i = 0; i < 8; i++) {
        const yy = horizonY + Math.pow((i + 1) / 8, 2.1) * 253;
        line([[935, yy], [1880, yy]], "#0066cc10", 1);
      }
      const grad = ctx.createRadialGradient(1390, horizonY, 12, 1390, horizonY, 390);
      grad.addColorStop(0, "#ffffff"); grad.addColorStop(1, "#ffffff00"); ctx.fillStyle = grad; ctx.fillRect(900, 485, 970, 490);
    });
    animatedText("长期愿景", 124, 245, 42, t, .25, C.accent, 400);
    animatedText(shot.title[0], 120, 434, 102, t, .65);
    animatedText(shot.title[1], 120, 571, 102, t, 1.05, C.accent);
    animatedText("可复用产品 · 更低使用门槛 · 持续维护能力", 124, 735, 40, t, 1.6, "#56565c", 400);
    bottomCaption(shot.caption, t, 2);
  },
  brand(t, shot) {
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
    const p = reveal(t, .15, 1.1);
    group(p, () => drawContained(images.brand, 688, 197 + (1 - p) * 23, 544, 227));
    animatedText(shot.title[0], 960, 590, 100, t, .45, C.ink, 600, "center");
    animatedText(shot.title[1], 960, 717, 100, t, .75, C.accent, 600, "center");
    animatedText("光年数智网络科技工作室", 960, 818, 38, t, 1, "#56565c", 400, "center");
    animatedText(shot.caption, 960, 939, 42, t, 1.15, C.ink, 500, "center");
  },
};
function sceneAt(shot, t, index) { scenes[shot.id](t, shot); if (shot.id !== "brand") chrome(shot, index, shot.id === "engineering"); }
function renderFrame(frame) {
  bounds.length = 0; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  const time = clamp(frame / fps, 0, spec.duration - 1 / fps);
  const index = shots.findIndex(shot => time >= shot.start && time < shot.start + shot.duration);
  const shot = shots[index], localTime = time - shot.start;
  if (index > 0 && localTime < .43) {
    sceneAt(shots[index - 1], shots[index - 1].duration - 1 / fps, index - 1);
    group(smooth(localTime / .43), () => sceneAt(shot, localTime, index));
  } else sceneAt(shot, localTime, index);
  return { frame, time, shot: shot.id, bounds: bounds.filter(b => b.size >= 32), overflow: bounds.filter(b => b.x < 30 || b.y < 20 || b.right > W - 30 || b.bottom > H - 20) };
}
window.renderFrame = renderFrame;
window.encodeFrame = (frame, format = "image/jpeg") => { renderFrame(frame); return canvas.toDataURL(format, .95).split(",")[1]; };
window.getFilmAssets = () => ({ earth: earth.dimensions, loaded: Object.keys(images), dimensions: Object.fromEntries(Object.entries(images).map(([key, image]) => [key, { width: image.naturalWidth, height: image.naturalHeight }])) });
window.filmReady = true;
renderFrame(120);
if (new URLSearchParams(location.search).has("render")) document.querySelector("#transport").style.display = "none";
let playing = false, origin = 0, currentFrame = 0;
document.querySelector("#scrub").addEventListener("input", event => { currentFrame = Number(event.target.value); playing = false; renderFrame(currentFrame); document.querySelector("#time").textContent = `${(currentFrame / fps).toFixed(1)} / ${spec.duration}s`; });
document.querySelector("#play").addEventListener("click", () => { playing = !playing; origin = performance.now() - currentFrame / fps * 1000; });
function tick(now) {
  if (playing) { currentFrame = Math.floor((now - origin) / 1000 * fps) % (spec.duration * fps); renderFrame(currentFrame); document.querySelector("#scrub").value = currentFrame; document.querySelector("#time").textContent = `${(currentFrame / fps).toFixed(1)} / ${spec.duration}s`; }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
