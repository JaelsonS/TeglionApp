const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const contabilStorage = require('../../services/storage/contabil-storage.service');
const firmBrandingService = require('./firm-branding.service');
const {
  normalizeThemeLogos,
  resolvePublicSiteZoneLogoUrl,
} = require('./public-site-logo');

test('normalizeThemeLogos: legacy logoStorageKey implica custom', () => {
  const t = normalizeThemeLogos({ logoStorageKey: 'firm/1/public-site/logo/x.webp' });
  assert.equal(t.headerLogoSource, 'custom');
  assert.equal(t.heroLogoSource, 'custom');
});

test('resolvePublicSiteZoneLogoUrl: source none ignora branding', async () => {
  mock.restoreAll();
  mock.method(firmBrandingService, 'resolveLogoUrl', async () => 'https://firm.test/logo.png');
  const url = await resolvePublicSiteZoneLogoUrl(
    'header',
    { theme: { headerLogoSource: 'none', heroLogoSource: 'none' } },
    { id: '1' },
  );
  assert.equal(url, null);
});

test('resolvePublicSiteZoneLogoUrl: custom zone key', async () => {
  mock.restoreAll();
  mock.method(contabilStorage, 'createSignedDownloadUrl', async (key) => `signed://${key}`);
  const url = await resolvePublicSiteZoneLogoUrl(
    'hero',
    {
      theme: {
        heroLogoSource: 'custom',
        heroLogoStorageKey: 'firm/1/public-site/logo/hero.webp',
      },
    },
    { id: '1' },
  );
  assert.equal(url, 'signed://firm/1/public-site/logo/hero.webp');
});
