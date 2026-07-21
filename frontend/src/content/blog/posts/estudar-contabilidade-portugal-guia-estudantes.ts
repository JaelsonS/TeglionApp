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

export const postEstudarContabilidade: BlogPost = {
  slug: 'estudar-contabilidade-portugal-guia-estudantes',
  title: 'Como estudar contabilidade em Portugal: guia para estudantes.',
  excerpt:
    'Calculadora certa, livros, método de estudo, estágios OCC e primeiros passos na profissão — do 1.º ano à licenciatura, com recursos práticos para quem quer perceber números sem dormir no livro.',
  publishedAt: '2026-06-18',
  updatedAt: '2026-07-20',
  author: 'Jaelson Santos',
  authorRole: 'Fundador do TegLion · Dev de software · Contabilidade (BR) → fiscalidade PT',
  category: 'Estudantes',
  audience: ['estudante'],
  tags: [
    'estudar contabilidade',
    'estudante contabilidade',
    'OCC',
    'calculadora científica',
    'licenciatura contabilidade',
    'Portugal',
  ],
  readMinutes: 12,
  featured: false,
  series: {
    id: 'carreira-contabilidade',
    title: 'Carreira em contabilidade',
    description: 'Do estudo à prática profissional — estudantes, estagiários e escritórios.',
    part: 1,
    totalParts: 3,
  },
  coverImage: {
    src: '/blog/covers/estudante.svg',
    alt: 'Estudar contabilidade em Portugal',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Estudar contabilidade em Portugal — guia do estudante',
    description:
      'Calculadora, livros, método de estudo e carreira OCC para estudantes de contabilidade em Portugal. Recursos práticos para licenciatura, CET e quem quer conhecer a área de contabilidade.',
    keywords: [
      'estudar contabilidade Portugal',
      'calculadora contabilidade',
      'licenciatura contabilidade',
      'OCC estagiário',
      'como ser contabilista Portugal',
    ],
  },
  relatedSlugs: [
    'ferramentas-essenciais-contabilista-2026',
    'contabilidade-explicada-leigos-portugal',
    'regime-simplificado-vs-contabilidade-organizada',
    'como-escolher-contabilista-portugal',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'Contabilidade não é só decorar fórmulas — é perceber o «porquê» de cada lançamento e declaração.',
      'Calculadora científica com memórias (ex.: Casio fx-991) é investimento que dura toda a licenciatura.',
      'Organize pastas por disciplina (Fiscal, Societária, Analítica) — no estágio, o hábito paga dividendos.',
      'Estágio profissional OCC é porta de entrada — trate o escritório como escola, não só como CV.',
      'Quem quer conhecer a área de contabilidade sem formação formal podem aprender conceitos base com livros acessíveis antes de decidir estudar.',
    ]),
    ...proseParagraphs(
      'Se está no 1.º ano de Contabilidade, a preparar o CET, ou simplesmente curioso sobre «como é que isto funciona na vida real», este guia junta o que os manuais raramente dizem: que material comprar, como estudar sem burnout, e o que esperar quando chegar a um escritório.',
      'Portugal tem formação universitária, politécnicos e percursos de certificação OCC. O caminho é longo — mas quem gosta de ordem, números e resolver problemas concretos encontra na profissão um puzzle diário com impacto real nas pessoas e nas empresas.',
    ),
    quoteBlock(
      'No exame, a calculadora salva tempo; no escritório, o que salva é saber onde procurar a regra — e ter arquivo desde o primeiro dia de estágio.',
      'Professores e contadores certificados',
    ),
    ...articleSection({
      h2: 'O que vai aprender (e por que importa)',
      id: 'curriculo',
      paragraphs: [
        'A formação cobre contabilidade geral, fiscalidade (IRS, IVA, IRC), direito societário, auditoria, sistemas de informação e análise financeira. Parece muito — e é. Mas cada peça encaixa: o lançamento contabilístico alimenta a declaração fiscal; a declaração fiscal reflecte a realidade da empresa.',
        'Se estuda só para passar, vai sofrer no estágio. Se estuda para perceber fluxos (dinheiro → documento → mapa → declaração), cada exame fica mais fácil e o primeiro emprego menos assustador.',
      ],
      blocks: [
        comparisonTable({
          caption: 'Disciplinas típicas e ligação à prática',
          headers: ['Área', 'O que aprende', 'Onde vê no escritório'],
          rows: [
            ['Contabilidade Geral', 'Balancete, razão, demonstrações', 'Mapas mensais do cliente'],
            ['Fiscalidade', 'IRS, IVA, retenções', 'Declarações periódicas e anuais'],
            ['Societária', 'Lda., assembleias, capital', 'Constituições e alterações'],
            ['Analítica / Gestão', 'Custos, orçamentos', 'Relatórios para decisão do cliente'],
            ['Sistemas / TI', 'ERP, SAF-T, Excel', 'Software de facturação e arquivo'],
          ],
        }),
      ],
    }),
    sectionDivider(),
    ...articleSection({
      h2: 'Material essencial: calculadora e arquivo',
      id: 'material',
      paragraphs: [
        'A pergunta clássica no 1.º dia: «Qual calculadora compro?». Para contabilidade e finanças em Portugal, uma científica com funções estatísticas e memórias é o padrão — modelos como a Casio fx-991ES Plus são permitidos na maioria dos exames e duram anos.',
        'Para além da calculadora: pastas por disciplina, etiquetas nas lombadas, e um caderno só para «erros que não quero repetir» (lançamentos trocados, sinais errados, confusão débito/crédito). No 3.º ano, esse caderno vale mais que muitos resumos fotocopiados.',
      ],
    }),
    ...articleSection({
      h2: 'Método de estudo que funciona',
      id: 'metodo',
      paragraphs: [
        'Contabilidade recompensa prática repetida com variação: faça o mesmo exercício três vezes — uma com o manual aberto, uma com ajuda mínima, uma cronometrada. Fiscalidade recompensa mapas mentais: ligação entre tipo de rendimento, retenção, anexo IRS e prazo.',
      ],
      blocks: [
        {
          type: 'ol',
          items: [
            'Antes da aula: leia o índice do capítulo (10 min) — chegue com perguntas',
            'Depois da aula: refaça 2–3 exercícios sem olhar para a solução',
            'Semanalmente: uma folha A4 com «conceitos que ainda não domino»',
            'Antes do teste: simule exame com calculadora e tempo limitado',
            'Ligue teoria a notícias: mudanças no IRS ou IVA são casos de estudo reais',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Para quem quer conhecer a área de contabilidade (sem matrícula)',
          text: 'Comece pelo nosso artigo «Contabilidade explicada para leigos» e por um livro introdutório em português. Se gostar da lógica, aí sim explore CET ou licenciatura.',
        },
      ],
    }),
    ...articleSection({
      h2: 'Estágio OCC e primeiros empregos',
      id: 'estagio',
      paragraphs: [
        'A Ordem dos Contabilistas Certificados regula a profissão. O estágio profissional é obrigatório para certificação — e é onde a teoria ganha corpo: prazos reais, clientes impacientes, Portal das Finanças lento às 23h59 do dia 19.',
        'No estágio, observe como o escritório pede documentos, como regista prazos e como comunica com clientes. Escritórios modernos usam portal do cliente e software de gestão — ferramentas que vai encontrar na carreira.',
      ],
    }),
    teglionCtaBlock({
      variant: 'firm',
      title: 'Estágio num escritório que ainda usa email para pedir PDFs?',
      text: 'Conheça o TegLion — portal do cliente, pedidos de documentos e prazos num só lugar. Sugira ao seu mentor ou experimente no próximo estágio.',
    }),
    ...affiliateSection({
      heading: 'O que vale a pena ter à mão na faculdade',
      headingId: 'kit-estudante',
      intro:
        'No primeiro ano, a tentação é comprar «tudo o que a loja recomenda». Na prática, bastam duas peças: uma calculadora que o acompanha até ao estágio e um livro que liga a teoria ao vocabulário do escritório. O resto — pastas, agendas, ebooks — só faz sentido depois de saber como estuda.',
      items: [
        {
          key: 'amazonCasio991',
          leadIn:
            'Em exames de contabilidade e finanças, a diferença entre um cálculo certo e um erro de arredondamento costuma ser a calculadora que já conhece de cor. Quem chega ao estágio sem uma Casio fiável perde tempo a improvisar no telemóvel — e o cliente à espera não espera.',
          title: 'Casio fx-991ES Plus 2ª Edição (Amazon)',
          description: 'padrão em faculdades portuguesas; memórias, estatística e verificação de cálculos numa só tecla.',
        },
        {
          key: 'amazonLivroGestaoContabil',
          leadIn:
            'Quando a matéria de Contabilidade Financeira parece abstracta, um texto em português que fala de gestão real ajuda a «ouvir» o que o professor está a dizer — e o que o supervisor no estágio vai pedir no primeiro mês.',
          title: 'Gestão Contábil — Para Contadores e Não Contadores (Amazon)',
          description: 'fundamentos claros e vocabulário da profissão, útil no 1.º e 2.º anos.',
        },
      ],
    }),
    { type: 'link', label: 'Ferramentas essenciais do contabilista em 2026', slug: 'ferramentas-essenciais-contabilista-2026' },
    { type: 'link', label: 'Contabilidade explicada a leigos', slug: 'contabilidade-explicada-leigos-portugal' },
    ...internalLinksSection({
      title: 'Continuar a aprender',
      intro: 'Artigos do blog para aprofundar temas que vai cruzar nos exames e no estágio.',
      slugs: [
        'contabilidade-explicada-leigos-portugal',
        'ferramentas-essenciais-contabilista-2026',
        'regime-simplificado-vs-contabilidade-organizada',
        'declaracao-irs-guia-pratico',
        'calendario-fiscal-portugal-2026-completo',
      ],
    }),
    legalCallout('Programas curriculares e regras OCC alteram-se — confirme na sua instituição e em occ.pt.'),
  ],
}
