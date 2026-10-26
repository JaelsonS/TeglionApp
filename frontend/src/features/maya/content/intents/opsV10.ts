import { defineIntent } from '@/features/maya/content/types'

/** Intents Onda 1–6: avenças, rendas, SAF-T, Manual. */
export const OPS_V10_INTENTS = [
  defineIntent({
    id: 'fee-charges',
    title: 'Avenças e mapa de pagamentos',
    shortDescription: 'honorários manuais',
    surface: 'firm',
    answer:
      'Em Pagamentos gere as avenças dos clientes sem Stripe: defina a mensalidade na ficha (Faturação), gere o mês no mapa e marque rascunho → confirmada → enviada → paga. Connect é opcional — nunca bloqueia o registo manual.',
    steps: [
      'Abra o cliente → Faturação e active a avença',
      'Vá a Pagamentos e escolha o ano',
      'Use Gerar pagamentos para o mês',
      'Clique numa célula para editar estado ou método',
    ],
    deepLink: '/app/firm/payments',
    relatedIntents: ['payments', 'billing', 'clients', 'manual-guide'],
    ctaLabel: 'Abrir Pagamentos',
    commonProblems: [
      {
        id: 'precisa-stripe',
        title: 'Preciso de Stripe?',
        answer:
          'Não. Sem Connect regista transferências, MB Way e numerário. Connect só se quiser cobrança online.',
      },
    ],
  }),
  defineIntent({
    id: 'rentals-guide',
    title: 'Arrendamentos dos clientes',
    shortDescription: 'recibos internos',
    surface: 'firm',
    answer:
      'Em Arrendamentos (clientes) regista imóveis e contratos dos seus clientes (senhorio → inquilino) com recibos INTERNOS. É um módulo separado dos Custos do gabinete. Não são recibos oficiais AT nem comunicação ao Portal das Finanças.',
    steps: [
      'Abra Arrendamentos (clientes) — não use Custos do gabinete',
      'Crie o imóvel associado ao cliente senhorio',
      'Adicione o contrato com o inquilino e a renda',
      'Gere recibos do mês e marque emitido/pago',
    ],
    deepLink: '/app/firm/client-rentals',
    relatedIntents: ['fee-charges', 'manual-guide'],
    ctaLabel: 'Abrir Arrendamentos',
  }),
  defineIntent({
    id: 'saft-read',
    title: 'SAF-T (leitura)',
    shortDescription: 'XML → totais',
    surface: 'firm',
    answer:
      'Carregue SAF-T PT (.xml/.zip) ou uma folha .xlsx sem macros. O ficheiro não é guardado, não há download de URLs, não se executam fórmulas/macros, e nada vai para a AT. .xls/.xlsm são rejeitados.',
    steps: [
      'Exporte o SAF-T XML do software do cliente (preferível) ou uma folha .xlsx sem macros',
      'Abra SAF-T (leitura) e carregue o ficheiro',
      'Confira NIF, período e totais de vendas',
    ],
    deepLink: '/app/firm/saft',
    relatedIntents: ['manual-guide', 'obligations'],
    ctaLabel: 'Abrir SAF-T',
  }),
  defineIntent({
    id: 'manual-guide',
    title: 'Manual do utilizador',
    shortDescription: 'guia Maya completo',
    surface: 'firm',
    answer:
      'O Manual público está em /manual — sou eu a explicar cada módulo, com honestidade sobre o que já existe e o que ainda não. Pode abrir noutro separador e voltar à app quando quiser.',
    steps: [
      'Abra o Manual (índice)',
      'Escolha o capítulo do módulo onde está',
      'Se precisar de uma pessoa, use Suporte',
    ],
    deepLink: '/manual',
    relatedIntents: ['human-support', 'tour', 'fee-charges'],
    ctaLabel: 'Abrir Manual',
  }),
]
