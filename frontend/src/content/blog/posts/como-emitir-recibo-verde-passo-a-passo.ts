import type { BlogPost } from '@/content/blog/types'
import {
  affiliateSection,
  articleSection,
  internalLinksSection,
  keyTakeaways,
  legalCallout,
  proseParagraphs,
  sectionDivider,
} from '@/content/blog/shared'

export const postComoEmitirReciboVerde: BlogPost = {
  slug: 'como-emitir-recibo-verde-passo-a-passo',
  title: 'Como emitir recibo verde: passo a passo no Portal das Finanças',
  excerpt:
    'Guia completo para emitir recibo verde no e-Fatura: login, dados do cliente, IVA, retenções, erros comuns e arquivo — do primeiro ao décimo recibo.',
  publishedAt: '2026-05-28',
  updatedAt: '2026-06-17',
  author: 'Liliana Nunes',
  authorRole: 'Revisão editorial TegLion · Guias de fiscalidade portuguesa',
  category: 'Facturação',
  audience: ['independente', 'pme'],
  featured: false,
  tags: ['recibos verdes', 'e-Fatura', 'Portal das Finanças', 'freelancer', 'passo a passo', 'tutorial'],
  readMinutes: 8,
  coverImage: {
    src: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=630&fit=crop&q=80',
    alt: 'Documentos e caneta sobre uma mesa',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Como emitir recibo verde — passo a passo (e-Fatura)',
    description:
      'Tutorial completo: emitir recibo verde no Portal das Finanças com NIF do cliente, IVA, retenção na fonte e boas práticas de arquivo.',
    keywords: ['emitir recibo verde', 'e-Fatura recibo', 'recibo verde passo a passo', 'Portal das Finanças recibo', 'tutorial recibo verde'],
  },
  relatedSlugs: [
    'portal-financas-guia-completo-iniciantes',
    'retencao-fonte-recibos-verdes',
    'recibos-verdes-vs-faturacao',
    'abrir-empresa-individual-eni',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'Precisa de actividade aberta e acesso ao Portal das Finanças (senha ou CMD).',
      'NIF do cliente é obrigatório — recibo sem NIF válido complica deduções e IRS.',
      'Guarde PDF imediatamente; use nomenclatura AAAA-MM-DD_Cliente.pdf.',
      'Retenção na fonte aplica-se em muitos serviços B2B — confirme taxa antes de emitir.',
      'Recibos verdes não substituem factura certificada quando é sujeito passivo de IVA.',
    ]),
    ...proseParagraphs(
      'Emitir recibo verde é uma das primeiras tarefas de quem abre actividade como prestador de serviços. O processo faz-se no Portal das Finanças (e-Fatura) e demora poucos minutos quando já tem actividade aberta e os dados do cliente à mão.',
      'Este guia detalha cada ecrã e cada decisão. Se ainda não abriu actividade, comece pelo artigo sobre ENI — sem início de actividade, o portal não deixa emitir.',
    ),
    {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=960&h=540&fit=crop&q=80',
      alt: 'Pessoa a preencher documentos',
      caption: 'Guarde PDF de cada recibo emitido — facilita o IRS e a conversa com o contador.',
    },
    ...articleSection({
      h2: 'Antes de emitir — checklist',
      id: 'requisitos',
      blocks: [
        {
          type: 'ul',
          items: [
            'Actividade aberta nas Finanças (início de actividade com CAE correcto)',
            'NIF e acesso ao portal (senha ou Chave Móvel Digital)',
            'NISS activo na Segurança Social, se aplicável',
            'NIF do cliente (adquirente) — peça antes de concluir o trabalho',
            'Valor acordado e se há retenção na fonte (cliente empresa)',
            'Descrição clara do serviço para o campo «prestação»',
          ],
        },
      ],
    }),
    { type: 'h2', id: 'passos', text: 'Passos no e-Fatura' },
    { type: 'h3', id: 'passo-1', text: '1. Entrar no portal' },
    ...proseParagraphs(
      'Aceda a portaldasfinancas.gov.pt com NIF e senha, ou Chave Móvel Digital no telemóvel. Se nunca activou acesso, o processo de adesão demora alguns dias — não deixe para o dia em que precisa de facturar.',
    ),
    { type: 'h3', id: 'passo-2', text: '2. Navegar até emitir' },
    ...proseParagraphs(
      'Menu «Faturas e recibos» (ou «e-Fatura») → «Emitir» / «Emitir recibo». A interface muda ocasionalmente; use a pesquisa interna com «recibo» se não encontrar.',
    ),
    { type: 'h3', id: 'passo-3', text: '3. Dados do cliente' },
    ...proseParagraphs(
      'Indique o NIF do adquirente. Descreva o serviço com clareza: «Consultoria marketing digital — projecto X, Maio 2026» é melhor do que «serviços». Descrições vagas dificultam cruzamento de dados e inspecções.',
    ),
    { type: 'h3', id: 'passo-4', text: '4. Valor, IVA e retenção' },
    ...proseParagraphs(
      'Se isento de IVA, seleccione motivo de isenção correcto (art. 53.º ou outro). Se o cliente for empresa, pode haver retenção de IRS — o portal calcula conforme categoria. Em dúvida, confirme com o contador antes da série anual de recibos.',
    ),
    { type: 'h3', id: 'passo-5', text: '5. Validar, emitir e arquivar' },
    ...proseParagraphs(
      'Revise valor, NIF e retenção. Descarregue PDF, guarde em pasta fiscal e envie ao cliente por email. O recibo comunica-se à AT — no IRS, estes valores devem coincidir com o declarado.',
    ),
    {
      type: 'ol',
      items: [
        'Entrar em portaldasfinancas.gov.pt',
        'Ir a «Faturas e recibos» → «Emitir»',
        'Indicar NIF do cliente e descrição do serviço',
        'Definir valor, IVA ou motivo de isenção',
        'Escolher retenção na fonte (IRS), se aplicável',
        'Validar, emitir e guardar PDF',
        'Enviar cópia ao cliente e registar no controlo mensal',
      ],
    },
    sectionDivider(),
    ...articleSection({
      h2: 'Erros frequentes ao emitir',
      id: 'erros',
      blocks: [
        {
          type: 'ul',
          items: [
            'NIF do cliente errado — difícil de corrigir após pagamento',
            'Valor bruto vs líquido confundido quando há retenção',
            'Não guardar PDF — portal permite reimprimir, mas organize já',
            'Emitir «em lote» no último dia do mês em vez de por prestação',
            'Descrição «serviços» sem detalhe',
            'Esquecer motivo de isenção de IVA quando aplicável',
          ],
        },
      ],
    }),
    {
      type: 'callout',
      variant: 'tip',
      title: 'Controlo mensal simples',
      text: 'Folha com colunas: data, cliente, NIF, bruto, retenção, líquido, PDF guardado (sim/não). No IRS, exporta do portal e compara com esta folha.',
    },
    ...affiliateSection({
      heading: 'Do tutorial à primeira factura real',
      headingId: 'primeira-factura',
      intro:
        'Emitir o primeiro recibo dá satisfação — perder o PDF no mês seguinte, não. Hábito de arquivo no dia 1 evita caça ao email em Março.',
      items: [
        {
          key: 'hotmartReciboVerde7Dias',
          leadIn:
            'Este artigo cobre o e-Fatura; o ebook inclui abertura de actividade, SS e declarações — pacote completo para começar do zero.',
          title: 'Recibo Verde em 7 Dias (Hotmart)',
          description: 'Guia em português para Portugal, com checklists.',
        },
        {
          key: 'amazonPastaSanfona12',
          leadIn:
            'Guarde PDF no bolso do mês correspondente — em Dezembro a pasta conta a história do ano.',
          title: 'Pasta sanfonada A4 — 12 bolsos (Amazon)',
          description: 'Um compartimento por mês ou cliente principal.',
        },
      ],
    }),
    { type: 'link', label: 'Recibos verdes vs facturação', slug: 'recibos-verdes-vs-faturacao' },
    { type: 'link', label: 'Portal das Finanças para iniciantes', slug: 'portal-financas-guia-completo-iniciantes' },
    ...internalLinksSection({
      title: 'Próximos passos',
      slugs: [
        'retencao-fonte-recibos-verdes',
        'recibos-verdes-vs-faturacao',
        'portal-financas-guia-completo-iniciantes',
        'declaracao-irs-guia-pratico',
      ],
    }),
    legalCallout(),
  ],
}
