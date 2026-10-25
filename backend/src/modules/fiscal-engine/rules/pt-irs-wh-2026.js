/**
 * Tabelas de retenção na fonte IRS — continente 2026 (trabalho dependente, sem deficiência).
 * Fonte: Despacho n.º 233-A/2026 (DR 6/01/2026).
 *
 * Fórmula (n.º 3): max(0, R × taxa − parcela − (parcelaAdicional × dependentes)).
 * Escalões 2–3 (tabelas I/II) e 2–3 (III) usam parcela em função de R.
 *
 * Nota: não inclui tabelas de deficiência, pensões, RAA/RAM, nem actualizações
 * posteriores a set/2026 (Lei 64-B/2026) até existir novo despacho AT.
 */

/** @typedef {{ upToCents: number|null, rateMilli: number, parcelaCents?: number, parcelaFormula?: { rateMilli: number, factorMilli: number, anchorCents: number }, additionalPerDependentCents: number }} Bracket */

/** @type {Bracket[]} */
const TABLE_I = [
  { upToCents: 92_000, rateMilli: 0, parcelaCents: 0, additionalPerDependentCents: 0 },
  {
    upToCents: 104_200,
    rateMilli: 12_500,
    parcelaFormula: { rateMilli: 12_500, factorMilli: 2_600, anchorCents: 127_385 },
    additionalPerDependentCents: 2_143,
  },
  {
    upToCents: 110_800,
    rateMilli: 15_700,
    parcelaFormula: { rateMilli: 15_700, factorMilli: 1_350, anchorCents: 155_483 },
    additionalPerDependentCents: 2_143,
  },
  { upToCents: 115_400, rateMilli: 15_700, parcelaCents: 9_471, additionalPerDependentCents: 2_143 },
  { upToCents: 121_200, rateMilli: 21_200, parcelaCents: 15_818, additionalPerDependentCents: 2_143 },
  { upToCents: 181_900, rateMilli: 24_100, parcelaCents: 19_333, additionalPerDependentCents: 2_143 },
  { upToCents: 211_900, rateMilli: 31_100, parcelaCents: 32_066, additionalPerDependentCents: 2_143 },
  { upToCents: 249_900, rateMilli: 34_900, parcelaCents: 40_119, additionalPerDependentCents: 2_143 },
  { upToCents: 330_500, rateMilli: 38_360, parcelaCents: 48_766, additionalPerDependentCents: 2_143 },
  { upToCents: 554_700, rateMilli: 39_690, parcelaCents: 53_162, additionalPerDependentCents: 2_143 },
  { upToCents: 2_022_100, rateMilli: 44_950, parcelaCents: 82_340, additionalPerDependentCents: 2_143 },
  { upToCents: null, rateMilli: 47_170, parcelaCents: 127_231, additionalPerDependentCents: 2_143 },
];

/** @type {Bracket[]} */
const TABLE_II = TABLE_I.map((b, i) => {
  if (i === 0) return { ...b, additionalPerDependentCents: 0 };
  return { ...b, additionalPerDependentCents: 3_429 };
});

/** @type {Bracket[]} */
const TABLE_III = [
  { upToCents: 99_100, rateMilli: 0, parcelaCents: 0, additionalPerDependentCents: 0 },
  {
    upToCents: 104_200,
    rateMilli: 12_500,
    parcelaFormula: { rateMilli: 12_500, factorMilli: 2_600, anchorCents: 137_215 },
    additionalPerDependentCents: 4_286,
  },
  {
    upToCents: 110_800,
    rateMilli: 12_500,
    parcelaFormula: { rateMilli: 12_500, factorMilli: 1_350, anchorCents: 167_785 },
    additionalPerDependentCents: 4_286,
  },
  { upToCents: 111_900, rateMilli: 12_500, parcelaCents: 9_617, additionalPerDependentCents: 4_286 },
  { upToCents: 143_200, rateMilli: 12_720, parcelaCents: 9_864, additionalPerDependentCents: 4_286 },
  { upToCents: 196_200, rateMilli: 15_700, parcelaCents: 14_132, additionalPerDependentCents: 4_286 },
  { upToCents: 224_000, rateMilli: 19_380, parcelaCents: 21_353, additionalPerDependentCents: 4_286 },
  { upToCents: 277_300, rateMilli: 22_770, parcelaCents: 28_947, additionalPerDependentCents: 4_286 },
  { upToCents: 338_900, rateMilli: 25_700, parcelaCents: 37_072, additionalPerDependentCents: 4_286 },
  { upToCents: 596_500, rateMilli: 28_810, parcelaCents: 47_612, additionalPerDependentCents: 4_286 },
  { upToCents: 2_026_500, rateMilli: 38_430, parcelaCents: 104_996, additionalPerDependentCents: 4_286 },
  { upToCents: null, rateMilli: 47_170, parcelaCents: 282_113, additionalPerDependentCents: 4_286 },
];

module.exports = {
  jurisdiction: 'PT',
  tax: 'IRS_WH',
  version: 'PT-IRS-WH-2026.1',
  status: 'active',
  effectiveFrom: '2026-01-01',
  effectiveTo: null,
  territory: 'continente',
  source: {
    label: 'Despacho n.º 233-A/2026 — tabelas retenção continente (trabalho dependente)',
    url: 'https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/legislacao/diplomas_legislativos/Documents/Despacho-233-A-2026.pdf',
    notes:
      'Simulação Teglion. Tabelas I–III (sem deficiência). Confirmar sempre no Portal das Finanças / despacho vigente.',
  },
  rounding: {
    mode: 'half_up_cents',
    description: 'Arredondamento ao cêntimo; retenção não pode ser negativa.',
  },
  /** Redução 1 p.p. na taxa marginal se ≥ 3 dependentes (n.º 5 alínea h). */
  largeFamilyRateReductionMilli: 1_000,
  tables: {
    I: {
      code: 'I',
      label: 'Não casado sem dependentes ou casado dois titulares',
      brackets: TABLE_I,
    },
    II: {
      code: 'II',
      label: 'Não casado com um ou mais dependentes',
      brackets: TABLE_II,
      minDependents: 1,
    },
    III: {
      code: 'III',
      label: 'Casado, único titular',
      brackets: TABLE_III,
    },
  },
  limitations: [
    'Só continente, trabalho dependente, titulares sem deficiência (tabelas I–III).',
    'Não aplica isenções art. 12.º-B, trabalho suplementar a 50 %, nem opção de taxa superior.',
    'Não cobre pensões nem Regiões Autónomas.',
    'Não é declaração oficial nem substitui o software de salários certificado.',
  ],
};
