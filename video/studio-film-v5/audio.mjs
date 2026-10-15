import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const root = dirname(fileURLToPath(import.meta.url));
const project = resolve(root, "../..");
const plan = JSON.parse(await readFile(join(root, "audio-plan.json"), "utf8"));
const ffmpeg = process.env.FFMPEG_BIN || "/opt/homebrew/bin/ffmpeg";
const execute = promisify(execFile);
const source = join(root, plan.music.file);
const sourceSha = createHash("sha256").update(await readFile(source)).digest("hex");
if (sourceSha !== plan.music.sha256) throw new Error("配乐文件与已确认的来源摘要不一致，停止生成。");
await mkdir(join(root, "qa"), { recursive: true });

const mix = plan.mix;
// 不沿用旧的合成器或转场音；先去除极低频与过亮的高频，再以实测响度做两遍归一化。
const filters = [
  `atrim=start=${mix.sourceStartSeconds}:duration=${plan.duration}`,
  "asetpts=PTS-STARTPTS",
  `aresample=${plan.sampleRate}`,
  `highpass=f=${mix.highpassHz}`,
  `lowpass=f=${mix.lowpassHz}`,
  `equalizer=f=${mix.presenceEqHz}:t=o:w=1.5:g=${mix.presenceEqDb}`,
  `afade=t=in:st=0:d=${mix.fadeInSeconds}`,
  `afade=t=out:st=${plan.duration - mix.fadeOutSeconds}:d=${mix.fadeOutSeconds}`,
];
const loudness = `loudnorm=I=${mix.integratedLUFS}:TP=${mix.truePeakDBTP}:LRA=${mix.loudnessRangeLU}`;
const analysis = await execute(ffmpeg, ["-hide_banner", "-nostdin", "-i", source, "-af", [...filters, `${loudness}:print_format=json`].join(","), "-f", "null", "-"], { maxBuffer: 4 * 1024 * 1024 });
const report = analysis.stderr.match(/\{\s*"input_i"[\s\S]*?\}/);
if (!report) throw new Error("未获取到音轨响度测量，停止生成。");
const measured = JSON.parse(report[0]);
for (const field of ["input_i", "input_tp", "input_lra", "input_thresh", "target_offset"]) {
  if (!Number.isFinite(Number(measured[field]))) throw new Error(`无效响度测量：${field}`);
}
const correction = `${loudness}:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true:print_format=json`;
const wav = join(root, "assets/mix.wav");
const rendered = await execute(ffmpeg, ["-y", "-hide_banner", "-nostdin", "-i", source, "-af", [...filters, correction].join(","), "-t", String(plan.duration), "-ar", String(plan.sampleRate), "-ac", "2", "-c:a", "pcm_s16le", wav], { maxBuffer: 4 * 1024 * 1024 });

// 只替换音轨，视频码流直接复制；写入临时文件，封装完成后才替换官网资源。
const visual = resolve(root, plan.visualSource);
const pending = join(root, "qa/studio-film-v5.pending.mp4");
const credit = `${plan.music.attribution} Source: ${plan.music.sourceUrl} License: ${plan.music.licenseUrl}`;
await execute(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", "-nostdin", "-i", visual, "-i", wav, "-map", "0:v:0", "-map", "1:a:0", "-map_metadata", "-1", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", String(plan.sampleRate), "-t", String(plan.duration), "-movflags", "+faststart", "-metadata", "title=光年数智品牌与研发短片 V5", "-metadata", `comment=${credit}`, pending]);
await rename(pending, join(project, "src/assets/media/studio-film-v5.mp4"));
await copyFile(resolve(root, plan.posterSource), join(project, "src/assets/media/studio-film-v5-poster.webp"));

// 网页只按需加载一个清晰度；原片保留用于原画选项，重建配乐时同步派生版本以免声音过期。
for (const variant of [
  { height: 720, width: 1280, crf: "24", maxrate: "1400k", bufsize: "2800k", audio: "128k" },
  { height: 480, width: 854, crf: "25", maxrate: "700k", bufsize: "1400k", audio: "96k" },
]) {
  const variantPending = join(root, `qa/studio-film-v5-${variant.height}p.pending.mp4`);
  await execute(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", "-nostdin", "-i", join(project, "src/assets/media/studio-film-v5.mp4"),
    "-map", "0:v:0", "-map", "0:a:0", "-vf", `scale=${variant.width}:${variant.height}:flags=lanczos:out_range=tv,setsar=1`,
    "-c:v", "libx264", "-preset", "slow", "-crf", variant.crf, "-profile:v", "main", "-level:v", "3.1", "-pix_fmt", "yuv420p", "-color_range", "tv",
    "-maxrate", variant.maxrate, "-bufsize", variant.bufsize, "-g", "60", "-c:a", "aac", "-b:a", variant.audio,
    "-movflags", "+faststart", "-map_metadata", "-1", "-metadata", `title=光年数智品牌与研发短片 V5 · ${variant.height}p`, "-metadata", `comment=${credit}`, variantPending]);
  await rename(variantPending, join(project, `src/assets/media/studio-film-v5-${variant.height}p.mp4`));
}

const silentPending = join(root, "qa/studio-film-v5-silent.pending.mp4");
// 另存完全无声版，不保留会让用户感到刺耳的任何旧转场音。
await execute(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", "-nostdin", "-i", visual, "-map", "0:v:0", "-map_metadata", "-1", "-c:v", "copy", "-an", "-t", String(plan.duration), "-movflags", "+faststart", silentPending]);
await rename(silentPending, join(root, "studio-film-v5-silent.mp4"));
await writeFile(join(root, "qa/mix-measurements.json"), JSON.stringify({ date: plan.date, sourceSha256: sourceSha, firstPass: measured, secondPass: JSON.parse(rendered.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)?.[0] || "null"), settings: mix, legacySynthTrackRemoved: true, noTransitionSfx: true, humanListening: "未做人工听感验收，需用户在合适音量下试听。" }, null, 2) + "\n");
console.log("V5 已生成：轻柔钢琴配乐、无转场音、低响度；V4 画面码流保持不变。");
