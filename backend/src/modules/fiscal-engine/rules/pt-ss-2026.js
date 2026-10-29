/**
 * Regras Segurança Social Portugal — taxas gerais 2026 (simulação).
 * Fontes: gov.pt (contribuições TCO) + Guias Segurança Social / Guia Fiscal PwC 2026.
 * IAS 2026: 537,13 € (referência pública).
 *
 * Não cobre isenções temporárias, regimes especiais (deficientes, pré-reforma, etc.).
 */
module.exports = {
  jurisdiction: 'PT',
  tax: 'SS',
  version: 'PT-SS-2026.1',
  status: 'active',
  effectiveFrom: '2026-01-01',
  effectiveTo: null,
  source: {
    label: 'gov.pt — Contribuições SS (TCO) + regime TI (CRC)',
    url: 'https://www.gov.pt/pt/servicos/obter-informacoes-sobre-as-contribuicoes-para-a-seguranca-social-pagamento-de-entidade-empregadora-por-trabalhador-por-conta-de-outrem',
    notes:
      'Simulação Teglion. Confirmar sempre o enquadramento no Portal da Segurança Social Direta. IAS 2026 = 537,13 €.',
  },
  rounding: {
    mode: 'half_up_cents',
    description: 'Arredondamento ao cêntimo mais próximo (0,5 cêntimo sobe).',
  },
  /** Indexante dos Apoios Sociais 2026 — cêntimos. */
  iasCents: 53_713,
  regimes: [
    {
      code: 'tco_lucrativo',
      label: 'Trabalho por conta de outrem (entidade com fins lucrativos)',
      workerBps: 1100,
      employerBps: 2375,
      totalBps: 3475,
      kind: 'employment',
    },
    {
      code: 'tco_ipss',
      label: 'Trabalho por conta de outrem (IPSS / sem fins lucrativos)',
      workerBps: 1100,
      employerBps: 2230,
      totalBps: 3330,
      kind: 'employment',
    },
    {
      code: 'ti_geral',
      label: 'Trabalhador independente (taxa geral)',
      workerBps: 2140,
      employerBps: 0,
      totalBps: 2140,
      kind: 'self_employed',
      /** Coeficiente rendimento relevante — prestação de serviços. */
      relevantIncomePct: 70,
      /** Coeficiente rendimento relevante — vendas de mercadorias. */
      relevantIncomeSalesPct: 20,
    },
    {
      code: 'ti_eni',
      label: 'ENI / EIRL e cônjuges (taxa 25,2 %)',
      workerBps: 2520,
      employerBps: 0,
      totalBps: 2520,
      kind: 'self_employed',
      relevantIncomePct: 70,
      relevantIncomeSalesPct: 20,
    },
  ],
  limitations: [
    'Não aplica isenções, reduções temporárias nem regimes especiais (deficientes, pré-reforma, 1.º emprego, etc.).',
    'Para TI: estimativa simplificada — não aplica declaração trimestral, opção ±25 %, nem limites mín./máx. da BIC.',
    'Coeficientes de rendimento relevante usados na estimativa: 70 % prestação de serviços, 20 % vendas.',
    'Não calcula contribuição da entidade contratante (7 % / 10 %).',
    'Não é declaração oficial nem substitui a Segurança Social Direta.',
  ],
};
