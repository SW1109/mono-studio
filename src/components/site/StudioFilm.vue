<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import filmUrl from "../../assets/media/studio-film-v5.mp4";
import posterUrl from "../../assets/media/studio-film-v5-poster.webp";

// 自动播放先以较低音量进入；点击解锁也不突然恢复到满音量。
const INITIAL_VOLUME = 0.35;
const player = ref(null);
const autoplayEnabled = ref(false);
const soundMuted = ref(false);
const soundBlocked = ref(false);
const failed = ref(false);
const notice = ref("");
let dispose = () => {};

async function playFilm(allowMutedFallback = false) {
  const video = player.value;
  if (!video) return;
  try { await video.play(); }
  catch (error) {
    // 切换路由或暂停会中断待完成的播放请求，不应误报为加载失败。
    if (error.name === "AbortError") return;
    if (error.name === "NotAllowedError") {
      // 有声自动播放受浏览器策略限制；被拦截后保留播放，并给出真实点击解锁声音的入口。
      if (allowMutedFallback && !video.muted) {
        soundMuted.value = true;
        soundBlocked.value = true;
        video.defaultMuted = true;
        video.muted = true;
        notice.value = "浏览器限制自动播放声音，已先静音播放。";
        await playFilm();
      } else notice.value = soundBlocked.value ? "浏览器限制自动播放，请点击播放器播放并开启声音。" : "请点击播放器的播放按钮观看。";
    } else failed.value = true;
  }
}
function enableSound() {
  const video = player.value;
  if (!video) return;
  // 必须在点击调用栈中直接解除静音并 play，避免丢失浏览器的用户激活状态。
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
  if (!soundBlocked.value) notice.value = "";
}
function retry() {
  failed.value = false;
  notice.value = "";
  const video = player.value;
  if (!video) return;
  soundMuted.value = false;
  soundBlocked.value = false;
  video.defaultMuted = false;
  video.muted = false;
  video.load();
  void playFilm(true);
}

onMounted(() => {
  const video = player.value;
  if (!video) return;
  video.volume = INITIAL_VOLUME;
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  // 先尝试有声自动播放；是否允许由浏览器决定，禁止用隐藏音轨等方式绕过策略。
  video.defaultMuted = false;
  video.muted = false;
  const syncPreference = () => {
    autoplayEnabled.value = !preference.matches;
    if (preference.matches) {
      video.pause();
      notice.value = "已遵循减少动态效果设置，可点击播放观看。";
    }
  };
  const pauseWhenHidden = () => { if (document.hidden) video.pause(); };
  syncPreference();
  if (autoplayEnabled.value) void playFilm(true);
  preference.addEventListener("change", syncPreference);
  document.addEventListener("visibilitychange", pauseWhenHidden);
  dispose = () => {
    preference.removeEventListener("change", syncPreference);
    document.removeEventListener("visibilitychange", pauseWhenHidden);
  };
});
onBeforeUnmount(() => {
  dispose();
  player.value?.pause();
});
</script>

<template>
  <figure class="studio-film">
    <video
      ref="player"
      :src="filmUrl"
      :poster="posterUrl"
      :autoplay="autoplayEnabled"
      :muted="soundMuted"
      playsinline
      controls
      preload="metadata"
      width="1920"
      height="1080"
      aria-label="光年数智工作室宣传片，介绍行业背景、研发服务、工程方法与长期愿景，时长64秒，钢琴配乐与文字叙事，无旁白"
      aria-describedby="studio-film-caption"
      @playing="handlePlaying"
      @volumechange="syncVolume"
      @error="failed = true"
    >
      当前浏览器不支持视频播放，可<a :href="filmUrl">下载宣传片</a>观看。
    </video>
    <figcaption id="studio-film-caption">
      <div class="studio-film-caption"><strong>光年数智 · 品牌与研发短片</strong><span>优先轻声播放 · 可调节音量或静音</span></div>
      <p class="studio-film-credit">配乐：<a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1800008" target="_blank" rel="noopener noreferrer">Almost New — Kevin MacLeod</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> · 已剪辑、均衡与淡入淡出</p>
      <p v-if="failed" class="studio-film-notice" role="alert">视频暂时无法加载。<button type="button" class="text-link" @click="retry">重新加载</button><a class="text-link" :href="filmUrl" download>下载观看</a></p>
      <p v-else-if="notice" class="studio-film-notice" role="status">{{ notice }}<button v-if="soundBlocked" type="button" class="text-link" @click="enableSound">开启声音</button></p>
    </figcaption>
  </figure>
</template>

<style scoped>
.studio-film { margin: 0; min-width: 0; overflow: hidden; border: 1px solid var(--line); border-radius: var(--radius-card); background: var(--canvas); }
.studio-film video { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: contain; background: var(--dark); }
.studio-film figcaption { padding: 16px 20px; border-top: 1px solid var(--line); }
.studio-film-caption { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px 16px; }
.studio-film-caption strong { font-size: 16px; font-weight: 600; }
.studio-film-caption span, .studio-film-notice, .studio-film-credit { font-size: 13px; color: var(--muted); }
.studio-film-notice, .studio-film-credit { margin-top: 8px; }
.studio-film-credit a { text-decoration: underline; text-underline-offset: 2px; }
.studio-film-notice .text-link { margin-left: 10px; border: 0; padding: 0; background: none; font-size: inherit; }
@media (max-width: 760px) { .studio-film figcaption { padding: 14px 16px; } }
</style>
