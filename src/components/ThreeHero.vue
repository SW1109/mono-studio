<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import * as THREE from "three";

const canvas = ref(null);
const mobileQuery = matchMedia("(max-width: 768px)");
const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");

let destroyScene = () => {};

function createScene() {
  if (!canvas.value || mobileQuery.matches) return () => {};

  const el = canvas.value;
  const renderer = new THREE.WebGLRenderer({
    canvas: el,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  const pixelRatio = Math.min(devicePixelRatio || 1, 2.25);
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6.25);

  const accent = new THREE.Color(readAccent());
  const geometry = new THREE.IcosahedronGeometry(1.4, 1);
  const solidMaterial = new THREE.MeshStandardMaterial({
    color: accent,
    metalness: 0.4,
    roughness: 0.2,
    transparent: true,
    opacity: 0.13,
    side: THREE.DoubleSide,
  });
  const solid = new THREE.Mesh(geometry, solidMaterial);
  scene.add(solid);

  const wireMaterial = new THREE.MeshBasicMaterial({
    color: accent,
    wireframe: true,
    transparent: true,
    opacity: 0.58,
  });
  const wire = new THREE.Mesh(geometry, wireMaterial);
  wire.scale.setScalar(1.01);
  scene.add(wire);

  const haloGeometry = new THREE.SphereGeometry(1.53, 64, 64);
  const haloMaterial = new THREE.ShaderMaterial({
    uniforms: { glowColor: { value: accent.clone() } },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        float facing = abs(dot(normalize(vNormal), normalize(vViewPosition)));
        float fresnel = pow(1.0 - facing, 3.4);
        gl_FragColor = vec4(glowColor, fresnel * 0.16);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
  });
  const halo = new THREE.Mesh(haloGeometry, haloMaterial);
  scene.add(halo);

  const ringGeometry = new THREE.TorusGeometry(1.83, 0.006, 8, 180);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: accent,
    transparent: true,
    opacity: 0.26,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const rings = [0, 1, 2].map((index) => {
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.set(Math.PI * (0.28 + index * 0.19), index * 0.7, index * 0.52);
    ring.scale.setScalar(0.94 + index * 0.075);
    scene.add(ring);
    return ring;
  });

  const innerGeometry = new THREE.OctahedronGeometry(0.65);
  const innerMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.8,
    roughness: 0.1,
    transparent: true,
    opacity: 0.55,
  });
  const inner = new THREE.Mesh(innerGeometry, innerMaterial);
  scene.add(inner);

  const particleCount = 128;
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 2.2 + Math.random() * 2.5;
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: accent,
    size: 0.032,
    transparent: true,
    opacity: 0.62,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const accentLight = new THREE.PointLight(accent, 2, 10);
  accentLight.position.set(3, 3, 3);
  scene.add(accentLight);
  const coolLight = new THREE.PointLight(0x4466ff, 1.4, 10);
  coolLight.position.set(-3, -2, 2);
  scene.add(coolLight);

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let frame = 0;
  let visible = true;

  const resize = () => {
    const width = Math.max(el.clientWidth, 1);
    const height = Math.max(el.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(el);
  resize();

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  });
  visibilityObserver.observe(el);

  const onPointerMove = (event) => {
    targetX = (event.clientY / innerHeight - 0.5) * 0.6;
    targetY = (event.clientX / innerWidth - 0.5) * 0.6;
  };
  if (matchMedia("(hover: hover)").matches) {
    addEventListener("pointermove", onPointerMove, { passive: true });
  }

  const updateTheme = () => {
    const color = new THREE.Color(readAccent());
    solidMaterial.color.copy(color);
    wireMaterial.color.copy(color);
    particleMaterial.color.copy(color);
    ringMaterial.color.copy(color);
    haloMaterial.uniforms.glowColor.value.copy(color);
    accentLight.color.copy(color);
  };
  const themeObserver = new MutationObserver(updateTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });

  const render = (time = 0) => {
    frame = requestAnimationFrame(render);
    if (!visible) return;

    const t = time * 0.001;
    if (!reducedQuery.matches) {
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;
      solid.rotation.set(currentX + t * 0.18, currentY + t * 0.22, 0);
      wire.rotation.copy(solid.rotation);
      inner.rotation.set(-t * 0.3, t * 0.4, 0);
      particles.rotation.set(t * 0.04, t * 0.08, 0);
      rings.forEach((ring, index) => {
        ring.rotation.z = t * (index % 2 ? -0.12 : 0.1) + index * 0.7;
        ring.rotation.y += 0.0015 * (index + 1);
      });
      const breathe = 1 + Math.sin(t * 0.9) * 0.04;
      solid.scale.setScalar(breathe);
      wire.scale.setScalar(breathe * 1.01);
      halo.scale.setScalar(breathe * 1.02);
    }
    renderer.render(scene, camera);
  };
  frame = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(frame);
    removeEventListener("pointermove", onPointerMove);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    themeObserver.disconnect();
    geometry.dispose();
    solidMaterial.dispose();
    wireMaterial.dispose();
    haloGeometry.dispose();
    haloMaterial.dispose();
    ringGeometry.dispose();
    ringMaterial.dispose();
    innerGeometry.dispose();
    innerMaterial.dispose();
    particleGeometry.dispose();
    particleMaterial.dispose();
    renderer.dispose();
  };
}

function readAccent() {
  return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#FF5C1A";
}

function syncScene() {
  destroyScene();
  destroyScene = createScene();
}

onMounted(() => {
  syncScene();
  mobileQuery.addEventListener("change", syncScene);
});

onBeforeUnmount(() => {
  mobileQuery.removeEventListener("change", syncScene);
  destroyScene();
});
</script>

<template>
  <canvas id="hero3d" ref="canvas" aria-hidden="true"></canvas>
</template>
