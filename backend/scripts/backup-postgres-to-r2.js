#!/usr/bin/env node
/**
 * CLI: backup PostgreSQL → Cloudflare R2
 *
 * Uso:
 *   node backend/scripts/backup-postgres-to-r2.js
 *   BACKUP_DRY_RUN=true npm run backup:postgres
 *
 * Exit 0 = sucesso / dry-run OK
 * Exit 1 = falha
 * Exit 2 = lock em uso (outra execução)
 */

const path = require('path');

// Carregar .env local se existir (Cron Render usa env injectadas — sem ficheiro).
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {
  // dotenv opcional
}

const { runBackup } = require('../src/backup/run');

async function main() {
  const result = await runBackup();
  if (result.ok) {
    process.exitCode = 0;
    return;
  }
  if (result.code === 'BACKUP_LOCK_HELD') {
    process.exitCode = 2;
    return;
  }
  process.exitCode = 1;
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({
    event: 'backup_failed',
    code: 'BACKUP_UNHANDLED',
    message: String(err && err.message ? err.message : err).slice(0, 300),
  }));
  process.exitCode = 1;
});
