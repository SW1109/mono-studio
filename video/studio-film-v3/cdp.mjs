import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// 只操作本次启动的隔离 Chromium，不接入用户现有浏览器或读取用户会话。
export async function startBrowser({ width = 1920, height = 1080, extraArgs = [] } = {}) {
  const profile = await mkdtemp(join(tmpdir(), "guangnian-film-v3-"));
  const child = spawn(process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
    "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--disable-background-timer-throttling",
    `--window-size=${width},${height}`, ...extraArgs, "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });
  let socket;
  try {
    const endpoint = await new Promise((resolve, reject) => {
      let stderr = "";
      const timer = setTimeout(() => reject(new Error("Chromium startup timeout")), 20000);
      child.once("error", error => { clearTimeout(timer); reject(error); });
      child.stderr.on("data", data => {
        stderr += data.toString();
        const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
        if (match) { clearTimeout(timer); resolve(match[1]); }
      });
    });
    socket = new WebSocket(endpoint);
    await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
    let id = 0;
    const pending = new Map();
    const events = [];
    socket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) {
        const request = pending.get(message.id);
        if (!request) return;
        pending.delete(message.id); clearTimeout(request.timer);
        message.error ? request.reject(new Error(JSON.stringify(message.error))) : request.resolve(message.result);
      } else events.push(message);
    });
    const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
      const requestId = ++id;
      const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`CDP timeout: ${method}`)); }, 30000);
      pending.set(requestId, { resolve, reject, timer });
      socket.send(JSON.stringify({ id: requestId, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    const call = (method, params) => send(method, params, sessionId);
    await call("Page.enable"); await call("Runtime.enable");
    const evaluate = async expression => {
      const result = await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text + ": " + result.exceptionDetails.exception?.description);
      return result.result.value;
    };
    const viewport = (w, h, dpr = 1) => call("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
    const navigate = async url => {
      events.length = 0;
      const loaded = new Promise((resolve, reject) => {
        const timer = setTimeout(() => { clearInterval(poll); reject(new Error(`Page load timeout: ${url}`)); }, 20000);
        const poll = setInterval(() => {
          if (events.some(event => event.method === "Page.loadEventFired" && event.sessionId === sessionId)) { clearTimeout(timer); clearInterval(poll); resolve(); }
        }, 20);
      });
      await call("Page.navigate", { url }); await loaded;
      await evaluate("document.fonts.ready.then(() => true)");
    };
    await viewport(width, height);
    return { call, evaluate, viewport, navigate, events,
      close: async () => {
        for (const request of pending.values()) { clearTimeout(request.timer); request.reject(new Error("Browser closed")); }
        socket.close(); child.kill("SIGTERM");
        await new Promise(resolve => { if (child.exitCode !== null) resolve(); else { child.once("exit", resolve); setTimeout(resolve, 3000).unref(); } });
        await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 150 });
      },
    };
  } catch (error) { socket?.close(); child.kill("SIGTERM"); await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 150 }); throw error; }
}
