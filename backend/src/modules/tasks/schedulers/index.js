const { runAllFirms, processFirm } = require('./internal-recurring.scheduler')

const INTERVAL_MS = 60 * 60 * 1000
let timer = null

function startTaskSchedulers() {
  if (timer) return
  void runAllFirms().catch(() => {})
  timer = setInterval(() => {
    void runAllFirms().catch(() => {})
  }, INTERVAL_MS)
  if (timer.unref) timer.unref()
}

function stopTaskSchedulers() {
  if (timer) clearInterval(timer)
  timer = null
}

module.exports = {
  startTaskSchedulers,
  stopTaskSchedulers,
  runAllTaskSchedulers: runAllFirms,
  processTaskFirm: processFirm,
}