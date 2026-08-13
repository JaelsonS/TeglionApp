/**
 * Orquestração do backup PostgreSQL → Cloudflare R2.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadBackupConfig } = require('./config');
const { buildBackupId, buildDumpObjectKey, buildManifestObjectKey } = require('./naming');
const { sha256File } = require('./checksum');
const { buildManifest } = require('./manifest');
const { acquireBackupLock } = require('./lock');
const { getPgDumpVersion, checkPostgresConnectivity, runPgDump } = require('./dump');
const {
  createR2Client,
  uploadFile,
  uploadJson,
  headObject,
  listDumpObjects,
  deleteObject,
} = require('./r2');
const { planRetention, manifestKeyForDumpKey } = require('./retention');
const { backupLog } = require('./logger');
const { reportBackupFailure } = require('./sentry');
const { safeErrorMessage } = require('./redact');

async function applyRetention({ client, bucket, policy, dryRun }) {
  const objects = await listDumpObjects({ client, bucket });
  const { delete: toDelete, plan } = planRetention(objects, policy);
  backupLog('backup_retention_planned', {
    ...plan,
    dryRun: Boolean(dryRun),
  });

  if (dryRun) {
    backupLog('backup_retention_completed', {
      deleted: 0,
      wouldDelete: toDelete.length,
      dryRun: true,
    });
    return { deleted: [], planned: toDelete, plan };
  }

  const deleted = [];
  for (const key of toDelete) {
    await deleteObject({ client, bucket, key });
    deleted.push(key);
    const manifestKey = manifestKeyForDumpKey(key);
    if (manifestKey) {
      try {
        await deleteObject({ client, bucket, key: manifestKey });
      } catch {
        // manifesto em falta não falha retenção do dump
      }
    }
  }

  backupLog('backup_retention_completed', { deleted: deleted.length, dryRun: false });
  return { deleted, planned: toDelete, plan };
}

async function runBackup(options = {}) {
  const startedAt = Date.now();
  const now = options.now || new Date();
  const env = options.env || process.env;
  let config;
  let lock = null;
  let backupId = null;
  let stage = 'init';
  let dumpPath = null;
  let workDir = null;

  const fail = async (err, extra = {}) => {
    const error = err instanceof Error ? err : new Error(String(err));
    const code = error.code || 'BACKUP_FAILED';
    backupLog('backup_failed', {
      backupId,
      stage,
      code,
      message: safeErrorMessage(error),
      durationMs: Date.now() - startedAt,
      ...extra,
    });
    await reportBackupFailure({
      dsn: config?.sentryDsn || env.SENTRY_DSN,
      error,
      context: {
        backupId,
        stage,
        durationMs: Date.now() - startedAt,
        objectKey: extra.objectKey,
        errorCode: code,
      },
    });
    return {
      ok: false,
      code,
      stage,
      backupId,
      durationMs: Date.now() - startedAt,
      error: safeErrorMessage(error),
    };
  };

  try {
    stage = 'config';
    config = options.config || loadBackupConfig(env);

    stage = 'lock';
    lock = acquireBackupLock(config.lockPath);
    if (!lock.acquired) {
      backupLog('backup_failed', {
        code: 'BACKUP_LOCK_HELD',
        reason: lock.reason,
        holderPid: lock.holderPid,
        stage,
      });
      return {
        ok: false,
        code: 'BACKUP_LOCK_HELD',
        stage,
        reason: lock.reason,
        durationMs: Date.now() - startedAt,
      };
    }

    backupId = buildBackupId(now);
    const dumpObjectKey = buildDumpObjectKey(now);
    const manifestObjectKey = buildManifestObjectKey(now);

    backupLog('backup_started', {
      backupId,
      dryRun: config.dryRun,
      dumpObjectKey,
      databaseIdentity: config.databaseIdentity,
      scriptVersion: config.scriptVersion,
    });

    stage = 'tools';
    const pgDumpVersion = await getPgDumpVersion(config.pgDumpBin);

    stage = 'connectivity';
    await checkPostgresConnectivity(config.databaseUrl, config.pgIsReadyBin);

    workDir = config.workDir || fs.mkdtempSync(path.join(os.tmpdir(), 'teglion-backup-'));
    dumpPath = path.join(workDir, `${backupId}.dump`);

    if (config.dryRun) {
      stage = 'dry_run';
      const client = createR2Client(config.r2);
      // permissões de listagem (read) sem upload/delete
      await listDumpObjects({ client, bucket: config.r2.bucket });
      await applyRetention({
        client,
        bucket: config.r2.bucket,
        policy: config.retention,
        dryRun: true,
      });

      const manifest = buildManifest({
        backupId,
        createdAt: now.toISOString(),
        databaseIdentity: config.databaseIdentity,
        dumpObjectKey,
        manifestObjectKey,
        dumpSizeBytes: 0,
        sha256: null,
        durationMs: Date.now() - startedAt,
        pgDumpVersion,
        scriptVersion: config.scriptVersion,
        status: 'DRY_RUN',
        dryRun: true,
      });

      backupLog('backup_verified', {
        backupId,
        dryRun: true,
        durationMs: Date.now() - startedAt,
      });

      return {
        ok: true,
        dryRun: true,
        backupId,
        dumpObjectKey,
        manifestObjectKey,
        manifest,
        durationMs: Date.now() - startedAt,
      };
    }

    stage = 'dump';
    const dumpResult = await runPgDump({
      databaseUrl: config.databaseUrl,
      outputPath: dumpPath,
      pgDumpBin: config.pgDumpBin,
    });
    backupLog('backup_dump_completed', {
      backupId,
      sizeBytes: dumpResult.sizeBytes,
    });

    stage = 'checksum';
    const sha256 = await sha256File(dumpPath);
    backupLog('backup_checksum_completed', { backupId, sha256 });

    stage = 'upload_dump';
    const client = createR2Client(config.r2);
    await uploadFile({
      client,
      bucket: config.r2.bucket,
      key: dumpObjectKey,
      filePath: dumpPath,
      contentType: 'application/octet-stream',
    });
    backupLog('backup_upload_completed', { backupId, objectKey: dumpObjectKey });

    stage = 'verify_dump';
    const head = await headObject({ client, bucket: config.r2.bucket, key: dumpObjectKey });
    if (!head.exists || head.contentLength !== dumpResult.sizeBytes) {
      const err = new Error('Validação R2 falhou: tamanho ou objecto em falta');
      err.code = 'BACKUP_R2_VERIFY_FAILED';
      throw err;
    }

    stage = 'manifest';
    const manifest = buildManifest({
      backupId,
      createdAt: now.toISOString(),
      databaseIdentity: config.databaseIdentity,
      dumpObjectKey,
      manifestObjectKey,
      dumpSizeBytes: dumpResult.sizeBytes,
      sha256,
      durationMs: Date.now() - startedAt,
      pgDumpVersion,
      scriptVersion: config.scriptVersion,
      status: 'SUCCESS',
      dryRun: false,
    });
    await uploadJson({
      client,
      bucket: config.r2.bucket,
      key: manifestObjectKey,
      object: manifest,
    });

    stage = 'verify_manifest';
    const headManifest = await headObject({
      client,
      bucket: config.r2.bucket,
      key: manifestObjectKey,
    });
    if (!headManifest.exists) {
      const err = new Error('Manifesto não encontrado no R2 após upload');
      err.code = 'BACKUP_R2_VERIFY_FAILED';
      throw err;
    }

    backupLog('backup_verified', {
      backupId,
      dumpObjectKey,
      manifestObjectKey,
      sha256,
      sizeBytes: dumpResult.sizeBytes,
      durationMs: Date.now() - startedAt,
    });

    stage = 'retention';
    await applyRetention({
      client,
      bucket: config.r2.bucket,
      policy: config.retention,
      dryRun: false,
    });

    return {
      ok: true,
      dryRun: false,
      backupId,
      dumpObjectKey,
      manifestObjectKey,
      sha256,
      sizeBytes: dumpResult.sizeBytes,
      manifest,
      durationMs: Date.now() - startedAt,
    };
  } catch (err) {
    return fail(err, { objectKey: undefined });
  } finally {
    if (dumpPath) {
      try {
        fs.unlinkSync(dumpPath);
      } catch {
        // ignore
      }
    }
    if (workDir && workDir.includes('teglion-backup-')) {
      try {
        fs.rmSync(workDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
    if (lock && lock.release) lock.release();
  }
}

module.exports = {
  runBackup,
  applyRetention,
};
