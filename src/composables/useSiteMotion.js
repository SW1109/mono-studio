import { onMounted, onScopeDispose, ref } from "vue";

// 内容默认可见；动画只做渐进增强，不让预渲染或脚本失败留下空白页面。
export function useSiteMotion(root) {
  const motionMode = ref("idle");
  let dispose = () => {};

  onMounted(() => {
    const container = root.value;
    if (!container) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const revealed = new WeakSet();
    const pendingReveals = new Set();
    const scenes = new Set();
    const animations = new Map();
    let revealObserver;
    let sceneObserver;

    const reveal = element => {
      if (revealed.has(element)) return;
      revealed.add(element);
      pendingReveals.delete(element);
      revealObserver?.unobserve(element);
      if (preference.matches || !element.animate) return;

      const delay = Math.min(180, Math.max(0, Number(element.dataset.revealDelay) || 0));
      const animation = element.animate([
        { opacity: 0, transform: "translate3d(0, 16px, 0)" },
        { opacity: 1, transform: "translate3d(0, 0, 0)" },
      ], { duration: 520, delay, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "backwards" });
      animations.set(animation, element);
      if (document.hidden) animation.pause();
      animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
    };

    const syncMotion = () => {
      motionMode.value = preference.matches ? "reduced" : document.hidden ? "paused" : "running";
      for (const animation of animations.keys()) {
        if (preference.matches) animation.finish();
        else if (document.hidden) animation.pause();
        else animation.play();
      }
    };

    if ("IntersectionObserver" in window) {
      revealObserver = new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting) reveal(entry.target);
      }, { threshold: 0.08 });
      sceneObserver = new IntersectionObserver(entries => {
        for (const entry of entries) entry.target.dataset.sceneActive = String(entry.isIntersecting);
      });
    }

    const register = subtree => {
      for (const element of [subtree, ...subtree.querySelectorAll("[data-reveal], [data-motion-scene]")]) {
        if (element.matches("[data-reveal]") && !revealed.has(element) && !pendingReveals.has(element)) {
          if (revealObserver) {
            pendingReveals.add(element);
            revealObserver.observe(element);
          } else revealed.add(element);
        }
        if (element.matches("[data-motion-scene]") && !scenes.has(element)) {
          scenes.add(element);
          element.dataset.sceneActive = "false";
          sceneObserver?.observe(element);
        }
      }
    };

    // 只注册新增节点，兼容路由切换和产品筛选，不在滚动时反复扫描或测量布局。
    const mutations = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) if (node.nodeType === 1) register(node);
      }
      for (const element of pendingReveals) {
        if (container.contains(element)) continue;
        revealObserver?.unobserve(element);
        pendingReveals.delete(element);
      }
      for (const scene of scenes) {
        if (container.contains(scene)) continue;
        sceneObserver?.unobserve(scene);
        scenes.delete(scene);
      }
      for (const [animation, element] of animations) {
        if (!container.contains(element)) animation.cancel();
      }
    });

    const showFocusedContent = event => {
      for (const [animation, element] of animations) {
        if (element.contains(event.target)) animation.finish();
      }
    };

    syncMotion();
    register(container);
    mutations.observe(container, { childList: true, subtree: true });
    preference.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncMotion);
    container.addEventListener("focusin", showFocusedContent);

    dispose = () => {
      mutations.disconnect();
      revealObserver?.disconnect();
      sceneObserver?.disconnect();
      preference.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", syncMotion);
      container.removeEventListener("focusin", showFocusedContent);
      for (const animation of animations.keys()) animation.cancel();
      animations.clear();
      pendingReveals.clear();
      scenes.clear();
    };
  });

  onScopeDispose(() => dispose());
  return { motionMode };
}