/**
 * Lock de ficheiro para impedir execuções concorrentes do backup.
 * Não usa Redis.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULT_LOCK_NAME = 'teglion-postgres-backup.lock';

function resolveLockPath(customPath) {
  if (customPath) return path.resolve(customPath);
  return path.join(os.tmpdir(), DEFAULT_LOCK_NAME);
}

/**
 * Tenta adquirir lock exclusivo.
 * @returns {{ acquired: true, lockPath: string, release: () => void } | { acquired: false, lockPath: string, reason: string }}
 */
function acquireBackupLock(customPath) {
  const lockPath = resolveLockPath(customPath);
  try {
    const fd = fs.openSync(lockPath, 'wx');
    const payload = JSON.stringify({
      pid: process.pid,
      startedAt: new Date().toISOString(),
    });
    fs.writeSync(fd, payload);
    fs.closeSync(fd);

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      try {
        fs.unlinkSync(lockPath);
      } catch {
        // ignore
      }
    };

    return { acquired: true, lockPath, release };
  } catch (err) {
    if (err && err.code === 'EEXIST') {
      let holder = null;
      try {
        holder = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      } catch {
        holder = null;
      }
      return {
        acquired: false,
        lockPath,
        reason: 'backup_lock_held',
        holderPid: holder?.pid || null,
        holderStartedAt: holder?.startedAt || null,
      };
    }
    throw err;
  }
}

module.exports = {
  acquireBackupLock,
  resolveLockPath,
  DEFAULT_LOCK_NAME,
};
