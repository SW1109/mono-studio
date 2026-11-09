<script setup>
import { onMounted } from "vue";
import SiteIcon from "./SiteIcon.vue";
onMounted(() => window.dispatchEvent(new Event("mono-theme-ready")));
</script>

<template>
  <details class="theme-picker">
    <summary aria-label="切换外观主题" title="外观：跟随系统、亮色或暗色">
      <SiteIcon class="theme-system" name="desktop" /><SiteIcon class="theme-light" name="sun" /><SiteIcon class="theme-dark" name="moon" />
    </summary>
    <div class="theme-picker-options" role="group" aria-label="外观主题">
      <label><SiteIcon name="desktop" />跟随系统<input type="radio" name="site-theme" value="system" data-theme-choice checked /></label>
      <label><SiteIcon name="sun" />亮色<input type="radio" name="site-theme" value="light" data-theme-choice /></label>
      <label><SiteIcon name="moon" />暗色<input type="radio" name="site-theme" value="dark" data-theme-choice /></label>
    </div>
  </details>
</template>
