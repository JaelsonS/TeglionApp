const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const firmSettingsService = require('./firm-settings.service');

const OWNER = { id: 'user-1', firm_id: 'firm-1', role: 'FIRM_OWNER' };
const STAFF = { id: 'user-2', firm_id: 'firm-1', role: 'FIRM_STAFF' };

function resetMocks() {
  mock.restoreAll();
}

test('updatePublicProfile: rejeita quem não é FIRM_OWNER', async () => {
  resetMocks();
  mock.method(firmUsersRepository, 'findFirmUserById', async () => STAFF);

  await assert.rejects(
    () => firmSettingsService.updatePublicProfile('firm-1', 'user-2', { tagline: 'x' }),
    (err) => {
      assert.equal(err.statusCode, 403);
      return true;
    },
  );
});

test('updatePublicProfile: apara e limita tagline/bio, guarda null quando vazio', async () => {
  resetMocks();
  mock.method(firmUsersRepository, 'findFirmUserById', async () => OWNER);
  let savedPatch = null;
  mock.method(firmsRepository, 'updateFirmPublicProfile', async (firmId, patch) => {
    savedPatch = patch;
    return { settings: { publicProfile: patch } };
  });

  await firmSettingsService.updatePublicProfile('firm-1', 'user-1', {
    tagline: '  Contabilidade & Finanças  ',
    bio: '   ',
  });

  assert.equal(savedPatch.tagline, 'Contabilidade & Finanças');
  assert.equal(savedPatch.bio, null, 'bio só com espaços deve gravar null, não string vazia');
});

test('updatePublicProfile: socialLinks só aceita chaves conhecidas, remove com null', async () => {
  resetMocks();
  mock.method(firmUsersRepository, 'findFirmUserById', async () => OWNER);
  let savedPatch = null;
  mock.method(firmsRepository, 'updateFirmPublicProfile', async (firmId, patch) => {
    savedPatch = patch;
    return { settings: { publicProfile: patch } };
  });

  await firmSettingsService.updatePublicProfile('firm-1', 'user-1', {
    socialLinks: {
      instagram: 'https://instagram.com/x',
      whatsapp: null,
      notAllowedKey: 'https://evil.example.com',
    },
  });

  assert.equal(savedPatch.socialLinks.instagram, 'https://instagram.com/x');
  assert.equal(savedPatch.socialLinks.whatsapp, null);
  assert.equal(savedPatch.socialLinks.notAllowedKey, undefined, 'chaves fora da allow-list nunca são gravadas');
});

test('updatePublicProfile: faqs preserva id enviado, gera id quando ausente, descarta perguntas/respostas vazias', async () => {
  resetMocks();
  mock.method(firmUsersRepository, 'findFirmUserById', async () => OWNER);
  let savedPatch = null;
  mock.method(firmsRepository, 'updateFirmPublicProfile', async (firmId, patch) => {
    savedPatch = patch;
    return { settings: { publicProfile: patch } };
  });

  await firmSettingsService.updatePublicProfile('firm-1', 'user-1', {
    faqs: [
      { id: 'faq_fixo', question: 'Como agendar?', answer: 'Pelo botão AGENDAR AGORA.' },
      { question: 'Sem id', answer: 'Deve ganhar um id novo.' },
      { question: '', answer: 'Sem pergunta — descartada.' },
      { question: 'Sem resposta', answer: '' },
    ],
  });

  assert.equal(savedPatch.faqs.length, 2, 'só as 2 entradas com pergunta E resposta sobrevivem');
  assert.equal(savedPatch.faqs[0].id, 'faq_fixo');
  assert.ok(savedPatch.faqs[1].id, 'entrada sem id recebe um id gerado');
  assert.notEqual(savedPatch.faqs[1].id, 'faq_fixo');
});

test('updatePublicProfile: rejeita mais de 20 FAQs (limite express-validator não cobre a service layer)', async () => {
  resetMocks();
  mock.method(firmUsersRepository, 'findFirmUserById', async () => OWNER);
  let savedPatch = null;
  mock.method(firmsRepository, 'updateFirmPublicProfile', async (firmId, patch) => {
    savedPatch = patch;
    return { settings: { publicProfile: patch } };
  });

  const faqs = Array.from({ length: 30 }, (_, i) => ({ question: `Q${i}`, answer: `A${i}` }));
  await firmSettingsService.updatePublicProfile('firm-1', 'user-1', { faqs });

  assert.equal(savedPatch.faqs.length, 20, 'corta no máximo de 20 mesmo que o payload traga mais');
});

test('updateBranding: rejeita quem não é FIRM_OWNER', async () => {
  resetMocks();
  mock.method(firmUsersRepository, 'findFirmUserById', async () => STAFF);

  await assert.rejects(
    () => firmSettingsService.updateBranding('firm-1', 'user-2', { primaryColor: '#123456' }),
    (err) => {
      assert.equal(err.statusCode, 403);
      return true;
    },
  );
});

test('updateBranding: rejeita cor hex inválida', async () => {
  resetMocks();
  mock.method(firmUsersRepository, 'findFirmUserById', async () => OWNER);

  await assert.rejects(
    () => firmSettingsService.updateBranding('firm-1', 'user-1', { primaryColor: 'not-a-color' }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('updateBranding: aceita hex válido e nunca devolve logoStorageKey', async () => {
  resetMocks();
  mock.method(firmUsersRepository, 'findFirmUserById', async () => OWNER);
  let savedPatch = null;
  mock.method(firmsRepository, 'updateFirmBranding', async (firmId, patch) => {
    savedPatch = patch;
    return {
      settings: {
        branding: { ...patch, logoStorageKey: 'secret/path/to/logo.png', logoUrl: 'https://signed-url' },
      },
    };
  });

  const result = await firmSettingsService.updateBranding('firm-1', 'user-1', {
    primaryColor: '#112233',
    secondaryColor: null,
  });

  assert.equal(savedPatch.primaryColor, '#112233');
  assert.equal(savedPatch.secondaryColor, null);
  assert.equal(result.branding.logoStorageKey, undefined, 'storage key interna nunca deve ser devolvida ao cliente');
  assert.equal(result.branding.logoUrl, 'https://signed-url');
});
