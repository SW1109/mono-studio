# 光年数智宣传片 V5 · 柔和配乐版

官网按设备默认播放 `src/assets/media/studio-film-v5-720p.mp4`（桌面）或 `studio-film-v5-480p.mp4`（窄屏、低性能及省流设备），播放器可手动切换 1080p 原画。`studio-film-v5.mp4` 保留为原片；首页与播放器封面同步为 V5。画面、64 秒时间线、30fps 与钢琴配乐保持不变。V4 为历史版本，不再作为官网播放资源。

## 本轮声音调整

- 停用旧程序合成配乐及全部转场音，不只是给原音轨降音量。
- 配乐：**Almost New — Kevin MacLeod (incompetech.com)**，CC BY 4.0；官方曲目为钢琴与低音声部，80 BPM。
- 使用前 64 秒，轻度高/低通与中高频均衡、2.5 秒淡入和 4 秒淡出；两遍测量归一化，目标 -24 LUFS / -6 dBTP。
- 网页默认音量为 35%，声音解锁不恢复到 100%；原有自动播放回退、原生控件、减少动态效果和页面隐藏暂停保留。
- `studio-film-v5-silent.mp4` 是完全无声版，不含旧转场音。
- 网页初始仅显示封面，视频进入可视区域才挂载媒体源；减少动态或省流设置下仅手动播放。离屏暂停、卸载释放资源。切换画质保留进度，不默认下载 1080p 原片。

授权与原曲下载地址、ISRC、SHA-256、剪辑方式统一记录于 `audio-plan.json`；署名与许可链接显示在官网播放器下方，也写入成片元数据。单独转载视频时请保留下列署名、来源及许可，说明已做长度、均衡、响度与淡入淡出处理：

> Almost New by Kevin MacLeod (incompetech.com) — CC BY 4.0. Edited for length, EQ, loudness and fades.

来源： https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1800008  
许可： https://creativecommons.org/licenses/by/4.0/

## 重建

原曲已保存在 `assets/`；需要现有 Node 24 与 FFmpeg，不增加网站依赖。脚本先校验曲目摘要，以 V4 成片直接复制原片视频码流，重新制作、封装音轨，再同步派生两档网页轻量版（H.264 Main / yuv420p / faststart，保留音频署名与许可元数据）：

```sh
node video/studio-film-v5/audio.mjs
```

临时 QA 报告、截图与音轨中间文件已按要求清理，下方保留制作时的验证结果摘要。自动化只能验证响度、峰值、媒体参数和音量逻辑；没有人工听感或真实扬声器验收，配乐审美仍需用户以合适音量试听确认。Safari/iOS/Android 实机及线上部署未验证。

制作时验证：76 项既有测试、25 页 SSG 构建与 10 项隔离 Chromium 播放检查通过。桌面及 375/320px 窄屏已核对，默认和点击解锁音量均为 35%，原生音量调节保持可用。最终 AAC 实测 -24.01 LUFS、-10.85 dBTP，无削波；有声/无声两版均完整解码通过，与 V4 的视频码流摘要完全一致。浏览器测试使用 `--mute-audio` 禁止实际扬声器输出，仅验证播放与音量状态，不构成人工听感验收。
