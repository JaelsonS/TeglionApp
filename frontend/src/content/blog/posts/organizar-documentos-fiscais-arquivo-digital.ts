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

export const postOrganizarDocumentos: BlogPost = {
  slug: 'organizar-documentos-fiscais-arquivo-digital',
  title: 'Como organizar documentos fiscais: arquivo digital que funciona',
  excerpt:
    'Pastas por ano, nomenclatura de ficheiros, backup e o que guardar 4+ anos — sistema prático para freelancers e microempresas em Portugal.',
  publishedAt: '2026-06-12',
  updatedAt: '2026-07-17',
  author: 'Liliana Nunes',
  authorRole: 'Revisão editorial TegLion · Guias de fiscalidade portuguesa',
  category: 'Organização',
  audience: ['independente', 'escritorio'],
  tags: ['arquivo', 'documentos fiscais', 'organização', 'freelancer', 'IRS'],
  readMinutes: 12,
  featured: false,
  series: {
    id: 'independente-2026',
    title: 'Trabalhador independente em Portugal',
    description: 'Série completa para quem abre actividade ou já factura em recibos verdes.',
    part: 4,
    totalParts: 5,
  },
  coverImage: {
    src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=630&fit=crop&q=80',
    alt: 'Pastas e arquivo organizado numa secretária',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Organizar documentos fiscais em Portugal (arquivo digital) | Blog TegLion',
    description:
      'Sistema de pastas, nomenclatura e backup para recibos, facturas e comprovativos. Prepare o IRS sem stress e evite multas por falta de arquivo.',
    keywords: ['organizar documentos fiscais', 'arquivo digital IRS', 'guardar recibos verdes', 'pastas fiscais'],
  },
  relatedSlugs: [
    'proteger-dados-fiscais-freelancer-portugal',
    'declaracao-irs-guia-pratico',
    'como-emitir-recibo-verde-passo-a-passo',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'Organize por ano fiscal e tipo: emitidos, despesas, SS, banco, IRS entregue.',
      'Nomenclatura AAAA-MM-DD_Cliente_Descricao.pdf poupa horas em Março.',
      'Guarde mínimo 4 anos após entrega do IRS — regra prática alinhada com prescrição.',
      'Backup 3-2-1: cópia local + nuvem + pen drive anual.',
      'Contador pede menos follow-up quando recebe pasta estruturada.',
    ]),
    ...proseParagraphs(
      'Em Março, quando o IRS aproxima, quem tem pasta organizada entrega em horas. Quem não tem passa fins de semana a procurar PDFs no email.',
      'Um sistema simples — digital com cópia física opcional — paga-se no primeiro ano e evita coimas por incapacidade de provar despesas ou rendimentos.',
    ),
    { type: 'h2', id: 'estrutura', text: 'Estrutura de pastas recomendada' },
    {
      type: 'ul',
      items: [
        'Fiscal / 2026 / Recibos emitidos',
        'Fiscal / 2026 / Despesas e facturas de compra',
        'Fiscal / 2026 / Segurança Social e contribuições',
        'Fiscal / 2026 / Banco e extratos',
        'Fiscal / 2026 / IRS e declarações entregues',
        'Fiscal / 2026 / Contratos e procurações',
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Nomenclatura de ficheiros',
      text: 'Use AAAA-MM-DD_Cliente_Descricao.pdf (ex.: 2026-05-14_ACME_Consultoria-maio.pdf). Facilita pesquisa e partilha com o contador.',
    },
    { type: 'h2', id: 'guardar', text: 'O que guardar e por quanto tempo' },
    {
      type: 'ol',
      items: [
        'Recibos e facturas emitidas — mínimo 4 anos após IRS',
        'Facturas de despesas dedutíveis — mesmo prazo',
        'Comprovativos de retenção na fonte',
        'Declarações SS e comprovativos de pagamento',
        'Modelo 3 IRS entregue + comprovativo',
        'Contratos com clientes relevantes para rendimentos',
      ],
    },
    { type: 'h2', id: 'backup', text: 'Backup: regra 3-2-1 simplificada' },
    {
      type: 'p',
      text: 'Três cópias dos dados importantes, em dois suportes diferentes, uma fora de casa (nuvem). Pen drive + OneDrive/Google Drive + pasta no portátil é suficiente para a maioria dos independentes.',
    },
    sectionDivider(),
    comparisonTable({
      caption: 'O que guardar — prazo mínimo recomendado',
      headers: ['Documento', 'Prazo', 'Formato'],
      rows: [
        ['Recibos/facturas emitidas', '4+ anos após IRS', 'PDF + export portal'],
        ['Facturas de despesas', '4+ anos', 'PDF ou papel digitalizado'],
        ['Comprovativos SS', '4+ anos', 'PDF pagamento'],
        ['Modelo 3 IRS entregue', 'Permanente (cópia)', 'PDF comprovativo'],
        ['Contratos relevantes', 'Duração + 4 anos', 'PDF assinado'],
        ['Extratos bancários', '4+ anos', 'PDF ou CSV'],
      ],
    }),
    ...articleSection({
      h2: 'Fluxo mensal de arquivo (15 minutos)',
      id: 'fluxo',
      paragraphs: [
        'Última sexta-feira do mês: descarregar recibos em falta do e-Fatura; digitalizar despesas da pasta «a classificar»; mover ficheiros para pastas do ano; backup automático na nuvem.',
        'Se usa contador, envie pacote mensal ou dê acesso ao portal — não acumule 12 meses num email gigante em Dezembro.',
      ],
    }),
    ...articleSection({
      h2: 'Digital vs papel: quando vale a pena imprimir',
      id: 'digital-papel',
      paragraphs: [
        'Para a maioria dos independentes, PDF com nome correcto + backup na nuvem chega. Imprima só o que precisa de assinatura física, contratos com cláusulas sensíveis ou documentos que um banco/cliente ainda peça em papel.',
        'Se guarda papel, use pastas etiquetadas por ano e destrua cópias com NIF/IBAN quando o prazo de arquivo passar — não deixe caixas abertas no escritório de casa.',
      ],
      blocks: [
        {
          type: 'callout',
          variant: 'info',
          title: 'Regra prática',
          text: 'Se o ficheiro não tem data no nome e não está na pasta do ano certo, trate-o como «ainda não arquivado». Cinco minutos no fim do mês evitam um fim de semana em Abril.',
        },
      ],
    }),
    ...articleSection({
      h2: 'Partilhar com o contador sem caos',
      id: 'partilhar',
      paragraphs: [
        'O melhor envio não é o email com 40 anexos. É uma pasta do ano (ou um link de nuvem) com a mesma estrutura todos os meses, mais um resumo curto: «faltam facturas de Maio do cliente X».',
        'Se o escritório usa portal de cliente, envie pelo canal oficial — fica data, pedido e ficheiro no mesmo sítio. Assim o follow-up deixa de ser «já enviei no WhatsApp».',
      ],
      blocks: [
        {
          type: 'ol',
          items: [
            'No dia 1–5 de cada mês: fechar o mês anterior (recibos + despesas).',
            'Exportar ou copiar a pasta do mês para a pasta do ano.',
            'Enviar ao contador (ou carregar no portal) com nota do que falta.',
            'Arquivar o comprovativo de envio na subpasta «Comunicações».',
          ],
        },
      ],
    }),
    ...articleSection({
      h2: 'Erros típicos (e como evitar)',
      id: 'erros-arquivo',
      blocks: [
        {
          type: 'ul',
          items: [
            'Pastas «misc» / «vários» — tudo o que não tem casa acaba perdido.',
            'Fotografias de facturas ilegíveis — digitalize em PDF nítido ou peça segunda via.',
            'Guardar só no telemóvel — se perde o telemóvel, perde o ano fiscal.',
            'Misturar despesas pessoais e de actividade na mesma pasta sem etiqueta.',
            'Apagar emails «grandes» com anexos fiscais sem guardar o PDF primeiro.',
          ],
        },
      ],
    }),
    { type: 'link', label: 'Portal das Finanças para iniciantes', slug: 'portal-financas-guia-completo-iniciantes' },
    { type: 'link', label: 'Proteger dados fiscais no portátil', slug: 'proteger-dados-fiscais-freelancer-portugal' },
    ...internalLinksSection({
      title: 'Ler também',
      slugs: [
        'proteger-dados-fiscais-freelancer-portugal',
        'portal-financas-guia-completo-iniciantes',
        'irs-recibos-verdes-erros-comuns',
        'como-escolher-contabilista-portugal',
      ],
    }),
    ...affiliateSection({
      heading: 'Material de arquivo (afiliados Amazon)',
      headingId: 'material',
      intro: 'Investir 30–50 € em arquivo organizado poupa horas todos os anos.',
      items: [
        {
          key: 'amazonPastaThinkTex26',
          leadIn: '26 compartimentos — um por cliente ou por trimestre.',
          title: 'Pasta expansível A4 ThinkTex (Amazon)',
          description: 'Ideal para cópias físicas de contratos e recibos impressos.',
        },
        {
          key: 'amazonPastaSanfona12',
          leadIn: 'Versão mais compacta: 12 bolsos por mês do ano.',
          title: 'Pasta sanfonada 12 bolsos (Amazon)',
          description: 'Organize recibos mês a mês.',
        },
        {
          key: 'amazonEtiquetasPastas',
          leadIn: 'Etiquetas legíveis evitam a pasta «misc» que ninguém abre.',
          title: 'Etiquetas para pastas (Amazon)',
          description: 'Autoadesivas, reutilizáveis.',
        },
        {
          key: 'amazonPenDrive32',
          leadIn: 'Cópia offline anual para o contador ou arquivo de segurança.',
          title: 'Pack pen drives USB 32 GB (Amazon)',
          description: 'Backup físico barato.',
        },
        {
          key: 'amazonTriturador',
          leadIn: 'Documentos com NIF e IBAN devem ser destruídos em segurança antes de ir para o lixo.',
          title: 'Triturador de papel (Amazon)',
          description: 'Para cópias físicas antigas.',
        },
        {
          key: 'amazonPastaProvaFogo',
          leadIn: 'Para contratos e documentos que não quer perder num acidente doméstico.',
          title: 'Pasta reforçada para documentos importantes (Amazon)',
          description: '13 compartimentos — útil para cópias críticas.',
        },
      ],
    }),
    teglionCtaBlock({
      variant: 'client',
      text: 'O seu escritório usa Teglion? Envie documentos pelo portal em vez de email — fica tudo datado e associado ao pedido do contador.',
    }),
    legalCallout(),
  ],
}
