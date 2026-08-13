/**
 * Configuração isolada do backup PostgreSQL → R2.
 * Não carrega backend/src/config/env.js (evita exigir JWT_* no Cron Job).
 */

const BACKUP_SCRIPT_VERSION = '1.0.0';

function truthy(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function requireNonEmpty(name, value) {
  const v = String(value || '').trim();
  if (!v) {
    const err = new Error(`Variável obrigatória em falta: ${name}`);
    err.code = 'BACKUP_CONFIG_MISSING';
    err.varName = name;
    throw err;
  }
  return v;
}

function parsePositiveInt(name, raw, fallback) {
  if (raw == null || String(raw).trim() === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    const err = new Error(`Variável inválida: ${name} deve ser inteiro >= 0`);
    err.code = 'BACKUP_CONFIG_INVALID';
    err.varName = name;
    throw err;
  }
  return n;
}

/**
 * Detecta pooler transaction mode (porta 6543) — incompatível com pg_dump.
 */
function assertDumpCompatibleDatabaseUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    const err = new Error('BACKUP_DATABASE_URL inválida');
    err.code = 'BACKUP_CONFIG_INVALID';
    throw err;
  }
  if (!/^postgres(ql)?:$/i.test(parsed.protocol)) {
    const err = new Error('BACKUP_DATABASE_URL deve usar protocolo postgresql://');
    err.code = 'BACKUP_CONFIG_INVALID';
    throw err;
  }
  const port = parsed.port || '5432';
  const host = (parsed.hostname || '').toLowerCase();
  if (port === '6543') {
    const err = new Error(
      'BACKUP_DATABASE_URL usa porta 6543 (Transaction pooler) — incompatível com pg_dump. Use Direct ou Session :5432.',
    );
    err.code = 'BACKUP_CONFIG_INVALID';
    throw err;
  }
  if (host.includes('pooler') && /transaction/i.test(url)) {
    const err = new Error(
      'BACKUP_DATABASE_URL parece Transaction pooler — use Session mode ou Direct :5432.',
    );
    err.code = 'BACKUP_CONFIG_INVALID';
    throw err;
  }
  return {
    host,
    port,
    database: (parsed.pathname || '/').replace(/^\//, '') || 'postgres',
  };
}

function anonymizeDatabaseIdentity(url) {
  try {
    const u = new URL(url);
    const db = (u.pathname || '/').replace(/^\//, '') || 'postgres';
    const host = (u.hostname || 'unknown').replace(/^db\./, '').split('.')[0] || 'unknown';
    // project-ish prefix only — never user/password
    return `supabase:${host}/${db}`;
  } catch {
    return 'supabase:unknown/postgres';
  }
}

function collectMissingRequired(env, names) {
  return names.filter((name) => !String(env[name] || '').trim());
}

function firstNonEmpty(env, names) {
  for (const name of names) {
    const v = String(env[name] || '').trim();
    if (v) return { name, value: v };
  }
  return null;
}

/**
 * Snapshot seguro: só nomes presentes/ausentes (nunca valores).
 * Inclui aliases comuns que o Render/Cloudflare às vezes usam.
 */
function probeBackupEnv(env = process.env) {
  const watched = [
    'BACKUP_DATABASE_URL',
    'BACKUP_DRY_RUN',
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_ENDPOINT',
    // aliases (Cloudflare S3-compatible docs)
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  ];
  const present = [];
  const missing = [];
  const nearMiss = []; // keys that look like R2/BACKUP but aren't exact
  for (const name of watched) {
    if (String(env[name] || '').trim()) present.push(name);
    else missing.push(name);
  }
  for (const name of Object.keys(env)) {
    if (!/^(R2_|BACKUP_|AWS_.*KEY|CLOUDFLARE_R2_)/i.test(name)) continue;
    if (watched.includes(name)) continue;
    nearMiss.push(name);
  }
  return { present, missing, nearMiss };
}

/**
 * Normaliza aliases → nomes canónicos antes da validação.
 */
function normalizeBackupEnv(env = process.env) {
  const out = { ...env };
  const access = firstNonEmpty(env, [
    'R2_ACCESS_KEY_ID',
    'AWS_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
  ]);
  const secret = firstNonEmpty(env, [
    'R2_SECRET_ACCESS_KEY',
    'AWS_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  ]);
  if (access) out.R2_ACCESS_KEY_ID = access.value;
  if (secret) out.R2_SECRET_ACCESS_KEY = secret.value;
  return out;
}

function loadBackupConfig(rawEnv = process.env) {
  const env = normalizeBackupEnv(rawEnv);
  const dryRun = truthy(env.BACKUP_DRY_RUN);

  // Report all missing keys at once (Render typos / empty secrets are common).
  const required = [
    'BACKUP_DATABASE_URL',
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
  ];
  const missing = collectMissingRequired(env, required);
  if (missing.length) {
    const present = required.filter((name) => !missing.includes(name));
    const probe = probeBackupEnv(rawEnv);
    const err = new Error(
      `Variável(eis) obrigatória(s) em falta: ${missing.join(', ')}`
        + (present.length ? ` (presentes: ${present.join(', ')})` : '')
        + (probe.nearMiss.length ? ` (outras keys semelhantes: ${probe.nearMiss.join(', ')})` : ''),
    );
    err.code = 'BACKUP_CONFIG_MISSING';
    err.missing = missing;
    err.present = present;
    err.probe = probe;
    throw err;
  }

  const databaseUrl = requireNonEmpty('BACKUP_DATABASE_URL', env.BACKUP_DATABASE_URL);
  const dbMeta = assertDumpCompatibleDatabaseUrl(databaseUrl);

  const r2AccountId = requireNonEmpty('R2_ACCOUNT_ID', env.R2_ACCOUNT_ID);
  const r2AccessKeyId = requireNonEmpty('R2_ACCESS_KEY_ID', env.R2_ACCESS_KEY_ID);
  const r2SecretAccessKey = requireNonEmpty('R2_SECRET_ACCESS_KEY', env.R2_SECRET_ACCESS_KEY);
  const r2BucketName = requireNonEmpty('R2_BUCKET_NAME', env.R2_BUCKET_NAME);
  let r2Endpoint = String(env.R2_ENDPOINT || '').trim();
  if (!r2Endpoint) {
    r2Endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;
  }
  if (!/^https:\/\//i.test(r2Endpoint)) {
    const err = new Error('R2_ENDPOINT deve usar https://');
    err.code = 'BACKUP_CONFIG_INVALID';
    throw err;
  }

  return {
    dryRun,
    scriptVersion: BACKUP_SCRIPT_VERSION,
    databaseUrl,
    databaseIdentity: anonymizeDatabaseIdentity(databaseUrl),
    databaseHostHint: dbMeta.host,
    databasePort: dbMeta.port,
    databaseName: dbMeta.database,
    r2: {
      accountId: r2AccountId,
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
      bucket: r2BucketName,
      endpoint: r2Endpoint,
      region: String(env.R2_REGION || 'auto').trim() || 'auto',
    },
    retention: {
      dailyDays: parsePositiveInt('BACKUP_RETENTION_DAILY_DAYS', env.BACKUP_RETENTION_DAILY_DAYS, 14),
      weeklyCount: parsePositiveInt('BACKUP_RETENTION_WEEKLY_COUNT', env.BACKUP_RETENTION_WEEKLY_COUNT, 8),
      monthlyCount: parsePositiveInt('BACKUP_RETENTION_MONTHLY_COUNT', env.BACKUP_RETENTION_MONTHLY_COUNT, 12),
    },
    lockPath: String(env.BACKUP_LOCK_PATH || '').trim() || null,
    workDir: String(env.BACKUP_WORK_DIR || '').trim() || null,
    sentryDsn: String(env.SENTRY_DSN || '').trim() || null,
    pgDumpBin: String(env.PG_DUMP_BIN || 'pg_dump').trim() || 'pg_dump',
    pgIsReadyBin: String(env.PG_ISREADY_BIN || 'pg_isready').trim() || 'pg_isready',
  };
}

module.exports = {
  BACKUP_SCRIPT_VERSION,
  loadBackupConfig,
  assertDumpCompatibleDatabaseUrl,
  anonymizeDatabaseIdentity,
  probeBackupEnv,
  normalizeBackupEnv,
  truthy,
  parsePositiveInt,
};
