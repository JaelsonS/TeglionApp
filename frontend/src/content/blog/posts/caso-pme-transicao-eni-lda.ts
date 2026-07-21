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

export const postCasoEniLda: BlogPost = {
  slug: 'caso-pme-transicao-eni-lda',
  title: 'Caso: de freelancer ENI a Lda — números ilustrativos e lições',
  excerpt:
    'Transição anonimizada de trabalhador independente para sociedade por quotas: facturação, custos, IRC vs IRS e o que o TOC pediu antes do «dia D». Números ilustrativos para PME.',
  publishedAt: '2026-07-20',
  updatedAt: '2026-07-20',
  author: 'Jaelson Santos',
  authorRole: 'Fundador do Teglion · Escreve sobre fiscalidade em Portugal',
  category: 'Contabilidade',
  audience: ['pme', 'independente'],
  featured: false,
  tags: ['caso de estudo', 'ENI', 'Lda', 'transição', 'IRC', 'freelancer', 'PME'],
  readMinutes: 11,
  coverImage: {
    src: '/blog/covers/caso.svg',
    alt: 'Caso: transição de ENI a Lda',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Caso PME: transição de ENI para Lda | Blog Teglion',
    description:
      'Caso ilustrativo de passagem de freelancer ENI a sociedade Lda: facturação, custos, impostos e checklist. Conteúdo educativo — confirme com contabilista certificado.',
    keywords: [
      'passar de ENI a Lda',
      'caso transição sociedade',
      'freelancer abrir Lda',
      'IRC vs IRS exemplo',
      'PME Portugal Lda',
    ],
  },
  relatedSlugs: [
    'irc-sociedades-lda-portugal-guia',
    'abrir-sociedade-lda-portugal-passo-a-passo',
    'regime-simplificado-vs-contabilidade-organizada',
    'como-escolher-contabilista-portugal',
  ],
  blocks: [
    legalCallout(
      'Os valores deste caso são ilustrativos e arredondados para ensino. Não representam a situação fiscal de uma pessoa real identificada nem uma simulação vinculativa. Decisões de estrutura exigem TOC / profissional habilitado e dados do ano em curso.',
    ),
    keyTakeaways([
      'Perfil: consultor de IT a solo, ~95 000 € de facturação anual, margem alta, um cliente a pedir NIF colectivo.',
      'ENI em contabilidade organizada já pagava honorários (~90 €/mês); na Lda a proposta subiu para ~160 €/mês.',
      'Simulação do TOC: «só a taxa de IRC» não bastava — entraram remuneração de gerente, SS e eventual distribuição.',
      'Custos de constituição + software + conta: ordem de 800–1 500 € no arranque (varia muito com o canal).',
      'Dia D: parar recibos no NIF pessoal, emitir pela Lda, actualizar contratos — falhar isto gera confusão de IVA e clientes.',
      'Seis meses depois: menos ansiedade patrimonial, mais disciplina bancária, imposto «diferente» — não automaticamente «mais barato».',
    ]),
    ...proseParagraphs(
      'Chamemos-lhe R. Não é o nome real. R facturava perto de 95 mil euros por ano como ENI, consultoria IT, poucos custos dedutíveis relevantes, um cliente grande (cerca de 40% da facturação) e zero vontade de «abrir empresa por moda». O gatilho foi uma frase no email do cliente: «A partir de Janeiro só trabalhamos com sociedades.»',
      'Este caso mostra o percurso que o escritório desenhou com R: números redondos, decisões e tropeços. Serve para preparar a sua conversa com o contabilista — não para copiar percentagens à letra.',
    ),
    quoteBlock(
      'Eu queria pagar menos imposto. O TOC disse: «Primeiro queremos que durma descansado e que o cliente não desapareça.» Tinham razão na ordem.',
      'R. — perfil ilustrativo',
    ),
    ...articleSection({
      h2: 'Retrato antes da transição',
      id: 'antes',
      paragraphs: [
        'Actividade aberta há quatro anos. Passou de regime simplificado para organizado quando o volume e as despesas o justificaram. IVA regular. Segurança Social de trabalhador independente em dia. Arquivo digital razoável — mas misturava cartão pessoal e despesas «quase da empresa».',
      ],
      blocks: [
        comparisonTable({
          caption: 'Números ilustrativos (ano anterior à Lda)',
          headers: ['Rubrica', 'Valor (aprox.)', 'Nota'],
          rows: [
            ['Facturação', '95 000 €', 'Serviços IT'],
            ['Custos relevantes', '12 000 €', 'Software, formação, deslocações'],
            ['Honorários TOC', '90 €/mês', 'Organizado, sem funcionários'],
            ['Cliente âncora', '~40%', 'A exigir sociedade'],
            ['Património misturado', 'Sim', 'Conta e cartão pessoais'],
          ],
        }),
      ],
    }),
    sectionDivider(),
    ...articleSection({
      h2: 'O que o TOC simulou (IRC vs IRS)',
      id: 'simulacao',
      paragraphs: [
        'A primeira pergunta de R foi «qual a taxa de IRC?». A resposta útil foi uma tabela com três colunas: continuar ENI; Lda com remuneração de gerente modesta; Lda com remuneração mais alta e menos dividendos. O TOC deixou claro que taxas de catálogo e benefícios pontuais mudam — e que o objectivo era ordem de grandeza, não «o número exacto do Modelo 22».',
        'No cenário ilustrativo, a Lda não ganhava «automaticamente» 10 mil euros por ano em imposto. Em alguns desenhos ganhava pouco; noutros, com remuneração e SS, o total aproximava-se do ENI. O que mudava de forma clara: responsabilidade limitada (com nuances), imagem perante o cliente âncora, e disciplina de contas.',
      ],
      blocks: [
        {
          type: 'callout',
          variant: 'info',
          title: 'Leitura correcta da simulação',
          text: 'Se a única justificação for «IRC é X%», peça outra reunião. Se a justificação for cliente + risco + crescimento + números honestos, está no bom caminho.',
        },
    { type: 'link', label: 'Guia: IRC e sociedades (Lda)', slug: 'irc-sociedades-lda-portugal-guia' },
    { type: 'link', label: 'Abrir sociedade Lda em Portugal — passo a passo', slug: 'abrir-sociedade-lda-portugal-passo-a-passo' },
      ],
    }),
    ...articleSection({
      h2: 'Custos de passar a Lda (ilustrativos)',
      id: 'custos',
      blocks: [
        {
          type: 'ul',
          items: [
            'Constituição / registo: algumas centenas de euros consoante Empresa na Hora vs apoio jurídico (R escolheu pacote simples + revisão do TOC)',
            'Software de facturação certificado: 15–40 €/mês típicos em planos micro',
            'Conta bancária empresa: custos de manutenção variáveis; R pagou pacote PME básico',
            'Honorários TOC: de ~90 € para ~160 €/mês (IRC, IES, mais compliance)',
            'Tempo de R: ~20–30 horas no mês de transição (contratos, clientes, banco, Finanças)',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Orçamento mental útil',
          text: 'R reservou ~1 200 € para o mês zero (taxas + setup) e aceitou +70 €/mês de contabilidade. Sem essa margem, a transição gera stress no cash-flow.',
        },
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'Escritório a gerir várias transições ENI → Lda?',
      text: 'Padronize a checklist de documentos e a data de corte no portal Teglion — o cliente vê o que falta; a equipa não perde o fio no WhatsApp.',
    }),
    ...articleSection({
      h2: 'O dia D e os 30 dias seguintes',
      id: 'dia-d',
      paragraphs: [
        'Combinaram data de início da Lda a meio do mês — erro. Dois clientes receberam um recibo ENI e uma factura Lda no mesmo período e perguntaram «qual é o NIF válido?». No mês seguinte passaram o corte para o dia 1. Lição barata, mas irritante.',
      ],
      blocks: [
        {
          type: 'ol',
          items: [
            'NIF colectivo e Portal das Finanças activos',
            'Software com dados da Lda e série correcta',
            'Email a clientes: novo NIF, prazo de transição, IBAN da sociedade',
            'Parar emissão no NIF pessoal na data combinada',
            'SS e enquadramento de gerente alinhados com o TOC',
            'Primeira reunião de fecho de mês com lista de documentos no portal',
          ],
        },
    { type: 'link', label: 'Passo a passo para abrir a Lda', slug: 'abrir-sociedade-lda-portugal-passo-a-passo' },
      ],
    }),
    ...articleSection({
      h2: 'Seis meses depois: o que mudou de verdade',
      id: 'seis-meses',
      paragraphs: [
        'O cliente âncora renovou. R dorme melhor com a separação patrimonial — e descobriu que a disciplina de não pagar o supermercado com o cartão da Lda é mais difícil do que o IRC. O imposto anual, no cenário ilustrativo, não foi um «milagre»; o negócio ficou mais apresentável e preparado para contratar um colaborador a meio tempo.',
        'O TOC passou a pedir documentos por lista mensal. R, habituado a enviar fotos à noite, demorou seis semanas a cumprir o portal. Quando cumpriu, o fecho deixou de ser uma discussão.',
      ],
      blocks: [
        comparisonTable({
          caption: 'Antes vs depois (leitura qualitativa + ordens de grandeza)',
          headers: ['Tema', 'ENI', 'Lda (6 meses)'],
          rows: [
            ['Imagem B2B', 'Ok, com limites', 'Cliente âncora satisfeito'],
            ['Honorários TOC', '~90 €/mês', '~160 €/mês'],
            ['Mistura pessoal/empresa', 'Frequente', 'Rara (após bronca do TOC)'],
            ['Pronto a contratar?', 'Possível, mais confuso', 'Estrutura mais limpa'],
            ['«Paguei menos imposto?»', '—', 'Depende do desenho — não era o único objectivo'],
          ],
        }),
      ],
    }),
    ...articleSection({
      h2: 'Checklist se está no lugar de R',
      id: 'checklist',
      blocks: [
        {
          type: 'ul',
          items: [
            'Tem um cliente ou concurso que exige sociedade nos próximos 6–12 meses?',
            'Já pediu simulação ENI vs Lda com o seu TOC (não só a taxa de IRC)?',
            'Tem margem para +honorários e setup no mês zero?',
            'Consegue separar contas bancárias a 100%?',
            'Tem data de corte no dia 1 (ou outro marco claro) e mensagem pronta para clientes?',
            'Leu o guia de IRC e o passo a passo de constituição antes de marcar a Empresa na Hora?',
          ],
        },
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'Do lado do escritório',
      text: 'Transições ENI → Lda geram picos de documentos. Com Teglion, o cliente entrega no portal e a equipa valida com estados — menos ruído no mês mais sensível.',
    }),
    ...internalLinksSection({
      title: 'Guias para decidir e executar',
      slugs: [
        'irc-sociedades-lda-portugal-guia',
        'abrir-sociedade-lda-portugal-passo-a-passo',
        'regime-simplificado-vs-contabilidade-organizada',
        'abrir-empresa-individual-eni',
        'como-escolher-contabilista-portugal',
      ],
    }),
    legalCallout(),
  ],
}
