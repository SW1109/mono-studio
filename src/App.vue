<script setup>
import { nextTick, onBeforeUnmount, onMounted } from "vue";
import ThreeHero from "./components/ThreeHero.vue";
import CesiumExperience from "./components/CesiumExperience.vue";
import { initSiteInteractions } from "./composables/useSiteInteractions";
import beianIcon from "./assets/gongan-beian.png";

let disposeInteractions;

onMounted(async () => {
  await nextTick();
  disposeInteractions = initSiteInteractions();
});

onBeforeUnmount(() => disposeInteractions?.());
</script>

<template>

<!-- 噪点层 -->
<div class="grain" aria-hidden="true"></div>

<!-- 滚动进度条 -->
<div class="progress" id="progress" aria-hidden="true"></div>

<!-- 自定义光标（仅桌面） -->
<div class="cursor-dot" id="cursorDot" aria-hidden="true"></div>
<div class="cursor-ring" id="cursorRing" aria-hidden="true"></div>

<!-- ============ 导航 ============ -->
<header class="nav" id="nav">
  <div class="nav-inner">
    <a class="brand" href="#top" aria-label="MONO STUDIO 首页">
      <span class="brand-dot" id="brandDot" title="点我有惊喜"></span>MONO<em>&nbsp;STUDIO</em>
    </a>
    <nav class="nav-links" id="navLinks" aria-label="站内导航">
      <a href="#products">产品</a>
      <a href="#spatial">3D 空间</a>
      <a href="#services">定制开发</a>
      <a href="#about">关于</a>
      <a href="#faq">FAQ</a>
      <a href="#contact">联系</a>
    </nav>
    <a href="#contact" class="btn btn-pill nav-cta">联系定制</a>
    <button class="nav-burger" id="navBurger" aria-label="打开菜单" aria-expanded="false">
      <span></span><span></span>
    </button>
  </div>
</header>

<!-- 移动端抽屉 -->
<div class="drawer" id="drawer" aria-hidden="true">
  <nav class="drawer-links">
    <a href="#products"><i>01</i>产品</a>
    <a href="#spatial"><i>02</i>3D 空间</a>
    <a href="#services"><i>03</i>定制开发</a>
    <a href="#about"><i>04</i>关于</a>
    <a href="#faq"><i>05</i>FAQ</a>
    <a href="#contact"><i>06</i>联系</a>
  </nav>
  <a href="#contact" class="btn btn-solid drawer-cta">聊聊你的项目 →</a>
</div>

<main id="top">

<!-- ============ HERO ============ -->
<section class="hero">
  <canvas id="aurora" aria-hidden="true"></canvas>
  <ThreeHero />

  <!-- 环绕浮动信息卡（随鼠标视差） -->
  <div class="hero-floats" id="heroFloats" aria-hidden="true">
    <div class="hfloat hf-1" data-depth="18">
      <span class="hf-label">今日自动化执行</span>
      <b class="hf-num">12,847<small> 次</small></b>
      <div class="hf-spark"><i style="--h:40%"></i><i style="--h:65%"></i><i style="--h:52%"></i><i style="--h:80%"></i><i style="--h:68%"></i><i style="--h:96%"></i></div>
    </div>
    <div class="hfloat hf-2" data-depth="30">
      <span class="hf-dot-row"><i></i><i></i><i></i></span>
      <code class="hf-code"><span class="c-kw">def</span> <span class="c-fn">build</span>(idea):<br>&nbsp;&nbsp;<span class="c-kw">return</span> <span class="c-str">"product"</span> <span class="c-cm"># 14 天交付</span></code>
    </div>
    <div class="hfloat hf-3" data-depth="24">
      <span class="hf-stars">★★★★★</span>
      <p class="hf-quote">“省了我每天两小时”</p>
      <span class="hf-label">— AutoClick 用户</span>
    </div>
    <div class="hfloat hf-4" data-depth="14">
      <span class="hf-live"></span>
      <span class="hf-release">ViewTurbo <b>v3.2</b> 刚刚发布</span>
    </div>
  </div>

  <div class="hero-inner">
    <p class="eyebrow reveal decode" data-text="Independent Software Studio">Independent Software Studio</p>
    <h1 class="hero-title">
      <span class="line-mask"><span class="line">把想法，</span></span>
      <span class="line-mask"><span class="line">做成<em class="stroke type-wrap"><span id="typeWord">产品</span><i class="caret"></i></em>。</span></span>
    </h1>
    <p class="hero-sub reveal d2">一个人的软件工作室。做自己热爱的工具，<br class="br-m">也为你把需求变成好用的软件。</p>
    <div class="hero-cta reveal d3">
      <a href="#spatial" class="btn btn-solid magnetic">进入 3D 空间</a>
      <a href="#products" class="btn btn-ghost magnetic">看看作品 <span class="arr">→</span></a>
    </div>
    <div class="trust-row reveal d3">
      <span><b>★ 4.9</b>用户评分</span><i></i>
      <span><b>20,000+</b>全球用户</span><i></i>
      <span><b>100%</b>源码交付</span><i></i>
      <span><b>&lt; 2h</b>平均响应</span>
    </div>
  </div>
  <div class="scroll-hint" aria-hidden="true">
    <span class="scroll-hint-label">SCROLL</span>
    <span class="scroll-hint-line"></span>
  </div>
</section>

<CesiumExperience />

<!-- ============ 数据条 ============ -->
<section class="stats">
  <div class="stats-grid">
    <div class="stat reveal"><b class="num" data-count="6">0</b><span>款上线产品</span></div>
    <div class="stat reveal d1"><b class="num" data-count="20000" data-suffix="+">0</b><span>服务用户</span></div>
    <div class="stat reveal d2"><b class="num" data-count="30" data-suffix="+">0</b><span>定制交付项目</span></div>
    <div class="stat reveal d3"><b class="num" data-count="8">0</b><span>年开发经验</span></div>
  </div>
</section>

<!-- ============ 主打产品：钉住缩放 ============ -->
<section class="feature" id="products">
  <div class="section-head">
    <p class="eyebrow reveal">Featured Product</p>
    <h2 class="h2">
      <span class="line-mask"><span class="line">主打作品</span></span>
    </h2>
  </div>

  <div class="pin-wrap" id="pinWrap">
    <div class="pin-stage">

      <!-- 左侧文案（滚动浮现） -->
      <div class="pin-copy" id="pinCopy">
        <p class="eyebrow">ViewTurbo · v3.2</p>
        <h3>浏览器该有的<br><em class="accent">速度极限</em>。</h3>
        <p class="pin-desc">为重度浏览场景而生的效率引擎。更快的加载、更顺滑的滚动——把每一毫秒还给你。</p>
        <ul class="pin-features">
          <li><span class="pf-dot"></span>渲染速度提升 <b>4.2×</b></li>
          <li><span class="pf-dot"></span>内存占用降低 <b>61%</b></li>
          <li><span class="pf-dot"></span>冷启动 <b>&lt; 0.4s</b></li>
          <li><span class="pf-dot"></span>支持 <b>200+</b> 标签页无卡顿</li>
        </ul>
        <div class="pin-actions">
          <a class="btn btn-solid magnetic" href="#contact">免费试用 <span class="arr">→</span></a>
          <a class="btn btn-ghost magnetic" href="#contact">了解更多</a>
        </div>
        <div class="pin-trust">
          <span><b>20,000+</b> 用户在用</span>
          <i></i>
          <span>★ <b>4.9</b> 评分</span>
          <i></i>
          <span>Windows / macOS</span>
        </div>
      </div>

      <!-- 右侧设备模拟 -->
      <figure class="device" id="device">
        <div class="device-glow" aria-hidden="true"></div>

        <!-- 浮动数据标注 -->
        <div class="device-badge db-1" aria-hidden="true">
          <span class="db-icon">⚡</span>
          <div><b>4.2×</b><span>渲染加速</span></div>
        </div>
        <div class="device-badge db-2" aria-hidden="true">
          <span class="db-icon">🧠</span>
          <div><b>−61%</b><span>内存占用</span></div>
        </div>

        <div class="device-screen">
          <div class="ui-bar">
            <i></i><i></i><i></i>
            <em>ViewTurbo</em>
            <span class="ui-tag">v3.2</span>
            <div class="ui-tabs">
              <span class="ui-tab active">仪表盘</span>
              <span class="ui-tab">性能</span>
              <span class="ui-tab">标签页</span>
            </div>
          </div>
          <div class="ui-body">
            <div class="ui-side">
              <span class="ui-chip on" title="仪表盘"></span>
              <span class="ui-chip" title="性能"></span>
              <span class="ui-chip" title="标签页"></span>
              <span class="ui-chip" title="设置"></span>
            </div>
            <div class="ui-main">
              <!-- 顶部指标行 -->
              <div class="ui-metrics">
                <div class="ui-metric">
                  <div class="ui-hero-num" id="uiNum">4.2<small>×</small></div>
                  <div class="ui-hero-label">渲染加速</div>
                </div>
                <div class="ui-metric-divider"></div>
                <div class="ui-metric">
                  <div class="ui-hero-num ui-num-green">−61<small>%</small></div>
                  <div class="ui-hero-label">内存节省</div>
                </div>
                <div class="ui-metric-divider"></div>
                <div class="ui-metric">
                  <div class="ui-hero-num ui-num-blue">0.4<small>s</small></div>
                  <div class="ui-hero-label">冷启动</div>
                </div>
              </div>
              <!-- 图表区 -->
              <div class="ui-chart-wrap">
                <div class="ui-chart-label">加载时间对比（秒）</div>
                <div class="ui-chart">
                  <!-- 7 帧折线数据点，用 CSS clip-path 模拟折线 -->
                  <div class="ui-line ui-line-before"></div>
                  <div class="ui-line ui-line-after"></div>
                  <div class="ui-chart-legend">
                    <span><i class="leg-dot leg-before"></i>优化前</span>
                    <span><i class="leg-dot leg-after"></i>优化后</span>
                  </div>
                </div>
              </div>
              <!-- 柱状图 -->
              <div class="ui-bars" aria-hidden="true">
                <i style="--h:38%"></i><i style="--h:62%"></i><i style="--h:50%"></i>
                <i style="--h:84%"></i><i style="--h:70%"></i><i style="--h:96%"></i>
              </div>
              <!-- 底部状态行 -->
              <div class="ui-status">
                <span class="ui-status-dot"></span>
                <span>引擎运行中</span>
                <span class="ui-status-val">CPU 1.2%</span>
                <span class="ui-status-val">RAM 82MB</span>
              </div>
            </div>
          </div>
        </div>
      </figure>

    </div>
  </div>
</section>

<!-- ============ 产品矩阵 ============ -->
<section class="grid-sec">
  <div class="section-head">
    <p class="eyebrow reveal">All Products</p>
    <h2 class="h2"><span class="line-mask"><span class="line">更多产品</span></span></h2>
  </div>
  <div class="cards">
    <article class="card tilt reveal">
      <div class="card-sheen" aria-hidden="true"></div>
      <span class="card-idx">01</span>
      <h3>AutoClick Pro</h3>
      <p>可视化自动点击与流程编排，桌面重复操作一键自动化。图像识别定位，脚本可导出分享。</p>
      <div class="tags"><span>Windows</span><span>自动化</span></div>
    </article>
    <article class="card tilt reveal d1">
      <div class="card-sheen" aria-hidden="true"></div>
      <span class="card-idx">02</span>
      <h3>ClipStack</h3>
      <p>剪贴板历史与片段管理。文本、图片、代码片段全都记住，全局快捷键秒速取回。</p>
      <div class="tags"><span>效率</span><span>跨平台</span></div>
    </article>
    <article class="card tilt reveal">
      <div class="card-sheen" aria-hidden="true"></div>
      <span class="card-idx">03</span>
      <h3>Watchdog</h3>
      <p>网页与接口变动监控，价格、库存、内容更新即时推送到微信 / 邮箱。</p>
      <div class="tags"><span>监控</span><span>推送</span></div>
    </article>
    <article class="card tilt reveal d1">
      <div class="card-sheen" aria-hidden="true"></div>
      <span class="card-idx">04</span>
      <h3>RenameX</h3>
      <p>批量重命名的终极形态。正则、序号、EXIF、拖拽预览，处理十万文件也不卡。</p>
      <div class="tags"><span>文件</span><span>批处理</span></div>
    </article>
  </div>
</section>

<!-- ============ 技术栈跑马灯 ============ -->
<div class="marquee" aria-hidden="true">
  <div class="marquee-track">
    <span>Python</span><i>·</i><span>C++</span><i>·</i><span>Vue</span><i>·</i><span>Electron</span><i>·</i><span>Node.js</span><i>·</i><span>Rust</span><i>·</i><span>小程序</span><i>·</i><span>自动化</span><i>·</i>
    <span>Python</span><i>·</i><span>C++</span><i>·</i><span>Vue</span><i>·</i><span>Electron</span><i>·</i><span>Node.js</span><i>·</i><span>Rust</span><i>·</i><span>小程序</span><i>·</i><span>自动化</span><i>·</i>
  </div>
</div>

<!-- ============ 工作现场：终端 + 对比滑块 ============ -->
<section class="workbench" id="workbench">
  <canvas class="wb-particles" id="wbParticles" aria-hidden="true"></canvas>

  <div class="section-head">
    <p class="eyebrow reveal">Behind the Scenes</p>
    <h2 class="h2"><span class="line-mask"><span class="line">工作现场</span></span></h2>
    <p class="section-sub reveal d2">代码是怎么变成产品的——两个小演示，眼见为实。</p>
  </div>

  <div class="wb-grid">
    <!-- 终端打字动画 -->
    <div class="terminal reveal" id="terminal">
      <div class="term-bar">
        <i></i><i></i><i></i><em>mono@studio: ~/project</em>
        <span class="term-status"><span class="hf-live"></span>LIVE</span>
      </div>
      <div class="term-body" id="termBody" aria-label="模拟终端演示"></div>
    </div>

    <!-- 优化前后对比滑块 -->
    <div class="compare reveal d1" id="compare" aria-label="优化前后对比，可拖动">
      <!-- Before -->
      <div class="cmp-side cmp-before">
        <span class="cmp-tag">优化前</span>
        <div class="cmp-ui">
          <div class="cmp-bars-demo">
            <div class="cmp-bar-wrap"><span class="cmp-bar-label">首屏渲染</span><div class="cmp-bar slow" style="--w:82%"><span>3.8s</span></div></div>
            <div class="cmp-bar-wrap"><span class="cmp-bar-label">脚本执行</span><div class="cmp-bar slow" style="--w:90%"><span>2.1s</span></div></div>
            <div class="cmp-bar-wrap"><span class="cmp-bar-label">资源加载</span><div class="cmp-bar slow" style="--w:75%"><span>1.9s</span></div></div>
            <div class="cmp-bar-wrap"><span class="cmp-bar-label">内存占用</span><div class="cmp-bar slow" style="--w:68%"><span>380MB</span></div></div>
          </div>
          <div class="cmp-metric"><b>3.8s</b><span>综合耗时</span></div>
        </div>
      </div>
      <!-- After -->
      <div class="cmp-side cmp-after" id="cmpAfter">
        <span class="cmp-tag cmp-tag-hot">优化后</span>
        <div class="cmp-ui">
          <div class="cmp-bars-demo">
            <div class="cmp-bar-wrap"><span class="cmp-bar-label">首屏渲染</span><div class="cmp-bar fast" style="--w:18%"><span>0.4s</span></div></div>
            <div class="cmp-bar-wrap"><span class="cmp-bar-label">脚本执行</span><div class="cmp-bar fast" style="--w:22%"><span>0.5s</span></div></div>
            <div class="cmp-bar-wrap"><span class="cmp-bar-label">资源加载</span><div class="cmp-bar fast" style="--w:15%"><span>0.3s</span></div></div>
            <div class="cmp-bar-wrap"><span class="cmp-bar-label">内存占用</span><div class="cmp-bar fast" style="--w:26%"><span>96MB</span></div></div>
          </div>
          <div class="cmp-metric"><b class="accent">0.4s</b><span>综合耗时</span></div>
        </div>
      </div>
      <!-- 滑块手柄 -->
      <div class="cmp-handle" id="cmpHandle" role="slider" aria-label="拖动对比" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" tabindex="0">
        <div class="cmp-grip-wrap">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M6 10L2 6M6 10L2 14M14 10L18 6M14 10L18 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
      <p class="cmp-hint">← 拖动对比 →</p>
    </div>
  </div>

  <!-- 工具链展示 -->
  <div class="wb-tools reveal">
    <p class="eyebrow" style="margin-bottom:28px">工具链一览</p>
    <div class="wb-tool-grid">
      <div class="wb-tool">
        <div class="wb-tool-icon">
          <svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="18" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M12 20l5 5 11-10" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <b>自动化测试</b><span>48+ 单元测试，CI 全绿才合并</span>
      </div>
      <div class="wb-tool">
        <div class="wb-tool-icon">
          <svg viewBox="0 0 40 40" fill="none"><rect x="4" y="8" width="32" height="24" rx="4" stroke="var(--accent)" stroke-width="1.5"/><path d="M4 14h32" stroke="var(--accent)" stroke-width="1.5"/><circle cx="10" cy="11" r="1.5" fill="var(--accent)"/><circle cx="16" cy="11" r="1.5" fill="var(--accent)"/></svg>
        </div>
        <b>版本管理</b><span>Git Flow，每个功能独立分支</span>
      </div>
      <div class="wb-tool">
        <div class="wb-tool-icon">
          <svg viewBox="0 0 40 40" fill="none"><path d="M20 4l14 7v18L20 36 6 29V11L20 4z" stroke="var(--accent)" stroke-width="1.5" stroke-linejoin="round"/><path d="M20 4v32M6 11l14 7 14-7" stroke="var(--accent)" stroke-width="1.5"/></svg>
        </div>
        <b>安全打包</b><span>代码签名 + 安装包自动构建</span>
      </div>
      <div class="wb-tool">
        <div class="wb-tool-icon">
          <svg viewBox="0 0 40 40" fill="none"><path d="M8 32V16l12-8 12 8v16" stroke="var(--accent)" stroke-width="1.5" stroke-linejoin="round"/><rect x="15" y="22" width="10" height="10" rx="1" stroke="var(--accent)" stroke-width="1.5"/><line x1="20" y1="22" x2="20" y2="32" stroke="var(--accent)" stroke-width="1.5"/></svg>
        </div>
        <b>一键发布</b><span>推送即触发自动打包上线</span>
      </div>
    </div>
  </div>

  <!-- 最近动态 -->
  <div class="now-feed reveal">
    <div class="now-head"><span class="hf-live"></span><b>最近动态</b><em>NOW</em></div>
    <ul class="now-list">
      <li><time>07-24</time><p>ViewTurbo v3.2 发布：新增分屏浏览，内存占用再降 18%</p></li>
      <li><time>07-19</time><p>交付某连锁餐饮的门店巡检小程序，两周上线</p></li>
      <li><time>07-11</time><p>AutoClick Pro 支持图色识别脚本录制回放</p></li>
      <li><time>07-02</time><p>开源了一个 Windows 托盘工具库，欢迎围观</p></li>
    </ul>
  </div>
</section>

<!-- ============ 定制开发 ============ -->
<section class="services" id="services">
  <div class="section-head">
    <p class="eyebrow reveal">Custom Development</p>
    <h2 class="h2"><span class="line-mask"><span class="line">定制开发</span></span></h2>
    <p class="section-sub reveal d2">从一个想法到可交付的软件，一个人，全流程。</p>
  </div>

  <ul class="svc-list">
    <li class="svc reveal">
      <span class="svc-no">01</span>
      <div class="svc-body"><h3>桌面工具软件</h3><p>Windows / macOS 客户端，界面到内核一手包办</p></div>
      <span class="svc-arr">→</span>
    </li>
    <li class="svc reveal">
      <span class="svc-no">02</span>
      <div class="svc-body"><h3>自动化 &amp; 脚本</h3><p>办公自动化、数据采集、流程机器人，解放重复劳动</p></div>
      <span class="svc-arr">→</span>
    </li>
    <li class="svc reveal">
      <span class="svc-no">03</span>
      <div class="svc-body"><h3>网站 &amp; 管理系统</h3><p>官网、后台、可视化大屏，设计与开发一体交付</p></div>
      <span class="svc-arr">→</span>
    </li>
    <li class="svc reveal">
      <span class="svc-no">04</span>
      <div class="svc-body"><h3>小程序 &amp; H5</h3><p>微信生态一站式，从审核到上线全程护航</p></div>
      <span class="svc-arr">→</span>
    </li>
  </ul>

  <div class="flow">
    <div class="flow-step reveal"><i>01</i><b>沟通需求</b><p>明确目标、范围与预算</p></div>
    <div class="flow-step reveal d1"><i>02</i><b>方案报价</b><p>技术方案 + 里程碑排期</p></div>
    <div class="flow-step reveal d2"><i>03</i><b>开发交付</b><p>阶段演示，随时可见进度</p></div>
    <div class="flow-step reveal d3"><i>04</i><b>维护迭代</b><p>交付源码，长期技术支持</p></div>
  </div>
</section>

<!-- ============ 关于我 · 时间线 ============ -->
<section class="about" id="about">
  <div class="about-grid">
    <div class="about-left">
      <p class="eyebrow reveal">About Me</p>
      <h2 class="h2"><span class="line-mask"><span class="line">一个人，</span></span><span class="line-mask"><span class="line">也是一支队伍。</span></span></h2>
      <p class="about-desc reveal d2">
        八年全栈开发，从内核级 C++ 到像素级 UI 都亲手打磨。
        不外包、不转手，你对接的人就是写代码的人——
        这意味着更快的响应、更少的信息损耗、更可控的质量。
      </p>
      <div class="about-badges reveal d3">
        <span class="badge"><i class="badge-dot"></i>当前可接单</span>
        <span class="badge">平均响应 &lt; 2h</span>
      </div>
    </div>
    <ol class="timeline">
      <li class="tl-item reveal">
        <span class="tl-year">2018</span>
        <div class="tl-body"><b>写下第一行商业代码</b><p>从外包项目起步，练出全栈手艺</p></div>
      </li>
      <li class="tl-item reveal d1">
        <span class="tl-year">2020</span>
        <div class="tl-body"><b>第一款独立产品上线</b><p>AutoClick Pro 发布，首月破千下载</p></div>
      </li>
      <li class="tl-item reveal d2">
        <span class="tl-year">2022</span>
        <div class="tl-body"><b>全职独立开发</b><p>辞职，把热爱变成职业</p></div>
      </li>
      <li class="tl-item reveal d3">
        <span class="tl-year">2024</span>
        <div class="tl-body"><b>ViewTurbo 发布</b><p>累计服务用户突破 20,000</p></div>
      </li>
      <li class="tl-item reveal d3">
        <span class="tl-year">NOW</span>
        <div class="tl-body"><b>持续构建中</b><p>下一个好产品，也许来自你的想法</p></div>
      </li>
    </ol>
  </div>
</section>

<!-- ============ 合作模式 ============ -->
<section class="plans">
  <div class="section-head">
    <p class="eyebrow reveal">Engagement</p>
    <h2 class="h2"><span class="line-mask"><span class="line">合作模式</span></span></h2>
    <p class="section-sub reveal d2">按需选择，丰俭由人。所有模式均交付源码。</p>
  </div>
  <div class="plan-cards">
    <article class="plan reveal">
      <h3>小工具速造</h3>
      <p class="plan-price"><b>¥1k</b> 起</p>
      <p class="plan-desc">单一功能的脚本 / 小工具，一周内交付</p>
      <ul class="plan-list">
        <li>需求明确的单点功能</li>
        <li>3–7 天交付</li>
        <li>含 1 次免费调整</li>
      </ul>
      <a href="#contact" class="btn btn-ghost magnetic">开始 <span class="arr">→</span></a>
    </article>
    <article class="plan plan-hot reveal d1">
      <span class="plan-tag">最受欢迎</span>
      <h3>完整软件定制</h3>
      <p class="plan-price"><b>¥8k</b> 起</p>
      <p class="plan-desc">桌面客户端 / 管理系统 / 小程序，全流程交付</p>
      <ul class="plan-list">
        <li>UI 设计 + 开发 + 部署</li>
        <li>里程碑分期付款</li>
        <li>交付源码与文档</li>
        <li>3 个月免费维护</li>
      </ul>
      <a href="#contact" class="btn btn-solid magnetic">开始 <span class="arr">→</span></a>
    </article>
    <article class="plan reveal d2">
      <h3>长期技术伙伴</h3>
      <p class="plan-price"><b>面议</b></p>
      <p class="plan-desc">按月合作，做你团队的外部技术大脑</p>
      <ul class="plan-list">
        <li>每月固定开发时长</li>
        <li>优先响应排期</li>
        <li>技术选型咨询</li>
      </ul>
      <a href="#contact" class="btn btn-ghost magnetic">聊聊 <span class="arr">→</span></a>
    </article>
  </div>
</section>

<!-- ============ 用户评价墙 ============ -->
<section class="voices">
  <div class="section-head">
    <p class="eyebrow reveal">Voices</p>
    <h2 class="h2"><span class="line-mask"><span class="line">他们怎么说</span></span></h2>
  </div>
  <div class="voice-rows" aria-label="用户评价">
    <div class="voice-row">
      <div class="voice-track">
        <figure class="voice"><blockquote>“描述完需求第三天就看到了能跑的演示版，这个速度我在别处没见过。”</blockquote><figcaption>某电商团队 · 定制爬虫</figcaption></figure>
        <figure class="voice"><blockquote>“AutoClick 把我每天两小时的重复操作压缩到了五分钟。”</blockquote><figcaption>@木子 · 运营</figcaption></figure>
        <figure class="voice"><blockquote>“代码交付得干干净净，注释比我们自己团队写得还全。”</blockquote><figcaption>某创业公司 CTO</figcaption></figure>
        <figure class="voice"><blockquote>“提的每个反馈都有回音，凌晨发的 bug 早上就修好了。”</blockquote><figcaption>@Ken · ViewTurbo 用户</figcaption></figure>
        <figure class="voice"><blockquote>“描述完需求第三天就看到了能跑的演示版，这个速度我在别处没见过。”</blockquote><figcaption>某电商团队 · 定制爬虫</figcaption></figure>
        <figure class="voice"><blockquote>“AutoClick 把我每天两小时的重复操作压缩到了五分钟。”</blockquote><figcaption>@木子 · 运营</figcaption></figure>
        <figure class="voice"><blockquote>“代码交付得干干净净，注释比我们自己团队写得还全。”</blockquote><figcaption>某创业公司 CTO</figcaption></figure>
        <figure class="voice"><blockquote>“提的每个反馈都有回音，凌晨发的 bug 早上就修好了。”</blockquote><figcaption>@Ken · ViewTurbo 用户</figcaption></figure>
      </div>
    </div>
    <div class="voice-row voice-row-rev">
      <div class="voice-track">
        <figure class="voice"><blockquote>“不用跟销售、项目经理绕圈子，直接和写代码的人对话，效率高得离谱。”</blockquote><figcaption>某外贸公司 · 管理系统</figcaption></figure>
        <figure class="voice"><blockquote>“小程序从设计到过审只用了两周，还教会了我们怎么自己发版。”</blockquote><figcaption>@青柠 · 咖啡店主理人</figcaption></figure>
        <figure class="voice"><blockquote>“预算不多，他帮我把需求砍到刚刚好，一分钱没多花。”</blockquote><figcaption>@阿哲 · 自由摄影师</figcaption></figure>
        <figure class="voice"><blockquote>“RenameX 处理了我硬盘里 30 万张素材，一次都没崩。”</blockquote><figcaption>@大熊 · 视频剪辑</figcaption></figure>
        <figure class="voice"><blockquote>“不用跟销售、项目经理绕圈子，直接和写代码的人对话，效率高得离谱。”</blockquote><figcaption>某外贸公司 · 管理系统</figcaption></figure>
        <figure class="voice"><blockquote>“小程序从设计到过审只用了两周，还教会了我们怎么自己发版。”</blockquote><figcaption>@青柠 · 咖啡店主理人</figcaption></figure>
        <figure class="voice"><blockquote>“预算不多，他帮我把需求砍到刚刚好，一分钱没多花。”</blockquote><figcaption>@阿哲 · 自由摄影师</figcaption></figure>
        <figure class="voice"><blockquote>“RenameX 处理了我硬盘里 30 万张素材，一次都没崩。”</blockquote><figcaption>@大熊 · 视频剪辑</figcaption></figure>
      </div>
    </div>
  </div>
</section>

<!-- ============ 理念金句 ============ -->
<section class="manifesto" id="manifesto">
  <p class="manifesto-text" id="manifesto-text">
    好软件不需要说明书。它应该像呼吸一样自然，在你需要的时候出现，在你专注的时候隐身。
  </p>
</section>

<!-- ============ FAQ ============ -->
<section class="faq" id="faq">
  <div class="section-head">
    <p class="eyebrow reveal">FAQ</p>
    <h2 class="h2"><span class="line-mask"><span class="line">常见问题</span></span></h2>
  </div>
  <div class="faq-list">
    <details class="faq-item reveal">
      <summary>定制开发怎么收费？<span class="faq-icon"></span></summary>
      <div class="faq-body"><p>按项目复杂度一口价报价，绝不按人天糊弄。沟通清楚需求后 24 小时内给出报价和排期，报价后不加价——范围内的改动都包含在内。</p></div>
    </details>
    <details class="faq-item reveal">
      <summary>开发周期一般多久？<span class="faq-icon"></span></summary>
      <div class="faq-body"><p>小工具 3–7 天，完整客户端或管理系统 2–6 周，小程序含审核约 2–3 周。每个里程碑都有可运行的演示版本，进度透明。</p></div>
    </details>
    <details class="faq-item reveal">
      <summary>交付后出了问题怎么办？<span class="faq-icon"></span></summary>
      <div class="faq-body"><p>所有项目含 3 个月免费缺陷修复。之后可选按次付费或包月维护。源码和文档都归你，即使换人接手也不会被卡脖子。</p></div>
    </details>
    <details class="faq-item reveal">
      <summary>需求还不明确，可以聊吗？<span class="faq-icon"></span></summary>
      <div class="faq-body"><p>当然，而且建议早点聊。很多客户来的时候只有一个模糊的想法，帮你把想法收敛成清晰的需求清单，这一步是免费的。</p></div>
    </details>
    <details class="faq-item reveal">
      <summary>现成产品可以二次定制吗？<span class="faq-icon"></span></summary>
      <div class="faq-body"><p>可以。ViewTurbo、AutoClick Pro 等产品都支持在现有功能上按需扩展，比从零开发快得多、也便宜得多。</p></div>
    </details>
  </div>
</section>

<!-- ============ 巨型文字跑马灯 ============ -->
<div class="mega-marquee" aria-hidden="true">
  <div class="mega-track">
    <span>LET'S BUILD SOMETHING&nbsp;—&nbsp;</span><span class="mega-stroke">LET'S BUILD SOMETHING&nbsp;—&nbsp;</span>
    <span>LET'S BUILD SOMETHING&nbsp;—&nbsp;</span><span class="mega-stroke">LET'S BUILD SOMETHING&nbsp;—&nbsp;</span>
  </div>
</div>

<!-- ============ 联系 ============ -->
<section class="contact" id="contact">
  <p class="eyebrow reveal">Get in Touch</p>
  <h2 class="contact-title">
    <span class="line-mask"><span class="line">聊聊你的</span></span>
    <span class="line-mask"><span class="line"><em class="accent">项目</em>。</span></span>
  </h2>
  <p class="contact-sub reveal d2">软件购买、定制开发、合作洽谈——欢迎随时来信。</p>
  <div class="contact-actions reveal d3">
    <button class="copy-btn" data-copy="heerjohn379@gmail.com">
      <span class="copy-label">邮箱</span><span class="copy-value">heerjohn379@gmail.com</span>
      <span class="copy-tip">点击复制</span>
    </button>
    <button class="copy-btn" data-copy="feg1735">
      <span class="copy-label">微信</span><span class="copy-value">feg1735</span>
      <span class="copy-tip">点击复制</span>
    </button>
  </div>
</section>

</main>

<footer class="footer">
  <div class="footer-inner">
    <div class="footer-meta">
      <span>© 2026 MONO STUDIO · 用心做软件</span>
      <div class="footer-records">
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
          鲁ICP备2026028241号-1
        </a>
        <a href="https://beian.mps.gov.cn/#/query/webSearch?code=37010102007161" target="_blank" rel="noopener noreferrer">
          <img :src="beianIcon" alt="" aria-hidden="true" />
          鲁公网安备 37010102007161号
        </a>
      </div>
    </div>
    <a href="#top" class="to-top">回到顶部 ↑</a>
  </div>
</footer>

<div class="toast" id="toast" role="status" aria-live="polite">已复制</div>
</template>
