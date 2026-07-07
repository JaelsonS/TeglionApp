#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const ignoreFiles = [
    'package-lock.json',
    'frontend/package-lock.json',
    'backend/package-lock.json',
    'LICENSE',
]

const rules = [
    { name: 'Stripe live key', re: /STRIPE_SECRET_KEY\s*=\s*sk_live_[0-9A-Za-z]+/g },
    { name: 'Stripe webhook secret', re: /STRIPE_WEBHOOK_SECRET\s*=\s*whsec_[0-9A-Za-z]+/g },
    { name: 'Brevo API key', re: /BREVO_API_KEY\s*=\s*xkeysib-[0-9A-Za-z-]+/g },
    { name: 'Google OAuth secret', re: /GOOGLE_OAUTH_CLIENT_SECRET\s*=\s*GOCSPX-(?!x{4,})[0-9A-Za-z_-]{10,}/g },
    { name: 'Sentry DSN hardcoded', re: /SENTRY_DSN\s*=\s*https:\/\//g },
    { name: 'Supabase service role key', re: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*[A-Za-z0-9._-]+/g },
    { name: 'JWT secret assignment', re: /JWT_(ACCESS|REFRESH)_SECRET\s*=\s*.+/g },
    { name: 'Redis URL with credentials', re: /REDIS_URL\s*=\s*redis:\/\/.+:.+@/g },
]

function getTrackedFiles() {
    const res = spawnSync('git', ['ls-files'], { encoding: 'utf8' })
    if (res.status !== 0) {
        throw new Error('Não foi possível listar ficheiros rastreados via git ls-files')
    }
    return res.stdout
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((file) => !file.includes('node_modules/'))
        .filter((file) => !ignoreFiles.includes(file))
}

function scanFile(filePath) {
    const content = readFileSync(filePath, 'utf8')
    const findings = []

    for (const rule of rules) {
        const re = new RegExp(rule.re)
        if (re.test(content)) {
            findings.push(rule.name)
        }
    }

    return findings
}

function main() {
    const files = getTrackedFiles()
    const incidents = []

    for (const file of files) {
        try {
            const findings = scanFile(file)
            if (findings.length > 0) {
                incidents.push({ file, findings })
            }
        } catch {
            // skip binary/unreadable files
        }
    }

    if (incidents.length === 0) {
        console.log('✅ Secret scan: sem credenciais expostas em ficheiros rastreados.')
        return
    }

    console.error('❌ Secret scan: foram encontrados potenciais segredos expostos.')
    for (const incident of incidents) {
        console.error(`- ${incident.file}: ${incident.findings.join(', ')}`)
    }
    process.exit(1)
}

main()
