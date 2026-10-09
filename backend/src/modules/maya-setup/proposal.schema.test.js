const test = require('node:test');
const assert = require('node:assert/strict');
const { coerceOpenAiProposal, parseProposalV1 } = require('./proposal.schema');
const { ensureProposalFromContext } = require('./proposal-enrich');

test('coerceOpenAiProposal: normaliza cores e filtra catalogKeys', () => {
  const coerced = coerceOpenAiProposal(
    {
      publicSitePatch: {
        theme: { primaryColor: '1e4d8c', secondaryColor: '#not-a-color' },
      },
      services: [
        { catalogKey: 'consultoria-individual' },
        { catalogKey: 'inventado-pelo-modelo' },
      ],
    },
    {
      countryCode: 'PT',
      answers: { serviceCatalogKeys: ['consultoria-individual'] },
    },
  );
  assert.equal(coerced.publicSitePatch.theme.primaryColor, '#1e4d8c');
  assert.equal(coerced.publicSitePatch.theme.secondaryColor, undefined);
  assert.equal(coerced.services.length, 1);
  assert.equal(coerced.services[0].catalogKey, 'consultoria-individual');
});

test('coerce + enrich + parse: só serviços personalizados no questionário', () => {
  const coerced = coerceOpenAiProposal(
    {
      publicSitePatch: {},
      services: [{ catalogKey: 'consultoria-individual' }],
      irs: { activateCampaign: false, templateIds: [] },
      booking: null,
    },
    {
      countryCode: 'PT',
      answers: { serviceCatalogKeys: [], customServices: [{ name: 'Declarações' }] },
    },
  );
  assert.equal(coerced.services.length, 0);
  const enriched = ensureProposalFromContext(coerced, {
    firmName: 'Silva',
    countryCode: 'PT',
    answers: { serviceCatalogKeys: [], tone: 'friendly' },
  });
  const parsed = parseProposalV1(enriched, { countryCode: 'PT' });
  assert.equal(parsed.services.length, 0);
  assert.ok(parsed.publicSitePatch.seo?.title?.includes('Silva'));
});
