const test = require('node:test');
const assert = require('node:assert/strict');

const serviceRequestsRepo = require('./service-requests.repository');
const tasksRepo = require('./tasks.repository');

test('SEC-M3: service_requests.listComments exige firmId', async () => {
  await assert.rejects(
    () => serviceRequestsRepo.listComments('req-1', { includeInternal: true }),
    /firmId/,
  );
});

test('SEC-M3: tasks.listComments exige firmId', async () => {
  await assert.rejects(() => tasksRepo.listComments('task-1'), /firmId/);
});
