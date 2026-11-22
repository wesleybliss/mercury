import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Monorepo root: apps/web/scripts -> ../../.. */
export const monorepoRoot = path.resolve(__dirname, '../../..')
export const webRoot = path.resolve(__dirname, '..')

export function loadEnvFile(filePath: string): void {
    if (!fs.existsSync(filePath))
        return

    for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
        const trimmed = line.trim()

        if (!trimmed || trimmed.startsWith('#'))
            continue

        const eq = trimmed.indexOf('=')

        if (eq === -1)
            continue

        const key = trimmed.slice(0, eq).trim()
        let value = trimmed.slice(eq + 1).trim()

        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        )
            value = value.slice(1, -1)

        if (!(key in process.env))
            process.env[key] = value
    }
}

/** Load shared env from the monorepo root (both apps read the same files). */
export function loadRootEnv(): void {
    loadEnvFile(path.join(monorepoRoot, '.env'))
    loadEnvFile(path.join(monorepoRoot, '.env.local'))
}
