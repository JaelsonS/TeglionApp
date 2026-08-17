/**
 * Fila de jobs do processo.
 *
 * Os jobs correm inline neste processo. Não há polling Redis (RPOP a cada 2s):
 * o Render pago já mantém a API acordada; o Redis fica para rate-limit e cache
 * quando há tráfego real. A fila Redis nunca foi preenchida em produção.
 */

const handlers = new Map();

function registerJobHandler(name, fn) {
  handlers.set(name, fn);
}

async function enqueueJob(name, payload = {}) {
  const handler = handlers.get(name);
  if (!handler) {
    throw new Error(`Job handler não registado: ${name}`);
  }

  await handler(payload);
  return { queued: false, ranInline: true };
}

/** @deprecated A fila Redis não é consumida; jobs correm inline via enqueueJob. */
async function processNextJob() {
  return false;
}

/** @deprecated No-op — não picar o Upstash com RPOP vazio. */
function startJobWorker() {
  return () => {};
}

module.exports = {
  registerJobHandler,
  enqueueJob,
  processNextJob,
  startJobWorker,
};
