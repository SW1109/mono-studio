import { inspectPhpRuntime, phpBinary } from "./lib/php-runtime.mjs";

try {
  let php = phpBinary(), requireHardening = false;
  for (let index = 2; index < process.argv.length; index++) {
    const flag = process.argv[index];
    if (flag === "--require-hardening") requireHardening = true;
    else if (flag === "--php" && process.argv[index + 1]) php = process.argv[++index];
    else throw new Error("用法：npm run check:php -- [--php PHP可执行文件] [--require-hardening]");
  }
  console.log(JSON.stringify(inspectPhpRuntime(php, { requireHardening }), null, 2));
  console.log("仅核验此 CLI 进程；网站实际 PHP/FPM 版本、配置和工作进程仍需单独确认。");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
