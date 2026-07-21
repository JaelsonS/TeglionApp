import type { BlogPost } from '@/content/blog/types'
import {
  affiliateSection,
  articleSection,
  comparisonTable,
  internalLinksSection,
  keyTakeaways,
  legalCallout,
  proseParagraphs,
  quoteBlock,
  sectionDivider,
  teglionCtaBlock,
} from '@/content/blog/shared'

export const postCalendarioFiscal2026: BlogPost = {
  slug: 'calendario-fiscal-portugal-2026-completo',
  title: 'Calendário fiscal Portugal 2026: todos os prazos do independente e da PME',
  excerpt:
    'Mapa mês a mês de Segurança Social, IVA, IRS, retenções e arquivo — com tabelas, checklists e ligações aos guias detalhados do blog.',
  publishedAt: '2026-06-18',
  updatedAt: '2026-07-21',
  author: 'Liliana Nunes',
  authorRole: 'Revisão editorial TegLion · Guias de fiscalidade portuguesa',
  category: 'Guias completos',
  audience: ['independente', 'pme'],
  tags: ['calendário fiscal', 'prazos 2026', 'obrigações', 'IVA', 'IRS', 'Segurança Social', 'PME'],
  readMinutes: 16,
  featured: true,
  coverImage: {
    src: '/blog/covers/fiscal-calendar.svg',
    alt: 'Calendário fiscal com marcações de prazos',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Calendário fiscal Portugal 2026 — prazos AT e SS',
    description:
      'Mapa mês a mês de Segurança Social, IVA, IRS e retenções em 2026 para independentes e PME — com checklists e links aos guias do blog TegLion.',
    keywords: [
      'calendário fiscal 2026 Portugal',
      'prazos fiscais independente',
      'obrigações mensais contabilidade',
      'IVA trimestral prazo',
      'IRS 2026 prazo',
    ],
  },
  relatedSlugs: [
    'obrigacoes-fiscais-mes-a-mes',
    'prazos-irs-2026-independentes',
    'guia-completo-trabalhador-independente-portugal-2026',
    'declaracao-irs-guia-pratico',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'Finanças (AT) e Segurança Social têm calendários separados — cumprir IRS não dispensa contribuições SS.',
      'A maioria dos prazos mensais cai no dia 20 do mês seguinte (SS, IVA mensal) — confirme sempre no portal oficial.',
      'IRS é anual (primavera–verão); prepare documentos ao longo do ano, não na véspera.',
      'Guarde PDF de cada entrega e pagamento — o arquivo é a sua defesa em caso de audição.',
      'Um contador certificado adapta este calendário ao seu regime (isenção IVA, trimestral, sociedade, etc.).',
    ]),
    ...proseParagraphs(
      'Recebeu um aviso da Segurança Social a lembrar a contribuição do mês e, no mesmo dia, o contador pergunta se o IVA do trimestre já está preparado — e apercebe-se que não tem um único calendário onde tudo caiba. Este artigo existe para esse momento.',
      'No balcão do escritório, a conversa é quase sempre a mesma: «pensei que o IRS cobria tudo». Não cobre. SS no dia 20, IVA no dia 20, retenções quando há, e o Modelo 3 na primavera — cada um com comprovativo e pasta. Se factura 800 € num mês e gasta tudo, a contribuição e o IVA (se houver) saem do mês seguinte: daí o stress.',
      'Se gere um pequeno negócio ou trabalha como independente em Portugal, o calendário fiscal não é um único evento anual — é um ritmo contínuo de emissão de documentos, pagamentos e declarações. Este artigo reúne os marcos que a maioria dos profissionais encontra ao longo de 2026, organizados por frequência e por mês.',
      'Os prazos exactos são publicados pela Autoridade Tributária e pela Segurança Social e podem ser ajustados quando caem em feriados ou fins-de-semana. Use este guia como mapa de estudo e confirme datas no Portal das Finanças e em seguranca-social.pt antes de agir.',
    ),
    quoteBlock(
      'Escritórios que falham prazos raramente o fazem por ignorância da lei — falham porque não tinham um calendário partilhado por cliente e por obrigação.',
      'Prática em gestão de escritórios de contabilidade',
    ),
    ...articleSection({
      h2: 'Visão geral: três frequências',
      id: 'frequencias',
      paragraphs: [
        'Pense no calendário em três camadas: obrigações que se repetem quase todos os meses (facturar, SS, eventual IVA), obrigações trimestrais ou periódicas (IVA trimestral, algumas declarações informativas) e o ciclo anual forte (IRS, inventários, comunicações de fim de ano).',
        'A tabela seguinte resume o que costuma aplicar-se a um trabalhador independente com actividade aberta. Sociedades (Lda., SA) têm obrigações adicionais (IRC, IES, contabilidade organizada) — não estão todas listadas aqui.',
      ],
      blocks: [
        comparisonTable({
          caption: 'Resumo informativo — valide o seu enquadramento com contador certificado.',
          headers: ['Obrigação', 'Frequência', 'Prazo típico', 'Onde'],
          rows: [
            ['Emitir recibos/facturas', 'Por cada venda', 'No momento da prestação', 'e-Fatura / software certificado'],
            ['Contribuições SS', 'Mensal', 'Até dia 20 do mês seguinte', 'seguranca-social.pt'],
            ['Declaração periódica IVA', 'Mensal ou trimestral', 'Até dia 20 após o período', 'Portal das Finanças'],
            ['Pagamento IVA', 'Com a declaração', 'Até dia 20', 'Portal das Finanças'],
            ['IRS (Modelo 3)', 'Anual', 'Abril–Julho (datas oficiais AT)', 'Portal das Finanças'],
            ['Arquivo de documentos', 'Contínuo', '4–10 anos conforme tipo', 'Digital + backup'],
          ],
        }),
        {
          type: 'link',
          label: 'Obrigações fiscais mês a mês (rotina do independente)',
          slug: 'obrigacoes-fiscais-mes-a-mes',
        },
      ],
    }),
    sectionDivider(),
    ...articleSection({
      h2: 'Janeiro a Março: arranque do ano fiscal',
      id: 't1',
      paragraphs: [
        'O primeiro trimestre mistura fecho do ano anterior com início de novas obrigações. Se ainda não entregou o IRS do ano passado, Janeiro é o mês de organizar documentos; se já entregou, é altura de definir rotinas para o ano corrente.',
      ],
      blocks: [
        { type: 'h3', id: 'jan', text: 'Janeiro' },
        {
          type: 'ul',
          items: [
            'Rever totais de facturação do ano anterior — base para IRS e eventual mudança de regime IVA',
            'Pagar contribuições SS de Dezembro (se ainda em aberto)',
            'Actualizar software de facturação e credenciais do Portal das Finanças',
            'Criar pasta digital «Fiscal 2026» com subpastas por mês',
          ],
        },
        { type: 'h3', id: 'fev', text: 'Fevereiro' },
        {
          type: 'ul',
          items: [
            'IVA do período anterior (se regime mensal/trimestral aplicável)',
            'Contribuições SS de Janeiro',
            'Reconciliar recibos emitidos com extractos bancários',
          ],
        },
        { type: 'h3', id: 'mar', text: 'Março' },
        {
          type: 'ul',
          items: [
            'Preparar documentação para IRS — muitos contribuintes começam a reunir PDFs nesta fase',
            'Contribuições SS de Fevereiro',
            'Avaliar se a facturação se aproxima do limite de isenção de IVA',
          ],
        },
      ],
    }),
    ...articleSection({
      h2: 'Abril a Junho: temporada IRS',
      id: 't2',
      paragraphs: [
        'A Autoridade Tributária abre o período de entrega do IRS. Para trabalhadores independentes, este é o momento de cruzar todos os recibos verdes emitidos, retenções na fonte, despesas dedutíveis elegíveis e dados do agregado familiar.',
        'Não deixe para o último dia útil: o portal sobrecarrega-se e erros de última hora são caros.',
      ],
      blocks: [
        {
          type: 'callout',
          variant: 'warning',
          title: 'Prazo IRS 2026',
          text: 'Consulte o calendário oficial da AT para as datas exactas de abertura e encerramento da entrega de IRS referente aos rendimentos de 2025. O nosso artigo dedicado lista marcos típicos para independentes.',
        },
    { type: 'link', label: 'Prazos IRS 2026 para independentes', slug: 'prazos-irs-2026-independentes' },
    { type: 'link', label: 'Guia prático de declaração de IRS', slug: 'declaracao-irs-guia-pratico' },
      ],
    }),
    ...articleSection({
      h2: 'Julho a Setembro: consolidar rotinas',
      id: 't3',
      paragraphs: [
        'Após o IRS, o foco volta ao mensal: facturar sem atrasos, SS em dia e IVA conforme regime. É também boa altura para rever se o contador (ou o software) está a reflectir correctamente o enquadramento.',
      ],
      blocks: [
        {
          type: 'ol',
          items: [
            'Auditar arquivo: todos os meses do ano têm PDFs de recibos e despesas?',
            'Verificar se clientes empresas pedem factura com IVA — sinal de transição de regime',
            'Planificar formação ou actualização de preços para o ano seguinte',
          ],
        },
        {
          type: 'link',
          label: 'Segurança Social do trabalhador independente',
          slug: 'seguranca-social-trabalhador-independente',
        },
        {
          type: 'link',
          label: 'Como escolher contabilista em Portugal',
          slug: 'como-escolher-contabilista-portugal',
        },
      ],
    }),
    ...articleSection({
      h2: 'Outubro a Dezembro: fecho de ano',
      id: 't4',
      paragraphs: [
        'O último trimestre é crítico para quem está perto de limites de isenção de IVA ou para quem precisa de ajustar estimativas de rendimento para a Segurança Social. Dezembro não é só festas — é fechar o ano com números coerentes.',
      ],
      blocks: [
        {
          type: 'ul',
          items: [
            'Emitir todos os recibos em falta antes de 31 de Dezembro',
            'Guardar comprovativos de despesas dedutíveis do ano',
            'Comunicar cessação de actividade se for o caso (Finanças + SS)',
            'Backup completo da pasta fiscal anual',
          ],
        },
        {
          type: 'link',
          label: 'IVA: quando preciso de me registar?',
          slug: 'iva-quando-preciso-de-me-registar',
        },
        {
          type: 'link',
          label: 'Organizar documentos fiscais — arquivo digital',
          slug: 'organizar-documentos-fiscais-arquivo-digital',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Checklist de fecho de ano (15 minutos)',
          text: 'Antes de 31 de Dezembro: (1) emitir recibos em aberto; (2) guardar facturas de despesas com NIF; (3) anotar totais aproximados de facturação do ano; (4) backup da pasta Fiscal 2026; (5) marcar no telemóvel a abertura do IRS. Quem faz isto em Dezembro poupa 2–3 horas (e nervos) em Abril.',
        },
      ],
    }),
    teglionCtaBlock({
      variant: 'client',
      title: 'Prefere que o escritório lhe lembre os prazos?',
      text: 'Peça ao seu contabilista um portal com alertas — no TegLion, cada obrigação tem data e lista do que falta enviar, em vez de mensagens soltas no WhatsApp.',
    }),
    ...affiliateSection({
      heading: 'Como transformar este calendário numa rotina',
      headingId: 'afiliados-calendario',
      intro:
        'Saber os prazos não basta — o que falha é a execução. Independentes que cumprem SS e IVA sem drama costumam ter duas coisas: um sítio onde a semana fica escrita à mão e, na primavera, um guia que organiza o IRS sem improvisar na última noite. O telemóvel sozinho perde-se no ruído das notificações.',
      items: [
        {
          key: 'amazonAgendaBezend',
          leadIn:
            'Imagine o dia 18: em vez de descobrir o prazo da SS no email da AT, já tem «SS — pagar» e «IVA — fechar mapas» marcados na semana. Uma agenda A5 na secretária (ou na pasta do portátil) torna o calendário fiscal um hábito, não uma surpresa.',
          title: 'Agenda semanal BEZEND A5 (Amazon)',
          description: 'vista semanal clara para independentes e equipas pequenas que vivem de prazos.',
        },
        {
          key: 'hotmartIrsReciboVerde',
          leadIn:
            'Quando o calendário chega à temporada do Modelo 3, reunir recibos, retenções e anexos sem método gasta fins-de-semana. Quem já tem actividade aberta ganha tempo com um guia faseado em português — em paralelo com o contador, não em vez dele.',
          title: 'IRS & Recibo Verde — Guia Prático (Hotmart)',
          description: 'estrutura o que reunir antes da entrega, alinhado com o ritmo anual da AT.',
        },
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'Gerir dezenas de calendários fiscais?',
      text: 'No Teglion, cada cliente tem prazos, documentos e alertas num só painel — ideal para escritórios que não querem falhar entregas.',
    }),
    ...internalLinksSection({
      title: 'Aprofundar cada tema do calendário',
      intro: 'Ligações aos guias detalhados do blog TegLion.',
      slugs: [
        'obrigacoes-fiscais-mes-a-mes',
        'seguranca-social-trabalhador-independente',
        'iva-quando-preciso-de-me-registar',
        'organizar-documentos-fiscais-arquivo-digital',
        'guia-completo-trabalhador-independente-portugal-2026',
      ],
    }),
    legalCallout('Calendário informativo — prazos legais prevalecem sobre este artigo.'),
  ],
}
