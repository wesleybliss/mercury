import type { NextConfig } from 'next'

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
