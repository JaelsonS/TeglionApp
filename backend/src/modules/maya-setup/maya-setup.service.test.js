const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const mayaSetupSessionsRepository = require('../../db/supabase/repositories/maya-setup-sessions.repository');
const mayaSetupService = require('./maya-setup.service');
const { parseProposalV1 } = require('./proposal.schema');
const openaiClient = require('./openai.client');

const OWNER = { id: 'owner-1', firm_id: 'firm-1', role: 'FIRM_OWNER', is_active: true };
const STAFF = { id: 'staff-1', firm_id: 'firm-1', role: 'FIRM_STAFF', is_active: true };

function resetMocks() {
  mock.restoreAll();
}

const VALID_ANSWERS = {
  consentOpenAi: true,
  countryCode: 'PT',
  tone: 'friendly',
  specialties: ['IRS'],
  serviceCatalogKeys: ['consultoria-individual'],
  irsCampaign: true,
  cityRegion: 'Lisboa',
};

test('normalizeAnswers: exige consentOpenAi', () => {
  assert.throws(
    () => mayaSetupService.normalizeAnswers({ countryCode: 'PT' }, 'PT'),
    (err) => err.statusCode === 400,
  );
});

test('parseProposalV1: rejeita catalogKey desconhecido', () => {
  assert.throws(
    () =>
      parseProposalV1(
        {
          publicSitePatch: {},
          services: [{ catalogKey: 'nao-existe' }],
          irs: { activateCampaign: false, templateIds: [] },
          booking: { timezone: 'Europe/Lisbon', defaultSchedule: { 1: [{ start: '09:00', end: '17:00' }] } },
        },
        { countryCode: 'PT' },
      ),
    (err) => err.statusCode === 502,
  );
});

test('parseProposalV1: BR bloqueia templates IRS', () => {
  assert.throws(
    () =>
      parseProposalV1(
        {
          publicSitePatch: {},
          services: [{ catalogKey: 'irs-modelo-3' }],
          irs: { activateCampaign: false, templateIds: [] },
          booking: { timezone: 'UTC', defaultSchedule: { 1: [{ start: '09:00', end: '17:00' }] } },
        },
        { countryCode: 'BR' },
      ),
    (err) => err.statusCode === 502,
  );
});

test('assertOwnerActor: staff recebe 403', async () => {
  resetMocks();
  mock.method(firmUsersRepository, 'findFirmUserById', async () => STAFF);
  await assert.rejects(
    () => mayaSetupService.assertOwnerActor('firm-1', 'staff-1'),
    (err) => err.statusCode === 403,
  );
});

test('generateProposal: persiste proposta validada (mock OpenAI)', async () => {
  resetMocks();
  process.env.MAYA_SETUP_OPENAI_MOCK = '1';
  mock.method(firmUsersRepository, 'findFirmUserById', async () => OWNER);
  mock.method(firmsRepository, 'findFirmById', async () => ({
    id: 'firm-1',
    name: 'Escritório Teste',
    slug: 'escritorio-teste',
    countryCode: 'PT',
  }));
  mock.method(mayaSetupSessionsRepository, 'findByIdForFirm', async () => ({
    id: 'sess-1',
    firmId: 'firm-1',
    status: 'draft',
    answers: VALID_ANSWERS,
    proposal: null,
    generateCount: 0,
  }));
  mock.method(mayaSetupSessionsRepository, 'sumGenerateCountToday', async () => 0);
  let saved = null;
  mock.method(mayaSetupSessionsRepository, 'updateSession', async (id, firmId, patch) => {
    saved = patch;
    return {
      id: 'sess-1',
      firmId: 'firm-1',
      status: patch.status,
      answers: VALID_ANSWERS,
      proposal: patch.proposal,
      appliedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const { session } = await mayaSetupService.generateProposal({
    firmId: 'firm-1',
    actorUserId: 'owner-1',
    sessionId: 'sess-1',
  });

  assert.equal(session.status, 'generated');
  assert.ok(session.proposal?.services?.length >= 1);
  assert.equal(saved.status, 'generated');
  delete process.env.MAYA_SETUP_OPENAI_MOCK;
});

test('mergePublicSitePatch: funde hero sem inventar storage keys', () => {
  const base = firmPublicSiteServiceRef();
  const merged = mayaSetupService.mergePublicSitePatch(base, {
    sections: [{ type: 'hero', content: { title: 'Novo título' } }],
  });
  const hero = merged.sections.find((s) => s.type === 'hero');
  assert.equal(hero.content.title, 'Novo título');
});

function firmPublicSiteServiceRef() {
  return require('../firm/firm-public-site.service').defaultSiteConfig();
}

test('openai mock inclui IRS só PT', () => {
  const pt = openaiClient.buildMockProposal({ countryCode: 'PT', irsCampaign: true, firmName: 'X' });
  assert.equal(pt.irs.activateCampaign, true);
  const br = openaiClient.buildMockProposal({ countryCode: 'BR', irsCampaign: true, firmName: 'X' });
  assert.equal(br.irs.activateCampaign, false);
});
