/**
 * Rascunho de demonstração AfDigital — sem OpenAI; não publica o site.
 */
const { parseProposalV1 } = require('./proposal.schema');
const { ensureProposalFromContext } = require('./proposal-enrich');
const { parseMediaAssetRef } = require('./media-assets');

const DEMO_CATALOG_CANDIDATES_PT = [
  'consultoria-individual',
  'irs-modelo-3',
  'abertura-atividade',
  'iva-isolada',
  'simulacao-irs',
];

const DEMO_CATALOG_CANDIDATES_BR = ['consultoria-individual', 'abertura-atividade'];

function demoCatalogKeysForCountry(countryCode) {
  const list =
    String(countryCode || 'PT').toUpperCase() === 'BR'
      ? DEMO_CATALOG_CANDIDATES_BR
      : DEMO_CATALOG_CANDIDATES_PT;
  const { CATALOG_KEY_SET } = require('./proposal.schema');
  return list.filter((k) => CATALOG_KEY_SET.has(k)).slice(0, 6);
}

function readDemoAssetEnv(prefix) {
  const storageKey = String(process.env[`MAYA_DEMO_ASSETS_${prefix}_STORAGE_KEY`] || '').trim();
  const id = String(process.env[`MAYA_DEMO_ASSETS_${prefix}_ID`] || '').trim();
  const alt = String(process.env[`MAYA_DEMO_ASSETS_${prefix}_ALT`] || '').trim().slice(0, 200);
  if (!storageKey || !id) return null;
  return parseMediaAssetRef({ id, storageKey, alt: alt || undefined });
}

/** @returns {import('./media-assets').parseMediaAssets extends (...args: any) => infer R ? R : never} */
function parseDemoMediaAssetsFromEnv() {
  const heroImage = readDemoAssetEnv('HERO');
  const aboutImage = readDemoAssetEnv('ABOUT');
  const logoKey = String(process.env.MAYA_DEMO_ASSETS_LOGO_STORAGE_KEY || '').trim();
  const logoUploaded = Boolean(logoKey);
  if (!heroImage && !aboutImage && !logoUploaded) return null;
  return {
    ...(logoUploaded ? { logoUploaded: true } : {}),
    ...(heroImage ? { heroImage } : {}),
    ...(aboutImage ? { aboutImage } : {}),
    prepareServicesForPublicPage: true,
  };
}

function buildDemoProposal({ firmName, countryCode, cityRegion }) {
  const cc = String(countryCode || 'PT').toUpperCase();
  const keys = demoCatalogKeysForCountry(cc);
  const skeleton = parseProposalV1(
    {
      version: 1,
      publicSitePatch: {},
      services: keys.map((catalogKey) => ({ catalogKey })),
      irs: {
        activateCampaign: cc === 'PT',
        templateIds: cc === 'PT' ? ['irs-modelo-3'] : [],
      },
      booking: {
        timezone: cc === 'BR' ? 'America/Sao_Paulo' : 'Europe/Lisbon',
        defaultSchedule: {
          1: [
            { start: '09:00', end: '13:00' },
            { start: '14:00', end: '18:00' },
          ],
          2: [
            { start: '09:00', end: '13:00' },
            { start: '14:00', end: '18:00' },
          ],
          3: [
            { start: '09:00', end: '13:00' },
            { start: '14:00', end: '18:00' },
          ],
          4: [
            { start: '09:00', end: '13:00' },
            { start: '14:00', end: '18:00' },
          ],
          5: [
            { start: '09:00', end: '13:00' },
            { start: '14:00', end: '18:00' },
          ],
        },
      },
    },
    { countryCode: cc },
  );

  return ensureProposalFromContext(skeleton, {
    answers: {
      tone: 'friendly',
      specialties: ['Contabilidade', 'IRS'],
      serviceCatalogKeys: keys,
      cityRegion: cityRegion || '',
      ownerBrief:
        'Exemplo AfDigital — substitua este texto pelo story do seu escritório. As imagens são institucionais de demonstração.',
    },
    firmName,
    countryCode: cc,
    cityRegion: cityRegion || (cc === 'BR' ? 'Brasil' : 'Portugal'),
  });
}

module.exports = {
  buildDemoProposal,
  parseDemoMediaAssetsFromEnv,
  demoCatalogKeysForCountry,
};
