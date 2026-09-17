/**
 * Schedulers Teglion — lembretes de obrigações e sync OVERDUE.
 */
const { runAllFirms } = require('./obligation-reminders.scheduler');
const { runAllFirms: runDocumentExpiryReminders } = require('../../documents/document-expiry-reminders.scheduler');

const INTERVAL_MS = 60 * 60 * 1000;
let timer = null;

function startContabilSchedulers() {
  if (timer) return;
  void runAllFirms().catch(() => {});
  void runDocumentExpiryReminders().catch(() => {});
  timer = setInterval(() => {
    void runAllFirms().catch(() => {});
    void runDocumentExpiryReminders().catch(() => {});
  }, INTERVAL_MS);
  if (timer.unref) timer.unref();
}

function stopContabilSchedulers() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = {
  startContabilSchedulers,
  stopContabilSchedulers,
};
