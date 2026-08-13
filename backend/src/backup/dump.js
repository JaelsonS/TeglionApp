/**
 * Execução de pg_dump / verificação de conectividade.
 * Connection string nunca é logada.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const { safeErrorMessage } = require('./redact');

function runCommand(bin, args, { env, timeoutMs = 30 * 60 * 1000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      env: { ...process.env, ...(env || {}) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      const err = new Error(`Timeout ao executar ${bin}`);
      err.code = 'BACKUP_CMD_TIMEOUT';
      reject(err);
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
      if (stdout.length > 200_000) stdout = stdout.slice(-100_000);
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
      if (stderr.length > 200_000) stderr = stderr.slice(-100_000);
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

async function getPgDumpVersion(pgDumpBin = 'pg_dump') {
  let result;
  try {
    result = await runCommand(pgDumpBin, ['--version'], { timeoutMs: 15_000 });
  } catch (err) {
    const e = new Error(safeErrorMessage(err));
    e.code = err && err.code === 'ENOENT' ? 'BACKUP_PG_DUMP_MISSING' : 'BACKUP_PG_DUMP_MISSING';
    throw e;
  }
  const { code, stdout, stderr } = result;
  if (code !== 0) {
    const err = new Error(safeErrorMessage(stderr || `pg_dump --version exit ${code}`));
    err.code = 'BACKUP_PG_DUMP_MISSING';
    throw err;
  }
  return String(stdout || stderr || '').trim();
}

/**
 * Verifica conectividade sem imprimir a URL.
 * Usa PGPASSWORD via URI embutida no pg_isready -d (libpq aceita URI).
 */
async function checkPostgresConnectivity(databaseUrl, pgIsReadyBin = 'pg_isready') {
  const { code, stdout, stderr } = await runCommand(
    pgIsReadyBin,
    ['-d', databaseUrl, '-t', '10'],
    { timeoutMs: 20_000 },
  );
  if (code !== 0) {
    const err = new Error(safeErrorMessage(stderr || stdout || 'PostgreSQL indisponível'));
    err.code = 'BACKUP_PG_UNAVAILABLE';
    throw err;
  }
  return true;
}

/**
 * pg_dump -Fc para ficheiro local.
 */
async function runPgDump({ databaseUrl, outputPath, pgDumpBin = 'pg_dump', timeoutMs = 30 * 60 * 1000 }) {
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }

  const args = [
    '--format=custom',
    '--no-owner',
    '--no-acl',
    '--file',
    outputPath,
    databaseUrl,
  ];

  const { code, stderr } = await runCommand(pgDumpBin, args, { timeoutMs });
  if (code !== 0) {
    try {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch {
      // ignore
    }
    const err = new Error(safeErrorMessage(stderr || `pg_dump falhou (exit ${code})`));
    err.code = 'BACKUP_PG_DUMP_FAILED';
    throw err;
  }

  const stat = fs.statSync(outputPath);
  if (!stat.size) {
    const err = new Error('pg_dump produziu ficheiro vazio');
    err.code = 'BACKUP_PG_DUMP_FAILED';
    throw err;
  }

  return { outputPath, sizeBytes: stat.size };
}

module.exports = {
  runCommand,
  getPgDumpVersion,
  checkPostgresConnectivity,
  runPgDump,
};
