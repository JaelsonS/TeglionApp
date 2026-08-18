/**
 * Catálogo de portais oficiais na ficha do cliente («Acessos oficiais»).
 * CUSTOM fica fora desta lista — linhas extra com portal_key CUSTOM.
 */
const CATALOG_PORTAL_KEYS = [
  'AT_FINANCAS',
  'SEGURANCA_SOCIAL',
  'VIA_CTT',
  'IAPMEI',
  'RELATORIO_UNICO',
];

const PORTAL_KEYS = [...CATALOG_PORTAL_KEYS, 'CUSTOM'];

const PORTALS = {
  AT_FINANCAS: {
    key: 'AT_FINANCAS',
    title: 'AT / Portal das Finanças',
    shortTitle: 'AT',
    description: 'Autoridade Tributária — Portal das Finanças.',
    url: 'https://www.portaldasfinancas.gov.pt',
    usernameLabel: 'NIF / utilizador',
  },
  SEGURANCA_SOCIAL: {
    key: 'SEGURANCA_SOCIAL',
    title: 'Segurança Social',
    shortTitle: 'SS',
    description: 'Segurança Social Direta.',
    url: 'https://www.seg-social.pt',
    usernameLabel: 'NISS / utilizador',
  },
  VIA_CTT: {
    key: 'VIA_CTT',
    title: 'ViaCTT',
    shortTitle: 'ViaCTT',
    description: 'Caixa postal electrónica (ViaCTT).',
    url: 'https://www.viactt.pt',
    usernameLabel: 'Utilizador',
  },
  IAPMEI: {
    key: 'IAPMEI',
    title: 'IAPMEI',
    shortTitle: 'IAPMEI',
    description: 'Portal IAPMEI — agência para a competitividade.',
    url: 'https://www.iapmei.pt',
    usernameLabel: 'Utilizador',
  },
  RELATORIO_UNICO: {
    key: 'RELATORIO_UNICO',
    title: 'Relatório Único',
    shortTitle: 'RU',
    description: 'Entrega do Relatório Único.',
    url: 'https://www.relatoriounico.pt',
    usernameLabel: 'Utilizador',
  },
  CUSTOM: {
    key: 'CUSTOM',
    title: 'Outro portal',
    shortTitle: 'Outro',
    description: 'Acesso oficial extra (nome à escolha).',
    url: null,
    usernameLabel: 'Utilizador',
  },
};

function isPortalKey(value) {
  return PORTAL_KEYS.includes(String(value || ''));
}

function isCatalogPortalKey(value) {
  return CATALOG_PORTAL_KEYS.includes(String(value || ''));
}

function portalMeta(portalKey) {
  return PORTALS[portalKey] || PORTALS.CUSTOM;
}

module.exports = {
  CATALOG_PORTAL_KEYS,
  PORTAL_KEYS,
  PORTALS,
  isPortalKey,
  isCatalogPortalKey,
  portalMeta,
};
