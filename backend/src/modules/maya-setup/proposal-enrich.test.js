const test = require('node:test');
const assert = require('node:assert/strict');
const { ensureProposalFromContext } = require('./proposal-enrich');

test('ensureProposalFromContext: preenche publicSitePatch vazio', () => {
  const result = ensureProposalFromContext(
    { version: 1, publicSitePatch: {}, services: [], irs: { activateCampaign: false, templateIds: [] }, booking: null },
    {
      firmName: 'Silva & Santos',
      countryCode: 'PT',
      cityRegion: 'Coimbra',
      answers: {
        tone: 'friendly',
        specialties: ['IRS'],
        serviceCatalogKeys: ['consultoria-individual'],
        ownerBrief: 'Queremos destacar apoio a autónomos.',
      },
    },
  );
  assert.ok(result.publicSitePatch.seo?.title?.includes('Silva'));
  assert.equal(result.publicSitePatch.sections?.[0]?.type, 'hero');
  assert.equal(result.services.length, 1);
});
