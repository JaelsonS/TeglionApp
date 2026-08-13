/**
 * Manifesto não sensível do backup.
 */

function buildManifest({
  backupId,
  createdAt,
  databaseIdentity,
  dumpObjectKey,
  manifestObjectKey,
  dumpSizeBytes,
  sha256,
  durationMs,
  pgDumpVersion,
  scriptVersion,
  status,
  dryRun = false,
  format = 'custom',
}) {
  return {
    backupId,
    createdAt,
    databaseIdentity,
    dumpObjectKey,
    manifestObjectKey,
    dumpSizeBytes,
    sha256,
    durationMs,
    format,
    status,
    dryRun: Boolean(dryRun),
    tools: {
      scriptVersion: scriptVersion || null,
      pgDumpVersion: pgDumpVersion || null,
    },
  };
}

module.exports = { buildManifest };
