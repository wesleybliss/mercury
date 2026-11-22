Allow rclone to upload files to the Cloudflare R2 bucket.

Example script:
```
#!/usr/bin/env bash
set -euo pipefail

APK_PATH="${1:?Usage: push-build <path-to-apk> [app-name] [notes]}"
APP_NAME="${2:-$(basename "$PWD")}"
NOTES="${3:-$(git log -1 --pretty=%s 2>/dev/null || echo "Manual build")}"

BUCKET="r2:dev-builds"
TS="$(date -u +%Y%m%d-%H%M)"
DIR="${APP_NAME}/${TS}"
SHA256="$(sha256sum "$APK_PATH" | awk '{print $1}')"
SIZE="$(stat -c%s "$APK_PATH")"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "none")"
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo "none")"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

# 1. Create manifest.json
jq -n \
  --arg id "${APP_NAME}-${TS}" \
  --arg app "$APP_NAME" \
  --arg ts "$TS" \
  --arg branch "$BRANCH" \
  --arg commit "$COMMIT" \
  --arg notes "$NOTES" \
  --arg sha256 "$SHA256" \
  --arg apk_key "${DIR}/app.apk" \
  --argjson size "$SIZE" \
  '{id:$id, app:$app, timestamp:$ts, branch:$branch, commit:$commit, notes:$notes, sha256:$sha256, apkKey:$apk_key, sizeBytes:$size}' \
  > "$TMP_DIR/manifest.json"

# 2. Upload APK and manifest
rclone copyto "$APK_PATH" "${BUCKET}/${DIR}/app.apk" --progress
rclone copyto "$TMP_DIR/manifest.json" "${BUCKET}/${DIR}/manifest.json"

# 3. Prepend to root index.json (keep latest 50)
rclone copyto "${BUCKET}/index.json" "$TMP_DIR/index.json" 2>/dev/null || echo "[]" > "$TMP_DIR/index.json"
jq --slurpfile new "$TMP_DIR/manifest.json" '($new + .) | .[0:50]' "$TMP_DIR/index.json" > "$TMP_DIR/index_new.json"
rclone copyto "$TMP_DIR/index_new.json" "${BUCKET}/index.json"

echo "Uploaded ${DIR} (SHA256: ${SHA256:0:12}...)"
```
