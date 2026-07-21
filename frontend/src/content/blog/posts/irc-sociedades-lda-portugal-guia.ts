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

export const postIrcSociedadesLda: BlogPost = {
  slug: 'irc-sociedades-lda-portugal-guia',
  title: 'IRC e sociedades (Lda): o que muda quando passa de ENI a empresa',
  excerpt:
    'Quando a facturação cresce, a Lda deixa de ser «complicação» e passa a ser decisão de negócio. IRC vs IRS, responsabilidade, contabilidade organizada e erros comuns — guia para PME.',
  publishedAt: '2026-07-20',
  updatedAt: '2026-07-20',
  author: 'Jaelson Santos',
  authorRole: 'Fundador do TegLion · Escreve sobre fiscalidade em Portugal',
  category: 'Guias completos',
  audience: ['pme', 'escritorio'],
  featured: false,
  tags: ['irc', 'lda', 'sociedades', 'pme', 'contabilidade'],
  readMinutes: 15,
  coverImage: {
    src: '/blog/covers/sociedade.svg',
    alt: 'IRC e sociedades Lda em Portugal',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'IRC e sociedades Lda: de ENI a empresa | Blog TegLion',
    description:
      'IRC vs IRS, responsabilidade e contabilidade organizada: o que muda ao passar de ENI a Lda em Portugal — guia prático para PME.',
    keywords: [
      'IRC Portugal',
      'sociedade Lda',
      'passar de ENI a Lda',
      'contabilidade organizada',
      'IRC vs IRS',
      'PME sociedade',
    ],
  },
  relatedSlugs: [
    'abrir-sociedade-lda-portugal-passo-a-passo',
    'regime-simplificado-vs-contabilidade-organizada',
    'digitalizar-escritorio-contabilidade-portugal',
    'como-escolher-contabilista-portugal',
  ],
  blocks: [
    legalCallout(
      'Taxas de IRC, regimes especiais e limiares mudam com o Orçamento do Estado — confirme sempre no Portal das Finanças e com um contabilista certificado (OCC) antes de decidir.',
    ),
    keyTakeaways([
      'ENI declara IRS (pessoa singular); a Lda é pessoa colectiva e paga IRC sobre o lucro da sociedade.',
      'Na Lda a responsabilidade dos sócios é, em regra, limitada ao capital — o património pessoal deixa de estar «tudo misturado» com o negócio.',
      'Sociedades em Portugal exigem contabilidade organizada e TOC — não dá para «fazer sozinho no Excel» como no início do ENI.',
      'Honorários típicos de contabilidade para micro-Lda: frequentemente 120–250 €/mês (volume e funcionários sobem o valor).',
      'Capital social mínimo de Lda pode ser baixo (ex.: 1 € por sócio em muitos casos), mas custos reais são registo, notário/balcão, banco e contabilista.',
      'Transição mal planeada custa: IVA, SS, contratos e facturação têm de mudar no dia certo — não «quando der jeito».',
    ]),
    ...proseParagraphs(
      'Imagine: facturou 80 mil euros no ano passado como ENI, tem dois clientes grandes a pedir «factura da empresa», e o contabilista já falou em «olhar para uma Lda». Não é vaidade de cartão de visita — é o momento em que o regime de pessoa singular começa a apertar: IRS progressivo, responsabilidade ilimitada e imagem perante bancos ou parceiros.',
      'Este guia explica, em linguagem de balcão do escritório, o que muda quando passa de empresário em nome individual para sociedade por quotas (Lda): imposto (IRC vs IRS), obrigações, custos e armadilhas. Não substitui o parecer do seu TOC — serve para chegar à reunião com perguntas certas.',
    ),
    quoteBlock(
      'Abrir Lda não é «pagar menos imposto por magia». É mudar a estrutura do negócio — e o imposto segue a estrutura, não o desejo.',
      'Equipa editorial TegLion',
    ),
    ...articleSection({
      h2: 'IRC em linguagem simples (vs IRS do ENI)',
      id: 'irc-vs-irs',
      paragraphs: [
        'Como ENI, o rendimento da actividade entra no IRS — imposto sobre o rendimento das pessoas singulares. Conforme o regime (simplificado ou organizado), aplica-se coeficiente ou lucro contabilístico, e a taxa efetiva depende do escalão e de outras rendas do agregado.',
        'Na Lda, a sociedade é um sujeito autónomo. O lucro tributável da empresa sujeita-se a IRC (Imposto sobre o Rendimento das Pessoas Colectivas). Em orientação geral para 2026, a taxa normal de IRC situa-se na casa dos 20% sobre a matéria colectável (confirme sempre a taxa vigente e eventuais taxas reduzidas para PME ou regimes especiais). Depois, se distribuir lucros aos sócios, pode haver tributação adicional na esfera pessoal (ex.: retenção / englobamento conforme opção) — o «custo total» não é só a taxa de IRC do balanço.',
        'Regra prática de conversa no escritório: comparar «IRS do ENI sobre o lucro da actividade» com «IRC da Lda + eventual remuneração/dividendos dos sócios + custos de estrutura». Quase nunca se decide só pela taxa de tabela.',
      ],
      blocks: [
        {
          type: 'callout',
          variant: 'info',
          title: 'Taxas reduzidas e PME',
          text: 'Existem regimes e taxas reduzidas para certos escalões de matéria colectável ou perfis de PME. Os limiares e condições mudam — peça ao contabilista o cenário com números do seu negócio, não uma percentagem solta da internet.',
        },
      ],
    }),
    sectionDivider(),
    ...articleSection({
      h2: 'Quando a Lda ajuda de verdade',
      id: 'quando-lda-ajuda',
      paragraphs: [
        'Não é obrigatório «crescer para Lda». Muitos profissionais prosperam anos como ENI. A sociedade faz sentido quando o risco ou a complexidade ultrapassam o que o nome individual aguenta bem.',
      ],
      blocks: [
        {
          type: 'ul',
          items: [
            'Responsabilidade: dívidas e contratos da Lda, em regra, não misturam automaticamente a casa e a conta pessoal (há excepções — avales, actos ilícitos, desconsideração da personalidade).',
            'Imagem comercial: clientes B2B, concursos e grandes contas pedem frequentemente NIF colectivo e facturação de sociedade.',
            'Contratação: admitir colaboradores com contrato de trabalho fica mais limpo na esfera da empresa (ainda assim há custos de SS e obrigações laborais).',
            'Investidores e sócios: trazer um parceiro com quotas é natural na Lda; no ENI «sócio» não existe da mesma forma.',
            'Crédito e leasing: bancos olham para contas da sociedade e rácios — estrutura empresarial ajuda, mas não garante aprovação.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Sinal de conversa com o TOC',
          text: 'Se já pensa em contratar, se um cliente representa mais de metade da facturação e exige Lda, ou se o património pessoal o preocupa — marque reunião de estrutura, não só de «fecho do mês».',
        },
      ],
    }),
    { type: 'link', label: 'Abrir sociedade Lda em Portugal: passo a passo', slug: 'abrir-sociedade-lda-portugal-passo-a-passo' },
    { type: 'link', label: 'Regime simplificado vs contabilidade organizada', slug: 'regime-simplificado-vs-contabilidade-organizada' },
    ...articleSection({
      h2: 'Contabilidade organizada: obrigação, não opção',
      id: 'contabilidade-organizada',
      paragraphs: [
        'A sociedade comercial em Portugal opera com contabilidade organizada. Isso significa planos de contas, lançamentos, balancetes, inventário quando aplicável, e declarações periódicas (incluindo Modelo 22 de IRC, IES, e o que o calendário fiscal exigir). O TOC assina e responde profissionalmente — o sócio-gerente não «substitui» o contabilista com um Excel.',
        'Na prática, o custo mensal sobe face a um ENI em regime simplificado com poucos recibos. Em microempresas sem grande volume, é comum ver propostas na faixa dos 120–250 €/mês; com funcionários, IVA complexo ou várias actividades, sobe. Peça proposta escrita com o que está incluído (IVA, salários, IRC, IES, reuniões).',
      ],
      blocks: [
        {
          type: 'ul',
          items: [
            'Software de facturação certificado e alinhado com o escritório',
            'Conta bancária da sociedade (separar do pessoal desde o dia 1)',
            'Processo claro de entrega de documentos (portal > WhatsApp solto)',
            'Calendário de fechos mensais / trimestrais combinado com o TOC',
          ],
        },
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'Escritório a acompanhar PME em transição?',
      text: 'Com TegLion, peça documentos por portal, acompanhe prazos e deixe de caçar facturas no WhatsApp — a Lda do cliente precisa de processo, não só de ERP.',
    }),
    comparisonTable({
      caption: 'ENI vs Lda — comparação rápida (orientação 2026)',
      headers: ['Tema', 'ENI', 'Lda'],
      rows: [
        ['Quem é o sujeito', 'Pessoa singular', 'Pessoa colectiva (sociedade)'],
        ['Imposto sobre o lucro', 'IRS (actividade)', 'IRC (+ eventual distribuição aos sócios)'],
        ['Responsabilidade', 'Em regra ilimitada (património pessoal)', 'Em regra limitada às quotas / capital'],
        ['Contabilidade', 'Simplificado ou organizado', 'Organizada (obrigatória)'],
        ['Imagem / B2B', 'Aceite, mas limita em alguns contratos', 'Mais natural para empresas e concursos'],
        ['Sócios / investidores', 'Não há quotas', 'Quotas e pacto social'],
        ['Custo estrutural típico', 'Mais baixo no início', 'Registo + TOC + conta + compliance'],
      ],
    }),
    ...articleSection({
      h2: 'Erros comuns na passagem ENI → Lda',
      id: 'erros-comuns',
      paragraphs: [
        'O balcão do escritório vê os mesmos tropeços todos os anos. Evitá-los poupa dinheiro e noites mal dormidas.',
      ],
      blocks: [
        {
          type: 'ol',
          items: [
            'Abrir Lda «porque o Instagram disse» sem simulação fiscal e de custos — taxa de IRC isolada não conta a história.',
            'Continuar a misturar cartão pessoal e despesas da empresa — o TOC e a AT não gostam; o banco também não.',
            'Esquecer de cessar ou ajustar a actividade ENI / CAE no timing certo — facturação duplicada ou lacunas.',
            'Assumir que o software e o NIF antigo «passam» — emitem-se documentos com o NIF colectivo e série correcta.',
            'Não actualizar contratos, seguros e Segurança Social (gerente, trabalhadores) no calendário combinado.',
            'Prometer ao cliente final «amanhã já é Lda» sem certidão, registo e NIF colectivo activos.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Atenção',
          text: 'Despesas pessoais na conta da sociedade e levantamentos sem suporte documental são clássicos de problemas em inspecção e no fecho de contas. Disciplina bancária é metade da contabilidade.',
        },
      ],
    }),
    ...articleSection({
      h2: 'Checklist antes de decidir',
      id: 'checklist',
      paragraphs: [
        'Leve isto à reunião com o contabilista. Se não conseguir responder a metade, ainda não está pronto para assinar o pacto social.',
      ],
      blocks: [
        {
          type: 'ul',
          items: [
            'Facturação anual estimada e margem bruta realista (não o «melhor mês»)',
            'Precisa de sócio, investidor ou crédito nos próximos 12–24 meses?',
            'Vai contratar? Quantos? Que custos de SS e seguros?',
            'Clientes exigem NIF colectivo ou facturação de sociedade?',
            'Simulação ENI vs Lda com o seu TOC (IRC + remuneração + dividendos + honorários)',
            'Orçamento para capital, registo, software, conta e mensalidade de contabilidade',
            'Plano de transição: data de início, facturação, contratos, SS, IVA',
            'Quem será gerente e com que poderes no pacto?',
          ],
        },
      ],
    }),
    ...articleSection({
      h2: 'Próximos passos práticos',
      id: 'proximos-passos',
      paragraphs: [
        'Se a decisão for avançar, o artigo passo a passo cobre nome, capital, certidão, registo, NIF colectivo, Segurança Social, banco e facturação. Se ainda estiver a pesar regimes, leia primeiro a comparação entre simplificado e organizado — a Lda entra no mundo organizado de qualquer forma.',
        'Escritórios que acompanham esta transição precisam de pedidos de documentos claros e prazos partilhados com o cliente: o «dia D» da sociedade é tão crítico como o fecho de IVA.',
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'Clientes a passar para Lda?',
      text: 'Centralize pedidos, prazos e mensagens no portal TegLion — menos follow-up manual, mais controlo no mês em que a estrutura muda.',
    }),
    ...internalLinksSection({
      title: 'Continuar a ler',
      intro: 'Artigos ligados a sociedades, regimes e escolha de contabilista.',
      slugs: [
        'abrir-sociedade-lda-portugal-passo-a-passo',
        'caso-pme-transicao-eni-lda',
        'regime-simplificado-vs-contabilidade-organizada',
        'como-escolher-contabilista-portugal',
        'digitalizar-escritorio-contabilidade-portugal',
      ],
    }),
    legalCallout(),
  ],
}
