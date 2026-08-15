/**
 * Formulário completo IRS Modelo 3 — perguntas + documentos base/condicionais.
 * Usado pelo catálogo (activate) e espelhado no editor IRS do frontend.
 *
 * documentTags nas opções = tags estáveis; títulos vêm de DOCUMENT_CATALOG.
 */

const DOCUMENT_CATALOG = {
  cartao_cidadao: 'Cartão de Cidadão (titular)',
  nif_titular: 'Comprovativo de NIF (titular)',
  efatura: 'Exportação e-Fatura / despesas do ano',
  iban: 'Comprovativo de IBAN (reembolso IRS)',
  cartao_cidadao_conjuge: 'Cartão de Cidadão (cônjuge)',
  nif_conjuge: 'NIF do cônjuge',
  cc_dependentes: 'Comprovativos dos dependentes',
  // Aliases legados (título usado como tag no catálogo antigo)
  'caderneta predial': 'Caderneta predial',
  'comprovativos dos dependentes': 'Comprovativos dos dependentes',
  'cartão de cidadão ou passaporte': 'Cartão de Cidadão ou Passaporte',
  'cartao de cidadao ou passaporte': 'Cartão de Cidadão ou Passaporte',
  recibos_vencimento: 'Recibos de vencimento do ano',
  declaracao_entidade: 'Declaração de rendimentos da entidade patronal',
  recibos_verdes: 'Recibos verdes / faturação categoria B',
  ss_independente: 'Comprovativos Segurança Social (independente)',
  atividade_at: 'Comprovativo de início/alteração de atividade (AT)',
  caderneta_predial: 'Caderneta predial',
  contrato_arrendamento: 'Contrato(s) de arrendamento',
  despesas_prediais: 'Comprovativos de despesas prediais',
  escritura_compra: 'Escritura / contrato de compra do imóvel',
  escritura_venda: 'Escritura / contrato de venda do imóvel',
  despesas_mais_valias: 'Despesas e impostos da compra/venda',
  extratos_capitais: 'Extratos de juros / dividendos / capitais',
  docs_exterior: 'Comprovativos de rendimentos no estrangeiro',
  donativos: 'Comprovativos de donativos',
  ppr_pensoes: 'Comprovativos PPR / contribuições pensões',
  creditos_habitacao: 'Extrato de crédito habitação (HPP)',
  irs_jovem: 'Comprovativo elegibilidade IRS Jovem',
  declaracao_anterior: 'Cópia da declaração IRS do ano anterior (se tiver)',
};

function yesNo(id, label, yesTags = [], required = true) {
  return {
    id,
    label,
    type: 'yes_no',
    required,
    options: [
      { id: 'sim', label: 'Sim', documentTags: yesTags },
      { id: 'nao', label: 'Não', documentTags: [] },
    ],
  };
}

const IRS_MODELO3_BASE_DOCUMENTS = [
  { tag: 'cartao_cidadao', title: DOCUMENT_CATALOG.cartao_cidadao, timing: 'immediate' },
  { tag: 'efatura', title: DOCUMENT_CATALOG.efatura, timing: 'immediate' },
  { tag: 'iban', title: DOCUMENT_CATALOG.iban, timing: 'immediate' },
  { tag: 'declaracao_anterior', title: DOCUMENT_CATALOG.declaracao_anterior, timing: 'manual' },
];

const IRS_MODELO3_INTAKE_FORM = {
  irsConfig: {
    taxYear: null,
    anexos: ['A', 'B', 'C', 'F', 'G', 'H', 'J', 'JOVEM'],
  },
  questions: [
    {
      id: 'q_ano',
      label: 'Ano dos rendimentos a declarar',
      type: 'short_text',
      required: true,
    },
    {
      id: 'q_estado_civil',
      label: 'Estado civil / situação familiar',
      type: 'single_choice',
      required: true,
      options: [
        { id: 'solteiro', label: 'Solteiro(a) / separado(a) / viúvo(a)', documentTags: [] },
        {
          id: 'casado_conjunto',
          label: 'Casado(a) / união de facto — declaração conjunta',
          documentTags: ['cartao_cidadao_conjuge', 'nif_conjuge'],
        },
        {
          id: 'casado_separado',
          label: 'Casado(a) — declaração separada',
          documentTags: [],
        },
      ],
    },
    yesNo('q_dependentes', 'Tem dependentes a cargo (filhos ou outros)?', ['cc_dependentes']),
    yesNo('q_dep', 'Teve rendimentos de trabalho dependente (salário, pensão)?', [
      'recibos_vencimento',
      'declaracao_entidade',
    ]),
    yesNo('q_ind', 'Teve rendimentos como trabalhador independente (recibos verdes / categoria B)?', [
      'recibos_verdes',
      'ss_independente',
      'atividade_at',
    ]),
    yesNo('q_capitais', 'Teve rendimentos de capitais (juros, dividendos, etc.)?', ['extratos_capitais']),
    yesNo('q_pred', 'Teve rendimentos prediais (arrendamento)?', [
      'caderneta_predial',
      'contrato_arrendamento',
      'despesas_prediais',
    ]),
    yesNo('q_mv', 'Teve mais-valias com venda de imóveis ou valores mobiliários?', [
      'escritura_compra',
      'escritura_venda',
      'despesas_mais_valias',
    ]),
    yesNo('q_exterior', 'Teve rendimentos obtidos no estrangeiro ou é não residente?', ['docs_exterior']),
    yesNo('q_ben', 'Pretende usufruir de benefícios fiscais (donativos, PPR, etc.)?', [
      'donativos',
      'ppr_pensoes',
    ]),
    yesNo('q_habitacao', 'Tem crédito à habitação própria permanente?', ['creditos_habitacao']),
    yesNo('q_jovem', 'É elegível / quer aplicar o regime IRS Jovem?', ['irs_jovem'], false),
    {
      id: 'q_notas',
      label: 'Notas ou situações especiais que o contabilista deva saber',
      type: 'long_text',
      required: false,
    },
  ],
};

/** Títulos amigáveis para tags condicionais (quando não estão na base). */
function titleForTag(tag) {
  const raw = String(tag || '').trim();
  if (!raw) return raw;
  if (DOCUMENT_CATALOG[raw]) return DOCUMENT_CATALOG[raw];
  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return DOCUMENT_CATALOG[normalized] || DOCUMENT_CATALOG[raw.toLowerCase()] || raw;
}

module.exports = {
  DOCUMENT_CATALOG,
  IRS_MODELO3_BASE_DOCUMENTS,
  IRS_MODELO3_INTAKE_FORM,
  titleForTag,
};
