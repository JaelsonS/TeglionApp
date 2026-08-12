const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const clientsRepository = require('../../../db/supabase/repositories/clients.repository');
const contabilStorage = require('../../../services/storage/contabil-storage.service');
const messagesService = require('../../messages/messages.service');
const googleDriveService = require('./google-drive.service');
const importService = require('./google-drive-import.service');

const FIRM_ID = 'firm-x';
const CLIENT_ID = 'client-1';

function resetMocks() {
  mock.restoreAll();
}

function mockClient() {
  mock.method(clientsRepository, 'findClientById', async () => ({ id: CLIENT_ID, firmId: FIRM_ID }));
}

// PNG real (assinatura mágica válida) — mesmo fixture usado nos testes de file-magic-bytes.
const PNG_BUFFER = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');

test('importFileFromDrive: rejeita sem fileId/accessToken', async () => {
  resetMocks();
  await assert.rejects(
    () => importService.importFileFromDrive({ firmId: FIRM_ID, clientId: CLIENT_ID, senderId: 's1', fileId: '', accessToken: '' }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('importFileFromDrive: cliente inexistente devolve 404', async () => {
  resetMocks();
  mock.method(clientsRepository, 'findClientById', async () => null);

  await assert.rejects(
    () =>
      importService.importFileFromDrive({
        firmId: FIRM_ID,
        clientId: CLIENT_ID,
        senderId: 's1',
        fileId: 'file-1',
        accessToken: 'token-1',
      }),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    },
  );
});

test('importFileFromDrive: tamanho declarado acima do limite é rejeitado antes de transferir', async () => {
  resetMocks();
  mockClient();
  mock.method(googleDriveService, 'fetchDriveFileMetadata', async () => ({
    name: 'grande.pdf',
    mimeType: 'application/pdf',
    size: String(500 * 1024 * 1024), // 500MB, acima do limite default
  }));
  mock.method(googleDriveService, 'downloadDriveFile', async () => {
    throw new Error('não devia transferir um ficheiro já rejeitado pelo tamanho declarado');
  });

  await assert.rejects(
    () =>
      importService.importFileFromDrive({
        firmId: FIRM_ID,
        clientId: CLIENT_ID,
        senderId: 's1',
        fileId: 'file-1',
        accessToken: 'token-1',
      }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('importFileFromDrive: MIME fora da whitelist é rejeitado, nunca chega a guardar', async () => {
  resetMocks();
  mockClient();
  mock.method(googleDriveService, 'fetchDriveFileMetadata', async () => ({
    name: 'script.exe',
    mimeType: 'application/x-msdownload',
    size: '100',
  }));
  mock.method(googleDriveService, 'downloadDriveFile', async () => Buffer.from('conteudo'));
  mock.method(contabilStorage, 'uploadClientDocument', async () => {
    throw new Error('não devia guardar um ficheiro com MIME não permitido');
  });

  await assert.rejects(
    () =>
      importService.importFileFromDrive({
        firmId: FIRM_ID,
        clientId: CLIENT_ID,
        senderId: 's1',
        fileId: 'file-1',
        accessToken: 'token-1',
      }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('importFileFromDrive: magic bytes que não batem com o MIME declarado são rejeitados', async () => {
  resetMocks();
  mockClient();
  mock.method(googleDriveService, 'fetchDriveFileMetadata', async () => ({
    name: 'falso.png',
    mimeType: 'image/png',
    size: '20',
  }));
  // Conteúdo não é realmente um PNG (assinatura mágica errada) — mesmo com extensão/MIME correctos.
  mock.method(googleDriveService, 'downloadDriveFile', async () => Buffer.from('isto-nao-e-um-png'));
  mock.method(contabilStorage, 'uploadClientDocument', async () => {
    throw new Error('não devia guardar um ficheiro com magic bytes inválidos');
  });

  await assert.rejects(
    () =>
      importService.importFileFromDrive({
        firmId: FIRM_ID,
        clientId: CLIENT_ID,
        senderId: 's1',
        fileId: 'file-1',
        accessToken: 'token-1',
      }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('importFileFromDrive: caminho feliz — transfere, valida, guarda e anexa como mensagem', async () => {
  resetMocks();
  mockClient();
  mock.method(googleDriveService, 'fetchDriveFileMetadata', async () => ({
    name: 'comprovativo.png',
    mimeType: 'image/png',
    size: String(PNG_BUFFER.length),
  }));
  mock.method(googleDriveService, 'downloadDriveFile', async () => PNG_BUFFER);
  let uploadArgs = null;
  mock.method(contabilStorage, 'uploadClientDocument', async (args) => {
    uploadArgs = args;
    return { path: 'firm/x/clients/1/documents/123-comprovativo.png', provider: 'supabase' };
  });
  let sendArgs = null;
  mock.method(messagesService, 'sendFirmMessage', async (args) => {
    sendArgs = args;
    return { message: { id: 'msg-1' } };
  });

  const result = await importService.importFileFromDrive({
    firmId: FIRM_ID,
    clientId: CLIENT_ID,
    senderId: 'staff-1',
    fileId: 'file-1',
    accessToken: 'token-1',
  });

  assert.equal(uploadArgs.firmId, FIRM_ID);
  assert.equal(uploadArgs.clientId, CLIENT_ID);
  assert.equal(uploadArgs.file.originalname, 'comprovativo.png');
  assert.deepEqual(sendArgs.attachment, {
    storageKey: 'firm/x/clients/1/documents/123-comprovativo.png',
    name: 'comprovativo.png',
    mime: 'image/png',
    size: PNG_BUFFER.length,
  });
  assert.equal(sendArgs.senderId, 'staff-1');
  assert.deepEqual(result, { message: { id: 'msg-1' } });
});

// PDF real (assinatura mágica válida: %PDF-).
const PDF_BUFFER = Buffer.from('255044462d312e340a', 'hex');

test('importFileFromDrive: Google Doc nativo é exportado como PDF em vez de descarregado directamente', async () => {
  resetMocks();
  mockClient();
  mock.method(googleDriveService, 'fetchDriveFileMetadata', async () => ({
    name: 'IRS 2026 - respostas',
    mimeType: 'application/vnd.google-apps.document',
    size: undefined,
  }));
  mock.method(googleDriveService, 'downloadDriveFile', async () => {
    throw new Error('não devia usar alt=media para um ficheiro nativo do Google');
  });
  let exportArgs = null;
  mock.method(googleDriveService, 'exportDriveFile', async (args) => {
    exportArgs = args;
    return PDF_BUFFER;
  });
  let uploadArgs = null;
  mock.method(contabilStorage, 'uploadClientDocument', async (args) => {
    uploadArgs = args;
    return { path: 'firm/x/clients/1/documents/123-irs.pdf', provider: 'supabase' };
  });
  let sendArgs = null;
  mock.method(messagesService, 'sendFirmMessage', async (args) => {
    sendArgs = args;
    return { message: { id: 'msg-2' } };
  });

  await importService.importFileFromDrive({
    firmId: FIRM_ID,
    clientId: CLIENT_ID,
    senderId: 'staff-1',
    fileId: 'file-doc-1',
    accessToken: 'token-1',
  });

  assert.equal(exportArgs.fileId, 'file-doc-1');
  assert.equal(exportArgs.exportMimeType, 'application/pdf');
  assert.equal(uploadArgs.file.mimetype, 'application/pdf');
  assert.equal(uploadArgs.file.originalname, 'IRS 2026 - respostas.pdf');
  assert.equal(sendArgs.attachment.mime, 'application/pdf');
});

test('importFileFromDrive: tipo nativo do Google sem export mapeado (ex: Formulários) devolve erro claro, não 500', async () => {
  resetMocks();
  mockClient();
  mock.method(googleDriveService, 'fetchDriveFileMetadata', async () => ({
    name: 'Formulário IRS',
    mimeType: 'application/vnd.google-apps.form',
    size: undefined,
  }));
  mock.method(googleDriveService, 'downloadDriveFile', async () => {
    throw new Error('não devia tentar descarregar um tipo nativo sem export mapeado');
  });

  await assert.rejects(
    () =>
      importService.importFileFromDrive({
        firmId: FIRM_ID,
        clientId: CLIENT_ID,
        senderId: 's1',
        fileId: 'file-form-1',
        accessToken: 'token-1',
      }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('importFileFromDrive: erro 403 do Google vira AppError amigável (não 500)', async () => {
  resetMocks();
  mockClient();
  mock.method(googleDriveService, 'fetchDriveFileMetadata', async () => {
    throw googleDriveService.driveApiError('metadata', 403, 'forbidden');
  });

  await assert.rejects(
    () =>
      importService.importFileFromDrive({
        firmId: FIRM_ID,
        clientId: CLIENT_ID,
        senderId: 's1',
        fileId: 'file-1',
        accessToken: 'token-1',
      }),
    (err) => {
      assert.equal(err.statusCode, 403);
      assert.match(err.message, /autorizar|Google Drive/i);
      return true;
    },
  );
});
