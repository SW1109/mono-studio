<script setup>
defineProps({ name: { type: String, default: "web" } });
const paths = {
  web: ['M4 5h16v14H4z', 'M4 9h16', 'M7 7h.01M10 7h.01', 'm9 12-2 2 2 2m6-4 2 2-2 2'],
  mobile: ['M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z', 'M10 6h4M11 18h2'],
  desktop: ['M3 4h18v12H3z', 'M8 21h8M12 16v5'],
  workflow: ['M3 3h6v6H3zM15 15h6v6h-6z', 'M9 6h6a3 3 0 0 1 3 3v6', 'm15 12 3 3 3-3M6 9v6a3 3 0 0 0 3 3h3'],
  layers: ['m12 3 9 5-9 5-9-5 9-5Z', 'm3 12 9 5 9-5M3 16l9 5 9-5'],
  activity: ['M3 12h4l3-8 4 16 3-8h4'],
  files: ['M8 3h8l4 4v13H8z', 'M16 3v5h4M4 7v14M11 12h6M11 16h4'],
  users: ['M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M2 21v-2a7 7 0 0 1 14 0v2', 'M17 4a4 4 0 0 1 0 7M22 21v-2a7 7 0 0 0-4-6'],
  package: ['m12 3 9 5v9l-9 5-9-5V8l9-5Z', 'm3 8 9 5 9-5M12 13v9M7.5 5.5l9 5'],
  calendar: ['M4 5h16v16H4z', 'M8 3v4M16 3v4M4 10h16M8 14h2M14 14h2M8 17h2'],
  shopping: ['M3 3h2l3 12h11l2-9H6', 'M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'],
  chart: ['M4 3v18h17', 'M8 17v-5M13 17V8M18 17V5'],
  sparkles: ['m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z', 'M20 2v4M18 4h4'],
  arrow: ['M5 19 19 5M5 5h14v14'],
  check: ['m5 12 4 4L19 6'],
};
</script>

<template><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path v-for="(path, index) in paths[name] || paths.web" :key="index" :d="path" /></svg></template>