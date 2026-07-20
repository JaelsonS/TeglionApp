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

export const postRegimeSimplificado: BlogPost = {
  slug: 'regime-simplificado-vs-contabilidade-organizada',
  title: 'Regime simplificado vs contabilidade organizada: qual escolher?',
  excerpt:
    'Diferenças práticas entre os dois regimes de contabilidade para trabalhadores independentes e PME em Portugal — custos, obrigações e quando mudar.',
  publishedAt: '2026-05-21',
  updatedAt: '2026-06-17',
  author: 'Equipa TegLion',
  authorRole: 'Equipa editorial · Guias de fiscalidade portuguesa',
  category: 'IRS',
  audience: ['independente', 'pme'],
  featured: false,
  tags: ['regime simplificado', 'contabilidade organizada', 'IRC', 'IRS', 'ENI'],
  readMinutes: 17,
  coverImage: {
    src: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&h=630&fit=crop&q=80',
    alt: 'Portátil numa mesa de trabalho',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Regime simplificado ou contabilidade organizada? | Blog TegLion',
    description:
      'Compare regime simplificado e contabilidade organizada para independentes em Portugal: custos, obrigações, coeficientes e quando mudar de regime.',
    keywords: ['regime simplificado Portugal', 'contabilidade organizada', 'IRS independente regime', 'coeficientes IRS'],
  },
  relatedSlugs: [
    'declaracao-irs-guia-pratico',
    'irs-recibos-verdes-erros-comuns',
    'obrigacoes-fiscais-mes-a-mes',
    'guia-completo-trabalhador-independente-portugal-2026',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'Regime simplificado: tributa uma parte da facturação (coeficientes) — não todas as despesas reais.',
      'Contabilidade organizada: tributa lucro real (rendimentos − despesas documentadas) — exige contador certificado.',
      'Há limite de volume de negócios para manter regime simplificado — ultrapassar obriga a mudança.',
      'Muitas despesas elevadas (aluguer escritório, equipa, stock) favorecem contabilidade organizada.',
      'A escolha afecta IRS, IVA e burocracia durante anos — simule antes de decidir.',
    ]),
    ...proseParagraphs(
      'Ao abrir actividade, escolhe (ou herda) um regime de contabilidade. O regime simplificado é comum no início; a contabilidade organizada exige contador certificado e livros contabilísticos — mas pode ser vantajosa com despesas elevadas ou facturação alta.',
      'Confundir os dois regimes é uma das principais fontes de erro no IRS: quem está no simplificado não «deduz tudo» como numa empresa com contabilidade completa; quem está na organizada não pode ignorar facturas de compra.',
      'Este guia compara ambos em linguagem prática. A decisão final deve ser simulada com contador — especialmente se está perto dos limites legais ou planeia crescer rápido.',
    ),
    sectionDivider(),
    comparisonTable({
      caption: 'Regime simplificado vs contabilidade organizada',
      headers: ['Critério', 'Regime simplificado', 'Contabilidade organizada'],
      rows: [
        ['Base de tributação', 'Coeficientes × facturação', 'Rendimentos − despesas reais'],
        ['Contador certificado', 'Recomendado, não sempre obrigatório', 'Obrigatório'],
        ['Arquivo de despesas', 'Importante, mas menos granular', 'Todas as facturas por rubrica'],
        ['Volume de negócios', 'Limite máximo anual', 'Obrigatório acima do limite'],
        ['Complexidade mensal', 'Menor', 'Maior (mapas, balancetes)'],
        ['Ideal para', 'Freelancers com poucas despesas', 'Negócios com custos altos ou equipa'],
      ],
    }),
    ...articleSection({
      h2: 'Regime simplificado em detalhe',
      id: 'simplificado',
      paragraphs: [
        'No regime simplificado, a AT aplica coeficientes à sua facturação bruta para determinar a parcela tributável. Por exemplo, em muitas actividades de serviços, uma percentagem significativa da facturação é considerada «despesa presumida» — não precisa de provar cada café, mas também não deduz despesas reais acima do coeficiente.',
        'Vantagens: menos papelada, menos honorários contabilísticos, entendimento mais rápido para quem começa. Desvantagens: se gasta muito em subcontratação, software, aluguer ou viagens, pode pagar IRS sobre rendimento «presumido» superior ao lucro real.',
      ],
      blocks: [
        {
          type: 'ul',
          items: [
            'Menos burocracia contabilística no dia a dia',
            'Coeficientes aplicados à facturação por categoria de rendimento',
            'Limite de volume de negócios para elegibilidade',
            'Ponto de partida da maioria dos freelancers',
          ],
        },
      ],
    }),
    ...articleSection({
      h2: 'Contabilidade organizada em detalhe',
      id: 'organizada',
      paragraphs: [
        'Na contabilidade organizada, o imposto incide sobre o lucro real: rendimentos da actividade menos despesas necessárias e devidamente documentadas. O contador mantém livros, mapas e demonstrações financeiras.',
        'É obrigatória quando ultrapassa o limite de volume de negócios do regime simplificado ou em certas formas jurídicas (ex.: sociedades). Também pode ser escolhida voluntariamente se as despesas reais superam largamente os coeficientes.',
      ],
      blocks: [
        {
          type: 'ul',
          items: [
            'Contabilista certificado (OCC) obrigatório',
            'Despesas reais com factura e justificação',
            'Mais trabalho de registo, maior precisão fiscal',
            'Melhor enquadramento para PME em crescimento',
          ],
        },
      ],
    }),
    ...articleSection({
      h2: 'Quando mudar de regime',
      id: 'mudar',
      paragraphs: [
        'Mudanças de regime têm prazos e regras de transição. Situações típicas que motivam mudança para organizada:',
      ],
      blocks: [
        {
          type: 'ol',
          items: [
            'Ultrapassou o limite de volume de negócios do regime simplificado',
            'Despesas reais consistentemente superiores aos coeficientes — simulação mostra IRS mais baixo na organizada',
            'Abertura de sociedade (Lda, Unipessoal) — organizada é o caminho',
            'Necessidade de demonstrações financeiras para crédito bancário ou investidores',
          ],
        },
      ],
    }),
    ...articleSection({
      h2: 'Perguntas para fazer ao contador',
      id: 'perguntas',
      blocks: [
        {
          type: 'ul',
          items: [
            'Com a minha facturação e despesas projectadas, qual regime minimiza IRS legalmente?',
            'Estou perto do limite de volume de negócios?',
            'Quanto custa a contabilidade organizada vs apoio pontual no simplificado?',
            'Que despesas devo passar a facturar com NIF da actividade?',
          ],
        },
      ],
    }),
    ...articleSection({
      h2: 'Exemplo numérico ilustrativo (regime simplificado)',
      id: 'exemplo',
      paragraphs: [
        'Cenário: consultor com 40.000 € de facturação anual, coeficiente que presume 25 % de despesas (valores ilustrativos — coeficientes reais variam por CAE).',
        'Base tributável aproximada: 40.000 × (1 − 0,25) = 30.000 € (simplificando). Na contabilidade organizada, se despesas reais forem 18.000 €, a base seria 22.000 € — potencialmente menos IRS.',
        'Se despesas reais fossem apenas 5.000 €, o simplificado pode ser mais favorável que declarar custos reais baixos na organizada. Simule sempre com OCC.',
      ],
    }),
    ...affiliateSection({
      heading: 'Aprofundar antes de decidir',
      headingId: 'aprofundar',
      intro:
        'Escolher regime não é só «clicar uma opção no portal». Quem percebe o básico fala com o contador em igual — e evita mudanças caras por engano.',
      items: [
        {
          key: 'amazonLivroGestaoContabil',
          leadIn:
            'Para quem quer ir além dos artigos curtos, este livro em português explica conceitos de gestão contabilística.',
          title: 'Gestão Contábil — Para Contadores e Não Contadores (Amazon)',
          description:
            'Obra de referência para fundamentos de contabilidade de gestão. Complementa a conversa com o OCC.',
        },
        {
          key: 'hotmartIrsReciboVerde',
          leadIn:
            'Se ainda está no regime simplificado com recibos verdes, este guia foca IRS e obrigações do dia a dia.',
          title: 'IRS & Recibo Verde — guia prático (Hotmart)',
          description: 'Ebook focado em independentes em Portugal.',
        },
      ],
    }),
    ...internalLinksSection({
      title: 'Ler também',
      slugs: [
        'irs-recibos-verdes-erros-comuns',
        'declaracao-irs-guia-pratico',
        'deducoes-irs-portugal-guia-completo',
      ],
    }),
    legalCallout('A escolha de regime tem impacto fiscal relevante — simule com contador antes de decidir.'),
  ],
}
