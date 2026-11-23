import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { NextConfig } from 'next'

// Shared monorepo-root .env (kept outside apps/web so uploader can share it).
// Loaded directly here rather than importing a local .ts helper because Next.js's
// CJS config transpiler fails on relative .ts imports under "type": "module".
const configDir = path.dirname(fileURLToPath(import.meta.url))
for (const envFile of ['.env.local', '.env']) {
    const filePath = path.resolve(configDir, '../..', envFile)
    if (fs.existsSync(filePath)) {
        process.loadEnvFile(filePath)
    }
}

const tailscaleHost = process.env.TAILSCALE_HOST || 'geekom-a7.ide-cherimoya.ts.net'
const tailscaleShortHost = tailscaleHost.split('.')[0] ?? tailscaleHost

const nextConfig: NextConfig = {
    reactStrictMode: true,
    // Allow Tailscale MagicDNS origin during local HTTPS dev (HMR / assets)
    allowedDevOrigins: [
        tailscaleHost,
        tailscaleShortHost,
        `**.${tailscaleHost.split('.').slice(1).join('.')}`,
    ],
}

export default nextConfig
