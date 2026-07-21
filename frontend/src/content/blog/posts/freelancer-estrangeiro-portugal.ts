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

export const postFreelancerEstrangeiro: BlogPost = {
  slug: 'freelancer-estrangeiro-portugal',
  title: 'Trabalhar como freelancer em Portugal sendo estrangeiro',
  excerpt:
    'NIF, residência fiscal, vistos, abrir actividade, Segurança Social e recibos verdes — guia completo para brasileiros e outros cidadãos em Portugal.',
  publishedAt: '2026-05-22',
  updatedAt: '2026-06-17',
  author: 'Jaelson Santos',
  authorRole: 'Fundador do TegLion · Escreve sobre fiscalidade em Portugal',
  category: 'Actividade',
  audience: ['independente', 'pme'],
  featured: false,
  tags: ['estrangeiro', 'NIF', 'freelancer', 'Portugal', 'recibos verdes', 'imigrante', 'D7', 'Nómada digital'],
  readMinutes: 8,
  coverImage: {
    src: '/blog/covers/independente.svg',
    alt: 'Freelancer estrangeiro em Portugal',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Freelancer estrangeiro em Portugal — NIF e recibos',
    description:
      'Como abrir actividade e emitir recibos verdes em Portugal sendo cidadão estrangeiro. NIF, SS, residência fiscal e obrigações explicadas passo a passo.',
    keywords: ['freelancer estrangeiro Portugal', 'NIF estrangeiro', 'recibos verdes imigrante', 'trabalhar Portugal', 'nómada digital Portugal fiscal'],
  },
  relatedSlugs: [
    'abrir-empresa-individual-eni',
    'guia-completo-trabalhador-independente-portugal-2026',
    'portal-financas-guia-completo-iniciantes',
    'proteger-dados-fiscais-freelancer-portugal',
  ],
  blocks: [
    legalCallout('Regras de vistos e residência não são aconselhamento jurídico — consulte AIMA e advogado de imigração.'),
    keyTakeaways([
      'NIF é obrigatório para abrir actividade e emitir recibos — obtenha-o nas Finanças ou via representante.',
      'Residência fiscal em Portugal (regra dos 183+ dias) implica IRS sobre rendimentos mundiais, com regras de convenção.',
      'Abrir actividade, NISS e conta bancária portuguesa são passos paralelos nos primeiros 30 dias.',
      'Guias em português brasileiro sobre MEI não se aplicam — legislação é portuguesa (AT, SS, e-Fatura).',
      'Contador com experiência em clientes estrangeiros evita erros de enquadramento no primeiro IRS.',
    ]),
    ...proseParagraphs(
      'Portugal recebe cada vez mais profissionais remotos, nómadas digitais e imigrantes que querem prestar serviços legalmente. O caminho passa por obter NIF, regularizar situação de residência, abrir actividade nas Finanças, enquadrar-se na Segurança Social e emitir recibos ou facturas conforme o regime.',
      'Este guia foca obrigações fiscais e contributivas — não substitui aconselhamento sobre vistos, nacionalidade ou contratos de trabalho com empresas no estrangeiro.',
    ),
    ...articleSection({
      h2: 'NIF e residência fiscal',
      id: 'nif',
      paragraphs: [
        'O NIF (Número de Identificação Fiscal) é indispensável. Cidadãos da UE podem solicitar NIF com documento de identificação; cidadãos de países terceiros podem precisar de representante fiscal ou comprovante de morada, conforme regras em vigor.',
        'Residência fiscal: em regra, se permanece 183 ou mais dias no ano civil em Portugal, ou tem habitação disponível que revele intenção de permanência, é residente fiscal português. Isso implica declarar rendimentos mundiais em Portugal, com possível alívio por convenções para evitar dupla tributação.',
        'Não confunda visto de residência com obrigação de abrir actividade — pode ser empregado e freelancer ao mesmo tempo, com regras específicas de cumulação e retenções.',
      ],
    }),
    sectionDivider(),
    comparisonTable({
      caption: 'Passos típicos — ordem sugerida',
      headers: ['Passo', 'Onde', 'Notas'],
      rows: [
        ['1. NIF', 'Portal/Finanças presencial', 'Pode precisar de representante se não residente'],
        ['2. Visto/residência', 'AIMA / consulado', 'Conforme nacionalidade e motivo de estadia'],
        ['3. Início actividade', 'Portal das Finanças', 'CAE, regime IVA, contabilidade'],
        ['4. NISS / SS', 'Segurança Social', 'Trabalhador independente'],
        ['5. Conta bancária PT', 'Banco', 'Receber pagamentos e SS'],
        ['6. Primeiro recibo', 'e-Fatura', 'Ou software certificado se IVA'],
      ],
    }),
    ...articleSection({
      h2: 'Trabalhar para clientes no estrangeiro',
      id: 'clientes-estrangeiro',
      paragraphs: [
        'Presta serviços a clientes fora de Portugal enquanto reside em Portugal? Em regra, os rendimentos são tributáveis em Portugal se a actividade é exercida daqui — mesmo que o pagamento venha em dólares ou euros para conta estrangeira.',
        'Deve emitir recibo verde (ou factura) pelo valor recebido, declarar no IRS português e verificar se há retenção na fonte no país do cliente. Convenções de dupla tributação podem atribuir direito de tributação a um dos estados — contador especializado é recomendado.',
      ],
    }),
    ...articleSection({
      h2: 'Brasileiros e lusófonos: cuidado com guias errados',
      id: 'lusofonos',
      blocks: [
        {
          type: 'callout',
          variant: 'info',
          title: 'Legislação portuguesa, não brasileira',
          text: 'Muitos guias em português brasileiro falam de MEI, CNPJ ou Receita Federal — não se aplicam em Portugal. Procure conteúdo que cite AT, Segurança Social, e-Fatura e IRS Modelo 3.',
        },
      ],
    }),
    ...articleSection({
      h2: 'Regimes especiais (visão geral)',
      id: 'regimes',
      paragraphs: [
        'Portugal teve regimes como o NHR (Residente Não Habitual), com regras que evoluíram. Verifique enquadramento actual com contabilista — não assuma benefícios fiscais por ter visto de nómada digital ou D7.',
        'O visto permite residir; a fiscalidade depende dos factos: dias em Portugal, tipo de rendimentos, país da fonte pagadora.',
      ],
    }),
    ...articleSection({
      h2: 'Wi‑Fi público e dados fiscais',
      id: 'wifi-seguranca',
      paragraphs: [
        'Imigrantes que trabalham de cafés, coworkings ou Airbnb partilham rede com desconhecidos. Aceder ao Portal das Finanças em Wi‑Fi aberto sem VPN expõe NIF e passwords.',
        'Antivírus com VPN, gestor de passwords e 2FA são investimento mínimo nos primeiros meses enquanto regulariza documentos sensíveis.',
      ],
    }),
    { type: 'link', label: 'Guia: proteger dados fiscais no portátil', slug: 'proteger-dados-fiscais-freelancer-portugal' },
    ...affiliateSection({
      heading: 'Primeiros dias com actividade em Portugal',
      headingId: 'escritorio',
      intro:
        'Quem chega de fora costuma tratar NIF, e-Fatura e recibos no mesmo portátil com que trabalha em coworkings e cafés. Dois apoios práticos — um roteiro fiscal em português europeu e protecção mínima em redes públicas — reduzem erros e risco nos primeiros meses.',
      items: [
        {
          key: 'hotmartReciboVerde7Dias',
          leadIn:
            'Guias brasileiros sobre MEI não se aplicam. Um ebook focado em Finanças e recibos verdes em contexto português amarra abertura de actividade e emissão legal sem misturar legislação.',
          title: 'Recibo Verde em 7 Dias (Hotmart)',
          description: 'passo a passo para abrir e emitir em Portugal, em linguagem clara.',
        },
        {
          key: 'amazonPandaDome',
          leadIn:
            'Em Wi‑Fi de café ou coworking, o login das Finanças e o email com dados fiscais ficam expostos. Um pacote com antivírus, VPN e gestor de passwords cobre o mínimo que a maioria dos nómadas digitais adia.',
          title: 'Panda Dome Complete 2026 (Amazon)',
          description: 'protecção compacta para quem trabalha fora de casa.',
        },
      ],
    }),
    { type: 'link', label: 'Abrir empresa individual (ENI)', slug: 'abrir-empresa-individual-eni' },
    ...internalLinksSection({
      title: 'Próximos passos no blog',
      slugs: [
        'abrir-empresa-individual-eni',
        'guia-completo-trabalhador-independente-portugal-2026',
        'portal-financas-guia-completo-iniciantes',
        'seguranca-social-trabalhador-independente',
      ],
    }),
    legalCallout(),
  ],
}
