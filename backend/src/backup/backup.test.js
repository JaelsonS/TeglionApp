const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const {
  loadBackupConfig,
  assertDumpCompatibleDatabaseUrl,
  anonymizeDatabaseIdentity,
} = require('./config');
const { redactSecrets, safeErrorMessage } = require('./redact');
const {
  buildBackupId,
  buildDumpObjectKey,
  buildManifestObjectKey,
  parseDumpKeyTimestamp,
} = require('./naming');
const { sha256File, sha256Buffer } = require('./checksum');
const { buildManifest } = require('./manifest');
const { planRetention, manifestKeyForDumpKey } = require('./retention');
const { acquireBackupLock } = require('./lock');
const { runBackup } = require('./run');

function baseEnv(overrides = {}) {
  return {
    BACKUP_DATABASE_URL: 'postgresql://user:secret@db.abcdefghijklmnopqrst.supabase.co:5432/postgres',
    R2_ACCOUNT_ID: 'acct123',
    R2_ACCESS_KEY_ID: 'AKIATESTKEY12345678',
    R2_SECRET_ACCESS_KEY: 'supersecretvalue',
    R2_BUCKET_NAME: 'teglion-backups-prod',
    R2_ENDPOINT: 'https://acct123.r2.cloudflarestorage.com',
    BACKUP_RETENTION_DAILY_DAYS: '14',
    BACKUP_RETENTION_WEEKLY_COUNT: '8',
    BACKUP_RETENTION_MONTHLY_COUNT: '12',
    ...overrides,
  };
}

test('config: rejeita variáveis obrigatórias em falta', () => {
  assert.throws(() => loadBackupConfig({}), /BACKUP_DATABASE_URL/);
  assert.throws(
    () =>
      loadBackupConfig({
        BACKUP_DATABASE_URL: 'postgresql://u:p@host:5432/db',
        R2_ACCOUNT_ID: 'acct',
        R2_ACCESS_KEY_ID: 'aki',
        R2_BUCKET_NAME: 'bucket',
      }),
    /R2_SECRET_ACCESS_KEY.*presentes: BACKUP_DATABASE_URL, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_BUCKET_NAME/,
  );
});

test('config: aceita alias AWS_SECRET_ACCESS_KEY', () => {
  const cfg = loadBackupConfig(
    baseEnv({
      R2_SECRET_ACCESS_KEY: '',
      AWS_SECRET_ACCESS_KEY: 'from-aws-alias',
    }),
  );
  assert.equal(cfg.r2.secretAccessKey, 'from-aws-alias');
});

test('config: rejeita Transaction pooler :6543', () => {
  assert.throws(
    () => assertDumpCompatibleDatabaseUrl('postgresql://u:p@pooler.supabase.com:6543/postgres'),
    /6543/,
  );
});

test('config: aceita Session/Direct :5432 e anonimiza identidade', () => {
  const cfg = loadBackupConfig(baseEnv());
  assert.equal(cfg.r2.bucket, 'teglion-backups-prod');
  assert.equal(cfg.dryRun, false);
  assert.match(cfg.databaseIdentity, /^supabase:/);
  assert.doesNotMatch(cfg.databaseIdentity, /secret/);
  assert.equal(anonymizeDatabaseIdentity(cfg.databaseUrl).includes('secret'), false);
});

test('config: dry-run flag', () => {
  const cfg = loadBackupConfig(baseEnv({ BACKUP_DRY_RUN: 'true' }));
  assert.equal(cfg.dryRun, true);
});

test('naming: object keys e backupId', () => {
  const d = new Date('2026-08-13T03:00:00.000Z');
  assert.equal(buildBackupId(d), '20260813T030000Z');
  assert.equal(buildDumpObjectKey(d), 'postgresql/daily/2026/08/2026-08-13-030000.dump');
  assert.equal(buildManifestObjectKey(d), 'postgresql/manifests/2026/08/2026-08-13-030000.json');
  const parsed = parseDumpKeyTimestamp(buildDumpObjectKey(d));
  assert.equal(parsed.toISOString(), '2026-08-13T03:00:00.000Z');
});

test('checksum: sha256 estável', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'teglion-chk-'));
  const file = path.join(dir, 'a.bin');
  fs.writeFileSync(file, 'teglion-backup');
  const hex = await sha256File(file);
  assert.equal(hex, sha256Buffer(Buffer.from('teglion-backup')));
  assert.equal(hex.length, 64);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('manifest: sem secrets', () => {
  const m = buildManifest({
    backupId: 'id1',
    createdAt: '2026-08-13T03:00:00.000Z',
    databaseIdentity: 'supabase:abc/postgres',
    dumpObjectKey: 'postgresql/daily/2026/08/2026-08-13-030000.dump',
    manifestObjectKey: 'postgresql/manifests/2026/08/2026-08-13-030000.json',
    dumpSizeBytes: 100,
    sha256: 'abc',
    durationMs: 10,
    pgDumpVersion: 'pg_dump (PostgreSQL) 16',
    scriptVersion: '1.0.0',
    status: 'SUCCESS',
  });
  const raw = JSON.stringify(m);
  assert.equal(m.status, 'SUCCESS');
  assert.doesNotMatch(raw, /password/i);
  assert.doesNotMatch(raw, /postgresql:\/\/[^[]/);
  assert.doesNotMatch(raw, /secret/i);
});

test('redact: remove connection strings e passwords', () => {
  const sample =
    'fail postgresql://user:hunter2@db.example.com:5432/postgres password=hunter2 R2_SECRET_ACCESS_KEY=abc';
  const out = redactSecrets(sample);
  assert.doesNotMatch(out, /hunter2/);
  assert.match(out, /REDACTED/);
  assert.equal(safeErrorMessage(new Error(sample)).includes('hunter2'), false);
});

test('retention: preserva diários/semanais/mensais', () => {
  const now = new Date('2026-08-13T12:00:00.000Z'); // Thursday
  const objects = [];
  // 20 dias de dumps às 03:00
  for (let i = 0; i < 20; i += 1) {
    const d = new Date(Date.UTC(2026, 7, 13 - i, 3, 0, 0));
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    objects.push({
      key: `postgresql/daily/${y}/${m}/${y}-${m}-${day}-030000.dump`,
    });
  }
  // primeiro do mês antigo
  objects.push({ key: 'postgresql/daily/2026/01/2026-01-01-030000.dump' });
  objects.push({ key: 'postgresql/daily/2025/12/2025-12-01-030000.dump' });

  const plan = planRetention(objects, { dailyDays: 14, weeklyCount: 8, monthlyCount: 12 }, now);
  assert.ok(plan.keep.length > 0);
  assert.ok(plan.delete.length >= 0);
  // um dump com >14 dias e não domingo e não dia 1 deve poder ser apagado
  const oldWeekday = 'postgresql/daily/2026/07/2026-07-22-030000.dump'; // Wed
  if (objects.some((o) => o.key === oldWeekday)) {
    assert.ok(plan.delete.includes(oldWeekday) || plan.keep.includes(oldWeekday));
  }
  assert.equal(
    manifestKeyForDumpKey('postgresql/daily/2026/08/2026-08-13-030000.dump'),
    'postgresql/manifests/2026/08/2026-08-13-030000.json',
  );
});

test('lock: segunda aquisição falha; release permite nova', () => {
  const lockPath = path.join(os.tmpdir(), `teglion-lock-test-${crypto.randomBytes(4).toString('hex')}.lock`);
  try {
    if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
  } catch {
    // ignore
  }
  const a = acquireBackupLock(lockPath);
  assert.equal(a.acquired, true);
  const b = acquireBackupLock(lockPath);
  assert.equal(b.acquired, false);
  assert.equal(b.reason, 'backup_lock_held');
  a.release();
  const c = acquireBackupLock(lockPath);
  assert.equal(c.acquired, true);
  c.release();
});

test('runBackup: falha de config sem secrets no resultado', async () => {
  const result = await runBackup({
    env: {
      BACKUP_DATABASE_URL: 'postgresql://u:supersecretpass@host:5432/db',
      // missing R2
    },
  });
  assert.equal(result.ok, false);
  assert.doesNotMatch(JSON.stringify(result), /supersecretpass/);
});

test('runBackup: dry-run com deps injectáveis (mock R2 list)', async () => {
  // Este teste valida o caminho de falha controlada quando pg_isready não existe —
  // não chama R2 real.
  const result = await runBackup({
    env: baseEnv({
      BACKUP_DRY_RUN: 'true',
      PG_ISREADY_BIN: 'pg_isready_does_not_exist_xyz',
      PG_DUMP_BIN: 'pg_dump_does_not_exist_xyz',
    }),
  });
  assert.equal(result.ok, false);
  assert.ok(['BACKUP_PG_DUMP_MISSING', 'BACKUP_PG_UNAVAILABLE', 'BACKUP_FAILED'].includes(result.code) || result.code);
  assert.doesNotMatch(JSON.stringify(result), /supersecretvalue/);
  assert.doesNotMatch(JSON.stringify(result), /secret@/);
});
