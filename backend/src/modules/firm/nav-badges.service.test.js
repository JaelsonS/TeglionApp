const { test, mock } = require('node:test');
const assert = require('node:assert/strict');

test('nav-badges.service: respeita permissões e agrega contagens', async () => {
  mock.reset();
  const permissions = require('../../utils/permissions');
  const messagesService = require('../messages/messages.service');
  const serviceInquiriesService = require('./service-inquiries.service');
  const consultationsService = require('../consultations/consultations.service');
  const firmObligations = require('../obligations/firm-obligations.service');
  const tasksWorkspace = require('../tasks/tasks-workspace.service');
  const obligationOperational = require('../obligations/obligation-operational.service');

  mock.method(permissions, 'hasPermissionForUser', (_user, perm) =>
    [
      permissions.PERMISSIONS.FIRM_CLIENTS_MANAGE,
      permissions.PERMISSIONS.FIRM_SERVICE_INQUIRIES_MANAGE,
      permissions.PERMISSIONS.FIRM_CONSULTATIONS_MANAGE,
      permissions.PERMISSIONS.FIRM_OBLIGATIONS_MANAGE,
    ].includes(perm),
  );
  mock.method(messagesService, 'getUnreadSummary', async () => ({ total: 3 }));
  mock.method(serviceInquiriesService, 'countUnseen', async () => ({ count: 2 }));
  mock.method(consultationsService, 'getAttentionCount', async () => ({ count: 4 }));
  mock.method(firmObligations, 'listFirmDocuments', async () => ({ total: 5, items: [] }));
  mock.method(tasksWorkspace, 'getMetrics', async () => ({ overdue: 1, critical: 2 }));
  mock.method(obligationOperational, 'getOperationalDashboard', async () => ({
    metrics: { critical: 1, overdue: 3 },
  }));

  const { getNavBadges } = require('./nav-badges.service');
  const data = await getNavBadges({ firmId: 'firm-1', user: { id: 'u1' } });

  assert.deepEqual(data, {
    messages: 3,
    serviceInquiries: 2,
    consultations: 4,
    documents: 5,
    tasks: 3,
    obligations: 4,
  });
});

test('nav-badges.service: sem permissões → zeros sem chamar serviços sensíveis', async () => {
  mock.reset();
  const permissions = require('../../utils/permissions');
  const messagesService = require('../messages/messages.service');
  let messagesCalled = 0;
  mock.method(permissions, 'hasPermissionForUser', () => false);
  mock.method(messagesService, 'getUnreadSummary', async () => {
    messagesCalled += 1;
    return { total: 99 };
  });

  // Re-require after mocks — service already loaded; call again
  delete require.cache[require.resolve('./nav-badges.service')];
  const { getNavBadges } = require('./nav-badges.service');
  const data = await getNavBadges({ firmId: 'firm-1', user: { id: 'u1' } });
  assert.deepEqual(data, {
    messages: 0,
    serviceInquiries: 0,
    consultations: 0,
    documents: 0,
    tasks: 0,
    obligations: 0,
  });
  assert.equal(messagesCalled, 0);
});
