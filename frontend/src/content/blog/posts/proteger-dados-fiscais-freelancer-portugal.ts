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

export const postProtegerDados: BlogPost = {
  slug: 'proteger-dados-fiscais-freelancer-portugal',
  title: 'Como proteger dados fiscais e o portátil do freelancer',
  excerpt:
    'Backup de recibos, antivírus, gestor de passwords, RGPD e cuidados com Wi‑Fi público — guia completo de segurança digital para independentes em Portugal.',
  publishedAt: '2026-05-29',
  updatedAt: '2026-06-17',
  author: 'Liliana Nunes',
  authorRole: 'Revisão editorial TegLion · Guias de fiscalidade portuguesa',
  category: 'Organização',
  audience: ['independente', 'escritorio'],
  featured: false,
  tags: ['segurança digital', 'backup', 'freelancer', 'Microsoft 365', 'antivírus', 'RGPD', 'phishing'],
  readMinutes: 8,
  coverImage: {
    src: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&h=630&fit=crop&q=80',
    alt: 'Portátil com candado digital — proteção de dados',
    width: 1200,
    height: 630,
  },
  seo: {
    title: 'Proteger dados fiscais como freelancer em Portugal | Blog TegLion',
    description:
      'Backup OneDrive, antivírus, 2FA, phishing da AT e boas práticas RGPD para quem guarda recibos verdes, IRS e documentos de clientes no portátil.',
    keywords: [
      'proteger dados fiscais',
      'backup recibos verdes',
      'antivírus freelancer',
      'Microsoft 365 OneDrive',
      'segurança digital PME',
      'phishing Finanças',
    ],
  },
  relatedSlugs: [
    'organizar-documentos-fiscais-arquivo-digital',
    'portal-financas-guia-completo-iniciantes',
    'freelancer-estrangeiro-portugal',
    'escolher-software-faturacao-portugal',
  ],
  blocks: [
    legalCallout(),
    keyTakeaways([
      'O portátil pessoal é o arquivo fiscal — trate-o como servidor de empresa.',
      'Regra 3-2-1: três cópias, dois suportes, uma na nuvem.',
      'A AT nunca pede password por email — phishing é o ataque nº 1.',
      'Use gestor de passwords e 2FA no portal e no email.',
      'Dados de clientes (NIF, contratos) estão sujeitos a RGPD — minimize e proteja.',
    ]),
    ...proseParagraphs(
      'Trabalhadores independentes concentram no portátil o que uma PME guarda em servidor: recibos verdes, PDFs de IRS, NIF de clientes, extractos bancários. Um ransomware ou um email falso do «Portal das Finanças» pode custar mais do que meses de contabilidade — e não há departamento de IT para resolver.',
      'Este guia cobre riscos reais, backup, software e hábitos diários. Complementa o artigo sobre organização de documentos fiscais — segurança sem arquivo organizado ainda deixa lacunas.',
    ),
    {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=960&h=540&fit=crop&q=80',
      alt: 'Freelancer a trabalhar no portátil em casa',
      caption: 'O portátil pessoal é, na prática, o arquivo fiscal da actividade.',
    },
    ...articleSection({
      h2: 'Riscos reais (não são só «para empresas grandes»)',
      id: 'riscos',
      blocks: [
        {
          type: 'ul',
          items: [
            'Phishing com link falso à AT ou à Segurança Social',
            'Portátil roubado ou disco avariado sem backup',
            'Wi‑Fi de café/coworking sem VPN',
            'Reutilizar a mesma password em e-Fatura, email e banco',
            'Anexos infectados de clientes («segue factura em anexo»)',
            'Partilhar ecrã em videochamada com documentos fiscais abertos',
          ],
        },
      ],
    }),
    {
      type: 'callout',
      variant: 'warning',
      title: 'Regra de ouro',
      text: 'Nunca abra anexos de remetentes desconhecidos. A AT e a SS não pedem passwords por email. Confirme sempre digitando portaldasfinancas.gov.pt no browser.',
    },
    sectionDivider(),
    comparisonTable({
      caption: 'Checklist de segurança mínima — freelancer',
      headers: ['Medida', 'Prioridade', 'Custo típico'],
      rows: [
        ['Backup automático (nuvem)', 'Alta', '0–7 €/mês'],
        ['Gestor de passwords', 'Alta', '0–3 €/mês'],
        ['2FA no email e portal AT', 'Alta', 'Gratuito'],
        ['Antivírus actualizado', 'Média', '0–40 €/ano'],
        ['VPN em redes públicas', 'Média', 'Incluído em pacotes'],
        ['Encriptação disco (BitLocker/FileVault)', 'Média', 'Gratuito no SO'],
        ['Triturar papel com NIF', 'Baixa', '30–80 € uma vez'],
      ],
    }),
    ...articleSection({
      h2: 'Backup: a terceira cópia dos PDFs fiscais',
      id: 'backup',
      paragraphs: [
        'Pen drive offline + cloud automática = tranquilidade. Se o portátil morre na véspera do IRS, ainda tem os recibos acessíveis.',
        'Configure uma pasta «Fiscal/2026» com sincronização OneDrive ou Google Drive. Teste restauro uma vez por ano — backup que nunca testou pode falhar quando precisa.',
      ],
    }),
    ...articleSection({
      h2: 'RGPD e dados de clientes',
      id: 'rgpd',
      paragraphs: [
        'Mesmo como ENI, trata NIF, moradas e contratos de clientes — são dados pessoais. Guarde só o necessário, com acesso protegido, e não envie documentos sensíveis por WhatsApp sem encriptação.',
        'Se trabalha com dados de saúde, menores ou listas de contactos em massa, as obrigações agravam-se. Em dúvida, consulte orientação CNPD ou advogado.',
      ],
    }),
    ...articleSection({
      h2: 'Excel, Word e folhas de despesas',
      id: 'office',
      paragraphs: [
        'Muitos contadores pedem mapas em Excel; freelancers trackam despesas mensais antes do software certificado. Office actualizado evita ficheiros corruptos na altura de entregar SAF-T.',
        'Separe ficheiros «Actividade» de «Pessoal» — misturar na mesma pasta Desktop aumenta risco de enviar documento errado ao cliente.',
      ],
    }),
    ...articleSection({
      h2: 'Antivírus e VPN: higiene digital',
      id: 'antivirus',
      paragraphs: [
        'Windows Defender ou macOS built-in ajudam, mas quem vive de dados de clientes beneficia de camadas extra — especialmente no mesmo portátil para pessoal e actividade.',
        'VPN em coworkings e hotéis protege tráfego quando acede ao portal das Finanças. Gestor de passwords evita reutilizar a senha do banco no e-Fatura.',
      ],
    }),
    ...affiliateSection({
      heading: 'O kit mínimo que realmente importa',
      headingId: 'kit-digital',
      intro:
        'Não precisa de um arsenal. A maioria dos incidentes com freelancers resume-se a dois falhas: recibos só no disco local e portátil sem protecção actualizada quando chega um email falso da AT. Backup na nuvem e antivírus multi-dispositivo cobrem esse núcleo.',
      items: [
        {
          key: 'amazonM365Pessoal',
          leadIn:
            'A regra 3-2-1 começa com uma cópia fora do portátil. Office com 1 TB OneDrive permite uma pasta «Fiscal» sincronizada — Word e Excel para mapas, Outlook para o email onde chegam notificações e facturas.',
          title: 'Microsoft 365 Pessoal — 12 meses (Amazon)',
          description: 'Office e nuvem para o arquivo fiscal do dia-a-dia.',
        },
        {
          key: 'amazonBitdefender',
          leadIn:
            'O mesmo login serve para Finanças, email e banca. Protecção no portátil, telemóvel e tablet reduz o impacto de phishing e malware — o ponto fraco mais comum em independentes que trabalham em Wi‑Fi público.',
          title: 'Bitdefender Total Security — 10 dispositivos / 2 anos (Amazon)',
          description: 'antivírus premium para o equipamento onde guarda NIF e recibos.',
        },
      ],
    }),
    { type: 'link', label: 'Organizar documentos fiscais', slug: 'organizar-documentos-fiscais-arquivo-digital' },
    { type: 'link', label: 'Portal das Finanças para iniciantes', slug: 'portal-financas-guia-completo-iniciantes' },
    ...internalLinksSection({
      title: 'Ler também',
      slugs: [
        'organizar-documentos-fiscais-arquivo-digital',
        'portal-financas-guia-completo-iniciantes',
        'freelancer-estrangeiro-portugal',
      ],
    }),
    legalCallout('Segurança digital não substitui boas práticas de arquivo e contador certificado.'),
  ],
}
