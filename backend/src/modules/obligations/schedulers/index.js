/**
 * Schedulers TegLion — lembretes de obrigações e sync OVERDUE.
 */
const { runAllFirms } = require('./obligation-reminders.scheduler');

const INTERVAL_MS = 60 * 60 * 1000;
let timer = null;

function startContabilSchedulers() {
  if (timer) return;
  void runAllFirms().catch(() => {});
  timer = setInterval(() => {
    void runAllFirms().catch(() => {});
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
