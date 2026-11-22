# Mercury

pnpm monorepo for browsing and uploading private Android APK dev builds (Cloudflare R2).

Shared config lives in the repo-root [`.env`](.env) / [`.env.sample`](.env.sample) (used by both apps).

## Uploading an APK

Requires `rclone`, `jq`, and write-capable `R2_*` credentials in the root `.env`.

```bash
pnpm push-build <path-to-apk> [app-name] [notes]
```

| Arg | Default | Purpose |
| --- | --- | --- |
| `path-to-apk` | *(required)* | Local APK file to upload |
| `app-name` | current directory name | Groups builds under `<app>/<timestamp>/` |
| `notes` | latest git commit subject, or `"Manual build"` | Shown in the web UI |

Also recorded automatically: UTC timestamp, git branch, short commit, SHA-256, and size.

Example:

```bash
pnpm push-build ./app/build/outputs/apk/debug/app-debug.apk my-app "fix login crash"
```

This uploads `app.apk` + `manifest.json` to R2 and prepends the build to root `index.json` (keeps the latest 50).
