import type { NextConfig } from 'next'

import { loadRootEnv } from './scripts/load-root-env'

// Shared monorepo-root .env (kept outside apps/web so uploader can share it)
loadRootEnv()

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
