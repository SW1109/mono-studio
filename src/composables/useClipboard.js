import { onBeforeUnmount, ref } from "vue";

export function useClipboard() {
  const copied = ref("");
  const message = ref("");
  let timer;
  let disposed = false;

  async function copy(value, label) {
    clearTimeout(timer);
    copied.value = "";
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      if (disposed) return;
      copied.value = label;
      message.value = `${label}已复制。`;
    } catch {
      if (disposed) return;
      message.value = `未能自动复制，请选中并手动复制${label}：${value}`;
    }
    timer = setTimeout(() => { copied.value = ""; }, 3000);
  }

  onBeforeUnmount(() => {
    disposed = true;
    clearTimeout(timer);
  });
  return { copied, message, copy };
}