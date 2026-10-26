/**
 * IRC Portugal 2026 — taxas gerais continente (+ derrama estadual).
 * Fonte: folheto AT «Sistema Fiscal Português — Taxas aplicáveis 2026»
 * + art. 87.º CIRC (norma transitória Lei n.º 64/2025: taxa 19 % em 2026).
 *
 * Derrama municipal: taxa introduzida pelo utilizador (máx. 1,5 %) — não há
 * lista de 300 municípios no motor (consultar Portal das Finanças).
 */
module.exports = {
  jurisdiction: 'PT',
  tax: 'IRC',
  version: 'PT-IRC-2026.1',
  status: 'active',
  effectiveFrom: '2026-01-01',
  effectiveTo: null,
  territory: 'continente',
  source: {
    label: 'AT — Sistema Fiscal Português · Taxas 2026 (IRC art. 87.º CIRC)',
    url: 'https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/Folhetos_informativos/Documents/SFP-Taxas-2026.pdf',
    notes:
      'Simulação Teglion (continente). Confirmar PME/Small Mid Cap, Interior e derramas no enquadramento real.',
  },
  rounding: {
    mode: 'half_up_cents',
    description: 'Arredondamento ao cêntimo em cada parcela.',
  },
  regimes: {
    general: {
      code: 'general',
      label: 'Taxa geral',
      brackets: [{ upToCents: null, rateMilli: 19_000 }],
    },
    sme: {
      code: 'sme',
      label: 'PME / Small Mid Cap',
      brackets: [
        { upToCents: 5_000_000, rateMilli: 15_000 },
        { upToCents: null, rateMilli: 19_000 },
      ],
    },
    sme_interior: {
      code: 'sme_interior',
      label: 'PME Interior (EBF art. 41.º-B)',
      brackets: [
        { upToCents: 5_000_000, rateMilli: 12_500 },
        { upToCents: null, rateMilli: 19_000 },
      ],
    },
  },
  /** Derrama estadual — sobre lucro tributável (faixas marginais). */
  stateSurcharge: [
    { upToCents: 150_000_000, rateMilli: 0 },
    { upToCents: 750_000_000, rateMilli: 3_000 },
    { upToCents: 3_500_000_000, rateMilli: 5_000 },
    { upToCents: null, rateMilli: 9_000 },
  ],
  municipalDerramaMaxBps: 150,
  limitations: [
    'Só continente — não aplica RAA/RAM (13,3 % / 10,5 %).',
    'Não determina elegibilidade PME, Small Mid Cap, Interior nem start-up.',
    'Derrama municipal é taxa manual (0–1,5 %); não carrega lista de municípios.',
    'Não calcula autoliquidação, pagamentos por conta nem benefícios fiscais.',
    'Não é declaração Modelo 22 oficial.',
  ],
};
