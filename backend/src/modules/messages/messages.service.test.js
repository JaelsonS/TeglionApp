const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const messagesRepository = require('../../db/supabase/repositories/messages.repository');
const conversationsRepository = require('../../db/supabase/repositories/conversations.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const contabilStorage = require('../../services/storage/contabil-storage.service');
const tasksWorkspace = require('../tasks/tasks-workspace.service');
const activityService = require('../../services/activity/activity.service');
const messagesService = require('./messages.service');

const FIRM_ID = 'firm-x';
const CLIENT_ID = 'client-1';

function resetMocks() {
  mock.restoreAll();
}

function mockCommon() {
  mock.method(clientsRepository, 'findClientById', async () => ({ id: CLIENT_ID }));
  mock.method(conversationsRepository, 'getOrCreate', async () => ({ id: 'conv-1' }));
  mock.method(tasksWorkspace, 'notifyClientInApp', async () => {});
  mock.method(activityService, 'recordActivity', async () => {});
}

test('sendFirmMessage: com attachment já resolvido (Fase I — importação do Drive), não faz upload de novo', async () => {
  resetMocks();
  mockCommon();
  mock.method(contabilStorage, 'uploadClientDocument', async () => {
    throw new Error('não devia subir de novo um anexo já resolvido');
  });
  let createArgs = null;
  mock.method(messagesRepository, 'createMessage', async (args) => {
    createArgs = args;
    return { id: 'msg-1', ...args };
  });

  const attachment = { storageKey: 'firm/x/clients/1/documents/foo.pdf', name: 'foo.pdf', mime: 'application/pdf', size: 1234 };
  const { message } = await messagesService.sendFirmMessage({
    firmId: FIRM_ID,
    clientId: CLIENT_ID,
    senderId: 'staff-1',
    attachment,
  });

  assert.equal(message.id, 'msg-1');
  assert.equal(createArgs.attachmentStorageKey, attachment.storageKey);
  assert.equal(createArgs.attachmentName, 'foo.pdf');
  assert.equal(createArgs.body, 'foo.pdf');
});

test('sendFirmMessage: sem texto, sem file e sem attachment, rejeita como mensagem vazia', async () => {
  resetMocks();
  mockCommon();

  await assert.rejects(
    () => messagesService.sendFirmMessage({ firmId: FIRM_ID, clientId: CLIENT_ID, senderId: 'staff-1' }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});
