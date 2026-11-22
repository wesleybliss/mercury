import { spawn } from 'node:child_process'
import path from 'node:path'

import { loadRootEnv, webRoot } from './load-root-env'

loadRootEnv()

const args = process.argv.slice(2)

if (args.length === 0) {
    console.error('Usage: with-env <command> [args...]')
    process.exit(1)
}

const [command, ...commandArgs] = args
const nextBin = path.join(webRoot, 'node_modules/next/dist/bin/next')
const resolvedCommand = command === 'next' ? process.execPath : command
const resolvedArgs = command === 'next' ? [nextBin, ...commandArgs] : commandArgs

const child = spawn(resolvedCommand, resolvedArgs, {
    cwd: webRoot,
    stdio: 'inherit',
    env: process.env,
})

child.on('exit', code => {
    process.exit(code ?? 0)
})
