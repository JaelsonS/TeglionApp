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

export const postEscolherSoftware: BlogPost = {
  slug: 'escolher-software-faturacao-portugal',
  title: 'Como escolher software de facturação certificado em Portugal',
  excerpt:
    'Certificação AT, recibos verdes vs factura, preço, SAF-T e integração contabilística — critérios completos para escolher sem surpresas nem multas.',
  publishedAt: '2026-05-24',
  updatedAt: '2026-06-17',
  author: 'Equipa TegLion',
  category: 'Facturação',
  tags: ['software facturação', 'certificação AT', 'Moloni', 'InvoiceXpress', 'freelancer', 'SAF-T'],
  readMinutes: 18,
  coverImage: {
    src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop&q=80',
    alt: 'Dashboard de software num portátil',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Melhor software facturação Portugal? Critérios | Blog TegLion',
    description:
      'Como escolher programa de facturação certificado pela AT: requisitos legais, comparação de funcionalidades, preços e quando deixar recibos verdes.',
    keywords: ['software facturação Portugal', 'programa certificado AT', 'facturação online freelancer', 'Moloni vs InvoiceXpress'],
  },
  relatedSlugs: [
    'recibos-verdes-vs-faturacao',
    'quando-passar-de-isento-a-iva',
    'proteger-dados-fiscais-freelancer-portugal',
    'regime-simplificado-vs-contabilidade-organizada',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'O software deve ter certificação AT activa — verifique número e validade na lista oficial.',
      'Recibos verdes gratuitos bastam até isenção de IVA e volume baixo; IVA obriga certificação.',
      'Compare preço, limite de documentos, exportação SAF-T e acesso do contador.',
      'Teste período experimental antes de subscrição anual.',
      'Backup e segurança (2FA, nuvem) são parte do «stack» fiscal tanto quanto o programa.',
    ]),
    ...proseParagraphs(
      'Muitos freelancers começam no e-Fatura gratuito. Quando o negócio cresce — ou quando passa a sujeito passivo de IVA — surge a necessidade de software certificado. A escolha errada gera retrabalho, multas ou horas extra no contador.',
      'Este guia não declara um «vencedor» universal — compara critérios objectivos para decidir conforme o seu volume, clientes e orçamento.',
    ),
    ...articleSection({
      h2: 'Certificação AT: o que verificar',
      id: 'certificacao',
      paragraphs: [
        'O software deve estar certificado pela Autoridade Tributária. No site da AT existe lista de programas certificados com número de certificação e entidade responsável.',
        'Confirme que a versão que vai subscrever comunica documentos em tempo útil (comunicação de séries, SAF-T se aplicável). Software não certificado ou desactualizado invalida facturas para efeitos fiscais.',
      ],
    }),
    sectionDivider(),
    comparisonTable({
      caption: 'Critérios de comparação — checklist',
      headers: ['Critério', 'Porque importa', 'Pergunta ao fornecedor'],
      rows: [
        ['Preço mensal / anual', 'Impacto fixo no negócio', 'Há limite de documentos ou clientes?'],
        ['IVA (taxas, isenções)', 'Obrigatório se sujeito passivo', 'Suporta regime mensal e trimestral?'],
        ['Exportação SAF-T', 'Contador precisa dos ficheiros', 'Formato PT e periodicidade?'],
        ['Multi-utilizador', 'Equipas e assistentes', 'Quantos utilizadores no plano base?'],
        ['App móvel', 'Emitir fora do escritório', 'Offline ou só online?'],
        ['Integrações', 'Loja online, banco', 'API, WooCommerce, Shopify?'],
        ['Suporte em português', 'Prazos fiscais não esperam', 'Horário e canal de suporte?'],
      ],
    }),
    ...articleSection({
      h2: 'Quando ainda NÃO precisa de software pago',
      id: 'quando-nao',
      paragraphs: [
        'Se está isento de IVA, presta serviços a particulares ou pequenos volumes B2B, e o contador aceita recibos verdes do portal — pode adiar a subscrição.',
        'Sinais de que já precisa: cliente recusa recibo sem IVA, ultrapassou limite de isenção, contador exige SAF-T mensal, ou facturação >50 documentos/mês com risco de erros manuais.',
      ],
    }),
    ...articleSection({
      h2: 'Migração a partir de recibos verdes',
      id: 'migracao',
      paragraphs: [
        'Antes de mudar: exporte PDFs e listagens do e-Fatura; defina data de corte com o contador; configure séries no novo software; teste factura de teste antes de emitir ao cliente real.',
        'Guarde pen drive ou cópia cloud do histórico — inspecções podem pedir documentos de anos anteriores.',
      ],
    }),
    ...articleSection({
      h2: 'Segurança digital além da facturação',
      id: 'seguranca-digital',
      paragraphs: [
        'Software certificado guarda facturas na cloud — mas o portátil continua a ser a porta de entrada. Phishing à AT, malware em anexos de clientes e Wi‑Fi público em coworkings são riscos reais.',
        'Antivírus actualizado, backup automático (OneDrive ou similar), passwords únicas e 2FA no software de facturação fazem parte do stack fiscal.',
      ],
    }),
    { type: 'link', label: 'Guia: proteger dados fiscais no portátil', slug: 'proteger-dados-fiscais-freelancer-portugal' },
    ...articleSection({
      h2: 'Erros comuns ao escolher software',
      id: 'erros',
      paragraphs: [
        'Subscrever plano anual no primeiro mês de actividade, antes de saber se ficará isento ou sujeito a IVA, é um dos erros mais frequentes. Outro: escolher software só pelo preço promocional, sem confirmar limite de documentos ou custo de utilizadores extra.',
        'Também convém evitar emitir a primeira factura real sem testar série, NIF do cliente e taxa de IVA no ambiente de testes — erros comunicados à AT geram anulações e tempo perdido com o contador.',
      ],
      blocks: [
        {
          type: 'ul',
          items: [
            'Não verificar validade da certificação AT na data da subscrição',
            'Ignorar exportação SAF-T exigida pelo contador',
            'Misturar recibos verdes antigos com facturas novas sem data de corte clara',
            'Não configurar backup além da cloud do fornecedor',
            'Assinar integração com loja online sem testar comunicação de séries',
          ],
        },
      ],
    }),
    comparisonTable({
      caption: 'Perfil de negócio → prioridades no software',
      headers: ['Perfil', 'Prioridade n.º 1', 'Pode adiar'],
      rows: [
        ['Freelancer B2B, isento IVA', 'Recibos + arquivo PDF', 'Integrações e-commerce'],
        ['Freelancer sujeito a IVA', 'IVA + SAF-T + certificação', 'App móvel avançada'],
        ['Loja online + stock', 'Integração WooCommerce/Shopify', 'Multi-empresa'],
        ['PME com 2–5 utilizadores', 'Permissões e auditoria', 'Preço mais baixo do mercado'],
      ],
    }),
    ...articleSection({
      h2: 'O que pedir ao contador antes de pagar',
      id: 'contador-software',
      paragraphs: [
        'Antes de subscrever 12 meses, pergunte ao contador: «Qual software já conhece?», «Precisa de SAF-T mensal ou trimestral?», «Há custo extra se eu exportar mal os mapas?». Muitos escritórios têm parceria ou preferência — alinhar reduz fricção.',
        'Se o contador pede acesso de leitura ao software, confirme se o plano base inclui utilizador «contabilista» ou se é add-on pago.',
      ],
    }),
    ...affiliateSection({
      heading: 'Antes de subscrever software pago',
      headingId: 'antes-software',
      intro:
        'Moloni, InvoiceXpress e similares cobram mensalidade — faz sentido quando já emite volume e precisa de IVA certificado.',
      items: [
        {
          key: 'hotmartReciboVerde7Dias',
          leadIn:
            'Se ainda emite no e-Fatura gratuito, este guia consolida actividade e recibos verdes antes de assinar um plano anual.',
          title: 'Recibo Verde em 7 Dias (Hotmart)',
          description: 'Base legal e prática antes de software certificado.',
        },
        {
          key: 'amazonLivroGestaoContabil',
          leadIn:
            'Ao comparar software, o contador fala em SAF-T e mapas. Este livro dá vocabulário de gestão contabilística para não contadores.',
          title: 'Gestão Contábil — Para Contadores e Não Contadores (Amazon)',
          description: 'Fundamentos em português — complemento teórico.',
        },
        {
          key: 'amazonM365Pessoal',
          leadIn:
            'OneDrive para sincronizar exports do software de facturação — backup além do SAF-T.',
          title: 'Microsoft 365 Pessoal (Amazon)',
          description: 'Excel, Word e 1 TB cloud.',
        },
        {
          key: 'amazonPenDrive32',
          leadIn:
            'Exporte PDFs e backups antes de mudar de sistema — transição sem perder histórico.',
          title: 'Pen drives USB 32GB (Amazon)',
          description: 'Backup offline na mudança de ferramenta.',
        },
      ],
    }),
    ...internalLinksSection({
      title: 'Ler a seguir',
      slugs: [
        'recibos-verdes-vs-faturacao',
        'iva-quando-preciso-de-me-registar',
        'quando-passar-de-isento-a-iva',
        'regime-simplificado-vs-contabilidade-organizada',
      ],
    }),
    legalCallout('Comparação informativa — teste períodos experimentais antes de decidir.'),
  ],
}
