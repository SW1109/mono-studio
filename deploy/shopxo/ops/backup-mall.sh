#!/usr/bin/env bash
# 商城每日备份：数据库、上传素材、合同文件与站点配置文件。
# 由 root 通过 cron 执行；备份目录权限受限，不放进任何 Web 可访问路径。
set -euo pipefail

SRC=${SRC:?请设置商城源码目录 SRC}
DEST=${DEST:?请设置私有备份目录 DEST}
DB_KEEP=${DB_KEEP:-30}
FILE_KEEP=${FILE_KEEP:-7}
TS=$(date +%Y%m%d-%H%M%S)

[ "$(id -u)" -eq 0 ] || { echo "需要 root 执行"; exit 1; }
[ -f "$SRC/config/database.php" ] || { echo "未找到 $SRC/config/database.php"; exit 1; }
mkdir -p "$DEST/db" "$DEST/files"
chmod 700 "$DEST" "$DEST/db" "$DEST/files"

CNF=$(mktemp)
trap 'rm -f "$CNF"' EXIT
php -r '
$c = require $argv[1];
$c = $c["connections"]["mysql"];
file_put_contents($argv[2], "[client]\nhost=".$c["hostname"]."\nport=".$c["hostport"]."\nuser=".$c["username"]."\npassword=\"".$c["password"]."\"\n");
' "$SRC/config/database.php" "$CNF"
chmod 600 "$CNF"
DB_NAME=$(php -r '$c=require $argv[1]; echo $c["connections"]["mysql"]["database"];' "$SRC/config/database.php")
MYD=$(command -v mysqldump || echo /www/server/mysql/bin/mysqldump)

DB_FILE="$DEST/db/$DB_NAME-$TS.sql.gz"
if ! "$MYD" --defaults-extra-file="$CNF" --single-transaction --quick --no-tablespaces --set-gtid-purged=OFF "$DB_NAME" 2>/dev/null | gzip > "$DB_FILE"; then
  rm -f "$DB_FILE"
  "$MYD" --defaults-extra-file="$CNF" --skip-opt --skip-lock-tables --no-tablespaces --set-gtid-purged=OFF "$DB_NAME" 2>/dev/null | gzip > "$DB_FILE"
fi
gzip -t "$DB_FILE" || { echo "数据库备份解压失败，已保留上一份"; exit 2; }

# 合同文件与上传素材是业务记录；站点配置文件含下载签名密钥，一并纳入但不含数据库口令。
FILE_TAR="$DEST/files/mall-files-$TS.tar.gz"
tar -czf "$FILE_TAR" \
  -C "$SRC" \
  --ignore-failed-read \
  --warning=no-file-changed \
  public/static/upload public/static/mono runtime/contracts \
  mono-site-navigation.json mono-site-config.json mono-contract-payment.json mono-service-catalog.json \
  || [ $? -eq 1 ]

find "$DEST/db" -name '*.sql.gz' -type f -mtime +"$DB_KEEP" -delete
find "$DEST/files" -name '*.tar.gz' -type f -mtime +"$FILE_KEEP" -delete
chmod 600 "$DB_FILE" "$FILE_TAR" 2>/dev/null || true

echo "$TS db=$(du -h "$DB_FILE" | cut -f1) files=$(du -h "$FILE_TAR" | cut -f1) ok"
