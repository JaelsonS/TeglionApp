const test = require('node:test');
const assert = require('node:assert/strict');
const { registerJobHandler, enqueueJob, startJobWorker, processNextJob } = require('./redis-queue');

test('enqueueJob runs the handler inline without Redis', async () => {
  const seen = [];
  registerJobHandler('test:inline', async (payload) => {
    seen.push(payload.n);
  });
  const result = await enqueueJob('test:inline', { n: 7 });
  assert.deepEqual(result, { queued: false, ranInline: true });
  assert.deepEqual(seen, [7]);
});

test('startJobWorker does not poll Redis', () => {
  const stop = startJobWorker();
  assert.equal(typeof stop, 'function');
  stop();
});

test('processNextJob is a no-op', async () => {
  assert.equal(await processNextJob(), false);
});
