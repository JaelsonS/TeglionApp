import type { BlogPost } from '@/content/blog/types'
import {
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

export const postSaftEfatura: BlogPost = {
  slug: 'saft-efatura-validacao-documentos-escritorio',
  title: 'SAF-T, e-Fatura e validação de documentos: fluxo para escritórios',
  excerpt:
    'Como escritórios de contabilidade organizam extração SAF-T, cruzamento com e-Fatura e validação de documentos dos clientes — sem viver de PDFs no WhatsApp.',
  publishedAt: '2026-07-20',
  updatedAt: '2026-07-20',
  author: 'Liliana Nunes',
  authorRole: 'Revisão editorial TegLion · Guias de fiscalidade portuguesa',
  category: 'Escritórios',
  audience: ['escritorio'],
  featured: false,
  tags: ['SAF-T', 'e-Fatura', 'validação documentos', 'escritório contabilidade', 'AT', 'arquivo digital'],
  readMinutes: 12,
  series: {
    id: 'operacoes-escritorio-teglion',
    title: 'Operações do escritório com TegLion',
    description: 'Digitalizar, prazos, SAF-T e software — trilho operacional para escritórios de contabilidade.',
    part: 3,
    totalParts: 5,
  },
  coverImage: {
    src: '/blog/covers/escritorio.svg',
    alt: 'SAF-T e validação de documentos no escritório',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'SAF-T e e-Fatura: validar documentos no escritório',
    description:
      'Fluxo prático para escritórios: SAF-T, e-Fatura AT, pedidos de documentos e validação antes do fecho. Menos erros, mais rastreio — Portugal 2026.',
    keywords: [
      'SAF-T Portugal',
      'e-Fatura escritório',
      'validação facturas contabilista',
      'SAF-T PT',
      'documentos fiscais escritório',
      'cruzamento e-Fatura',
    ],
  },
  relatedSlugs: [
    'digitalizar-escritorio-contabilidade-portugal',
    'gestao-prazos-fiscais-escritorio-contabilidade',
    'software-escritorio-contabilidade-portugal',
    'organizar-documentos-fiscais-arquivo-digital',
    'caso-escritorio-digitalizacao-prazos',
  ],
  blocks: [
    legalCallout(
      'Regras de comunicação de ficheiros SAF-T, prazos e obrigações de facturação são da Autoridade Tributária. Este artigo descreve práticas de escritório — confirme sempre a legislação e manuais oficiais em vigor.',
    ),
    keyTakeaways([
      'SAF-T (Standard Audit File) é o ficheiro estruturado que a AT (e o seu ERP) usam para auditar e integrar dados de facturação/contabilidade — não é «mais um PDF».',
      'e-Fatura centraliza documentos comunicados; o escritório deve cruzar o que o cliente diz que emitiu/recebeu com o que está na AT.',
      'Validação = completude + legibilidade + consistência (NIF, datas, IVA, série) antes do lançamento.',
      'Pedidos formais com prazo batem WhatsApp: o cliente vê o que falta; o escritório prova que pediu.',
      'Erros típicos: foto ilegível, factura de fornecedor sem NIF, duplicados, e «já enviei» sem estar no portal.',
      'Ferramentas como TegLion fecham a última milha (pedido → entrega → histórico); o ERP continua a ser o coração contabilístico.',
    ]),
    ...proseParagraphs(
      'No fecho de IVA, o problema raramente é «não saber lançar». É não ter a factura certa, a tempo, legível, sem duplicar o que já veio no SAF-T do software do cliente. Escritórios maduros tratam SAF-T, e-Fatura e validação de documentos como um único fluxo — não como três tarefas soltas.',
      'Este guia é para directores técnicos, contadores e equipas de back-office que querem menos ruído na véspera do dia 20 e mais rastreio quando um cliente diz «eu tinha enviado».',
    ),
    quoteBlock(
      'Se o documento não está validado, ainda não existe para o fecho — existe só na cabeça do cliente.',
    ),
    ...articleSection({
      h2: 'SAF-T no dia a dia do escritório',
      id: 'saft',
      paragraphs: [
        'O SAF-T PT é um ficheiro XML normalizado. Consoante o contexto, o cliente (ou o software) gera/exporta dados de facturação e, em certos regimes e obrigações, comunica ou disponibiliza informação à AT. Do lado do escritório, o SAF-T (ou a integração equivalente do ERP) reduz digitação e permite confrontar totais, séries e documentos em falta.',
        'Na prática: combine com o cliente quem exporta, com que periodicidade, e para onde o ficheiro vai (pasta segura, upload no portal, importação no ERP). Ficheiros trocados por email sem controlo de versão são o equivalente digital da pasta amarela perdida.',
      ],
      blocks: [
        {
          type: 'ul',
          items: [
            'Definir responsável: cliente, software house ou escritório',
            'Calendário de exportação alinhado com o fecho (ex.: dia 8–10 do mês seguinte)',
            'Validar se a versão / estrutura do ficheiro é a esperada pelo ERP',
            'Arquivar cópia com data e hash/nome padronizado (cliente_AAAA_MM_saft)',
          ],
        },
      ],
    }),
    ...articleSection({
      h2: 'e-Fatura: cruzar, não só «confiar»',
      id: 'efatura',
      paragraphs: [
        'O e-Fatura (Portal das Finanças) mostra documentos comunicados por emitentes. É uma fonte de verdade parcial: o que não foi comunicado, ou foi comunicado com erro, não aparece como o cliente espera. O escritório deve ensinar o cliente a consultar e a comunicar atempadamente — e a não assumir que «se paguei, já está na AT».',
        'Fluxo útil: listar despesas relevantes do mês → verificar presença no e-Fatura → pedir PDF/XML em falta → só então lançar. Para emitentes, confrontar listagens do software com o que a AT reflecte evita surpresas em inspecção ou em mapas de IVA.',
      ],
      blocks: [
        {
          type: 'callout',
          variant: 'info',
          title: 'Acesso e procurações',
          text: 'Configure acessos e procurações com rigor. Nunca peça a senha pessoal do cliente. Preferir perfis de gestor / contador conforme as regras do portal e a política do escritório.',
        },
      ],
    }),
    sectionDivider(),
    ...articleSection({
      h2: 'Fluxo de validação de documentos',
      id: 'validacao',
      paragraphs: [
        'Validar não é «abrir o PDF». É uma checklist curta, repetível, que qualquer colaborador treinado aplica.',
      ],
      blocks: [
        {
          type: 'ol',
          items: [
            'Completude: todos os documentos pedidos para o período estão no portal?',
            'Legibilidade: NIF, valores, datas e IVA legíveis (foto de telemóvel às escuras = rejeitar)',
            'Identidade: documento pertence à entidade certa (NIF colectivo vs pessoal)',
            'Duplicados: mesmo número/série já lançado ou já no SAF-T?',
            'Coerência IVA: taxa e enquadramento fazem sentido para o CAE / operação',
            'Estado: aceite / rejeitado / em falta — com mensagem clara ao cliente',
          ],
        },
        comparisonTable({
          caption: 'Estados que o cliente deve entender',
          headers: ['Estado', 'Significado', 'Acção do cliente'],
          rows: [
            ['Pedido', 'Escritório pediu o documento', 'Carregar no portal até à data'],
            ['Recebido', 'Ficheiro chegou', 'Esperar validação'],
            ['Rejeitado', 'Ilegível, errado ou incompleto', 'Reenviar corrigido'],
            ['Validado', 'Pronto para lançamento', 'Nenhuma — salvo pedido extra'],
          ],
        }),
      ],
    }),
    { type: 'link', label: 'Como digitalizar o escritório de contabilidade', slug: 'digitalizar-escritorio-contabilidade-portugal' },
    { type: 'link', label: 'Gestão de prazos fiscais no escritório', slug: 'gestao-prazos-fiscais-escritorio-contabilidade' },
    teglionCtaBlock({
      variant: 'firm',
      title: 'Pedidos de documentos com estado e histórico',
      text: 'TegLion ajuda o escritório a pedir, receber e acompanhar documentos dos clientes com portal próprio — o complemento natural ao ERP e ao cruzamento SAF-T / e-Fatura.',
    }),
    ...articleSection({
      h2: 'Erros que atrasam o fecho',
      id: 'erros',
      blocks: [
        {
          type: 'ul',
          items: [
            'Aceitar screenshots em vez de PDF quando o detalhe do IVA importa',
            'Misturar documentos de ENI antigo e Lda nova no mesmo pedido',
            'Não rejeitar a tempo — o cliente acha que «já está» e desaparece',
            'Importar SAF-T sem reconciliar totais com listagens de facturação',
            'Deixar e-Fatura para o último dia — filas e dúvidas sem margem',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'WhatsApp como arquivo',
          text: 'Mensagens de voz e fotos perdidas no chat não são arquivo fiscal. Se o documento importa, tem de estar no portal (ou repositório oficial do escritório) com data e cliente associados.',
        },
      ],
    }),
    ...articleSection({
      h2: 'Papel do portal do cliente (e do TegLion)',
      id: 'portal',
      paragraphs: [
        'O ERP resolve lançamentos, mapas e declarações. A última milha — pedir a factura de Junho, rejeitar a foto ilegível, provar que pediu três vezes — é onde muitos escritórios perdem horas. Um portal com marca do escritório torna o pedido formal, rastreável e menos dependente da memória de uma pessoa.',
        'Na digitalização, combine: ERP + calendário de prazos + portal de documentos. SAF-T e e-Fatura entram como fontes de cruzamento; o portal fecha o ciclo humano com o contribuinte.',
      ],
    }),
    ...articleSection({
      h2: 'Checklist mensal sugerida',
      id: 'checklist',
      blocks: [
        {
          type: 'ol',
          items: [
            'Abrir período no portal e gerar pedidos padrão por tipo de cliente',
            'Receber / importar SAF-T ou listagens do software do cliente',
            'Cruzar emitidos e despesas relevantes com e-Fatura',
            'Validar e rejeitar com mensagem objectiva',
            'Lançar apenas o validado; escalar faltas críticas 5–7 dias antes do prazo',
            'Arquivar evidências do período (ficheiros + estados)',
          ],
        },
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'Menos chase, mais fecho',
      text: 'Se a equipa ainda caça documentos por chat na véspera do IVA, experimente padronizar pedidos no TegLion e medir horas recuperadas num mês piloto.',
    }),
    ...internalLinksSection({
      title: 'Continuar no tema escritório',
      intro: 'Digitalização, prazos e um caso real de mudança de processo.',
      slugs: [
        'digitalizar-escritorio-contabilidade-portugal',
        'gestao-prazos-fiscais-escritorio-contabilidade',
        'organizar-documentos-fiscais-arquivo-digital',
        'caso-escritorio-digitalizacao-prazos',
      ],
    }),
    legalCallout(),
  ],
}
