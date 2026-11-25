import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, PerspectiveCamera, Points, Scene, ShaderMaterial, WebGLRenderer } from "three";

// 首页固定背景：同一批光点在「星系 / 网页 / 手机 / 桌面窗口 / 流程节点 / 协作球体」之间变形。
// 只在首页挂载后动态加载，不进入全站启动资源。
const TAU = Math.PI * 2;
export const SCENE_SHAPES = ["galaxy", "web", "mobile", "desktop", "flow", "orbit"];

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function rotate([x, y, z], rx = 0, ry = 0, rz = 0) {
  let c = Math.cos(rx), s = Math.sin(rx);
  [y, z] = [y * c - z * s, y * s + z * c];
  c = Math.cos(ry); s = Math.sin(ry);
  [x, z] = [x * c + z * s, -x * s + z * c];
  c = Math.cos(rz); s = Math.sin(rz);
  [x, y] = [x * c - y * s, x * s + y * c];
  return [x, y, z];
}

const jitter = (random, amount) => (random() - 0.5) * amount;
const rectEdge = (random, x0, y0, x1, y1) => {
  const w = x1 - x0, h = y1 - y0;
  let t = random() * 2 * (w + h);
  if (t < w) return [x0 + t, y0];
  t -= w;
  if (t < h) return [x1, y0 + t];
  t -= h;
  if (t < w) return [x1 - t, y1];
  return [x0, y1 - (t - w)];
};
const rectFill = (random, x0, y0, x1, y1) => [x0 + (x1 - x0) * random(), y0 + (y1 - y0) * random()];
const ring = (random, cx, cy, radius) => {
  const angle = random() * TAU;
  return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
};
function pick(random, parts) {
  const total = parts.reduce((sum, part) => sum + part[0], 0);
  let t = random() * total;
  for (const part of parts) {
    t -= part[0];
    if (t <= 0) return part[1]();
  }
  return parts[parts.length - 1][1]();
}
const ambient = random => [jitter(random, 6.4), jitter(random, 4.2), jitter(random, 2.4)];

const shapes = {
  galaxy(random) {
    let point;
    if (random() < 0.14) {
      const u = random() * 2 - 1, angle = random() * TAU, radius = Math.pow(random(), 1.8) * 0.6, s = Math.sqrt(1 - u * u);
      point = [Math.cos(angle) * s * radius, u * radius * 0.5, Math.sin(angle) * s * radius];
    } else {
      const arm = Math.floor(random() * 3), t = Math.pow(random(), 0.75), radius = 0.3 + t * 2.45;
      const angle = arm * TAU / 3 + radius * 1.6 + jitter(random, 0.9 * (1.15 - t));
      point = [Math.cos(angle) * radius + jitter(random, 0.3), jitter(random, 0.22) * (1.2 - t), Math.sin(angle) * radius + jitter(random, 0.3)];
    }
    return rotate(point, -1.02, 0, 0.32);
  },
  web(random) {
    const point = pick(random, [
      [0.26, () => [...rectEdge(random, -2.2, -1.45, 2.2, 1.45), 0]],
      [0.07, () => [-2.2 + 4.4 * random(), 1.02, 0]],
      [0.04, () => [...ring(random, -2.0 + Math.floor(random() * 3) * 0.16, 1.24, 0.045), 0]],
      [0.08, () => [...rectFill(random, -1.95, 0.5, -0.15, 0.72), 0.08]],
      [0.05, () => [...rectFill(random, -1.95, 0.22, -0.75, 0.34), 0.08]],
      [0.04, () => [...rectFill(random, -1.95, -0.18, -1.15, 0), 0.12]],
      [0.14, () => [...rectEdge(random, 0.15, -0.2, 1.95, 0.82), 0.16]],
      [0.04, () => { const t = random(); return [0.15 + 1.8 * t, -0.2 + 1.02 * t, 0.16]; }],
      [0.22, () => { const x0 = -1.95 + Math.floor(random() * 3) * 1.32; return [...rectEdge(random, x0, -1.22, x0 + 1.18, -0.45), 0.24]; }],
      [0.06, () => ambient(random)],
    ]);
    point[2] += jitter(random, 0.03);
    return rotate(point, 0.1, -0.42, 0);
  },
  mobile(random) {
    const point = pick(random, [
      [0.3, () => [...rectEdge(random, -0.8, -1.6, 0.8, 1.6), 0]],
      [0.04, () => [...rectFill(random, -0.22, 1.42, 0.22, 1.47), 0.02]],
      [0.38, () => {
        const y = 1.02 - Math.floor(random() * 5) * 0.46;
        return pick(random, [
          [0.35, () => [...ring(random, -0.5, y, 0.12), 0.08]],
          [0.4, () => [...rectFill(random, -0.26, y + 0.02, 0.55, y + 0.08), 0.08]],
          [0.25, () => [...rectFill(random, -0.26, y - 0.1, 0.22, y - 0.05), 0.08]],
        ]);
      }],
      [0.1, () => [...ring(random, -0.48 + Math.floor(random() * 4) * 0.32, -1.36, 0.06), 0.06]],
      [0.12, () => [...rectEdge(random, -0.66, -1.22, 0.66, 1.3), 0.04]],
      [0.06, () => ambient(random)],
    ]);
    return rotate(point, 0.08, 0.42, -0.1);
  },
  desktop(random) {
    const windows = [[-1.0, 0.45, 2.6, 1.7, -0.5], [0.25, -0.05, 2.6, 1.7, 0], [1.1, -0.62, 1.7, 1.1, 0.45]];
    const point = pick(random, [
      ...windows.map(([cx, cy, w, h, z], index) => [index === 1 ? 0.36 : 0.29, () => {
        const x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2;
        return pick(random, [
          [0.5, () => [...rectEdge(random, x0, y0, x1, y1), z]],
          [0.12, () => [x0 + w * random(), y1 - 0.22, z]],
          [0.12, () => [x0 + 0.5, y0 + (h - 0.22) * random(), z]],
          [0.26, () => { const row = Math.floor(random() * 4); return [...rectFill(random, x0 + 0.65, y1 - 0.42 - row * 0.28, x1 - 0.2 - (row % 2) * 0.5, y1 - 0.36 - row * 0.28), z + 0.02]; }],
        ]);
      }]),
      [0.06, () => ambient(random)],
    ]);
    return rotate(point, 0.12, -0.35, 0);
  },
  flow(random) {
    const nodes = [[-2.4, -0.7, 0], [-1.2, 0.75, 0.35], [0, -0.25, -0.25], [1.15, 0.95, 0.25], [2.4, -0.15, 0], [0.95, -1.25, 0.35]];
    const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 4]];
    const roll = random();
    if (roll < 0.36) {
      const node = nodes[Math.floor(random() * nodes.length)];
      const u = random() * 2 - 1, angle = random() * TAU, s = Math.sqrt(1 - u * u), radius = 0.2 + jitter(random, 0.03);
      return { point: rotate([node[0] + Math.cos(angle) * s * radius, node[1] + u * radius, node[2] + Math.sin(angle) * s * radius], 0.15, -0.2, 0), flow: -1 };
    }
    if (roll < 0.93) {
      const edgeIndex = Math.floor(random() * edges.length), [a, b] = edges[edgeIndex].map(index => nodes[index]), t = random();
      const control = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + (b[1] > a[1] ? -0.35 : 0.35), (a[2] + b[2]) / 2 + 0.3];
      const q = 1 - t;
      const point = [0, 1, 2].map(axis => q * q * a[axis] + 2 * q * t * control[axis] + t * t * b[axis] + jitter(random, 0.035));
      return { point: rotate(point, 0.15, -0.2, 0), flow: (t + edgeIndex * 0.17) % 1 };
    }
    return { point: ambient(random), flow: -1 };
  },
  orbit(random) {
    const roll = random();
    if (roll < 0.7) {
      const u = random() * 2 - 1, angle = random() * TAU, s = Math.sqrt(1 - u * u), radius = 1.75 + jitter(random, 0.05);
      return rotate([Math.cos(angle) * s * radius, u * radius, Math.sin(angle) * s * radius], 0.35, 0, 0.2);
    }
    if (roll < 0.94) {
      const angle = random() * TAU, radius = 2.7 + jitter(random, 0.06);
      return rotate([Math.cos(angle) * radius, jitter(random, 0.04), Math.sin(angle) * radius], 0.42, 0, 0.24);
    }
    const u = random() * 2 - 1, angle = random() * TAU, s = Math.sqrt(1 - u * u), radius = random() * 1.2;
    return [Math.cos(angle) * s * radius, u * radius, Math.sin(angle) * s * radius];
  },
};

function buildGeometry(count) {
  const random = createRandom(1735);
  const geometry = new BufferGeometry();
  const buffers = SCENE_SHAPES.map(() => new Float32Array(count * 3));
  const seeds = new Float32Array(count * 3);
  const flows = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    SCENE_SHAPES.forEach((name, shapeIndex) => {
      const result = shapes[name](random);
      const point = Array.isArray(result) ? result : result.point;
      if (name === "flow") flows[i] = result.flow;
      buffers[shapeIndex].set(point, i * 3);
    });
    seeds.set([random(), random(), random()], i * 3);
  }
  // 第一组同时作为 position，便于 three 计算包围体。
  geometry.setAttribute("position", new BufferAttribute(buffers[0], 3));
  buffers.forEach((buffer, index) => geometry.setAttribute(`s${index}`, new BufferAttribute(buffer, 3)));
  geometry.setAttribute("seed", new BufferAttribute(seeds, 3));
  geometry.setAttribute("flow", new BufferAttribute(flows, 1));
  return geometry;
}

const vertexShader = `
  attribute vec3 s0; attribute vec3 s1; attribute vec3 s2; attribute vec3 s3; attribute vec3 s4; attribute vec3 s5;
  attribute vec3 seed;
  attribute float flow;
  uniform float uFrom; uniform float uTo; uniform float uMix;
  uniform float uTime; uniform float uPixel; uniform float uSize; uniform float uVelocity; uniform float uFlow; uniform float uDim;
  uniform vec3 uColorA; uniform vec3 uColorB;
  varying vec3 vColor;
  varying float vAlpha;
  vec3 shapeAt(float index) {
    if (index < .5) return s0;
    if (index < 1.5) return s1;
    if (index < 2.5) return s2;
    if (index < 3.5) return s3;
    if (index < 4.5) return s4;
    return s5;
  }
  void main() {
    float local = smoothstep(0., 1., clamp(uMix * 1.5 - seed.x * .5, 0., 1.));
    vec3 point = mix(shapeAt(uFrom), shapeAt(uTo), local);
    vec3 direction = normalize(seed - .5 + 1e-4);
    float burst = sin(local * 3.14159);
    point += direction * burst * (.5 + seed.y * .9);
    point += .035 * vec3(sin(uTime * .7 + seed.y * 20.), cos(uTime * .6 + seed.z * 20.), sin(uTime * .5 + seed.x * 20.));
    point += direction * uVelocity * .35 * seed.z;
    vec4 view = modelViewMatrix * vec4(point, 1.);
    gl_Position = projectionMatrix * view;
    gl_PointSize = uSize * (.55 + seed.y * .95) * uPixel * (9. / -view.z);
    float pulse = flow >= 0. ? smoothstep(.9, 1., fract(flow - uTime * .28)) * uFlow : 0.;
    float twinkle = .75 + .25 * sin(uTime * 2. + seed.x * 40.);
    vAlpha = ((.3 + .7 * seed.z) * twinkle * (1. - burst * .3) + pulse * 1.6) * uDim;
    vColor = mix(uColorA, uColorB, local);
    vColor = mix(vColor, vec3(1.), seed.z > .94 ? .55 : pulse * .7);
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - .5);
    if (d > .5) discard;
    float falloff = 1. - smoothstep(.12, .5, d);
    gl_FragColor = vec4(vColor * falloff * vAlpha * .62, falloff * vAlpha);
    #include <colorspace_fragment>
  }
`;

export function createLightyearScene(canvas, { reduced = false } = {}) {
  const compact = matchMedia("(max-width: 760px)").matches;
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 60);
  camera.position.set(0, 0, 9);

  const geometry = buildGeometry(compact ? 5200 : 9000);
  const uniforms = {
    uFrom: { value: 0 }, uTo: { value: 0 }, uMix: { value: 1 },
    uTime: { value: 0 }, uPixel: { value: 1 }, uSize: { value: compact ? 3.4 : 3 }, uVelocity: { value: 0 }, uFlow: { value: 0 }, uDim: { value: 1 },
    uColorA: { value: new Color("#9ba5ff") }, uColorB: { value: new Color("#9ba5ff") },
  };
  const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false, blending: AdditiveBlending });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  const state = { from: 0, to: 0, mix: 1, velocity: 0, spin: 0, time: 0, side: "left", scale: 1, dim: 1 };
  const current = { x: 0, y: 0, scale: 0.6, dim: 0 };
  const target = { x: 0, y: 0, scale: 1, dim: 1 };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let viewport = { width: 1, height: 1 };
  let frameId = 0;
  let last = performance.now();
  let dirty = true;
  let rendered = false;

  function layoutTarget() {
    const mobile = viewport.width <= 760;
    const halfWidth = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z * camera.aspect;
    const shift = mobile ? 0 : Math.min(2.5, halfWidth * 0.42);
    target.x = state.side === "left" ? shift : state.side === "right" ? -shift : 0;
    target.y = mobile && state.side !== "center" ? 0.95 : 0;
    target.scale = state.scale * (mobile ? 0.72 : 1);
    target.dim = state.dim;
  }

  function resize() {
    viewport = { width: window.innerWidth, height: window.innerHeight };
    const ratio = Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 1.75);
    renderer.setPixelRatio(ratio);
    renderer.setSize(viewport.width, viewport.height, false);
    camera.aspect = viewport.width / Math.max(1, viewport.height);
    camera.updateProjectionMatrix();
    uniforms.uPixel.value = ratio;
    layoutTarget();
    dirty = true;
  }

  function go(index, { color = "#9ba5ff", side = "left", scale = 1, dim = 1 } = {}) {
    const next = Math.max(0, Math.min(SCENE_SHAPES.length - 1, Number(index) || 0));
    const targetColor = new Color(color);
    if (next !== state.to) {
      const shown = uniforms.uColorA.value.clone().lerp(uniforms.uColorB.value, Math.min(1, state.mix));
      if (state.mix >= 1) { state.from = state.to; state.mix = 0; }
      else if (state.mix >= 0.5) { state.from = state.to; state.mix = 1 - state.mix; }
      state.to = next;
      uniforms.uColorA.value.copy(shown);
      uniforms.uColorB.value.copy(targetColor);
      if (reduced) state.mix = 1;
    } else if (state.mix >= 1) {
      uniforms.uColorA.value.copy(targetColor);
      uniforms.uColorB.value.copy(targetColor);
    } else {
      uniforms.uColorB.value.copy(targetColor);
    }
    Object.assign(state, { side, scale, dim });
    layoutTarget();
    dirty = true;
  }

  const onPointer = event => {
    pointer.tx = event.clientX / Math.max(1, viewport.width) - 0.5;
    pointer.ty = event.clientY / Math.max(1, viewport.height) - 0.5;
  };

  function frame(now) {
    frameId = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (document.hidden) return;
    const animating = !reduced || dirty || state.mix < 1;
    if (!animating) return;
    if (!reduced) state.time += dt;
    state.mix = Math.min(1, state.mix + (reduced ? 1 : dt / 1.7));
    state.velocity *= Math.exp(-dt * 3.5);
    const ease = reduced ? 1 : 1 - Math.exp(-dt * 2.6);
    for (const key of ["x", "y", "scale", "dim"]) current[key] += (target[key] - current[key]) * ease;
    pointer.x += (pointer.tx - pointer.x) * (reduced ? 0 : 1 - Math.exp(-dt * 3));
    pointer.y += (pointer.ty - pointer.y) * (reduced ? 0 : 1 - Math.exp(-dt * 3));
    state.spin += dt * state.velocity * 0.6;

    uniforms.uFrom.value = state.from;
    uniforms.uTo.value = state.to;
    uniforms.uMix.value = state.mix;
    uniforms.uTime.value = state.time;
    uniforms.uVelocity.value = Math.min(1.2, Math.abs(state.velocity));
    uniforms.uFlow.value = (state.from === 4 ? 1 - state.mix : 0) + (state.to === 4 ? state.mix : 0);
    uniforms.uDim.value = current.dim;
    points.position.set(current.x, current.y, 0);
    points.scale.setScalar(current.scale);
    points.rotation.y = Math.sin(state.time * 0.22) * 0.26 + pointer.x * 0.28 + state.spin;
    points.rotation.x = Math.sin(state.time * 0.17) * 0.06 + pointer.y * 0.14;
    renderer.render(scene, camera);
    dirty = false;
    if (!rendered) { rendered = true; canvas.dataset.ready = "true"; }
  }

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onPointer, { passive: true });
  frameId = requestAnimationFrame(frame);

  return {
    go,
    // Lenis 速度为每帧像素，这里只取一个温和的扰动量。
    setVelocity(value) { state.velocity = Math.max(-1.5, Math.min(1.5, (Number(value) || 0) / 40)); },
    dispose() {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
