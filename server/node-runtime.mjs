import { readFileSync } from "node:fs";

export const nodePolicy = Object.freeze(JSON.parse(readFileSync(new URL("./node-security-policy.json", import.meta.url), "utf8")));
export function assertNodeVersion(version = process.versions.node) {
  const parts = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  const minimum = parts && nodePolicy.minimumVersions[parts[1]];
  if (minimum) {
    const actual = parts.slice(1).map(Number), required = minimum.split(".").map(Number);
    if (actual[1] > required[1] || (actual[1] === required[1] && actual[2] >= required[2])) return version;
  }
  throw new Error(`Node.js ${version} 未达到项目安全版本要求，请升级至 ${nodePolicy.recommended} 或受支持分支的修复版本。`);
}
