Build a minimal, stateless, single-user Next.js (App Router) web app and API deployed on Vercel to browse and download private Android APK dev builds stored in Cloudflare R2, supporting both browser access (via Auth.js v5 / NextAuth) and a native Android client (via Bearer JWT).

### Code Style & Stack
- TypeScript, 4-space indentation, no semicolons, omit unnecessary braces where clean.
- Next.js (App Router), Tailwind CSS v4, shadcn/ui, Plus Jakarta Sans or Inter font.
- `next-auth@beta` (Auth.js v5) with Google Provider and stateless `jwt` session strategy (no database).
- `jose` (for verifying Android Google ID tokens against Google's JWKS and signing/verifying 30-day mobile Bearer JWTs).
- `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` (for Cloudflare R2 S3-compatible access).

### Environment Variables (`.env.example`)
- `R2_ENDPOINT` (e.g. `https://<account_id>.r2.cloudflarestorage.com`)
- `R2_BUCKET` (e.g. `dev-builds`)
- `R2_ACCESS_KEY_ID` (Read-Only R2 token)
- `R2_SECRET_ACCESS_KEY`
- `AUTH_SECRET` (used by Auth.js v5 and for signing mobile JWTs)
- `AUTH_GOOGLE_ID` (Google Web Client ID)
- `AUTH_GOOGLE_SECRET` (Google Web Client Secret)
- `ALLOWED_EMAIL`

### Authentication Architecture
1. **Web Auth (Auth.js v5):**
   - Configure Google Provider in `auth.ts` with `session: { strategy: "jwt" }`.
   - In the `signIn` callback, allow sign-in ONLY if `profile?.email_verified === true` and `profile?.email?.toLowerCase() === process.env.ALLOWED_EMAIL?.toLowerCase()`. Reject all other accounts.
2. **Mobile Auth (`POST /api/auth/google`):**
   - Accepts JSON `{ idToken: string }` from the native Android app's Credential Manager.
   - Verifies `idToken` using `jose` (`createRemoteJWKSet` pointing to `https://www.googleapis.com/oauth2/v3/certs`), checking `issuer` (`https://accounts.google.com` or `accounts.google.com`), `audience` (`AUTH_GOOGLE_ID`), `email_verified === true`, and `email.toLowerCase() === ALLOWED_EMAIL.toLowerCase()`.
   - If valid, signs and returns a 30-day HS256 JWT (`{ token, expiresAt }`) using `AUTH_SECRET`. Returns `401` on failure.
3. **Unified Auth Helper (`lib/verify-auth.ts`):**
   - Checks `Authorization: Bearer <token>` first and verifies the HS256 JWT with `AUTH_SECRET`.
   - If no Bearer header is present, falls back to Auth.js `auth()` to check the browser session cookie.
   - Returns the verified user email or `null`.

### API Endpoints
1. **`GET /api/builds`**
   - Protected by `verify-auth.ts` (returns `401` if unauthorized).
   - Fetches `index.json` from the R2 bucket via `GetObjectCommand` and returns its JSON array (`Cache-Control: no-store`).
   - Schema of each item: `{ id, app, timestamp, branch, commit, notes, sha256, apkKey, sizeBytes }`.
   - If `index.json` does not exist yet (`NoSuchKey`), return `[]`.
2. **`GET /api/builds/download`**
   - Protected by `verify-auth.ts`.
   - Reads `key` query parameter (e.g. `my-app/20261122-1630/app.apk`).
   - Validates that `key` is non-empty, ends with `.apk`, and does not contain `..` or start with `/`.
   - Generates a 5-minute presigned GET URL using `getSignedUrl` with `ResponseContentType: "application/vnd.android.package-archive"`.
   - If `?redirect=1` is passed (for direct web browser downloads), return a `302` redirect to the presigned URL; otherwise return `{ url }` as JSON (for the Android app).

### Web UI (Mobile-First)
- **Unauthenticated:** Clean, centered sign-in page with a "Sign in with Google" button.
- **Authenticated (`/`):**
  - Header with app title, refresh button, and Sign Out button.
  - Filter pills at the top to filter builds by `app` name.
  - Responsive list of build cards showing: app name, relative/formatted timestamp, branch + short commit badge, change notes, file size (MB), copyable SHA-256 snippet, and a "Download APK" button that triggers `/api/builds/download?key=<apkKey>&redirect=1`.
