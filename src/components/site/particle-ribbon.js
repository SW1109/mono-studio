import { BufferAttribute, BufferGeometry, Color, OrthographicCamera, Points, Scene, ShaderMaterial, WebGLRenderer } from "three";

export function createParticleRibbon(canvas, container) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "low-power" });
  const scene = new Scene();
  const camera = new OrthographicCamera(-5, 5, 4.1, -4.1, .1, 50);
  camera.position.z = 14;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const compact = matchMedia("(max-width: 760px)");
  const count = compact.matches ? 3600 : 6400;
  const coordinates = new Float32Array(count * 3);
  let seed = 1735;
  // 固定分布避免重挂载时闪跳；第三维保存每个光点的亮度和相位。
  for (let i = 0; i < count; i++) {
    for (let axis = 0; axis < 3; axis++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      coordinates[i * 3 + axis] = seed / 4294967296;
    }
    coordinates[i * 3] *= Math.PI * 2;
    coordinates[i * 3 + 1] = coordinates[i * 3 + 1] * 2 - 1;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(coordinates, 3));
  const material = new ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { time: { value: 14 }, pixelRatio: { value: 1 }, lightMode: { value: 0 }, mint: { value: new Color("#8cf2c6") }, violet: { value: new Color("#b9a2ff") }, rose: { value: new Color("#e7a3ee") } },
    vertexShader: `
      uniform float time;
      uniform float pixelRatio;
      uniform float lightMode;
      varying float phase;
      varying float brightness;
      void main() {
        float angle = position.x + time * .045;
        float band = position.y;
        float twist = angle * 1.5 + time * .13;
        float radius = 1.95 + band * 1.7 * cos(twist);
        vec3 point = vec3(radius * cos(angle), radius * sin(angle), band * 1.7 * sin(twist));
        point.z += .2 * sin(angle * 3.0 + time * .22);
        vec4 projected = modelViewMatrix * vec4(point, 1.0);
        phase = .5 + .5 * sin(angle + band * 1.8);
        brightness = (.45 + .55 * position.z) * (.8 + .2 * sin(time * .65 + position.z * 22.0));
        brightness *= smoothstep(-4.0, 2.5, projected.z + 14.0) * .35 + .65;
        brightness = mix(brightness, .76 + .24 * position.z, lightMode);
        gl_Position = projectionMatrix * projected;
        gl_PointSize = (position.z > .88 ? 3.0 : 2.0) * pixelRatio * (1.0 + lightMode * .3);
      }
    `,
    fragmentShader: `
      uniform vec3 mint;
      uniform vec3 violet;
      uniform vec3 rose;
      varying float phase;
      varying float brightness;
      void main() {
        float distanceToCenter = length(gl_PointCoord - .5);
        if (distanceToCenter > .5) discard;
        vec3 color = phase > .5 ? mix(violet, mint, (phase - .5) * 2.0) : mix(rose, violet, phase * 2.0);
        gl_FragColor = vec4(color, brightness * (1.0 - smoothstep(.25, .5, distanceToCenter)));
        #include <colorspace_fragment>
      }
    `,
  });
  const ribbon = new Points(geometry, material);
  ribbon.frustumCulled = false;
  scene.add(ribbon);
  let frame = 0;
  let lastFrame = 0;
  let visible = true;
  let disposed = false;
  let contextLost = false;
  let pointerX = 0;
  let pointerY = 0;
  let tiltX = 0;
  let tiltY = 0;
  const render = () => {
    if (disposed || contextLost) return;
    tiltX += (pointerX - tiltX) * .035;
    tiltY += (pointerY - tiltY) * .035;
    ribbon.rotation.set(1.07 + tiltY * .16, -.4 + tiltX * .2, .35 + material.uniforms.time.value * .025);
    renderer.render(scene, camera);
    canvas.dataset.rendered = "true";
  };
  const tick = now => {
    frame = 0;
    if (disposed || contextLost || !visible || document.hidden || preference.matches) return;
    if (!lastFrame || now - lastFrame >= 30) {
      material.uniforms.time.value += lastFrame ? Math.min(.08, (now - lastFrame) / 1000) : 0;
      lastFrame = now;
      render();
    }
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = 0;
    canvas.dataset.motion = preference.matches ? "reduced" : !visible || document.hidden ? "paused" : "running";
    if (preference.matches) { pointerX = 0; pointerY = 0; render(); }
    else if (visible && !document.hidden && !contextLost) frame = requestAnimationFrame(tick);
  };
  const resize = () => {
    const { width, height } = canvas.parentElement.getBoundingClientRect();
    if (!width || !height || disposed || contextLost) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    material.uniforms.pixelRatio.value = ratio;
    const halfHeight = Math.max(3.9, 3.5 / (width / height));
    camera.left = -halfHeight * width / height;
    camera.right = halfHeight * width / height;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    render();
  };
  const onPointer = event => {
    if (preference.matches || event.pointerType === "touch") return;
    const rect = container.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / rect.width - .5;
    pointerY = (event.clientY - rect.top) / rect.height - .5;
  };
  const resetPointer = () => { pointerX = 0; pointerY = 0; };
  const updateTheme = () => {
    const light = document.documentElement.dataset.theme === "light";
    material.uniforms.lightMode.value = light ? 1 : 0;
    material.uniforms.mint.value.set(light ? "#087253" : "#8cf2c6");
    material.uniforms.violet.value.set(light ? "#4f2090" : "#b9a2ff");
    material.uniforms.rose.value.set(light ? "#a92e7a" : "#e7a3ee");
    render();
  };
  const onContextLost = event => { event.preventDefault(); contextLost = true; canvas.dataset.rendered = "false"; canvas.style.opacity = "0"; sync(); };
  const onContextRestored = () => { contextLost = false; canvas.style.opacity = ""; resize(); sync(); };
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
  observer.observe(container);
  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(canvas.parentElement);
  preference.addEventListener("change", sync);
  window.addEventListener("mono-theme-change", updateTheme);
  document.addEventListener("visibilitychange", sync);
  container.addEventListener("pointermove", onPointer, { passive: true });
  container.addEventListener("pointerleave", resetPointer);
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);
  updateTheme();
  resize();
  sync();

  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    sizeObserver.disconnect();
    preference.removeEventListener("change", sync);
    window.removeEventListener("mono-theme-change", updateTheme);
    document.removeEventListener("visibilitychange", sync);
    container.removeEventListener("pointermove", onPointer);
    container.removeEventListener("pointerleave", resetPointer);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    canvas.removeEventListener("webglcontextrestored", onContextRestored);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  };
}
