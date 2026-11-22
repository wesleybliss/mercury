Build a minimal, single-user native Android app in Kotlin + Jetpack Compose using Material 3 Expressive (androidx.compose.material3:material3:1.5.0) to browse, verify, and install Android APK dev builds via a private Vercel API backed by Cloudflare R2.

### Core Requirements
1. **Small Release Bundle:** Configure R8 (`isMinifyEnabled = true`, `isShrinkResources = true`) in `build.gradle.kts`. Keep dependencies minimal: Jetpack Compose, Material 3 Expressive, OkHttp, Kotlinx Serialization, DataStore Preferences, and AndroidX Credentials (`androidx.credentials` + `googleid`).
2. **Configuration:** Read `API_BASE_URL` (e.g. `https://builds.yourdomain.com`) and `GOOGLE_WEB_CLIENT_ID` from `local.properties` into `BuildConfig`. Provide a `local.properties.example`. No API secrets or R2 keys in the app.
3. **Authentication Flow:**
   - On launch, check DataStore for a saved session JWT. If absent, show a clean M3 Expressive Sign-In screen with a "Sign in with Google" button.
   - Use Android Credential Manager (`GetGoogleIdOption` with `GOOGLE_WEB_CLIENT_ID`) to obtain a Google ID token.
   - `POST` `{ "idToken": "<token>" }` to `${API_BASE_URL}/api/auth/google`.
   - Save the returned 30-day `token` in DataStore and navigate to the Build List screen.
   - Attach `Authorization: Bearer <token>` to all subsequent API requests. If any API call returns `401`, clear the saved token and return to the Sign-In screen. Include a Sign Out button in the top bar.
4. **Build List Screen (Material 3 Expressive):**
   - Fetch `GET ${API_BASE_URL}/api/builds` on launch and on pull-to-refresh.
   - Response schema: JSON array of `{ id, app, timestamp, branch, commit, notes, sha256, apkKey, sizeBytes }`.
   - Use M3 Expressive styling: dynamic color (Android 12+), expressive typography hierarchy, rounded container cards, and filter chips at the top to filter by `app` name.
   - Each card shows: app name, formatted/relative timestamp, branch + short commit pill, change notes, file size (MB), and an "Install" button.
5. **Download, Verify, and Install Flow:**
   - Tapping "Install" calls `GET ${API_BASE_URL}/api/builds/download?key=<urlEncodedApkKey>` to receive `{ "url": "<presigned-r2-url>" }`.
   - Download the APK directly from the presigned URL into `context.cacheDir/apks/` using OkHttp (do NOT send the `Authorization` header to R2) with a live determinate progress bar on the card.
   - Compute the downloaded file's SHA-256 checksum and compare it against `manifest.sha256`.
   - If the checksum mismatches, delete the file and show an error snackbar.
   - If it matches, check `packageManager.canRequestPackageInstalls()`. If false, prompt and open `Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES`. If true, launch `Intent.ACTION_VIEW` with a `FileProvider` URI and MIME type `application/vnd.android.package-archive`.
   - Clean up old cached APKs on startup so cache doesn't bloat.
6. **Manifest & Permissions:** Include `INTERNET` and `REQUEST_INSTALL_PACKAGES`, plus a properly configured `FileProvider` in `AndroidManifest.xml` and `res/xml/file_paths.xml`.
