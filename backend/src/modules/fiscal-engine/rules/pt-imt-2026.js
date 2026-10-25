/**
 * IMT Portugal 2026 — tabelas práticas continente + taxas fixas.
 * Fonte: Ofício Circulado AT n.º 40129/2026 + art. 17.º CIMT (OE 2026).
 *
 * Fórmula escalões marginais: max(0, valor × taxa − parcela a abater).
 * Escalões «taxa única»: valor × taxa (sem parcela).
 *
 * Não cobre RAA/RAM, isenções pontuais, taxa 10 % (domicílio paraíso fiscal),
 * nem Imposto do Selo.
 */

/** @typedef {{ upToCents: number|null, rateMilli: number, parcelaCents: number, flat?: boolean }} Bracket */

/** @type {Bracket[]} */
const TABLE_I = [
  { upToCents: 10_634_600, rateMilli: 0, parcelaCents: 0 },
  { upToCents: 14_547_000, rateMilli: 2_000, parcelaCents: 212_692 },
  { upToCents: 19_834_700, rateMilli: 5_000, parcelaCents: 649_102 },
  { upToCents: 33_053_900, rateMilli: 7_000, parcelaCents: 1_045_796 },
  { upToCents: 66_098_200, rateMilli: 8_000, parcelaCents: 1_376_335 },
  { upToCents: 115_085_300, rateMilli: 6_000, parcelaCents: 0, flat: true },
  { upToCents: null, rateMilli: 7_500, parcelaCents: 0, flat: true },
];

/** @type {Bracket[]} */
const TABLE_II = [
  { upToCents: 33_053_900, rateMilli: 0, parcelaCents: 0 },
  { upToCents: 66_098_200, rateMilli: 8_000, parcelaCents: 2_644_312 },
  { upToCents: 115_085_300, rateMilli: 6_000, parcelaCents: 0, flat: true },
  { upToCents: null, rateMilli: 7_500, parcelaCents: 0, flat: true },
];

/** @type {Bracket[]} */
const TABLE_III = [
  { upToCents: 10_634_600, rateMilli: 1_000, parcelaCents: 0 },
  { upToCents: 14_547_000, rateMilli: 2_000, parcelaCents: 106_346 },
  { upToCents: 19_834_700, rateMilli: 5_000, parcelaCents: 542_756 },
  { upToCents: 33_053_900, rateMilli: 7_000, parcelaCents: 939_450 },
  { upToCents: 63_393_100, rateMilli: 8_000, parcelaCents: 1_269_989 },
  { upToCents: 115_085_300, rateMilli: 6_000, parcelaCents: 0, flat: true },
  { upToCents: null, rateMilli: 7_500, parcelaCents: 0, flat: true },
];

module.exports = {
  jurisdiction: 'PT',
  tax: 'IMT',
  version: 'PT-IMT-2026.1',
  status: 'active',
  effectiveFrom: '2026-01-01',
  effectiveTo: null,
  territory: 'continente',
  source: {
    label: 'Ofício Circulado AT n.º 40129/2026 — tabelas práticas IMT 2026',
    url: 'https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/legislacao/instrucoes_administrativas/Documents/Oficio_Circulado_40129_2026.pdf',
    notes:
      'Simulação Teglion (continente). Confirmar valor tributável (maior entre preço e VPT) e isenções no Portal das Finanças.',
  },
  rounding: {
    mode: 'half_up_cents',
    description: 'Arredondamento ao cêntimo; IMT não pode ser negativo.',
  },
  tables: {
    I: {
      code: 'I',
      label: 'Habitação própria e permanente',
      brackets: TABLE_I,
    },
    II: {
      code: 'II',
      label: 'HPP — jovens ≤ 35 anos',
      brackets: TABLE_II,
    },
    III: {
      code: 'III',
      label: 'Habitação (não HPP)',
      brackets: TABLE_III,
    },
  },
  flatRates: {
    rustic: {
      code: 'rustic',
      label: 'Prédios rústicos',
      rateMilli: 5_000,
    },
    other_urban: {
      code: 'other_urban',
      label: 'Outros prédios urbanos / outras aquisições onerosas',
      rateMilli: 6_500,
    },
  },
  limitations: [
    'Só continente — não aplica tabelas IV–VI (RAA/RAM).',
    'Não determina isenções, reinvestimentos nem taxa 10 % (paraíso fiscal).',
    'Não calcula Imposto do Selo.',
    'O valor de incidência deve ser o maior entre preço e valor patrimonial tributário.',
    'Não é liquidação oficial nem substitui o Portal das Finanças.',
  ],
};
