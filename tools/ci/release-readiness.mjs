#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const root = process.cwd()

function run(command, args, cwd, extraEnv = {}) {
    const pretty = `${command} ${args.join(' ')}`
    console.log(`\n$ (${cwd}) ${pretty}`)

    const res = spawnSync(command, args, {
        cwd,
        stdio: 'inherit',
        env: {
            ...process.env,
            ...extraEnv,
        },
    })

    if (res.status !== 0) {
        throw new Error(`Falhou: ${pretty}`)
    }
}

function main() {
    const frontendDir = path.join(root, 'frontend')
    const backendDir = path.join(root, 'backend')

    console.log('\n=== Release Readiness Teglion ===')
    console.log('Executando checklist automatizado (frontend + backend + operação).')

    run('npm', ['run', 'test'], frontendDir)
    run('npm', ['run', 'build:spa'], frontendDir)
    run('npm', ['run', 'test:e2e'], frontendDir)

    run('npm', ['run', 'test:security-static'], backendDir)
    run('npm', ['run', 'release:gate'], backendDir)

    console.log('\n✅ Release readiness aprovado para GO controlado.\n')
}

try {
    main()
} catch (err) {
    console.error(`\n❌ Release readiness falhou: ${err.message || String(err)}\n`)
    process.exit(1)
}
