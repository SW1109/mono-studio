import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = process.env.FILM_ROOT || dirname(fileURLToPath(import.meta.url));
const spec = JSON.parse(await readFile(join(root, "spec.json"), "utf8"));
const rate = spec.audio.sampleRate, count = rate * spec.duration;
const music = new Float32Array(count * 2), sfx = new Float32Array(count * 2);
const hz = midi => 440 * 2 ** ((midi - 69) / 12);
const smooth = n => { const p = Math.max(0, Math.min(1, n)); return p * p * (3 - 2 * p); };
function add(target, time, length, signal, gain = 1, pan = 0) {
  const start = Math.round(time * rate), n = Math.round(length * rate);
  const left = Math.sqrt((1 - pan) / 2), right = Math.sqrt((1 + pan) / 2);
  for (let i = 0; i < n && start + i < count; i++) {
    if (start + i < 0) continue;
    const value = signal(i / rate, i, length) * gain;
    target[(start + i) * 2] += value * left;
    target[(start + i) * 2 + 1] += value * right;
  }
}

// 原创 D 大调和声与低密度电子节奏；不引用外部歌曲、旋律或声音样本。
const chords = [[50,57,62,66,69],[47,54,59,62,66],[43,50,55,59,62],[45,52,57,61,64],[43,50,55,59,62],[50,57,62,66,69]];
const chordLength = 64 / chords.length;
chords.forEach((chord, k) => {
  chord.forEach((midi, j) => {
    const f = hz(midi), length = chordLength + 1.5;
    add(music, k * chordLength, length, t => {
      const attack = smooth(t / 1.45), release = smooth((length - t) / 2.2);
      const phase = Math.PI * 2 * f * t;
      const body = Math.sin(phase) + .22 * Math.sin(phase * 2 + .3) + .075 * Math.sin(phase * 3);
      const air = .16 * Math.sin(Math.PI * 2 * f * 1.0012 * t + .7);
      return (body + air) * attack * release * (.8 + .12 * Math.sin(t * 1.1));
    }, .072, (j - 2) * .27);
  });
});
const beat = 60 / spec.audio.bpm;
for (let b = 12; b < 92; b++) {
  const time = b * beat;
  const energy = time < 22 ? .64 : time < 50 ? .84 : 1;
  const chord = chords[Math.min(chords.length - 1, Math.floor(time / chordLength))];
  const f = hz(chord[0] - 12);
  if (b % 2 === 0) add(music, time, beat * 1.8, t => Math.sin(2 * Math.PI * f * t) * smooth(t / .035) * Math.exp(-t * 2.8), .19 * energy, 0);
  if (b % 2 === 0) add(music, time, .32, t => Math.sin(2 * Math.PI * (49 * t + 34 * .055 * (1 - Math.exp(-t / .055)))) * Math.exp(-t * 17) * smooth(t / .007), .145 * energy, 0);
  // 弦乐感短句采用软起音与长尾，不使用 UI 提示音或游戏式 pluck/bloop。
  if (b % 2 === 0 && time >= 14) {
    const midi = chord[2 + ((b / 2) % 3)], note = hz(midi + 12);
    add(music, time + .06, beat * 2.4, t => {
      const phase = 2 * Math.PI * note * t;
      return (Math.sin(phase) + .14 * Math.sin(phase * 2) + .04 * Math.sin(phase * 3)) * smooth(t / .12) * Math.exp(-t * 2.1) * smooth((beat * 2.4 - t) / .25);
    }, .055 * energy, b % 4 ? .32 : -.32);
  }
}
// 结尾和声回到主调，渐强后自然收束；品牌字标不伴随震屏或高频冲击。
[50,57,62,66,74].forEach((midi, i) => {
  const f = hz(midi); add(music, 58, 6, t => Math.sin(2 * Math.PI * f * t) * smooth(t / .4) * Math.exp(-t * .3) * smooth((6 - t) / 1.8), .075, (i - 2) * .23);
});

const events = spec.shots.slice(1).map((shot, i) => ({ shot: shot.id, targetFrame: Math.round((shot.start + .3) * spec.fps), duration: .7, gain: .105 + (shot.id === "brand" ? .015 : 0), seed: 4400 + i * 157, kind: "低密度空气转场" }));
events.forEach(event => {
  let state = event.seed, low = 0;
  add(sfx, event.targetFrame / spec.fps - event.duration / 2, event.duration, (t, i, duration) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const noise = state / 2 ** 31 - 1;
    low += .065 * (noise - low);
    const envelope = Math.sin(Math.PI * t / duration) ** 2;
    return low * envelope * 2.8;
  }, event.gain, 0);
});

const mix = new Float32Array(count * 2);
let peak = 0;
for (let i = 0; i < count; i++) {
  const time = i / rate;
  const fade = smooth(time / 1.8) * smooth((spec.duration - time) / 2.2);
  for (let channel = 0; channel < 2; channel++) {
    const index = i * 2 + channel;
    music[index] *= fade; sfx[index] *= fade;
    mix[index] = music[index] + sfx[index]; peak = Math.max(peak, Math.abs(mix[index]));
  }
}
const gain = .63 / peak;
function wav(values) {
  const buffer = Buffer.alloc(44 + values.length * 2);
  buffer.write("RIFF", 0); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 4, 28); buffer.writeUInt16LE(4, 32); buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36); buffer.writeUInt32LE(values.length * 2, 40);
  for (let i = 0; i < values.length; i++) buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, values[i] * gain)) * 32767), 44 + i * 2);
  return buffer;
}
await writeFile(join(root, "assets/mix.wav"), wav(mix));
await writeFile(join(root, "assets/sfx.wav"), wav(sfx));
await writeFile(join(root, "assets/audio-plan.json"), JSON.stringify({ created: "2026-10-14", rate, bpm: spec.audio.bpm, duration: spec.duration, seedPolicy: "各转场固定 LCG seed；相同时间线可确定性重建", original: true, thirdPartySamples: false, peakBeforeGain: peak, appliedGain: gain, targetPeakDbFS: 20 * Math.log10(.63), events }, null, 2) + "\n");
console.log(`Original audio created: 64s, ${rate}Hz stereo, target peak ${(20 * Math.log10(.63)).toFixed(2)} dBFS`);
