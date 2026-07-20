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
} from '@/content/blog/shared'

export const postPrazosIrs2026: BlogPost = {
  slug: 'prazos-irs-2026-independentes',
  title: 'Prazos IRS 2026 para trabalhadores independentes',
  excerpt:
    'Calendário de entrega, fases da campanha, documentos a reunir, pagamentos e checklist completo para quem entrega IRS com recibos verdes ou facturas.',
  publishedAt: '2026-05-19',
  updatedAt: '2026-06-17',
  author: 'Liliana Nunes',
  authorRole: 'Revisão editorial TegLion · Guias de fiscalidade portuguesa',
  category: 'IRS',
  audience: ['independente', 'pme'],
  featured: false,
  tags: ['IRS 2026', 'prazos', 'calendário fiscal', 'recibos verdes', 'independentes'],
  readMinutes: 8,
  series: {
    id: 'zero-ao-primeiro-irs',
    title: 'Do zero ao primeiro IRS',
    description: 'Deduções, declaração, prazos e erros comuns — trilho para a primeira (ou próxima) entrega de IRS.',
    part: 3,
    totalParts: 4,
  },
  coverImage: {
    src: '/blog/covers/irs.svg',
    alt: 'Prazos de IRS e calendário fiscal',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Prazos IRS 2026 independentes Portugal | Blog TegLion',
    description:
      'Datas, fases e checklist para entregar IRS 2026 como trabalhador independente em Portugal. Prepare documentos com antecedência e evite coimas.',
    keywords: ['prazos IRS 2026', 'IRS independente prazo', 'calendário IRS Portugal', 'entregar IRS 2026', 'campanha IRS'],
  },
  relatedSlugs: [
    'declaracao-irs-guia-pratico',
    'deducoes-irs-portugal-guia-completo',
    'irs-recibos-verdes-erros-comuns',
    'calendario-fiscal-portugal-2026-completo',
  ],
  blocks: [
    legalCallout('Datas exactas publicadas anualmente pela AT — verifique portaldasfinancas.gov.pt antes de submeter.'),
    keyTakeaways([
      'A campanha de IRS decorre tipicamente entre Abril e Junho/Julho, com prazos escalonados por NIF.',
      'Trabalhadores independentes declaram rendimentos da actividade no anexo correspondente (ex.: anexo B).',
      'Prepare documentos em Fevereiro–Março — não espere pela abertura oficial da campanha.',
      'Quem tem reembolso tende a receber mais cedo se entregar no início da campanha.',
      'Entregar fora do prazo gera coimas e juros; corrigir após submissão tem regras próprias.',
    ]),
    ...proseParagraphs(
      'Todos os anos, trabalhadores independentes entregam IRS entre Abril e Junho/Julho (conforme calendário oficial da Autoridade Tributária). Marcar prazos evita coimas e dá tempo para corrigir erros antes da submissão final.',
      'Este guia organiza o que preparar, quando começar e como evitar os erros de quem deixa tudo para o último dia útil — quando o portal está sobrecarregado e o contador já não tem vagas.',
    ),
    {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=960&h=540&fit=crop&q=80',
      alt: 'Calendário numa parede',
      caption: 'Anote o último dia útil do seu prazo — não deixe para a véspera.',
    },
    ...articleSection({
      h2: 'Como funciona a campanha de IRS',
      id: 'campanha',
      paragraphs: [
        'A AT abre a campanha de IRS por fases. Os prazos finais podem variar conforme o último dígito do NIF ou outras regras publicadas no ano. Consulte sempre o calendário oficial no Portal das Finanças.',
        'Durante a campanha, o portal pré-preenche rendimentos com base em recibos emitidos, retenções comunicadas por terceiros e outras fontes. O seu trabalho é validar — não assumir que está correcto.',
      ],
    }),
    comparisonTable({
      caption: 'Linha do tempo recomendada (independente com recibos verdes)',
      headers: ['Quando', 'O que fazer'],
      rows: [
        ['Jan–Fev', 'Exportar lista de recibos emitidos no ano anterior; organizar despesas'],
        ['Março', 'Reunião com contador ou simulação no portal; actualizar IBAN'],
        ['Abril (abertura)', 'Entregar se números conferidos — prioridade se espera reembolso'],
        ['Maio–Junho', 'Última janela — evitar só se ainda a recolher documentos em falta'],
        ['Após prazo', 'Entrega extemporânea com coimas; regularização o quanto antes'],
      ],
    }),
    sectionDivider(),
    ...articleSection({
      h2: 'Checklist de documentos antes de entregar',
      id: 'checklist',
      blocks: [
        {
          type: 'ul',
          items: [
            'Total de recibos/facturas emitidos no ano (export do e-Fatura)',
            'Retenções na fonte sofridas — cruzar com PDFs de cada recibo B2B',
            'Despesas dedutíveis documentadas (facturas com NIF da actividade)',
            'Rendimentos de outras fontes: emprego, pensões, arrendamento, plataformas',
            'Contribuições à Segurança Social pagas (comprovativos)',
            'IBAN actualizado no portal para reembolso ou débito',
            'Comprovativo de IRS do ano anterior (referência de valores)',
            'Rendimentos do estrangeiro, se aplicável',
          ],
        },
      ],
    }),
    ...articleSection({
      h2: 'Anexo da actividade independente',
      id: 'anexo',
      paragraphs: [
        'No regime simplificado, a tributação baseia-se em coeficientes aplicados à facturação — nem todas as despesas entram da mesma forma que na contabilidade organizada.',
        'Na contabilidade organizada, o contador prepara mapas com despesas reais. Em ambos os casos, os rendimentos da actividade devem coincidir com os documentos emitidos e comunicados à AT.',
      ],
    }),
    ...articleSection({
      h2: 'Pagamento ou reembolso após entrega',
      id: 'pagamento',
      paragraphs: [
        'Se o resultado for imposto a pagar, o portal indica valor e prazos de pagamento (incluindo possibilidade de prestações, conforme regras em vigor).',
        'Se houver reembolso, o valor vai para o IBAN registado. Verifique se está correcto antes de submeter — erros atrasam o crédito.',
      ],
    }),
    ...articleSection({
      h2: 'Entregar cedo vs deixar para o fim',
      id: 'dica',
      paragraphs: [
        'Quem tem reembolso a receber tende a receber mais cedo se entregar no início da campanha. O processamento da AT é sequencial — filas mais curtas em Abril.',
        'Quem deve imposto ganha tempo para planear o pagamento e evita stress técnico (portal lento, senha expirada, documentos em falta descobertos tarde).',
        'Excepção: se ainda aguarda documentos de clientes ou do contador, melhor esperar com números completos do que submeter e corrigir depois.',
      ],
    }),
    ...articleSection({
      h2: 'Erros de prazo que geram coimas',
      id: 'coimas',
      blocks: [
        {
          type: 'ul',
          items: [
            'Não entregar IRS quando legalmente obrigado',
            'Entregar com rendimentos omitidos (além de coima, imposto em falta + juros)',
            'Não pagar imposto apurado no prazo de pagamento',
            'Ignorar notificações de correção da AT após entrega',
          ],
        },
      ],
    }),
    ...affiliateSection({
      heading: 'Do calendário à entrega sem correria',
      headingId: 'marcar',
      intro:
        'A campanha de IRS não se resolve no último dia útil: quem marca fases (reunir documentos, cruzar totais, submeter) e segue um roteiro claro evita coimas e noites em branco. Dois apoios complementam este calendário.',
      items: [
        {
          key: 'hotmartIrsReciboVerde',
          leadIn:
            'Na primeira entrega com recibos verdes, prazos e anexos misturam-se. Um guia prático em português condensa documentos, fluxos de submissão e erros comuns — útil em paralelo com o seu contador, não em substituição.',
          title: 'IRS & Recibo Verde (Hotmart)',
          description: 'roteiro para independentes na campanha anual.',
        },
        {
          key: 'amazonAgendaBezend',
          leadIn:
            'Anote no início de Abril «campanha aberta» e no fim do prazo legal «último dia útil», com espaço semanal para IVA e Segurança Social. Uma agenda física na mesa (ou na mochila) lembra o que o portal não notifica a tempo.',
          title: 'Agenda semanal BEZEND 2026–2027 (Amazon)',
          description: 'formato A5 para manter o calendário fiscal visível o ano inteiro.',
        },
      ],
    }),
    { type: 'link', label: 'Declaração de IRS — guia prático', slug: 'declaracao-irs-guia-pratico' },
    { type: 'link', label: 'Calendário fiscal Portugal 2026', slug: 'calendario-fiscal-portugal-2026-completo' },
    ...internalLinksSection({
      title: 'Continuar a preparar o IRS',
      slugs: [
        'declaracao-irs-guia-pratico',
        'deducoes-irs-portugal-guia-completo',
        'irs-recibos-verdes-erros-comuns',
        'calendario-fiscal-portugal-2026-completo',
      ],
    }),
    legalCallout(),
  ],
}
