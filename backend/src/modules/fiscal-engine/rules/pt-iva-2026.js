/**
 * Regras IVA Portugal — versão de biblioteca (não inventar taxas).
 * Fonte a validar por contabilista antes de marcar como «activa» em produção.
 * Taxas standard CIVA em vigor para o continente em 2026 (referência pública).
 */
module.exports = {
  jurisdiction: 'PT',
  tax: 'IVA',
  version: 'PT-IVA-2026.1',
  status: 'active',
  effectiveFrom: '2026-01-01',
  effectiveTo: null,
  source: {
    label: 'Código do IVA (CIVA) — taxas normal, intermédia e reduzida (continente)',
    url: 'https://info.portaldasfinancas.gov.pt/',
    notes:
      'Simulação Teglion. Confirmar sempre a taxa e o enquadramento no período e território aplicáveis (continente vs Regiões Autónomas).',
  },
  rounding: {
    mode: 'half_up_cents',
    description: 'Arredondamento ao cêntimo mais próximo (0,5 cêntimo sobe).',
  },
  rates: [
    { code: 'normal', label: 'Taxa normal', percent: 23, bps: 2300 },
    { code: 'intermediate', label: 'Taxa intermédia', percent: 13, bps: 1300 },
    { code: 'reduced', label: 'Taxa reduzida', percent: 6, bps: 600 },
  ],
  limitations: [
    'Não determina se a operação é isenta, não sujeita ou com autoliquidação.',
    'Não distingue IVA liquidado, dedutível ou não dedutível.',
    'Não é apuramento nem declaração oficial.',
  ],
};
