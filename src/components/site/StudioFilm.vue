<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import originalUrl from "../../assets/media/studio-film-v5.mp4";
import hdUrl from "../../assets/media/studio-film-v5-720p.mp4";
import smoothUrl from "../../assets/media/studio-film-v5-480p.mp4";
import posterUrl from "../../assets/media/studio-film-v5-poster.webp";

const INITIAL_VOLUME = 0.35;
const sources = [
  { id: "smooth", label: "流畅 · 480p", url: smoothUrl },
  { id: "hd", label: "高清 · 720p", url: hdUrl },
  { id: "original", label: "原画 · 1080p", url: originalUrl },
];
const player = ref(null);
const quality = shallowRef("hd");
const activeSource = computed(() => sources.find(source => source.id === quality.value));
const sourceLoaded = shallowRef(false);
const soundMuted = shallowRef(false);
const soundBlocked = shallowRef(false);
const failed = shallowRef(false);
const buffering = shallowRef(false);
const notice = shallowRef("");
let autoplayEnabled = false;
let inView = false;
let resumeWhenVisible = false;
let pendingSeek = null;
let pendingResume = false;
let playAttempt = 0;
let disposed = false;
let dispose = () => {};

function attachSource() {
  const video = player.value;
  if (!video) return;
  // 不在 SSR 或初始模板写入 src；仅在可见或主动播放时发起媒体请求。
  sourceLoaded.value = true;
  buffering.value = true;
  // 显式加载后允许读取元信息，切换画质时即使暂停也能恢复进度。
  video.preload = "metadata";
  video.src = activeSource.value.url;
}
async function playFilm(allowMutedFallback = false) {
  const video = player.value;
  if (!video || disposed) return;
  const attempt = ++playAttempt;
  try { await video.play(); }
  catch (error) {
    // 离屏、切换画质和卸载都会取消旧请求；旧 Promise 不能重新拉起播放器。
    if (disposed || attempt !== playAttempt || error.name === "AbortError") return;
    buffering.value = false;
    if (error.name === "NotAllowedError") {
      if (allowMutedFallback && !video.muted) {
        soundMuted.value = true;
        soundBlocked.value = true;
        video.defaultMuted = true;
        video.muted = true;
        notice.value = "浏览器限制自动播放声音，已先静音播放。";
        await playFilm();
      } else notice.value = "浏览器限制自动播放，请点击播放器播放。";
    } else handleError();
  }
}
function startPlayback() {
  failed.value = false;
  notice.value = "";
  resumeWhenVisible = false;
  if (!sourceLoaded.value) attachSource();
  void playFilm(true);
}
function pauseFilm() {
  playAttempt++;
  player.value?.pause();
  buffering.value = false;
}
function suspendPlayback() {
  if (player.value && !player.value.paused) resumeWhenVisible = true;
  pauseFilm();
}
function resumePlayback() {
  if (!inView || document.hidden || !autoplayEnabled || failed.value) return;
  if (!sourceLoaded.value) startPlayback();
  else if (resumeWhenVisible) {
    resumeWhenVisible = false;
    void playFilm(true);
  }
}
function enableSound() {
  const video = player.value;
  if (!video) return;
  // 在点击调用栈中解除静音并 play，保留浏览器的用户激活状态。
  soundMuted.value = false;
  soundBlocked.value = false;
  video.defaultMuted = false;
  video.muted = false;
  if (video.volume === 0) video.volume = INITIAL_VOLUME;
  notice.value = "";
  void playFilm();
}
function syncVolume() {
  const video = player.value;
  if (!video) return;
  soundMuted.value = video.muted;
  if (!soundMuted.value && video.volume > 0 && soundBlocked.value) {
    soundBlocked.value = false;
    notice.value = "";
  }
}
function handlePlaying() {
  failed.value = false;
  buffering.value = false;
  notice.value = soundBlocked.value ? "浏览器限制自动播放声音，已先静音播放。" : "";
}
function handleError() {
  if (disposed) return;
  failed.value = true;
  buffering.value = false;
  pendingResume = false;
}
function selectQuality(event) {
  const next = sources.find(source => source.id === event.target.value);
  if (!next || next.id === quality.value) return;
  const video = player.value;
  pendingSeek = video?.currentTime || 0;
  pendingResume = Boolean(video && (!video.paused || failed.value));
  quality.value = next.id;
  failed.value = false;
  if (!sourceLoaded.value) return;
  pauseFilm();
  attachSource();
}
function restorePosition() {
  const video = player.value;
  if (!video) return;
  if (pendingSeek !== null && Number.isFinite(video.duration)) {
    video.currentTime = Math.min(pendingSeek, video.duration);
    pendingSeek = null;
  }
  if (pendingResume) {
    pendingResume = false;
    if (inView && !document.hidden) void playFilm(true);
    else resumeWhenVisible = true;
  }
}
function retry() {
  failed.value = false;
  notice.value = "";
  pendingSeek = null;
  pendingResume = false;
  pauseFilm();
  attachSource();
  void playFilm(true);
}

onMounted(() => {
  const video = player.value;
  if (!video) return;
  video.volume = INITIAL_VOLUME;
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reducedData = window.matchMedia("(prefers-reduced-data: reduce)");
  const connection = navigator.connection;
  const saveData = Boolean(connection?.saveData || reducedData.matches);
  const slowConnection = ["slow-2g", "2g"].includes(connection?.effectiveType);
  const smallScreen = window.matchMedia("(max-width: 640px)").matches;
  const canObserve = "IntersectionObserver" in window;
  const limitedDevice = navigator.hardwareConcurrency <= 2 || navigator.deviceMemory <= 2;
  quality.value = saveData || slowConnection || smallScreen || limitedDevice ? "smooth" : "hd";

  const syncPreference = () => {
    autoplayEnabled = canObserve && !preference.matches && !saveData && !slowConnection;
    if (!autoplayEnabled) {
      resumeWhenVisible = false;
      pauseFilm();
      notice.value = preference.matches ? "已遵循减少动态效果设置，点击播放后再加载视频。" : saveData || slowConnection ? "已启用省流播放，点击播放后再加载视频。" : "请点击播放短片。";
    } else resumePlayback();
  };
  const syncVisibility = () => { if (document.hidden) suspendPlayback(); else resumePlayback(); };
  let observer;
  if (canObserve) {
    observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      inView = entry.isIntersecting && entry.intersectionRatio >= 0.15;
      if (inView) resumePlayback();
      else suspendPlayback();
    }, { threshold: [0, 0.15] });
    observer.observe(video);
  } else inView = true;
  // 无可见性 API 时保留封面与手动播放，不添加滚动监听或轮询。
  syncPreference();
  preference.addEventListener("change", syncPreference);
  document.addEventListener("visibilitychange", syncVisibility);
  dispose = () => {
    observer?.disconnect();
    preference.removeEventListener("change", syncPreference);
    document.removeEventListener("visibilitychange", syncVisibility);
  };
});
onBeforeUnmount(() => {
  disposed = true;
  dispose();
  pauseFilm();
  // 卸载即中止下载并释放解码资源，避免后台继续播放或占用带宽。
  const video = player.value;
  if (video) { video.removeAttribute("src"); video.load(); }
});
</script>

<template>
  <figure class="studio-film">
    <div class="studio-film-screen">
      <video
        ref="player"
        :poster="posterUrl"
        :muted="soundMuted"
        playsinline
        controls
        preload="none"
        width="1280"
        height="720"
        aria-label="光年数智工作室宣传片，介绍行业背景、研发服务、工程方法与长期愿景，时长64秒，钢琴配乐与文字叙事，无旁白"
        aria-describedby="studio-film-caption"
        @playing="handlePlaying"
        @pause="buffering = false"
        @volumechange="syncVolume"
        @waiting="buffering = true"
        @canplay="buffering = false"
        @loadedmetadata="restorePosition"
        @error="handleError"
      >
        当前浏览器不支持视频播放，可<a :href="originalUrl">下载宣传片</a>观看。
      </video>
      <button v-if="!sourceLoaded" class="film-play-button" type="button" aria-label="播放光年数智宣传片" @click="startPlayback"><span aria-hidden="true">▶</span>播放短片</button>
    </div>
    <figcaption id="studio-film-caption">
      <div class="studio-film-caption">
        <div><strong>光年数智 · 品牌与研发短片</strong><span>64 秒 · 轻量播放 · 可调节音量或静音</span></div>
        <label class="film-quality">画质<select :value="quality" aria-label="宣传片播放画质" @change="selectQuality"><option v-for="source in sources" :key="source.id" :value="source.id">{{ source.label }}</option></select></label>
      </div>
      <p v-if="failed" class="studio-film-notice" role="alert">视频暂时无法加载，可切换流畅画质或<button type="button" class="text-link" @click="retry">重新加载</button><a class="text-link" :href="activeSource.url" download>下载观看</a></p>
      <p v-else-if="notice" class="studio-film-notice" role="status">{{ notice }}<button v-if="soundBlocked" type="button" class="text-link" @click="enableSound">开启声音</button></p>
      <p v-else-if="buffering" class="studio-film-notice" role="status">正在缓冲 {{ activeSource.label }}，网络较慢时可切换流畅画质。</p>
      <p class="studio-film-credit">配乐：<a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1800008" target="_blank" rel="noopener noreferrer">Almost New — Kevin MacLeod</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> · 已剪辑、均衡与淡入淡出</p>
    </figcaption>
  </figure>
</template>

<style scoped>
.studio-film { margin: 0; min-width: 0; overflow: hidden; border: 1px solid var(--line); border-radius: var(--radius-card); background: var(--canvas); }
.studio-film-screen { position: relative; background: var(--canvas); }
.studio-film video { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: contain; background: var(--canvas); }
.film-play-button { position: absolute; inset: 50% auto auto 50%; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 12px 22px; border: 1px solid var(--glass-line); border-radius: var(--radius-pill); background: var(--button-primary-bg); color: var(--canvas); font-size: 14px; white-space: nowrap; }
.film-play-button:hover { background: var(--button-primary-hover); }
.film-play-button span { font-size: 12px; }
.studio-film figcaption { padding: 16px 20px; border-top: 1px solid var(--line); }
.studio-film-caption { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px 20px; }
.studio-film-caption strong { display: block; font-size: 16px; font-weight: 600; }
.studio-film-caption div > span { display: block; margin-top: 4px; }
.studio-film-caption span, .studio-film-notice, .studio-film-credit, .film-quality { font-size: 13px; color: var(--muted); }
.film-quality { display: flex; align-items: center; gap: 10px; }
.film-quality select { min-height: 44px; max-width: 100%; padding: 8px 28px 8px 12px; border: 1px solid var(--line); border-radius: var(--radius-sm); color: var(--ink); background: var(--pearl); }
.studio-film-notice, .studio-film-credit { margin-top: 10px; }
.studio-film-credit a { text-decoration: underline; text-underline-offset: 2px; }
.studio-film-notice .text-link { margin-left: 10px; border: 0; padding: 0; background: none; font-size: inherit; }
@media (max-width: 760px) { .studio-film figcaption { padding: 14px 16px; }.studio-film-caption { align-items: start; }.studio-film-caption strong { font-size: 15px; } }
</style>
