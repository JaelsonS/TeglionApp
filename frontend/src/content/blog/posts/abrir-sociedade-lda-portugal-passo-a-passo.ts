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

export const postAbrirSociedadeLda: BlogPost = {
  slug: 'abrir-sociedade-lda-portugal-passo-a-passo',
  title: 'Abrir sociedade Lda em Portugal: passo a passo prático',
  excerpt:
    'Nome, capital, certidão, registo, NIF colectivo, Segurança Social, banco, facturação e contabilista — roteiro claro para constituir uma Lda sem saltar etapas críticas.',
  publishedAt: '2026-07-20',
  updatedAt: '2026-07-21',
  author: 'Jaelson Santos',
  authorRole: 'Fundador do TegLion · Dev de software · Contabilidade (BR) → fiscalidade PT',
  category: 'Actividade',
  audience: ['pme', 'independente'],
  featured: false,
  tags: ['lda', 'sociedade', 'abrir empresa', 'pme', 'registo comercial', 'NIF colectivo'],
  readMinutes: 12,
  coverImage: {
    src: '/blog/covers/sociedade.svg',
    alt: 'Abrir sociedade Lda em Portugal',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Abrir sociedade Lda em Portugal — passo a passo',
    description:
      'Nome, capital, registo, NIF colectivo, SS, banco e facturação: roteiro para constituir uma Lda em Portugal sem saltar etapas críticas.',
    keywords: [
      'abrir sociedade Lda',
      'constituir empresa Portugal',
      'registo comercial Lda',
      'NIF colectivo',
      'empresa por quotas',
      'passo a passo Lda',
    ],
  },
  relatedSlugs: [
    'irc-sociedades-lda-portugal-guia',
    'quanto-custa-abrir-actividade-portugal',
    'abrir-empresa-individual-eni',
    'caso-pme-transicao-eni-lda',
  ],
  blocks: [
    legalCallout(
      'Procedimentos de Empresa na Hora, Online e conservatórias mudam em prazos e documentos. Confirme requisitos oficiais (IRN / Portal da Empresa) e apoio profissional antes de pagar taxas.',
    ),
    keyTakeaways([
      'Ordem típica: nome disponível → pacto/capital → constituição/registo → NIF colectivo → SS → banco → software → TOC activo.',
      'Capital social de Lda pode ser muito baixo; o custo real está em taxas, tempo, contabilista e conta bancária.',
      'Sem NIF colectivo e facturação correcta, não comece a «vender como empresa» — evita correcções dolorosas.',
      'Gerente e sócios têm obrigações distintas: quem assina, quem trabalha, quem recebe dividendos.',
      'Se vem de ENI, planeie a data de corte: contratos, recibos e IVA não podem ficar a meio.',
      'Orçamento de arranque (indicativo, variável): algumas centenas a mais de mil euros conforme via (Empresa na Hora vs processo mais elaborado) + mensalidade TOC.',
    ]),
    ...proseParagraphs(
      'Abrir uma Lda parece um formulário — até falhar o nome, esquecer a Segurança Social do gerente ou emitir a primeira factura com o NIF antigo. Este artigo segue a ordem em que o balcão do escritório costuma acompanhar o cliente: do nome ao primeiro mês de facturação.',
      'Se ainda está a decidir entre ENI e sociedade, leia antes o guia de IRC e sociedades. Se já decidiu, use esta lista como checklist com o seu contabilista.',
    ),
    quoteBlock(
      'Constituir a sociedade é o dia 1. O dia 2 é ter conta, software, TOC e documentos a fluir — senão tem NIF colectivo e zero operação.',
    ),
    ...articleSection({
      h2: '1. Nome (firma) e objecto',
      id: 'nome',
      paragraphs: [
        'A firma tem de estar disponível e cumprir regras de identificação. Em muitos fluxos usa-se o serviço de certificados de admissibilidade / Empresa na Hora / Online. Evite nomes demasiado genéricos ou que colidam com marcas conhecidas.',
        'Defina o objecto social (CAE principal e secundários) com realismo: o que vai facturar nos próximos 12 meses, não a lista de sonhos. Mudanças posteriores são possíveis, mas custam tempo e atenção do TOC.',
      ],
    }),
    ...articleSection({
      h2: '2. Capital social e quotas',
      id: 'capital',
      paragraphs: [
        'Na Lda o capital divide-se em quotas. O valor mínimo legal pode ser simbólico (em muitos casos 1 € por sócio), mas o pacto deve reflectir quem detém que percentagem e com que poderes.',
        'Discuta com o advogado/TOC: prestações acessórias, cláusulas de preferência, entrada de novos sócios, e o que acontece se um sócio sair. «Depois vemos» é a frase que gera litígios caros.',
      ],
      blocks: [
        {
          type: 'callout',
          variant: 'tip',
          title: 'Capital baixo ≠ empresa barata',
          text: 'Capital mínimo baixo facilita o arranque, mas bancos e fornecedores olham para solvência e histórico — não só para o valor escrito no pacto.',
        },
      ],
    }),
    ...articleSection({
      h2: '3. Certidão e documentos dos sócios',
      id: 'certidao',
      paragraphs: [
        'Prepare identificação dos sócios e gerentes, comprovativos de morada quando pedidos, e o certificado de admissibilidade de firma se o canal o exigir. Em processos presenciais ou mistos, a lista de documentos varia — confirme na fonte oficial do canal que escolheu.',
        'Se um sócio for estrangeiro ou pessoa colectiva, o dossier engorda: NIF português, representações, traduções. Antecipe isto; não descubra no balcão.',
      ],
    }),
    sectionDivider(),
    ...articleSection({
      h2: '4. Constituição e registo comercial',
      id: 'registo',
      paragraphs: [
        'A sociedade nasce com o acto de constituição e o registo no Registo Comercial (consoante o regime: Empresa na Hora, Online, ou via mais tradicional). Guarde a certidão permanente / código de acesso — vai precisar dela no banco, no Portal das Finanças e em contratos.',
        'Anote a data de início de actividade que declararão às Finanças. É a âncora do calendário fiscal.',
      ],
      blocks: [
        comparisonTable({
          caption: 'Canais comuns (orientação)',
          headers: ['Canal', 'Perfil típico', 'Notas'],
          rows: [
            ['Empresa na Hora', 'Constituição rápida, pacotes standard', 'Menos customização no pacto'],
            ['Empresa Online', 'Sócios com CMD / autenticação', 'Conveniente se documentação está pronta'],
            ['Via clássica / apoio jurídico', 'Pactos complexos, vários sócios', 'Mais tempo e custo, mais flexibilidade'],
          ],
        }),
      ],
    }),
    { type: 'link', label: 'IRC e sociedades: o que muda de ENI para Lda', slug: 'irc-sociedades-lda-portugal-guia' },
    { type: 'link', label: 'Quanto custa abrir actividade em Portugal', slug: 'quanto-custa-abrir-actividade-portugal' },
    ...articleSection({
      h2: '5. NIF colectivo e Portal das Finanças',
      id: 'nif-colectivo',
      paragraphs: [
        'Após o registo, a sociedade fica com NIF de pessoa colectiva. Configure acessos no Portal das Finanças (gestores de portal, procurações ao TOC com cuidado — nunca partilhe senhas pessoais).',
        'Comunique o início de actividade, escolha de regimes de IVA e demais parâmetros com o contabilista. Erros no dia 1 (isenção vs sujeito passivo, periodicidade) custam meses a corrigir.',
      ],
    }),
    ...articleSection({
      h2: '6. Segurança Social',
      id: 'seguranca-social',
      paragraphs: [
        'A sociedade e as pessoas ligadas a ela (gerentes, trabalhadores) têm enquadramentos próprios. Não assuma que «o NISS do ENI resolve». Inscrições, remunerações declaradas e contribuições do órgão de gestão devem ser alinhadas com o TOC e, se necessário, com apoio laboral.',
        'Se vai ter colaboradores, prepare contratos, seguros e calendário de remessas antes do primeiro vencimento — não na véspera do processamento.',
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'Acompanhar constituição e primeiros meses?',
      text: 'Use o portal TegLion para pedir documentos ao cliente por etapas (pacto, NIF, IBAN, facturas) e manter o histórico limpo desde o dia 1 da Lda.',
    }),
    ...articleSection({
      h2: '7. Conta bancária da sociedade',
      id: 'banco',
      paragraphs: [
        'Abra conta em nome da Lda com NIF colectivo e documentos de registo. Separe 100% do património pessoal: ordenados, dividendos e despesas pessoais não devem «passar pela mesma caixa» sem suporte.',
        'Peça cartões e acessos online só a quem o pacto e a política interna autorizam. Dois cartões para tudo e password partilhada é receita para dor de cabeça no fecho de contas.',
      ],
    }),
    ...articleSection({
      h2: '8. Facturação e software certificado',
      id: 'faturacao',
      paragraphs: [
        'Escolha software de facturação certificado, com série e dados da sociedade correctos (morada, capital, conservatória, CAE). Teste uma factura de teste / série de formação se o software permitir, antes do primeiro cliente real.',
        'Se vinha de recibos verdes no Portal, mude o hábito: a Lda não é «o mesmo recibo com outro NIF». Alinhe com o escritório o fluxo de envio de PDFs e a validação no e-Fatura.',
      ],
    }),
    ...articleSection({
      h2: '9. Contabilista certificado (TOC)',
      id: 'contabilista',
      paragraphs: [
        'Sem TOC, a Lda não navega bem: IRC, IES, IVA, salários e arquivo. Escolha escritório com experiência em microempresas e comunicação clara. Peça proposta com o que está incluído no primeiro ano (constituição + acompanhamento).',
        'Combine canal oficial de documentos: portal do cliente, não só WhatsApp. No primeiro trimestre, a disciplina de entrega define se o fecho de mês é calmo ou caótico.',
      ],
      blocks: [
        {
          type: 'ol',
          items: [
            'Confirmar inscrição OCC e experiência com Lda / IRC',
            'Assinar proposta e definir honorários e exclusões',
            'Configurar procuração / acessos sem partilhar senhas',
            'Calendário de fechos e lista de documentos mensais',
            'Revisão após 90 dias: o que falhou no processo?',
          ],
        },
      ],
    }),
    ...articleSection({
      h2: 'Checklist final do dia de abertura',
      id: 'checklist-final',
      blocks: [
        {
          type: 'ul',
          items: [
            'Firma registada e certidão / códigos guardados em local seguro',
            'NIF colectivo activo e Portal das Finanças configurado',
            'SS alinhada (sociedade / gerente / trabalhadores)',
            'Conta bancária aberta e IBAN partilhado com o TOC',
            'Software de facturação com dados correctos',
            'Primeira reunião de fecho de mês agendada',
            'Se vinha de ENI: data de corte e comunicação a clientes',
          ],
        },
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'Escritório com várias constituições por ano?',
      text: 'Padronize pedidos de documentos e prazos no TegLion — cada nova Lda começa com o mesmo processo, não com um chat diferente.',
    }),
    ...internalLinksSection({
      title: 'Artigos relacionados',
      intro: 'Da decisão fiscal ao custo de abrir actividade e ao caso de transição.',
      slugs: [
        'irc-sociedades-lda-portugal-guia',
        'caso-pme-transicao-eni-lda',
        'abrir-empresa-individual-eni',
        'quanto-custa-abrir-actividade-portugal',
        'como-escolher-contabilista-portugal',
      ],
    }),
    legalCallout(),
  ],
}
