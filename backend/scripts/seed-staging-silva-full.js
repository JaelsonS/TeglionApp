#!/usr/bin/env node
/**
 * Demo STAGING completa — Silva & Associados (jaelsonsilva345@gmail.com).
 *
 * 1. Catálogo, clientes, obrigações, mensagens, notícias, página base
 * 2. Ofertas principais + site público premium (hubs)
 *
 *   node backend/scripts/seed-staging-silva-full.js
 */
const { spawnSync } = require('child_process');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../..');

const env = {
  ...process.env,
  SEED_OWNER_EMAIL: 'jaelsonsilva345@gmail.com',
  SEED_FIRM_NAME: 'Silva & Associados',
  SEED_OWNER_NAME: 'Jaelson Silva',
  SEED_FIRM_SLUG: 'silva-associados',
  SEED_CITY: 'Lisboa, Portugal',
  SEED_DEMO_ID: 'silva-associados-v1',
  SEED_PUBLIC_TAGLINE:
    'Contabilidade, fiscalidade e consultoria para particulares e PME — com portal do cliente e prazos sempre visíveis.',
  SEED_PRIMARY_COLOR: '#0F4C5C',
  SEED_SECONDARY_COLOR: '#C27803',
  SEED_OWNER_JOB: 'Sócio-gerente',
};

function run(script) {
  const scriptPath = path.join(__dirname, script);
  console.log(`\n▶ ${script}\n`);
  const r = spawnSync(process.execPath, [scriptPath], {
    cwd: REPO_ROOT,
    env,
    stdio: 'inherit',
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run('seed-staging-afdigital-demo.js');
run('polish-staging-public-presentation.js');
console.log('\n✓ Silva & Associados — staging demo completa.\n');
