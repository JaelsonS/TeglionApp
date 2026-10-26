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
    subtitle: 'Carteira, hub, portal e importação CSV',
    audience: 'firm',
    status: 'available',
    seoDescription: 'Como gerir a carteira no Teglion: lista, hub, convite ao portal e CSV.',
    blocks: [
      {
        type: 'maya',
        text: 'A carteira é o ponto de partida de quase tudo: documentos, avenças, portal e hub. Cada gabinete só vê os seus clientes — isso não é um detalhe, é a regra de ouro.',
      },
      { type: 'h2', text: 'Lista de Clientes' },
      {
        type: 'p',
        text: 'Em Clientes vê a carteira em cartões (no telemóvel) ou tabela (no computador). Use os chips Activos / Atenção / Sem portal e a pesquisa por nome ou NIF. Os KPIs no topo também filtram: toque em «sem portal» para ver quem ainda não tem acesso.',
      },
      {
        type: 'ol',
        items: [
          'Crie o cliente (Novo cliente) ou importe CSV com o modelo oficial.',
          'Abra o hub — é a ficha completa da empresa.',
          'Convide ao portal só quando quiser que o cliente envie documentos ou veja pedidos.',
          'Use etiquetas se a equipa organizar a carteira por tipo de trabalho.',
        ],
      },
      { type: 'h2', text: 'Hub do cliente' },
      {
        type: 'p',
        text: 'No hub encontra resumo, perfil, faturação (avenças), acessos oficiais (cofre), documentos, tarefas e mensagens. Mude de secção pelos separadores — o endereço fica com ?section= para poder partilhar o link interno.',
      },
      {
        type: 'callout',
        variant: 'tip',
        title: 'Convite em lote',
        text: 'Na lista, seleccione vários clientes e use «Gerar e enviar convite». No telemóvel a selecção também funciona nos cartões.',
      },
      {
        type: 'callout',
        variant: 'security',
        title: 'CSV e passwords',
        text: 'Não cole passwords de AT/SS no CSV. Credenciais oficiais vão para o cofre, com controlo de quem pode ver.',
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
        text: 'Documentos são o coração do gabinete digital. O objectivo é simples: pedir com rasto, receber no sítio certo, e deixar de viver de PDFs no WhatsApp.',
      },
      { type: 'h2', text: 'Três secções no gabinete' },
      {
        type: 'ul',
        items: [
          'Pedidos — cria um pedido formal para um cliente da carteira; ele vê no portal.',
          'Ficheiros — o que já chegou, por cliente e período.',
          'Histórico — o rasto do que foi pedido e entregue ao longo do tempo.',
        ],
      },
      { type: 'h2', text: 'Do lado do cliente' },
      {
        type: 'p',
        text: 'No portal, o cliente autentica-se, vê o que falta e envia o ficheiro. Isso é diferente de Mensagens (conversa) e diferente dos formulários da página pública (leads).',
      },
      {
        type: 'ol',
        items: [
          'Convide o cliente ao portal (lista de Clientes ou hub).',
          'Crie o pedido em Documentos → Pedidos.',
          'Espere a entrega em Ficheiros.',
          'Use Histórico se precisar de conferir o passado.',
        ],
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
    title: 'Tarefas e operações',
    subtitle: 'Obrigações dos clientes vs trabalho interno',
    audience: 'firm',
    status: 'available',
    seoDescription: 'Como usar Tarefas, Obrigações e o Calendário fiscal no Teglion sem misturar conceitos.',
    blocks: [
      {
        type: 'maya',
        text: 'No Gestor de Operações há três ideias que a equipa mistura com frequência — e eu quero que fiquem claras de uma vez.',
      },
      {
        type: 'ul',
        items: [
          'Obrigações dos clientes: prazos e entregas (IVA, IRS, SS…) ligados à carteira.',
          'Tarefas: trabalho interno da equipa (pedir um documento, rever um processo, follow-up).',
          'Calendário fiscal: prazos nacionais de referência — alimenta o contexto, não substitui a AT.',
        ],
      },
      { type: 'h2', text: 'Fluxo do dia' },
      {
        type: 'ol',
        items: [
          'Comece pelo Resumo ou Obrigações — o que está em atraso na carteira.',
          'Crie tarefas internas só para o que a equipa tem de fazer (não para inventar obrigações fiscais).',
          'Associe cliente e responsável quando já souber.',
          'Feche a tarefa no mesmo sítio; não deixe «fantasmas» no quadro.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        title: 'Agendamentos é outra coisa',
        text: 'Reuniões com clientes ficam em Agendamentos. Tarefas → Calendário é operação interna. Calendário fiscal são prazos AT. Três calendários, três propósitos.',
      },
      { type: 'appLink', label: 'Abrir Tarefas', href: '/app/firm/tasks' },
      { type: 'appLink', label: 'Agendamentos', href: '/app/firm/agenda' },
      { type: 'appLink', label: 'Calendário fiscal', href: '/app/firm/fiscal-calendar' },
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
    subtitle: 'Como me usar para aprender o Teglion de verdade',
    audience: 'both',
    status: 'available',
    seoDescription: 'Maya no Teglion: guia do produto por ecrã, limites honestos, sem inventar regras fiscais.',
    blocks: [
      {
        type: 'maya',
        text: 'Eu sou a Maya. O meu trabalho é ensinar o Teglion com calma: o que é este ecrã, qual o próximo passo, e o que não misturar. Não sou contabilista automática nem substituo a AT.',
      },
      { type: 'h2', text: 'Como me abrir' },
      {
        type: 'ul',
        items: [
          'Botão Maya / «Perguntar à Maya» nos ecrãs do gabinete.',
          'Bolha de ajuda flutuante (pode escondê-la nas preferências).',
          'No site comercial e no portal do cliente também apareço — com temas diferentes.',
        ],
      },
      { type: 'h2', text: 'O que faço bem' },
      {
        type: 'ol',
        items: [
          'Reconheço a página onde está e explico o objectivo.',
          'Mostro temas curtos («Aprenda neste ecrã») e um mapa completo se precisar.',
          'Abro o link certo na app quando pedir.',
          'Aviso limites: o que é interno vs oficial AT, o que é SaaS vs avença do cliente.',
        ],
      },
      { type: 'h2', text: 'O que não faço' },
      {
        type: 'ul',
        items: [
          'Não leio documentos, mensagens nem dados da carteira na ajuda estática.',
          'Não invento prazos fiscais nem «atalhos» à AT.',
          'Não substituo uma pessoa: em Suporte há WhatsApp e contacto humano.',
        ],
      },
      {
        type: 'callout',
        variant: 'info',
        title: 'Configuração rápida',
        text: 'Se for o responsável do gabinete, a configuração rápida pode gerar um rascunho de página/serviços com IA — só com consentimento. É rascunho para editar, não publicação automática.',
      },
      {
        type: 'callout',
        variant: 'security',
        title: 'Privacidade',
        text: 'A ajuda estática não vê a sua carteira. Funções de setup com IA seguem consentimento e isolamento por gabinete.',
      },
      { type: 'appLink', label: 'Manual completo', href: '/manual' },
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
    title: 'Definições, serviços e agenda',
    subtitle: 'Identidade, página pública, Serviços e Agendamentos',
    audience: 'firm',
    status: 'available',
    seoDescription: 'Definições, Serviços e Agendamentos no Teglion — como configurar o gabinete de ponta a ponta.',
    blocks: [
      {
        type: 'maya',
        text: 'Há três sítios que o responsável configura uma vez e a equipa usa todos os dias: Definições (identidade e página), Serviços (o que oferece) e Agendamentos (quando atende).',
      },
      { type: 'h2', text: 'Definições do gabinete' },
      {
        type: 'p',
        text: 'Em Definições trata identidade, página pública, equipa, segurança e integrações (Google, Stripe Connect). Ligue só o que usa — menos integrações = menos superfície de risco.',
      },
      { type: 'h2', text: 'Serviços (catálogo)' },
      {
        type: 'ol',
        items: [
          'Em Serviços → Catálogo crie ou active um modelo Teglion.',
          'Edite preço, duração, texto e se exige marcação.',
          'Publique na página pública quando estiver pronto.',
          'Pedidos do site entram em Solicitações; pedidos da carteira na Central.',
        ],
      },
      { type: 'h2', text: 'Agendamentos (marcações)' },
      {
        type: 'ol',
        items: [
          'Abra Agendamentos → Definições.',
          'Defina o horário semanal (dias Abertos e intervalos).',
          'Marque feriados nas excepções do mês.',
          'Escolha duração do slot e horizonte (até quando se pode marcar).',
          'Guarde a disponibilidade.',
          'No serviço, active «Exige agendamento» e publique — senão o site não mostra horários.',
        ],
      },
      {
        type: 'callout',
        variant: 'tip',
        title: 'Teste como cliente',
        text: 'Depois de gravar e publicar, abra a página pública do gabinete e tente marcar um horário. Se falhar, volte a estes três passos: horário gravado, serviço com marcação, página publicada.',
      },
      {
        type: 'callout',
        variant: 'security',
        title: 'Integrações',
        text: 'OAuth e Connect pedem confirmação consciente. Não autorize apps de terceiros fora dos fluxos oficiais do Teglion.',
      },
      { type: 'appLink', label: 'Abrir Definições', href: '/app/firm/settings' },
      { type: 'appLink', label: 'Serviços', href: '/app/firm/services' },
      { type: 'appLink', label: 'Agendamentos', href: '/app/firm/agenda' },
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
      { type: 'h2', text: 'Porque o site não mostra horários para marcar?' },
      {
        type: 'p',
        text: 'Faltam um ou mais destes: (1) horário gravado em Agendamentos → Definições; (2) serviço com «Exige agendamento» publicado; (3) página pública publicada. Teste sempre como se fosse o cliente.',
      },
      { type: 'h2', text: 'Qual a diferença entre Solicitações e Central de Serviços?' },
      {
        type: 'p',
        text: 'Solicitações = pedidos da página pública (leads). Central = pedidos de clientes já na carteira da app. São pipelines diferentes de propósito.',
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
      { type: 'appLink', label: 'Arrendamentos dos clientes', href: '/app/firm/client-rentals' },
      { type: 'appLink', label: 'Custos do gabinete', href: '/app/firm/rentals' },
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
