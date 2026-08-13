const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const { contabilRepository } = require('../../../db/supabase/repositories/contabil.repository');
const firmsRepository = require('../../../db/supabase/repositories/firms.repository');
const clientsRepository = require('../../../db/supabase/repositories/clients.repository');
const messagesRepository = require('../../../db/supabase/repositories/messages.repository');
const contabilNotifications = require('../../../services/notifications/contabil-notifications.service');
const reminderSendsRepository = require('../../../db/supabase/repositories/obligation-reminder-sends.repository');
const { processFirm } = require('./obligation-reminders.scheduler');

const FIRM_ID = 'firm-x';

function resetMocks() {
  mock.restoreAll();
}

function obligationDueInDays(days, overrides = {}) {
  const due = new Date();
  due.setHours(0, 0, 0, 0);
  due.setDate(due.getDate() + days);
  return {
    id: 'ob-1',
    clientId: 'client-1',
    title: 'IVA trimestral',
    type: 'IVA',
    status: 'WAITING_CLIENT',
    dueDate: due.toISOString(),
    ...overrides,
  };
}

function wireCommonMocks(obligation) {
  mock.method(contabilRepository, 'syncOverdueObligations', async () => {});
  mock.method(contabilRepository, 'listObligations', async () => [obligation]);
  mock.method(firmsRepository, 'findFirmById', async () => ({ id: FIRM_ID, name: 'Escritório Teste' }));
  mock.method(clientsRepository, 'findClientById', async () => ({
    id: 'client-1',
    email: 'cliente@example.com',
    phone: null,
    displayName: 'Cliente Teste',
  }));
}

test('processFirm: envia mensagem e email na primeira execução do dia', async () => {
  resetMocks();
  const obligation = obligationDueInDays(5);
  wireCommonMocks(obligation);

  let messagesCreated = 0;
  let emailsSent = 0;
  mock.method(messagesRepository, 'createMessage', async () => {
    messagesCreated += 1;
  });
  mock.method(contabilNotifications, 'notifyClientObligationReminder', async () => {
    emailsSent += 1;
  });
  // claim real (não mockado) — primeira chamada do dia deve dar true de qualquer forma,
  // mas aqui simulamos diretamente o comportamento esperado do repositório.
  mock.method(reminderSendsRepository, 'tryClaimReminderSend', async () => true);

  await processFirm(FIRM_ID);

  assert.equal(messagesCreated, 1);
  assert.equal(emailsSent, 1);
});

test('processFirm: NÃO reenvia mensagem nem email se já houver claim para o dia', async () => {
  resetMocks();
  const obligation = obligationDueInDays(5);
  wireCommonMocks(obligation);

  let messagesCreated = 0;
  let emailsSent = 0;
  mock.method(messagesRepository, 'createMessage', async () => {
    messagesCreated += 1;
  });
  mock.method(contabilNotifications, 'notifyClientObligationReminder', async () => {
    emailsSent += 1;
  });
  // Simula que o dia já foi reivindicado (segunda execução do cron no mesmo dia).
  mock.method(reminderSendsRepository, 'tryClaimReminderSend', async () => false);

  await processFirm(FIRM_ID);

  assert.equal(messagesCreated, 0);
  assert.equal(emailsSent, 0);
});

test('processFirm: chama tryClaimReminderSend com o dayBucket de hoje e o obligationId certo', async () => {
  resetMocks();
  const obligation = obligationDueInDays(1);
  wireCommonMocks(obligation);
  mock.method(messagesRepository, 'createMessage', async () => {});
  mock.method(contabilNotifications, 'notifyClientObligationReminder', async () => {});

  const calls = [];
  mock.method(reminderSendsRepository, 'tryClaimReminderSend', async (args) => {
    calls.push(args);
    return true;
  });

  await processFirm(FIRM_ID);

  const today = new Date().toISOString().slice(0, 10);
  assert.equal(calls.length, 2);
  assert.deepEqual(
    calls.map((c) => c.channel).sort(),
    ['email', 'message'],
  );
  for (const call of calls) {
    assert.equal(call.firmId, FIRM_ID);
    assert.equal(call.obligationId, 'ob-1');
    assert.equal(call.dayBucket, today);
  }
});

test('processFirm: obrigação fora da janela de lembrete (d=3) não gera claim nem envio', async () => {
  resetMocks();
  const obligation = obligationDueInDays(3);
  wireCommonMocks(obligation);

  let claimed = false;
  mock.method(reminderSendsRepository, 'tryClaimReminderSend', async () => {
    claimed = true;
    return true;
  });
  mock.method(messagesRepository, 'createMessage', async () => {});
  mock.method(contabilNotifications, 'notifyClientObligationReminder', async () => {});

  await processFirm(FIRM_ID);

  assert.equal(claimed, false);
});
