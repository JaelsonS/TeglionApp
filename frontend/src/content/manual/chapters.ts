import type { ManualChapter } from './types'

/**
 * Manual do utilizador Teglion — voz da Maya (1.ª pessoa).
 * Conteúdo estático tipado: sem HTML, sem markdown executável.
 */
export const MANUAL_CHAPTERS: ManualChapter[] = [
  {
    slug: 'primeiros-passos',
    number: 1,
    title: 'Primeiros passos',
    subtitle: 'Conta, MFA e o seu primeiro dia no Teglion',
    audience: 'firm',
    status: 'available',
    seoDescription: 'Maya explica como criar a conta do gabinete, activar MFA e começar no painel Teglion.',
    blocks: [
      {
        type: 'maya',
        text: 'Olá — sou a Maya. Este manual é a minha forma de acompanhar o gabinete e quem ainda está a descobrir o Teglion. Vou falar-lhe como se estivéssemos lado a lado no ecrã.',
      },
      {
        type: 'p',
        text: 'O Teglion é a plataforma de gestão para gabinetes de contabilidade em Portugal: clientes, documentos, prazos, portal, página pública e operação do dia. Não substitui o software de contabilidade clássico — organiza a relação com o cliente e o trabalho da equipa.',
      },
      { type: 'h2', text: 'Criar a conta do gabinete' },
      {
        type: 'ol',
        items: [
          'Abra o registo do gabinete e use o e-mail profissional.',
          'Confirme o e-mail quando o pedido chegar.',
          'Active a autenticação em dois factores (MFA) — é obrigatório para proteger a carteira.',
          'Entre no Painel e siga a «Configuração rápida» se aparecer.',
        ],
      },
      {
        type: 'callout',
        variant: 'security',
        title: 'Segurança em primeiro lugar',
        text: 'Nunca partilhe códigos MFA, passwords ou links de convite. O Teglion não pede passwords por e-mail ou WhatsApp. Se algo parecer estranho, feche a sessão e contacte o suporte oficial.',
      },
      {
        type: 'appLink',
        label: 'Criar conta do gabinete (14 dias)',
        href: '/auth/firm/register',
      },
      {
        type: 'appLink',
        label: 'Entrar no gabinete',
        href: '/auth/firm/login',
      },
    ],
  },
  {
    slug: 'planos-e-faturacao',
    number: 2,
    title: 'Planos e faturação (SaaS)',
    subtitle: 'O plano do gabinete vs. pagamentos dos clientes',
    audience: 'firm',
    status: 'available',
    seoDescription: 'Diferença entre o plano Teglion (SaaS) e Stripe Connect para cobrar clientes.',
    blocks: [
      {
        type: 'maya',
        text: 'Há três dinheiros no Teglion — e eu quero que nunca os misture.',
      },
      {
        type: 'ul',
        items: [
          'Plano Teglion (SaaS): o gabinete paga à AfDigital pelo software.',
          'Avenças dos clientes: registo manual no mapa de Pagamentos — funciona sem Stripe.',
          'Stripe Connect (opcional): cobranças online; o principal vai para a conta do gabinete e o Teglion retém só a taxa de serviço.',
        ],
      },
      {
        type: 'callout',
        variant: 'warning',
        title: 'Honestidade',
        text: 'A taxa Teglion Connect não é a mesma coisa que as taxas Stripe. Sem Connect, continua a marcar transferências e MB Way à mão.',
      },
      { type: 'appLink', label: 'Ver preços', href: '/pricing' },
      { type: 'appLink', label: 'Plano na app', href: '/app/firm/billing' },
    ],
  },
  {
    slug: 'gerir-clientes',
    number: 3,
    title: 'Gerir clientes',
    subtitle: 'Carteira, hub e importação CSV',
    audience: 'firm',
    status: 'available',
    seoDescription: 'Como a Maya orienta a gestão de clientes no Teglion: hub, CSV e isolamento por gabinete.',
    blocks: [
      {
        type: 'maya',
        text: 'Cada gabinete só vê os seus clientes. Eu nunca misturo dados entre firmas — o isolamento por gabinete é uma regra de ouro do Teglion.',
      },
      {
        type: 'p',
        text: 'Na lista de Clientes cria, pesquisa e abre o hub de cada um: documentos, faturação, acessos oficiais e o que a equipa precisa no dia a dia.',
      },
      {
        type: 'ul',
        items: [
          'Importe em CSV quando trouxer uma carteira grande (use o modelo oficial).',
          'Não cole passwords de AT/SS no CSV sem necessidade — o cofre existe para credenciais sensíveis.',
          'Convide o cliente ao portal só quando estiver pronto a entregar documentos.',
        ],
      },
      { type: 'appLink', label: 'Abrir Clientes', href: '/app/firm/clients' },
    ],
  },
  {
    slug: 'documentos',
    number: 4,
    title: 'Documentos',
    subtitle: 'Pedidos, ficheiros e o portal do cliente',
    audience: 'both',
    status: 'available',
    seoDescription: 'Fluxo de documentos no Teglion entre gabinete e portal do cliente.',
    blocks: [
      {
        type: 'maya',
        text: 'Documentos são o coração do gabinete digital. Eu ajudo a pedir, receber e validar — sem viver de PDFs no WhatsApp.',
      },
      {
        type: 'p',
        text: 'Do lado do gabinete: pedidos formais, ficheiros e histórico. Do lado do cliente: o portal mostra o que falta e permite enviar com sessão autenticada.',
      },
      {
        type: 'callout',
        variant: 'security',
        title: 'Uploads seguros',
        text: 'Os ficheiros passam por validação de tipo e conteúdo. Não aceite atalhos de «envie-me por e-mail a senha do Portal das Finanças» — use o cofre e o portal.',
      },
      { type: 'appLink', label: 'Documentos do gabinete', href: '/app/firm/documents' },
      { type: 'appLink', label: 'Portal do cliente', href: '/auth/client/login' },
    ],
  },
  {
    slug: 'obrigacoes-fiscais',
    number: 5,
    title: 'Obrigações fiscais',
    subtitle: 'Calendário, tarefas e a vista mês fiscal N/M',
    audience: 'firm',
    status: 'available',
    seoDescription: 'Calendário fiscal e matriz mês N/M no Teglion, com limites honestos face à AT.',
    blocks: [
      {
        type: 'maya',
        text: 'Eu mostro prazos e progresso — mas não invento obrigações da AT. O calendário ajuda; a responsabilidade final continua a ser do gabinete e das fontes oficiais.',
      },
      {
        type: 'p',
        text: 'Use Obrigações dos clientes e a vista «Mês fiscal» para ver tratados/total por tipo. Marque o que já ficou tratado a partir da lista.',
      },
      {
        type: 'callout',
        variant: 'info',
        title: 'Simulação ≠ declaração',
        text: 'Em Calculadoras encontra IVA, IRS, SS, retenção, IMT e IRC — simulações de apoio. Não substituem software certificado nem o envio oficial.',
      },
      { type: 'appLink', label: 'Calendário fiscal', href: '/app/firm/fiscal-calendar' },
      { type: 'appLink', label: 'Tarefas / obrigações', href: '/app/firm/tasks' },
    ],
  },
  {
    slug: 'pagamentos-e-avencas',
    number: 6,
    title: 'Pagamentos e avenças',
    subtitle: 'Mapa anual, estados e Connect opcional',
    audience: 'firm',
    status: 'available',
    seoDescription: 'Mapa de avenças no Teglion: gerar pagamentos, estados e Stripe Connect opcional.',
    blocks: [
      {
        type: 'maya',
        text: 'Configure a mensalidade na ficha do cliente (Faturação), gere o mês no mapa e marque rascunho → confirmada → enviada → paga. Sem Connect, funciona a 100%.',
      },
      {
        type: 'ol',
        items: [
          'Defina avença activa e dia de vencimento (1–28).',
          'Em Pagamentos, escolha o ano e use «Gerar pagamentos».',
          'Clique numa célula para editar valor, método ou estado.',
          'Se quiser cobrança online, active Connect em Definições — nunca é obrigatório.',
        ],
      },
      { type: 'appLink', label: 'Abrir Pagamentos', href: '/app/firm/payments' },
    ],
  },
  {
    slug: 'tarefas',
    number: 7,
    title: 'Tarefas',
    subtitle: 'Gestor de operações do gabinete',
    audience: 'firm',
    status: 'available',
    seoDescription: 'Gestor de tarefas e operações no Teglion.',
    blocks: [
      {
        type: 'maya',
        text: 'As tarefas organizam o trabalho da equipa: o que está em curso, o que está atrasado e o que depende do cliente.',
      },
      {
        type: 'p',
        text: 'Use filtros com parcimónia — uma vista clara vale mais do que dez dashboards. Atribua responsáveis e feche o ciclo no mesmo sítio.',
      },
      { type: 'appLink', label: 'Abrir Tarefas', href: '/app/firm/tasks' },
    ],
  },
  {
    slug: 'controlo-de-caixa',
    number: 8,
    title: 'Controlo de caixa',
    subtitle: 'O que existe hoje e o que vem depois',
    audience: 'firm',
    status: 'planned',
    seoDescription: 'Estado honesto do controlo de caixa no Teglion.',
    blocks: [
      {
        type: 'maya',
        text: 'Ainda não há um módulo completo de caixa estilo ERP. O que já ajuda: mapa de avenças, estados de pagamento e Connect opcional.',
      },
      {
        type: 'callout',
        variant: 'info',
        title: 'Transparência',
        text: 'Quando existirem mais ferramentas de caixa, aparecem neste manual — sem prometer o que ainda não está no produto.',
      },
      { type: 'appLink', label: 'Pagamentos (avenças)', href: '/app/firm/payments' },
    ],
  },
  {
    slug: 'alertas',
    number: 9,
    title: 'Alertas',
    subtitle: 'Central de avisos ao cliente',
    audience: 'firm',
    status: 'available',
    seoDescription: 'Central de alertas e broadcasts no Teglion.',
    blocks: [
      {
        type: 'maya',
        text: 'Use a Central de Alertas para comunicar com a carteira de forma controlada — melhor do que mensagens soltas.',
      },
      {
        type: 'p',
        text: 'Escreva com clareza, evite dados sensíveis desnecessários e confirme sempre o destinatário certo.',
      },
      { type: 'appLink', label: 'Central de Alertas', href: '/app/firm/alerts' },
    ],
  },
  {
    slug: 'modelos-e-assinaturas',
    number: 10,
    title: 'Modelos e assinaturas',
    subtitle: 'Orçamentos e o que ainda é futuro',
    audience: 'firm',
    status: 'partial',
    seoDescription: 'Modelos no Teglion e limites actuais de assinatura digital.',
    blocks: [
      {
        type: 'maya',
        text: 'Há apoio a documentos e orçamentos no fluxo do gabinete. Assinatura electrónica avançada como produto completo ainda não é a promessa desta versão.',
      },
      {
        type: 'callout',
        variant: 'warning',
        title: 'Não inventamos certificação',
        text: 'Não use o Teglion como se fosse software de faturação certificado AT. Quando houver caminho oficial, estará documentado com honestidade.',
      },
    ],
  },
  {
    slug: 'cofre-de-credenciais',
    number: 11,
    title: 'Cofre de credenciais',
    subtitle: 'Acessos oficiais com cuidado',
    audience: 'firm',
    status: 'available',
    seoDescription: 'Cofre de acessos oficiais no Teglion e boas práticas de segurança.',
    blocks: [
      {
        type: 'maya',
        text: 'O cofre existe para credenciais oficiais (AT, SS, etc.) com controlo do gabinete. Trate-o como zona sensível.',
      },
      {
        type: 'callout',
        variant: 'security',
        title: 'Boas práticas',
        text: 'Menos pessoas com acesso, MFA activo, sem partilhar ecrãs com passwords visíveis, e revisão periódica de quem ainda precisa de ver cada acesso.',
      },
    ],
  },
  {
    slug: 'open-banking',
    number: 12,
    title: 'Open Banking',
    subtitle: 'Fora do âmbito actual',
    audience: 'firm',
    status: 'planned',
    seoDescription: 'Open Banking não está disponível no Teglion nesta versão.',
    blocks: [
      {
        type: 'maya',
        text: 'Open Banking (PSD2) não está no Teglion nesta fase. Se aparecer no futuro, será com decisão jurídica e segurança próprias — não como atalho de marketing.',
      },
    ],
  },
  {
    slug: 'assistente-maya',
    number: 13,
    title: 'Assistente (Maya)',
    subtitle: 'O que eu faço — e o que não faço',
    audience: 'both',
    status: 'available',
    seoDescription: 'Limites da Maya no Teglion: guia do produto, sem inventar regras fiscais.',
    blocks: [
      {
        type: 'maya',
        text: 'Eu sou a Maya: guio no produto, explico ecrãs e aponto o próximo passo. Não sou contabilista automática nem substituo a AT.',
      },
      {
        type: 'ul',
        items: [
          'No site público ajudo quem ainda não é cliente a perceber o Teglion e a começar o trial.',
          'No gabinete explico módulos, MFA, portal e configuração.',
          'No portal do cliente ajudo a encontrar documentos e pedidos.',
          'A Maya Setup (IA opcional) só gera rascunhos de página/serviços com consentimento — nunca inventa declarações fiscais.',
        ],
      },
      {
        type: 'callout',
        variant: 'security',
        title: 'Privacidade',
        text: 'A Maya de ajuda estática não lê a sua carteira de clientes. Se usar funções de IA de setup, o conteúdo segue as regras de consentimento e isolamento do gabinete.',
      },
      { type: 'appLink', label: 'Falar com suporte humano', href: '/suporte' },
    ],
  },
  {
    slug: 'atas',
    number: 14,
    title: 'Atas',
    subtitle: 'Ainda não no produto',
    audience: 'firm',
    status: 'planned',
    seoDescription: 'Módulo de atas ainda não disponível no Teglion.',
    blocks: [
      {
        type: 'maya',
        text: 'Ainda não há módulo de atas de reunião no Teglion. Enquanto isso, use documentos e tarefas para o que precisa de ficar registado.',
      },
    ],
  },
  {
    slug: 'equipa',
    number: 15,
    title: 'Equipa',
    subtitle: 'Convites, papéis e permissões',
    audience: 'firm',
    status: 'available',
    seoDescription: 'Gestão de equipa e RBAC no Teglion.',
    blocks: [
      {
        type: 'maya',
        text: 'Há o responsável do gabinete (FIRM_OWNER) e a equipa (FIRM_STAFF) com permissões. Não inventamos papéis que não existem.',
      },
      {
        type: 'p',
        text: 'Convide colegas pelo fluxo oficial. Revogue acessos quando alguém sair. Menos privilégios = menos risco.',
      },
      { type: 'appLink', label: 'Definições', href: '/app/firm/settings' },
    ],
  },
  {
    slug: 'relatorios',
    number: 16,
    title: 'Relatórios',
    subtitle: 'O que já mede e o que vem a seguir',
    audience: 'firm',
    status: 'partial',
    seoDescription: 'Estado dos relatórios no Teglion.',
    blocks: [
      {
        type: 'maya',
        text: 'Já tem saldos e mapas (avenças, mês fiscal, SAF-T leitura). Relatórios avançados de BI ainda evoluem — prefiro mostrar o que já é útil do que inventar dashboards vazios.',
      },
      { type: 'appLink', label: 'Pagamentos', href: '/app/firm/payments' },
      { type: 'appLink', label: 'SAF-T (leitura)', href: '/app/firm/saft' },
    ],
  },
  {
    slug: 'definicoes-e-integracoes',
    number: 17,
    title: 'Definições e integrações',
    subtitle: 'Identidade, Google, Connect e página pública',
    audience: 'firm',
    status: 'available',
    seoDescription: 'Definições do gabinete no Teglion: identidade, Google e Connect.',
    blocks: [
      {
        type: 'maya',
        text: 'Em Definições configura identidade, página pública, agenda, pagamentos online e a equipa. Ligue Google só se precisar — e desligue o que não usa.',
      },
      {
        type: 'callout',
        variant: 'security',
        title: 'Integrações',
        text: 'OAuth e Connect pedem confirmação consciente. Não autorize apps de terceiros fora dos fluxos oficiais do Teglion.',
      },
      { type: 'appLink', label: 'Abrir Definições', href: '/app/firm/settings' },
    ],
  },
  {
    slug: 'faq',
    number: 18,
    title: 'FAQ',
    subtitle: 'Perguntas que me fazem todos os dias',
    audience: 'both',
    status: 'available',
    seoDescription: 'Perguntas frequentes do Teglion respondidas pela Maya.',
    blocks: [
      {
        type: 'maya',
        text: 'Reuni as dúvidas mais comuns. Se a sua não estiver aqui, fale com uma pessoa em Suporte — eu não finjo respostas inventadas.',
      },
      { type: 'h2', text: 'O Teglion substitui o TOConline / Sage?' },
      {
        type: 'p',
        text: 'Não. Organiza clientes, documentos, prazos, portal e operação. O fecho contabilístico continua no software que já usa.',
      },
      { type: 'h2', text: 'Os recibos de renda são oficiais AT?' },
      {
        type: 'p',
        text: 'Não. Em Imóveis e rendas o registo é interno para o gabinete acompanhar — sem comunicação à AT.',
      },
      { type: 'h2', text: 'O SAF-T é enviado à AT?' },
      {
        type: 'p',
        text: 'Não. A leitura de SAF-T extrai totais e cabeçalho para o gabinete. Sem envio automático.',
      },
      { type: 'h2', text: 'Como falo com uma pessoa?' },
      {
        type: 'p',
        text: 'Use /suporte ou os canais oficiais (WhatsApp, e-mail, telefone) publicados pela AfDigital — Soluções Tecnológicas.',
      },
      {
        type: 'callout',
        variant: 'security',
        title: 'Phishing',
        text: 'Desconfie de mensagens que peçam códigos MFA, passwords ou transferência urgente «para não perder a conta». O Teglion não faz isso.',
      },
      { type: 'appLink', label: 'Central de suporte', href: '/suporte' },
      { type: 'appLink', label: 'Imóveis e rendas', href: '/app/firm/rentals' },
      { type: 'appLink', label: 'SAF-T leitura', href: '/app/firm/saft' },
    ],
  },
]

export const MANUAL_BY_SLUG = Object.fromEntries(
  MANUAL_CHAPTERS.map((c) => [c.slug, c]),
) as Record<string, ManualChapter>

export function listManualChapters() {
  return MANUAL_CHAPTERS.map(({ slug, number, title, subtitle, audience, status }) => ({
    slug,
    number,
    title,
    subtitle,
    audience,
    status,
  }))
}

export function getManualChapter(slug: string) {
  return MANUAL_BY_SLUG[slug] || null
}
