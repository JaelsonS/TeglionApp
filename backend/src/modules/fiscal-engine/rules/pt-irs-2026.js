/**
 * Regras IRS Portugal — escalões gerais (continente) para rendimentos 2026.
 * Fonte: folheto AT «Sistema Fiscal Português — Taxas aplicáveis 2026» + art. 68.º CIRS (OE 2026).
 *
 * Nota (Out/2026): Lei n.º 64-B/2026 autorizou redução das taxas dos 1.º–6.º escalões;
 * esta versão NÃO aplica essa redução até existir decreto/republicação do CIRS e folheto AT actualizado.
 * Próxima versão candidata: PT-IRS-2026.2 (após fonte oficial).
 *
 * Taxas em «milli» = percentagem × 1000 (ex.: 12,5 % → 12500; 13,579 % → 13579).
 */
module.exports = {
  jurisdiction: 'PT',
  tax: 'IRS',
  version: 'PT-IRS-2026.1',
  status: 'active',
  effectiveFrom: '2026-01-01',
  effectiveTo: null,
  territory: 'continente',
  source: {
    label: 'AT — Sistema Fiscal Português · Taxas aplicáveis 2026 (art. 68.º e 68.º-A CIRS)',
    url: 'https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/Folhetos_informativos/Documents/SFP-Taxas-2026.pdf',
    notes:
      'Simulação Teglion sobre rendimento coletável. Não calcula deduções, retenções, mínimo de existência nem regimes regionais (RAA/RAM).',
  },
  rounding: {
    mode: 'half_up_cents',
    description: 'Arredondamento ao cêntimo mais próximo em cada parcela (0,5 cêntimo sobe).',
  },
  /** Limites superiores do rendimento coletável (cêntimos). null = sem teto. */
  brackets: [
    { upToCents: 834_200, normalMilli: 12_500, avgMilli: 12_500 },
    { upToCents: 1_258_700, normalMilli: 15_700, avgMilli: 13_579 },
    { upToCents: 1_783_800, normalMilli: 21_200, avgMilli: 15_823 },
    { upToCents: 2_308_900, normalMilli: 24_100, avgMilli: 17_705 },
    { upToCents: 2_939_700, normalMilli: 31_100, avgMilli: 20_579 },
    { upToCents: 4_309_000, normalMilli: 34_900, avgMilli: 25_130 },
    { upToCents: 4_656_600, normalMilli: 43_100, avgMilli: 26_472 },
    { upToCents: 8_663_400, normalMilli: 44_600, avgMilli: 34_856 },
    { upToCents: null, normalMilli: 48_000, avgMilli: null },
  ],
  /** Taxa adicional de solidariedade — art. 68.º-A (continente). */
  solidarity: [
    { upToCents: 8_000_000, rateMilli: 0 },
    { upToCents: 25_000_000, rateMilli: 2_500 },
    { upToCents: null, rateMilli: 5_000 },
  ],
  limitations: [
    'Parte de rendimento coletável já determinado — não calcula deduções específicas nem abatimentos.',
    'Não aplica tabelas de retenção na fonte nem mínimo de existência.',
    'Não cobre RAA/RAM nem deficiência (art. 56.º-A).',
    'Não é declaração oficial nem substitui o Portal das Finanças.',
  ],
};
