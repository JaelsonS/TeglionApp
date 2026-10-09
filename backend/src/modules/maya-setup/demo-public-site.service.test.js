const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildDemoProposal,
  parseDemoMediaAssetsFromEnv,
  demoCatalogKeysForCountry,
} = require('./demo-public-site.service');

test('demoCatalogKeysForCountry: PT inclui chaves válidas', () => {
  const keys = demoCatalogKeysForCountry('PT');
  assert.ok(keys.length >= 2);
  assert.ok(keys.includes('consultoria-individual'));
});

test('buildDemoProposal: secções ricas e serviços', () => {
  const proposal = buildDemoProposal({
    firmName: 'Escritório Demo',
    countryCode: 'PT',
    cityRegion: 'Coimbra',
  });
  assert.ok(Array.isArray(proposal.publicSitePatch.sections));
  assert.ok(proposal.publicSitePatch.sections.length >= 5);
  assert.ok(proposal.services.length >= 2);
  assert.match(String(proposal.publicSitePatch.seo?.title || ''), /Escritório Demo/);
});

test('parseDemoMediaAssetsFromEnv: vazio sem env', () => {
  const prev = {
    hero: process.env.MAYA_DEMO_ASSETS_HERO_STORAGE_KEY,
    heroId: process.env.MAYA_DEMO_ASSETS_HERO_ID,
  };
  delete process.env.MAYA_DEMO_ASSETS_HERO_STORAGE_KEY;
  delete process.env.MAYA_DEMO_ASSETS_HERO_ID;
  assert.equal(parseDemoMediaAssetsFromEnv(), null);
  if (prev.hero) process.env.MAYA_DEMO_ASSETS_HERO_STORAGE_KEY = prev.hero;
  if (prev.heroId) process.env.MAYA_DEMO_ASSETS_HERO_ID = prev.heroId;
});
