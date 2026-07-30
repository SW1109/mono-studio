/* 页面级渐进增强交互。仅在 Vue 完成挂载后调用。 */
export function initSiteInteractions() {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = matchMedia("(hover: none)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- 无缝滚动轨道：实测循环距离并补足视口 ---------- */
  const loopTracks = $$(".marquee-track, .voice-track, .mega-track");
  const setupLoopTracks = () => {
    if (reduced) return;
    loopTracks.forEach((track) => {
      $$(".loop-fill", track).forEach((clone) => clone.remove());
      const children = [...track.children];
      const unitCount = +(track.dataset.loopUnit || Math.floor(children.length / 2));
      if (!track.dataset.loopUnit) track.dataset.loopUnit = unitCount;
      if (!unitCount || children.length <= unitCount) return;

      const distance = children[unitCount].offsetLeft - children[0].offsetLeft;
      if (distance <= 0) return;
      track.style.setProperty("--loop-distance", `${-distance}px`);

      const originals = children.slice(0, unitCount);
      const viewportWidth = track.parentElement.clientWidth;
      while (track.scrollWidth - distance < viewportWidth + 2) {
        originals.forEach((item) => {
          const clone = item.cloneNode(true);
          clone.classList.add("loop-fill");
          clone.setAttribute("aria-hidden", "true");
          track.appendChild(clone);
        });
      }
    });
  };
  setupLoopTracks();
  let loopResizeRaf = 0;
  addEventListener("resize", () => {
    cancelAnimationFrame(loopResizeRaf);
    loopResizeRaf = requestAnimationFrame(setupLoopTracks);
  }, { passive: true });

  /* ---------- 导航滚动玻璃化 ---------- */
  const nav = $("#nav");
  const onNavScroll = () => nav.classList.toggle("scrolled", scrollY > 24);
  addEventListener("scroll", onNavScroll, { passive: true });
  onNavScroll();

  /* ---------- 当前区块导航状态 ---------- */
  const navAnchors = $$(".nav-links a[href^='#']");
  const navTargets = navAnchors
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);
  if (navTargets.length) {
    const navIO = new IntersectionObserver((entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top))[0];
      if (!current) return;
      navAnchors.forEach((a) => {
        const active = a.getAttribute("href") === `#${current.target.id}`;
        a.classList.toggle("active", active);
        if (active) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      });
    }, { rootMargin: "-28% 0px -62% 0px", threshold: 0 });
    navTargets.forEach((section) => navIO.observe(section));
  }

  /* ---------- 移动端抽屉 ---------- */
  const burger = $("#navBurger");
  const drawer = $("#drawer");
  const setDrawer = (open) => {
    burger.classList.toggle("open", open);
    drawer.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
    drawer.setAttribute("aria-hidden", !open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => setDrawer(!drawer.classList.contains("open")));
  $$(".drawer a").forEach((a) => a.addEventListener("click", () => setDrawer(false)));

  /* ---------- IntersectionObserver：reveal / 标题逐行 ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in-view");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
  );
  $$(".reveal, .h2, .hero-title, .contact-title, .device").forEach((el) => io.observe(el));

  /* ---------- 数字滚动 count-up ---------- */
  const fmt = new Intl.NumberFormat("zh-CN");
  const countIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        countIO.unobserve(e.target);
        const el = e.target;
        const target = +el.dataset.count;
        const suffix = el.dataset.suffix || "";
        if (reduced) { el.textContent = fmt.format(target) + suffix; continue; }
        const t0 = performance.now();
        const dur = 1600;
        const tick = (t) => {
          const p = Math.min((t - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 4); // easeOutQuart
          el.textContent = fmt.format(Math.round(target * eased)) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    },
    { threshold: 0.6 }
  );
  $$(".num[data-count]").forEach((el) => countIO.observe(el));

  /* ---------- Hero 极光背景（Canvas） ---------- */
  const canvas = $("#aurora");
  if (canvas && !reduced) {
    const ctx = canvas.getContext("2d");
    const blobs = [
      { x: 0.3, y: 0.35, r: 0.45, hue: 18,  sat: 90, spX: 0.00016, spY: 0.00011, ph: 0 },
      { x: 0.7, y: 0.55, r: 0.40, hue: 258, sat: 40, spX: 0.00013, spY: 0.00017, ph: 2 },
      { x: 0.5, y: 0.8,  r: 0.38, hue: 200, sat: 45, spX: 0.00010, spY: 0.00014, ph: 4 },
    ];
    let w, h, raf, visible = true;
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener("resize", resize, { passive: true });

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const b of blobs) {
        const bx = (b.x + Math.sin(t * b.spX + b.ph) * 0.12) * w;
        const by = (b.y + Math.cos(t * b.spY + b.ph) * 0.10) * h;
        const br = b.r * Math.min(w, h) * (1 + Math.sin(t * 0.0002 + b.ph) * 0.08);
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        g.addColorStop(0, `hsla(${b.hue}, ${b.sat}%, 50%, 0.10)`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(bx - br, by - br, br * 2, br * 2);
      }
      ctx.globalCompositeOperation = "source-over";
      if (visible) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) raf = requestAnimationFrame(draw);
      else cancelAnimationFrame(raf);
    }).observe(canvas);
  }

  /* ---------- Hero 打字机：轮播替换词 ---------- */
  const typeWord = $("#typeWord");
  if (typeWord && !reduced) {
    const words = ["产品", "工具", "利器", "应用", "现实"];
    let idx = 0;
    const caret = typeWord.nextElementSibling; // .caret
    const typeIn = (word) => {
      typeWord.textContent = "";
      let i = 0;
      const interval = setInterval(() => {
        typeWord.textContent = word.slice(0, ++i);
        if (i >= word.length) clearInterval(interval);
      }, 80);
    };
    const eraseOut = (cb) => {
      const word = typeWord.textContent;
      let i = word.length;
      const interval = setInterval(() => {
        typeWord.textContent = word.slice(0, --i);
        if (i <= 0) { clearInterval(interval); cb(); }
      }, 50);
    };
    const cycle = () => {
      idx = (idx + 1) % words.length;
      eraseOut(() => {
        setTimeout(() => typeIn(words[idx]), 200);
      });
    };
    setInterval(cycle, 2800);
  }

  /* ---------- Hero 聚光 + 浮动卡片鼠标视差 ---------- */
  const heroScene = $(".hero");
  if (heroScene && !isTouch && !reduced) {
    const floats = $$(".hfloat", heroScene);
    let mx = 0, my = 0, cx = 0, cy = 0;
    let visible = true, raf = 0;

    const updateFloats = () => {
      cx += (mx - cx) * 0.055;
      cy += (my - cy) * 0.055;
      floats.forEach((f) => {
        const d = +(f.dataset.depth || 20);
        f.style.transform = `translate3d(${cx * d * 0.52}px, ${cy * d * 0.38}px, 0)`;
      });
      if (visible) raf = requestAnimationFrame(updateFloats);
    };

    heroScene.addEventListener("pointermove", (e) => {
      const r = heroScene.getBoundingClientRect();
      const px = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
      const py = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1);
      mx = (px - 0.5) * 2;
      my = (py - 0.5) * 2;
      heroScene.style.setProperty("--hero-x", `${px * 100}%`);
      heroScene.style.setProperty("--hero-y", `${py * 100}%`);
    }, { passive: true });
    heroScene.addEventListener("pointerleave", () => {
      mx = my = 0;
      heroScene.style.setProperty("--hero-x", "72%");
      heroScene.style.setProperty("--hero-y", "42%");
    });
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(updateFloats);
    }).observe(heroScene);
    raf = requestAnimationFrame(updateFloats);
  }

  /* ---------- 主打产品：滚动驱动的钉住缩放 ---------- */
  const pinWrap = $("#pinWrap");
  const device = $("#device");
  const pinCopy = $("#pinCopy");
  const pinDesktop = matchMedia("(min-width: 769px)");
  if (pinWrap && !reduced) {
    let ticking = false;
    const updatePin = () => {
      ticking = false;
      if (!pinDesktop.matches) {
        device.style.transform = pinCopy.style.transform = "";
        device.style.opacity = pinCopy.style.opacity = "";
        return;
      }
      const rect = pinWrap.getBoundingClientRect();
      const total = rect.height - innerHeight;
      const p = Math.min(Math.max(-rect.top / total, 0), 1);

      // 设备：从右侧稍微偏移 + 缩放入场
      const s = 0.88 + 0.12 * Math.min(p / 0.55, 1);
      const dx = (1 - Math.min(p / 0.55, 1)) * 40;
      device.style.transform = `scale(${s}) translateX(${dx}px)`;
      device.style.opacity = Math.min(p / 0.18 + 0.2, 1);

      // 文案：从左侧浮入
      const cp = Math.min(Math.max((p - 0.25) / 0.4, 0), 1);
      const ease = 1 - Math.pow(1 - cp, 3);
      pinCopy.style.opacity = ease;
      pinCopy.style.transform = `translateX(${(1 - ease) * -36}px)`;
    };
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(updatePin); }
    };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
    updatePin();
  }

  /* ---------- 卡片 3D 倾斜 + 光斑跟随（仅指针设备） ---------- */
  if (!isTouch && !reduced) {
    $$(".tilt").forEach((card) => {
      let raf = null;
      card.addEventListener("pointermove", (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = null;
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          card.style.transform =
            `perspective(900px) rotateY(${(px - 0.5) * 6}deg) rotateX(${(0.5 - py) * 6}deg)`;
          card.style.setProperty("--mx", `${px * 100}%`);
          card.style.setProperty("--my", `${py * 100}%`);
        });
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  /* ---------- 理念金句：滚动逐词点亮 ---------- */
  const mani = $("#manifesto-text");
  if (mani) {
    const text = mani.textContent.trim();
    mani.textContent = "";
    const spans = [...text].map((ch) => {
      const s = document.createElement("span");
      s.className = "w";
      s.textContent = ch;
      mani.appendChild(s);
      return s;
    });
    if (reduced) {
      spans.forEach((s) => s.classList.add("lit"));
    } else {
      let ticking = false;
      const updateMani = () => {
        ticking = false;
        const r = mani.getBoundingClientRect();
        const p = Math.min(Math.max((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.5), 0), 1);
        const lit = Math.floor(p * spans.length);
        spans.forEach((s, i) => s.classList.toggle("lit", i < lit));
      };
      addEventListener("scroll", () => {
        if (!ticking) { ticking = true; requestAnimationFrame(updateMani); }
      }, { passive: true });
      updateMani();
    }
  }

  /* ---------- 一键复制 ---------- */
  const toast = $("#toast");
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  };
  $$(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      showToast(`已复制 ${text}`);
    });
  });

  /* ---------- 滚动进度条 ---------- */
  const progress = $("#progress");
  if (progress) {
    let pTick = false;
    const updateProgress = () => {
      pTick = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    };
    addEventListener("scroll", () => {
      if (!pTick) { pTick = true; requestAnimationFrame(updateProgress); }
    }, { passive: true });
    updateProgress();
  }

  /* ---------- 自定义光标（桌面指针设备） ---------- */
  const dot = $("#cursorDot");
  const ring = $("#cursorRing");
  if (dot && !isTouch && !reduced) {
    document.body.classList.add("has-cursor");
    let mx2 = -100, my2 = -100, rx = -100, ry = -100, shown = false;
    addEventListener("pointermove", (e) => {
      mx2 = e.clientX; my2 = e.clientY;
      if (!shown) { shown = true; dot.style.opacity = ring.style.opacity = 1; }
    }, { passive: true });
    addEventListener("pointerdown", () => ring.classList.add("hovering"));
    addEventListener("pointerup", () => {
      if (!document.querySelector(":hover")?.closest?.("a,button,summary,.card")) {
        ring.classList.remove("hovering");
      }
    });
    document.addEventListener("pointerover", (e) => {
      ring.classList.toggle("hovering", !!e.target.closest("a,button,summary,.card,.svc"));
    });
    const loop = () => {
      rx += (mx2 - rx) * 0.16;
      ry += (my2 - ry) * 0.16;
      dot.style.transform = `translate(${mx2}px,${my2}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    document.documentElement.addEventListener("pointerleave", () => {
      dot.style.opacity = ring.style.opacity = 0; shown = false;
    });
  }

  /* ---------- 磁吸按钮 ---------- */
  if (!isTouch && !reduced) {
    $$(".magnetic").forEach((el) => {
      const strength = 22;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - 0.5) * strength;
        const y = ((e.clientY - r.top) / r.height - 0.5) * strength;
        el.style.transform = `translate(${x}px,${y}px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transition = "transform .6s cubic-bezier(.16,1,.3,1)";
        el.style.transform = "";
        setTimeout(() => (el.style.transition = ""), 600);
      });
    });
  }

  /* ---------- 文字乱码解码 ---------- */
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/[]{}#%&*";
  const decodeIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      decodeIO.unobserve(e.target);
      const el = e.target;
      const final = el.dataset.text;
      if (reduced) { el.textContent = final; continue; }
      let frame = 0;
      const total = final.length * 3 + 12;
      const tick = () => {
        frame++;
        const settled = Math.floor((frame / total) * final.length);
        el.textContent = [...final].map((ch, i) => {
          if (ch === " " || i < settled) return ch;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join("");
        if (settled < final.length) requestAnimationFrame(tick);
        else el.textContent = final;
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.5 });
  $$(".decode[data-text]").forEach((el) => decodeIO.observe(el));

  /* ---------- FAQ：同时只展开一个 ---------- */
  const faqItems = $$(".faq-item");
  faqItems.forEach((d) => {
    d.addEventListener("toggle", () => {
      if (d.open) faqItems.forEach((o) => { if (o !== d) o.open = false; });
    });
  });

  /* ============================================================
     工作现场：终端打字动画
     ============================================================ */
  const termBody = $("#termBody");
  if (termBody && !reduced) {
    const LINES = [
      { type: "cmd",  text: "git clone https://github.com/mono/autoclick-pro" },
      { type: "out",  text: "Cloning into 'autoclick-pro'..." },
      { type: "out",  text: "remote: Counting objects: 1,024 done." },
      { type: "out",  text: "Resolving deltas: 100% (832/832), done." },
      { type: "cmd",  text: "cd autoclick-pro && python build.py --release" },
      { type: "out",  text: "✓ Compiling core engine... 0.8s" },
      { type: "out",  text: "✓ Bundling assets... 0.3s" },
      { type: "out",  text: "✓ Code signing... OK" },
      { type: "out",  text: "✓ Packaging installer... done" },
      { type: "good", text: "▶ Build succeeded in 1.1s  →  dist/AutoClickPro_v3.2.exe" },
      { type: "cmd",  text: "python test_runner.py --all" },
      { type: "out",  text: "Running 48 tests..." },
      { type: "good", text: "✓ 48 passed, 0 failed, 0 skipped  (1.4s)" },
      { type: "cmd",  text: "git push origin main && gh release create v3.2" },
      { type: "good", text: "✓ Release v3.2 published → github.com/mono/autoclick-pro/releases" },
    ];
    const PROMPT = "mono@studio:~$ ";
    let lineIdx = 0, charIdx = 0, phase = "typing"; // typing | pause | newline
    let termVisible = false;

    const createLine = (type) => {
      const div = document.createElement("div");
      div.className = `tl tl-${type}`;
      if (type === "cmd") {
        const pr = document.createElement("span");
        pr.className = "tl-prompt";
        pr.textContent = PROMPT;
        div.appendChild(pr);
      }
      const txt = document.createElement("span");
      txt.className = "tl-text";
      div.appendChild(txt);
      termBody.appendChild(div);
      return txt;
    };

    // 初始化第一行
    let currentTxt = createLine(LINES[0].type);

    const tick = () => {
      if (!termVisible || lineIdx >= LINES.length) return;
      const line = LINES[lineIdx];

      if (phase === "typing") {
        if (charIdx < line.text.length) {
          currentTxt.textContent = line.text.slice(0, ++charIdx);
          // 命令行慢，输出行快
          const delay = line.type === "cmd"
            ? (Math.random() > 0.1 ? 28 : 80)
            : 12;
          setTimeout(tick, delay);
        } else {
          phase = "pause";
          setTimeout(tick, line.type === "cmd" ? 300 : 60);
        }
      } else {
        // 换行
        lineIdx++;
        charIdx = 0;
        phase = "typing";
        if (lineIdx < LINES.length) {
          currentTxt = createLine(LINES[lineIdx].type);
          // 滚动到底部
          termBody.scrollTop = termBody.scrollHeight;
          if (lineIdx < 5) {
            setTimeout(tick, 60);
          } else {
            setTimeout(tick, 40);
          }
        } else {
          // 播完后 3s 重置
          setTimeout(() => {
            termBody.innerHTML = "";
            lineIdx = 0; charIdx = 0; phase = "typing";
            currentTxt = createLine(LINES[0].type);
            tick();
          }, 3000);
        }
      }
    };

    // 进入视口时开始
    const termIO = new IntersectionObserver(([e]) => {
      termVisible = e.isIntersecting;
      if (termVisible && lineIdx === 0 && charIdx === 0) tick();
    }, { threshold: 0.3 });
    termIO.observe(termBody);
  } else if (termBody && reduced) {
    // 无动效：直接显示最终结果
    termBody.innerHTML = `
      <div class="tl tl-cmd"><span class="tl-prompt">mono@studio:~$ </span><span class="tl-text">python build.py --release</span></div>
      <div class="tl tl-good"><span class="tl-text">▶ Build succeeded in 1.1s</span></div>
      <div class="tl tl-cmd"><span class="tl-prompt">mono@studio:~$ </span><span class="tl-text">python test_runner.py --all</span></div>
      <div class="tl tl-good"><span class="tl-text">✓ 48 passed, 0 failed</span></div>
    `;
  }

  /* ============================================================
     工作现场：对比滑块（Before/After）
     ============================================================ */
  const compare = $("#compare");
  const cmpAfter = $("#cmpAfter");
  const cmpHandle = $("#cmpHandle");
  if (compare && cmpAfter && cmpHandle) {
    let dragging = false;
    let pct = 50;

    const setPos = (x) => {
      const r = compare.getBoundingClientRect();
      pct = Math.min(Math.max(((x - r.left) / r.width) * 100, 2), 98);
      cmpAfter.style.clipPath = `inset(0 0 0 ${pct}%)`;
      cmpHandle.style.left = `${pct}%`;
      cmpHandle.setAttribute("aria-valuenow", Math.round(pct));
    };

    // 初始位置
    cmpAfter.style.clipPath = `inset(0 0 0 50%)`;
    cmpHandle.style.left = `50%`;

    cmpHandle.addEventListener("pointerdown", (e) => {
      dragging = true;
      cmpHandle.setPointerCapture(e.pointerId);
      compare.classList.add("dragging");
    });
    cmpHandle.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      setPos(e.clientX);
    });
    cmpHandle.addEventListener("pointerup", () => {
      dragging = false;
      compare.classList.remove("dragging");
    });

    // 键盘支持
    cmpHandle.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") setPos(compare.getBoundingClientRect().left + (pct - 5) / 100 * compare.offsetWidth);
      if (e.key === "ArrowRight") setPos(compare.getBoundingClientRect().left + (pct + 5) / 100 * compare.offsetWidth);
    });

    // 触屏支持
    compare.addEventListener("touchmove", (e) => {
      e.preventDefault();
      setPos(e.touches[0].clientX);
    }, { passive: false });
    compare.addEventListener("touchstart", (e) => {
      setPos(e.touches[0].clientX);
    }, { passive: true });

    // 悬浮自动扫描演示（进入视口且非触屏时）
    if (!isTouch && !reduced) {
      let demoRunning = false;
      const cmpIO = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !demoRunning) {
          demoRunning = true;
          let t0 = null;
          const demo = (ts) => {
            if (!t0) t0 = ts;
            const elapsed = ts - t0;
            // 2s 内从 50 → 18，再 2s 回到 50，循环一次
            const phase = (elapsed % 4000) / 4000;
            let target;
            if (phase < 0.5) {
              target = 50 - (phase / 0.5) * 32;
            } else {
              target = 18 + ((phase - 0.5) / 0.5) * 32;
            }
            if (!dragging) {
              pct += (target - pct) * 0.04;
              cmpAfter.style.clipPath = `inset(0 0 0 ${pct}%)`;
              cmpHandle.style.left = `${pct}%`;
            }
            if (elapsed < 8000) requestAnimationFrame(demo);
            else demoRunning = false;
          };
          requestAnimationFrame(demo);
        }
      }, { threshold: 0.5 });
      cmpIO.observe(compare);
    }
  }

  /* ============================================================
     彩蛋：点击 logo 圆点换主题色 + 粒子迸发
     ============================================================ */
  const THEMES = [
    ["#FF5C1A", "rgba(255,92,26,.15)"],
    ["#3DDC84", "rgba(61,220,132,.15)"],
    ["#4D9FFF", "rgba(77,159,255,.15)"],
    ["#FFD60A", "rgba(255,214,10,.15)"],
    ["#FF2D78", "rgba(255,45,120,.15)"],
  ];
  let themeIdx = 0;
  const brandDot = $("#brandDot");
  if (brandDot) {
    brandDot.style.cursor = "pointer";
    brandDot.addEventListener("click", (e) => {
      themeIdx = (themeIdx + 1) % THEMES.length;
      const [c, soft] = THEMES[themeIdx];
      document.documentElement.style.setProperty("--accent", c);
      document.documentElement.style.setProperty("--accent-soft", soft);
      showToast("主题色已切换 ✦");
      if (reduced) return;
      const r = brandDot.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      for (let i = 0; i < 14; i++) {
        const s = document.createElement("span");
        s.className = "spark";
        s.style.background = c;
        s.style.left = cx + "px";
        s.style.top = cy + "px";
        document.body.appendChild(s);
        const ang = (Math.PI * 2 * i) / 14 + Math.random() * 0.5;
        const dist = 40 + Math.random() * 60;
        const anim = s.animate([
          { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
          { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(0)`, opacity: 0 },
        ], { duration: 600 + Math.random() * 300, easing: "cubic-bezier(.16,1,.3,1)" });
        anim.onfinish = () => s.remove();
      }
    });
  }

  /* ============================================================
     3D 粒子场：工作现场区域背景粒子
     ============================================================ */
  const wbCanvas = $("#wbParticles");
  if (wbCanvas && !reduced) {
    const wbCtx = wbCanvas.getContext("2d");
    let wbW, wbH;
    const resize2d = () => {
      wbW = wbCanvas.offsetWidth;
      wbH = wbCanvas.offsetHeight;
      wbCanvas.width = wbW;
      wbCanvas.height = wbH;
    };
    resize2d();
    addEventListener("resize", resize2d, { passive: true });

    const NUM = 60;
    const pts = Array.from({ length: NUM }, () => ({
      x: Math.random() * (wbW || 800),
      y: Math.random() * (wbH || 400),
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: 1 + Math.random() * 1.5,
    }));

    let wbVisible = false;
    new IntersectionObserver(([e]) => { wbVisible = e.isIntersecting; }, { threshold: 0.1 }).observe(wbCanvas);

    const drawParticles = () => {
      requestAnimationFrame(drawParticles);
      if (!wbVisible) return;
      wbCtx.clearRect(0, 0, wbW, wbH);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = wbW; if (p.x > wbW) p.x = 0;
        if (p.y < 0) p.y = wbH; if (p.y > wbH) p.y = 0;
        wbCtx.beginPath();
        wbCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        wbCtx.fillStyle = "rgba(255,92,26,0.4)";
        wbCtx.fill();
      }
      // 连线
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            wbCtx.beginPath();
            wbCtx.moveTo(pts[i].x, pts[i].y);
            wbCtx.lineTo(pts[j].x, pts[j].y);
            wbCtx.strokeStyle = `rgba(255,92,26,${0.18 * (1 - dist / 110)})`;
            wbCtx.lineWidth = 0.8;
            wbCtx.stroke();
          }
        }
      }
    };
    drawParticles();
  }

  return () => {
    document.body.style.overflow = "";
  };
}
