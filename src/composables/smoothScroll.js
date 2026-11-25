// 全站共用一个 Lenis 实例：首页与内页滚动手感一致，首页再在其上挂 GSAP ScrollTrigger。
// 仅在浏览器中按需加载；减少动态效果时不启用，页面保持原生滚动。
let lenis = null;
let pending = null;
const listeners = new Set();

export function startSmoothScroll() {
  if (import.meta.env.SSR || typeof window === "undefined") return Promise.resolve(null);
  if (lenis) return Promise.resolve(lenis);
  if (pending) return pending;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve(null);
  pending = import("lenis")
    .then(({ default: Lenis }) => {
      lenis = new Lenis({
        autoRaf: true,
        duration: 1.15,
        smoothWheel: true,
        allowNestedScroll: true,
        stopInertiaOnNavigate: true,
        // 弹窗、三维演示与显式标记的区域保留原生滚轮（如 Cesium 缩放、导航菜单）。
        prevent: node => Boolean(node?.closest?.("dialog, .cesium-widget, .cesium-viewer, [data-lenis-prevent]")),
      });
      lenis.on("scroll", event => { for (const listener of listeners) listener(event); });
      return lenis;
    })
    .catch(() => null);
  return pending;
}

export const getLenis = () => lenis;

export function onSmoothScroll(listener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

// 路由切换前停下惯性，避免上一页的平滑滚动覆盖新页面的滚动位置。
export function settleSmoothScroll() {
  lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
}
