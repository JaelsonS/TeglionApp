import type { BlogPost } from '@/content/blog/types'
import {
  affiliateSection,
  articleSection,
  comparisonTable,
  internalLinksSection,
  keyTakeaways,
  legalCallout,
  proseParagraphs,
  sectionDivider,
  teglionCtaBlock,
} from '@/content/blog/shared'

export const postEscolherContabilista: BlogPost = {
  slug: 'como-escolher-contabilista-portugal',
  title: 'Como escolher contabilista em Portugal: guia para freelancers e PME',
  excerpt:
    'OCC, especialização, preço, portal do cliente e comunicação — critérios para escolher (ou mudar de) contabilista sem surpresas.',
  publishedAt: '2026-06-10',
  updatedAt: '2026-07-21',
  author: 'Jaelson Santos',
  authorRole: 'Fundador do TegLion · Escreve sobre fiscalidade em Portugal',
  category: 'Contabilidade',
  audience: ['independente', 'pme'],
  tags: ['contabilista', 'OCC', 'contabilidade', 'freelancer', 'escritório'],
  readMinutes: 14,
  featured: true,
  series: {
    id: 'independente-2026',
    title: 'Trabalhador independente em Portugal',
    description: 'Série completa para quem abre actividade ou já factura em recibos verdes.',
    part: 5,
    totalParts: 5,
  },
  coverImage: {
    src: '/blog/covers/escritorio.svg',
    alt: 'Como escolher contabilista em Portugal',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Como escolher contabilista em Portugal (OCC)',
    description:
      'Como escolher contabilista certificado OCC em Portugal: preços típicos, portal do cliente, comunicação e quando mudar. Para freelancers, recibos verdes e PME.',
    keywords: [
      'escolher contabilista Portugal',
      'contabilista OCC',
      'contabilidade freelancer',
      'mudar de contabilista',
      'preço contabilista independente',
      'portal cliente contabilista',
    ],
  },
  relatedSlugs: [
    'regime-simplificado-vs-contabilidade-organizada',
    'guia-completo-trabalhador-independente-portugal-2026',
    'organizar-documentos-fiscais-arquivo-digital',
    'digitalizar-escritorio-contabilidade-portugal',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'Contabilista em Portugal deve estar inscrito na OCC — peça número de membro.',
      'Preço mensal típico para independente: 40–120 € conforme volume e regime.',
      'Exija canal estruturado (portal, email) — evite só WhatsApp sem registo.',
      'Nunca entregue a senha do Portal das Finanças ao contador.',
      'Revisão trimestral evita surpresas no IRS anual.',
    ]),
    ...proseParagraphs(
      'Ligou a três escritórios: um responde «mande WhatsApp», outro pede a senha das Finanças «para agilizar», e o terceiro envia proposta com 65 €/mês, portal do cliente e revisão trimestral. A diferença não é só preço — é risco. Este guia ajuda a escolher contabilista em Portugal (ou mudar) com critérios práticos, para freelancers e PME.',
      'Um bom contabilista certificado OCC não é só quem «entrega o IRS». É quem explica obrigações antes do prazo, responde em tempo útil e usa ferramentas que não o obrigam a pedir documentos por mensagens soltas.',
      'Para perceber regimes de contabilidade antes da conversa, leia também o artigo sobre regime simplificado vs organizado — e o guia completo do trabalhador independente se ainda está a abrir actividade. Se gere um escritório, cruze com digitalizar o escritório e software para contabilidade.',
    ),
    { type: 'h2', id: 'criterios', text: '7 critérios de escolha' },
    {
      type: 'ol',
      items: [
        'Inscrição activa na OCC (peça número de membro)',
        'Experiência na sua actividade (serviços, comércio, tech, etc.)',
        'Clareza de preços — mensalidade vs por documento',
        'Canal de comunicação definido (email, portal, reuniões)',
        'Portal do cliente ou forma estruturada de pedir documentos',
        'Prazos de resposta realistas (24–48h úteis é razoável)',
        'Disponibilidade para revisão trimestral, não só IRS anual',
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'Sinais de alerta',
      text: 'Promessas de «pagar zero IRS», pedidos de senha do Portal das Finanças, ausência de recibo de honorários ou comunicação só por mensagens de voz sem registo.',
    },
    {
      type: 'link',
      label: 'Guia completo do trabalhador independente 2026',
      slug: 'guia-completo-trabalhador-independente-portugal-2026',
    },
    { type: 'h2', id: 'preco', text: 'Quanto custa em 2026?' },
    {
      type: 'p',
      text: 'Trabalhador independente com contabilidade organizada: tipicamente 40–120 €/mês conforme volume de documentos e complexidade. Regime simplificado pode ficar nos 40–70 €; sociedades e IVA regular sobem facilmente para 120–250 €+. Peça proposta por escrito — «à volta de X» sem papel é conversa de café, não contrato.',
    },
    { type: 'link', label: 'Regime simplificado vs contabilidade organizada', slug: 'regime-simplificado-vs-contabilidade-organizada' },
    {
      type: 'link',
      label: 'Quanto custa abrir actividade em Portugal',
      slug: 'quanto-custa-abrir-actividade-portugal',
    },
    sectionDivider(),
    comparisonTable({
      caption: 'Pacotes típicos de honorários (indicativos)',
      headers: ['Perfil', 'Faixa mensal', 'O que costuma incluir'],
      rows: [
        ['Independente, regime simplificado, poucos recibos', '40–70 €', 'IRS, orientação SS, email'],
        ['Independente organizado ou IVA regular', '70–120 €', 'IVA, mapas, arquivo'],
        ['Microempresa com funcionários', '120–250 €+', 'Salários, SS, IVA, IRC/IRS'],
        ['Só IRS anual (sem acompanhamento)', 'Variável', 'Não recomendado se factura regularmente'],
      ],
    }),
    { type: 'h2', id: 'portal', text: 'Portal do cliente: o que exigir' },
    {
      type: 'ul',
      items: [
        'Upload seguro de facturas e recibos',
        'Lista clara do que falta entregar',
        'Histórico de mensagens com o escritório',
        'Visibilidade de prazos (SS, IVA, IRS)',
        'Sem depender de email perdido ou grupos de WhatsApp',
      ],
    },
    {
      type: 'link',
      label: 'Como digitalizar um escritório de contabilidade',
      slug: 'digitalizar-escritorio-contabilidade-portugal',
    },
    {
      type: 'link',
      label: 'Software para escritório de contabilidade em Portugal',
      slug: 'software-escritorio-contabilidade-portugal',
    },
    ...articleSection({
      h2: 'Checklist para a primeira reunião',
      id: 'primeira-reuniao',
      paragraphs: [
        'Leve NIF, comprovativo de início de actividade, últimos recibos emitidos, extrato bancário dos últimos 3 meses e lista de despesas com factura. Pergunte explicitamente: o que está incluído na mensalidade, prazo de resposta, e como pedem documentos em falta.',
      ],
      blocks: [
        {
          type: 'ol',
          items: [
            'Confirmar número OCC e experiência na sua actividade',
            'Pedir proposta escrita com serviços incluídos e exclusões',
            'Definir canal oficial (portal, email) — evitar só WhatsApp',
            'Combinar revisão trimestral ou semestral',
            'Esclarecer quem emite recibos/facturas (você vs escritório)',
            'Perguntar sobre software de facturação recomendado',
            'Anotar honorários: mensalidade + extras (cessação, substituição IRS, etc.)',
          ],
        },
      ],
    }),
    ...articleSection({
      h2: 'Perguntas que deve fazer (e respostas que quer ouvir)',
      id: 'perguntas',
      paragraphs: [
        '«Como me avisam de prazos?» — Resposta boa: alertas por email ou portal, não só «ligamos se houver problema». «Posso ver o que falta entregar?» — Lista actualizada, não memória do contador.',
        '«Trabalham com regime simplificado e organizado?» — Especialização na sua estrutura. «Quem trata do IVA se passar a sujeito passivo?» — Transição planeada, não surpresa de honorários de +50 €/mês sem aviso.',
      ],
      blocks: [
        {
          type: 'link',
          label: 'Portal das Finanças — guia para iniciantes',
          slug: 'portal-financas-guia-completo-iniciantes',
        },
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'É contabilista certificado?',
      text: 'Ofereça portal TegLion aos seus clientes — marca do escritório, pedidos formais e menos tempo em follow-up de documentos.',
    }),
    ...articleSection({
      h2: 'Como mudar de contabilista',
      id: 'mudar',
      paragraphs: [
        'Pode mudar a qualquer momento. Peça exportação de documentos e mapas; comunique à AT se havia procuração ao contabilista anterior.',
        'O novo escritório precisa de histórico de recibos e declarações — organize arquivo antes da transição para não pagar horas de reconstrução a 30–50 €/hora.',
      ],
      blocks: [
        {
          type: 'link',
          label: 'Organizar documentos fiscais — arquivo digital',
          slug: 'organizar-documentos-fiscais-arquivo-digital',
        },
      ],
    }),
    ...internalLinksSection({
      title: 'Preparar-se antes da primeira reunião',
      slugs: [
        'guia-completo-trabalhador-independente-portugal-2026',
        'organizar-documentos-fiscais-arquivo-digital',
        'declaracao-irs-guia-pratico',
        'obrigacoes-fiscais-mes-a-mes',
      ],
    }),
    ...affiliateSection({
      heading: 'Aprofundar conhecimento',
      headingId: 'livros',
      intro: 'Para entender o que o contabilista faz (sem substituí-lo), estes recursos ajudam.',
      items: [
        {
          key: 'amazonLivroGestaoContabil',
          leadIn: 'Linguagem acessível sobre conceitos contabilísticos — útil antes de reuniões com o escritório.',
          title: 'Gestão Contábil — Para Contadores e Não Contadores (Amazon)',
          description: 'Livro em português sobre fundamentos.',
        },
        {
          key: 'hotmartIrsReciboVerde',
          leadIn: 'Se ainda entrega IRS sozinho e quer perceber o básico antes de contratar.',
          title: 'IRS & Recibo Verde — Guia Prático (Hotmart)',
          description: 'Curso/guia em português para Portugal.',
        },
      ],
    }),
    legalCallout(),
  ],
}
