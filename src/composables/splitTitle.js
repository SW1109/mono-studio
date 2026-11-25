// 按中文标点断行，供标题逐行动画使用；不用正则后行断言，兼容较旧的 Safari。
export function splitTitle(text = "") {
  return String(text)
    .split("\n")
    .flatMap(part => part.replace(/([，。：！？；])(?=.)/g, "$1\u0000").split("\u0000"))
    .map(line => line.trim())
    .filter(Boolean);
}
