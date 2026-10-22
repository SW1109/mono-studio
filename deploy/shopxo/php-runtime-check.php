<?php
// This is an offline deployment check, not an HTTP protection against PHP engine bugs.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

function monoPhpVersionAssessment($version, array $policy)
{
    // Accept stable releases and numeric distribution build suffixes; reject previews.
    if (!is_string($version) || !preg_match('/\A(\d+)\.(\d+)\.(\d+)(?:[-+][0-9][0-9A-Za-z.+~_-]*)?\z/', $version, $parts)
        || preg_match('/dev|alpha|beta|rc/i', $version)) {
        return ['status' => 'rejected', 'reason' => 'PHP 版本不是可核对的正式版本。'];
    }
    $branch = $parts[1].'.'.$parts[2];
    $minimum = $policy['minimumVersions'][$branch] ?? null;
    if (!$minimum) {
        return ['status' => 'rejected', 'reason' => '此 PHP 分支不在项目已审核运行范围内，请使用 PHP 8.3.36 或已审核的更新分支。'];
    }
    if (version_compare($parts[1].'.'.$parts[2].'.'.$parts[3], $minimum, '<')) {
        return ['status' => 'rejected', 'reason' => 'PHP '.$branch.' 必须升级至 '.$minimum.' 或该分支的更新补丁版本（CVE-2026-109618 / CVE-2026-109619）。'];
    }
    return ['status' => 'passed', 'reason' => '达到已审核漏洞的 PHP 版本基线。'];
}

function monoPhpHardeningAssessment(array $values, $version)
{
    $issues = [];
    $disabled = static function ($value) {
        return $value === false || in_array(strtolower(trim((string) $value)), ['', '0', 'off', 'false', 'no', 'none'], true);
    };
    if (!$disabled($values['session.upload_progress.enabled'] ?? false)) {
        $issues[] = '请在实际 php.ini 或 FPM 池中设置 session.upload_progress.enabled=0，并重启全部工作进程。';
    }
    if (version_compare($version, '8.5.0', '>=') && !$disabled($values['fatal_error_backtraces'] ?? false)) {
        $issues[] = 'PHP 8.5 请设置 fatal_error_backtraces=0，并重启全部工作进程。';
    }
    return $issues;
}

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    try {
        $arguments = array_slice($argv, 1);
        foreach ($arguments as $argument) {
            if (!in_array($argument, ['--json', '--require-hardening'], true)) {
                throw new RuntimeException('用法：php php-runtime-check.php [--json] [--require-hardening]');
            }
        }
        $policy = json_decode(file_get_contents(__DIR__.'/php-security-policy.json'), true, 512, JSON_THROW_ON_ERROR);
        if (empty($policy['minimumVersions']) || empty($policy['advisories'])) {
            throw new RuntimeException('PHP 安全版本策略缺失或无效。');
        }
        $assessment = monoPhpVersionAssessment(PHP_VERSION, $policy);
        $configuration = [
            'session.upload_progress.enabled' => ini_get('session.upload_progress.enabled'),
            'fatal_error_backtraces' => ini_get('fatal_error_backtraces'),
        ];
        $issues = monoPhpHardeningAssessment($configuration, PHP_VERSION);
        $passed = $assessment['status'] === 'passed'
            && (!in_array('--require-hardening', $arguments, true) || !$issues);
        $report = [
            'status' => $passed ? 'passed' : 'rejected',
            'version' => PHP_VERSION,
            'binary' => PHP_BINARY,
            'sapi' => PHP_SAPI,
            'loadedIni' => php_ini_loaded_file() ?: null,
            'policyReviewedAt' => $policy['reviewedAt'],
            'advisories' => $policy['advisories'],
            'versionCheck' => $assessment,
            'configuration' => $configuration,
            'hardeningIssues' => $issues,
            'webWorkersVerified' => false,
        ];
        if (in_array('--json', $arguments, true)) {
            echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), PHP_EOL;
        } else {
            echo 'PHP ', PHP_VERSION, ': ', $report['status'], PHP_EOL, $assessment['reason'], PHP_EOL;
            foreach ($issues as $issue) echo $issue, PHP_EOL;
            echo '仅检查本次 CLI 进程；网站实际 PHP/FPM 版本、配置及旧工作进程退出情况仍需核验。', PHP_EOL;
        }
        exit($passed ? 0 : 1);
    } catch (Throwable $error) {
        fwrite(STDERR, $error->getMessage().PHP_EOL);
        exit(1);
    }
}
