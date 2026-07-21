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

export const postQuantoCustaAbrir: BlogPost = {
  slug: 'quanto-custa-abrir-actividade-portugal',
  title: 'Quanto custa abrir actividade em Portugal? Custos reais para freelancers',
  excerpt:
    'Início de actividade, Segurança Social, software, contador e IVA — quanto reservar no primeiro ano como independente, com tabela de custos típicos.',
  publishedAt: '2026-05-26',
  updatedAt: '2026-06-17',
  author: 'Jaelson Santos',
  authorRole: 'Fundador do TegLion · Dev de software · Contabilidade (BR) → fiscalidade PT',
  category: 'Actividade',
  audience: ['independente', 'pme'],
  featured: false,
  tags: ['custos', 'abrir actividade', 'freelancer', 'ENI', 'orçamento'],
  readMinutes: 8,
  coverImage: {
    src: '/blog/covers/independente.svg',
    alt: 'Custos de abrir actividade em Portugal',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Quanto custa abrir actividade em Portugal? | Blog TegLion',
    description:
      'Custos típicos para abrir actividade como freelancer ou ENI: Finanças, SS, facturação e contabilidade. Estimativas informativas para planear o primeiro ano.',
    keywords: ['custo abrir actividade', 'quanto custa recibos verdes', 'freelancer Portugal custos', 'ENI custos', 'orçamento independente'],
  },
  relatedSlugs: [
    'abrir-empresa-individual-eni',
    'seguranca-social-trabalhador-independente',
    'escolher-software-faturacao-portugal',
    'guia-completo-trabalhador-independente-portugal-2026',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'Abrir actividade no Portal das Finanças é gratuito — o custo está nas obrigações mensais e anuais.',
      'Segurança Social: contribuição mensal obrigatória (valor variável conforme fase e rendimentos).',
      'Contador: 40–150 €/mês é faixa comum para independentes com volume moderado.',
      'Software de facturação: 0–35 €/mês; gratuito possível só em cenários limitados.',
      'Reserve fundo de maneio para 3 meses de SS + contador antes de depender só da facturação.',
    ]),
    ...proseParagraphs(
      '«Quanto vou gastar para trabalhar legalmente?» É uma das primeiras perguntas — e a resposta depende do regime, do volume de facturação, se contrata contador desde o início e se fica isento ou sujeito a IVA.',
      'Este artigo organiza custos em categorias com faixas realistas para Portugal em 2026. Não substitui orçamento personalizado — use-o para planear o primeiro trimestre e negociar honorários com o contador com números na mão.',
    ),
    ...articleSection({
      h2: 'Início de actividade: o que é gratuito',
      id: 'inicio',
      paragraphs: [
        'O registo de início de actividade no Portal das Finanças não implica taxa elevada de abertura. Também não precisa de advogado só para «abrir recibos verdes» — precisa de escolher bem o CAE, o regime de IVA e o regime de contabilidade, porque mudar depois custa tempo e dinheiro.',
        'Custos que surgem logo a seguir: primeira contribuição à Segurança Social, eventual software, primeira consulta com contador e equipamento mínimo (computador, arquivo, seguro se a actividade exigir).',
      ],
    }),
    sectionDivider(),
    comparisonTable({
      caption: 'Custos típicos no primeiro ano — faixas indicativas (€)',
      headers: ['Item', 'Frequência', 'Faixa típica', 'Notas'],
      rows: [
        ['Abertura actividade (AT)', 'Uma vez', '0', 'Gratuito online'],
        ['Segurança Social', 'Mensal', '20–300+', 'Depende fase e rendimentos declarados'],
        ['Contador / OCC', 'Mensal', '40–150', 'Pacotes para independentes'],
        ['Software facturação', 'Mensal', '0–35', 'Certificado se sujeito IVA'],
        ['Seguro RC profissional', 'Anual', '100–400+', 'Conforme sector'],
        ['IRS', 'Anual', 'Variável', 'A pagar, neutro ou reembolso'],
        ['IVA', 'Mensal/trim.', 'Variável', 'Só se sujeito passivo'],
        ['Formação fiscal', 'Opcional', '20–80', 'Ebooks, cursos'],
      ],
    }),
    ...articleSection({
      h2: 'Segurança Social: o custo fixo que mais surpreende',
      id: 'ss',
      paragraphs: [
        'No primeiro período de actividade, a contribuição pode basear-se num valor contributivo mínimo ou fixo — mesmo que ainda não facture muito. Ao longo do ano, ajusta-se com base nos rendimentos declarados.',
        'Não pagar SS gera dívidas com juros e bloqueios. Active débito directo ou alerta no telemóvel para o dia 20 de cada mês.',
      ],
    }),
    ...articleSection({
      h2: 'Contador: quando compensa desde o dia 1',
      id: 'contador',
      paragraphs: [
        'Legalmente pode abrir sozinho; pragmaticamente, um contador evita CAE errado, regime de IVA inadequado e erros no primeiro IRS. O custo mensal é frequentemente recuperado em deduções e multas evitadas.',
        'Peça proposta por escrito: o que inclui (IVA, SS, IRS, número de recibos/mês). Compare 2–3 escritórios antes de decidir.',
      ],
    }),
    ...articleSection({
      h2: 'Orçamento exemplo: freelancer de serviços (primeiro ano)',
      id: 'exemplo',
      paragraphs: [
        'Cenário ilustrativo: designer freelance, isento de IVA, regime simplificado, ~2.000 €/mês de facturação a partir do 3.º mês, contador a 80 €/mês, software gratuito via portal.',
        'Meses 1–2 (rampa): SS ~60 € + contador 80 € = ~140 €/mês sem facturação ainda. Meses com facturação: SS sobe, IRS provisiona 20–25 % do lucro tributável em conta separada.',
        'Fundo de maneio recomendado: 3 × (SS + contador) ≈ 420 € antes de largar emprego ou investir em equipamento caro.',
      ],
    }),
    ...articleSection({
      h2: 'Custos que muitos esquecem',
      id: 'esquecidos',
      blocks: [
        {
          type: 'ul',
          items: [
            'Subscrições profissionais (Adobe, hosting, domínio) — dedutíveis ou custo conforme regime',
            'Deslocações e viagens a clientes',
            'Renovação de certificados digitais ou Chave Móvel',
            'Conta bancária empresarial (alguns bancos cobram pacotes)',
            'Tributação de rendimentos no estrangeiro (dupla conformidade)',
          ],
        },
      ],
    }),
    ...articleSection({
      h2: 'Quando os custos disparam (e como antecipar)',
      id: 'disparar',
      paragraphs: [
        'O orçamento do primeiro trimestre raramente iguala o do segundo ano. Passar de isento a sujeito passivo de IVA acrescenta software certificado, tempo de contador e possivelmente contabilidade organizada. Contratar o primeiro colaborador multiplica obrigações de Segurança Social e processamento salarial.',
        'Antecipe estes gatilhos: quando a facturação se aproxima de 70 % do limite de isenção de IVA, simule com o contador o custo mensal extra. Se planeia crescer de freelancer solo para equipa, reserve 150–300 €/mês adicionais só em contabilidade.',
      ],
    }),
    comparisonTable({
      caption: 'Estrutura jurídica — impacto no custo fixo (indicativo)',
      headers: ['Estrutura', 'Custo administrativo típico', 'Quando faz sentido'],
      rows: [
        ['Trabalhador independente (recibos)', 'Baixo — SS + contador opcional', 'Serviços, volume moderado'],
        ['ENI', 'Semelhante ao independente', 'Quando precisa de nome comercial distinto'],
        ['Sociedade unipessoal (Lda)', 'Médio-alto — contabilidade organizada', 'Risco, sócios futuros, crédito'],
        ['Sociedade com funcionários', 'Alto — salários + SS patronal', 'Equipa fixa, operações maiores'],
      ],
    }),
    ...affiliateSection({
      heading: 'Investir no essencial, não no supérfluo',
      headingId: 'essencial',
      intro:
        'No primeiro mês, o orçamento aperta-se entre SS, contador e ferramentas. Priorize o que evita multas (legalização + arquivo) antes de gadgets.',
      items: [
        {
          key: 'hotmartReciboVerde7Dias',
          leadIn:
            'Em vez de pagar consultoria antes de faturar, muitos começam por um guia que explica custos reais e passos iniciais.',
          title: 'Recibo Verde em 7 Dias (Hotmart)',
          description: 'Checklists e planilhas para planear o primeiro trimestre.',
        },
        {
          key: 'amazonPastaProvaFogo',
          leadIn:
            'A pasta resistente para NIF, contratos e primeiros recibos custa menos que uma hora de contador.',
          title: 'Pasta A4 documentos importantes (Amazon)',
          description: 'Arquivo desde o dia 1 da actividade.',
        },
      ],
    }),
    { type: 'link', label: 'Abrir empresa individual (ENI)', slug: 'abrir-empresa-individual-eni' },
    { type: 'link', label: 'Guia completo do trabalhador independente 2026', slug: 'guia-completo-trabalhador-independente-portugal-2026' },
    ...internalLinksSection({
      title: 'Guias relacionados',
      slugs: [
        'abrir-empresa-individual-eni',
        'seguranca-social-trabalhador-independente',
        'guia-completo-trabalhador-independente-portugal-2026',
      ],
    }),
    legalCallout('Valores exactos dependem do seu enquadramento — peça simulação a um contador certificado.'),
  ],
}
