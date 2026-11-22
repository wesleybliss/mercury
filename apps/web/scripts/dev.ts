import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { loadRootEnv, webRoot } from './load-root-env'

loadRootEnv()

const port = process.env.PORT || '3015'
const hostname = process.env.HOST || '0.0.0.0'
const useLocalHttps = process.env.USE_LOCAL_HTTPS === 'true'
const tailscaleHost = process.env.TAILSCALE_HOST || 'geekom-a7.ide-cherimoya.ts.net'

const args = [
    'dev',
    '--hostname', hostname,
    '--port', port,
]

if (useLocalHttps) {
    const certDir = path.join(os.homedir(), 'localhost/_certs')
    const cert = path.join(certDir, `${tailscaleHost}.crt`)
    const key = path.join(certDir, `${tailscaleHost}.key`)

    if (!fs.existsSync(cert) || !fs.existsSync(key)) {
        console.error(`USE_LOCAL_HTTPS=true but certs not found:\n  ${cert}\n  ${key}`)
        process.exit(1)
    }

    args.push(
        '--experimental-https',
        '--experimental-https-cert', cert,
        '--experimental-https-key', key,
    )

    console.log(`Starting Next.js with Tailscale TLS for ${tailscaleHost}`)
    console.log(`  https://${tailscaleHost}:${port}/`)
    console.log(`  https://localhost:${port}/`)
} else {
    console.log(`Starting Next.js on http://localhost:${port}/`)
}

const nextBin = path.join(webRoot, 'node_modules/next/dist/bin/next')
const child = spawn(process.execPath, [nextBin, ...args], {
    cwd: webRoot,
    stdio: 'inherit',
    env: process.env,
})

child.on('exit', code => {
    process.exit(code ?? 0)
})
