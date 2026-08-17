import { defineIntent } from '@/features/maya/content/types'

export const SETTINGS_INTENTS = [
  defineIntent({
    id: 'settings',
    title: 'O que configuro em Definições?',
    shortDescription: 'hub de Definições',
    answer:
      'Em Definições o menu lateral abre cada secção: Identidade (logótipo), Página pública (o site), Escritório (nome e contactos), Pagamentos (Stripe dos seus clientes — só o responsável liga), O seu perfil, Equipa, Etiquetas, Notificações, Ajuda, Sobre o Teglion e Encerrar conta (só quem pode encerrar). A secção que desbloqueia captação é Página pública.',
    steps: [
      'Identidade — logótipo',
      'Página pública — conteúdo e publicar',
      'Escritório — dados da firma',
      'Pagamentos — se quiser receber online',
      'Equipa e perfil — acessos',
    ],
    deepLink: '/app/firm/settings',
    relatedIntents: ['settings-identity', 'public-page', 'payments', 'settings-team'],
    nextSteps: [
      { label: 'Página pública', intentId: 'public-page' },
      { label: 'Identidade', intentId: 'settings-identity' },
    ],
  }),
  defineIntent({
    id: 'settings-identity',
    title: 'Como configurar o logótipo?',
    shortDescription: 'identidade',
    answer:
      'Em Identidade carrega o logótipo usado no menu do escritório e no portal dos clientes. Quem não pode editar a firma vê a secção em modo de leitura. Este logótipo também pode aparecer na página de cada serviço se marcar essa opção no editor do serviço.',
    steps: [
      'Abra Definições → Identidade',
      'Carregue a imagem do logótipo',
      'Guarde',
      'Confirme no menu e, se quiser, na pré-visualização de um serviço',
    ],
    deepLink: '/app/firm/settings?tab=identidade',
    relatedIntents: ['public-page', 'service-editor', 'settings'],
    ctaLabel: 'Abrir Identidade',
  }),
  defineIntent({
    id: 'settings-firm',
    title: 'Dados do escritório',
    shortDescription: 'dados do escritório',
    answer:
      'Em Escritório estão o nome, contactos e dados fiscais da firma. Só quem pode editar a firma altera estes campos; os restantes vêem em leitura. Estes dados alimentam a identidade do produto e, em parte, a página pública.',
    steps: [
      'Abra Definições → Escritório',
      'Confirme nome e contactos',
      'Guarde se tiver permissão para editar',
    ],
    deepLink: '/app/firm/settings?tab=escritorio',
    relatedIntents: ['settings', 'public-page'],
    ctaLabel: 'Abrir Escritório',
  }),
  defineIntent({
    id: 'settings-profile',
    title: 'O seu perfil',
    shortDescription: 'perfil pessoal',
    answer:
      'O seu perfil é a sua conta (nome, e-mail, palavra-passe) — não o cadastro da firma nem o de um cliente. Cada pessoa da equipa gere o seu.',
    steps: ['Abra Definições → O seu perfil', 'Actualize o que estiver desactualizado', 'Guarde'],
    deepLink: '/app/firm/settings?tab=perfil',
    relatedIntents: ['settings', 'settings-team'],
    ctaLabel: 'Abrir o seu perfil',
  }),
  defineIntent({
    id: 'settings-team',
    title: 'Como gerir a equipa?',
    shortDescription: 'equipa',
    answer:
      'Em Equipa vê os membros, convites pendentes e departamentos. Quem gere a equipa pode criar um membro, convidar por e-mail, editar, reenviar ou revogar convite, e ajustar permissões. Não partilhe a conta do responsável. Convidar por e-mail pede nome, e-mail e, opcionalmente, cargo e departamento.',
    steps: [
      'Abra Definições → Equipa',
      'Convide por e-mail ou crie o membro',
      'Defina permissões adequadas',
      'Reenvie o convite se não chegou',
    ],
    deepLink: '/app/firm/settings?tab=equipa',
    relatedIntents: ['settings', 'settings-profile'],
    ctaLabel: 'Abrir Equipa',
    fields: [
      {
        id: 'invite-name',
        name: 'Nome (convite)',
        meaning: 'Nome da pessoa que vai entrar na equipa.',
        required: true,
      },
      {
        id: 'invite-email',
        name: 'Email (convite)',
        meaning: 'Para onde o Teglion envia o convite de registo.',
        required: true,
        format: 'Endereço de e-mail válido',
      },
      {
        id: 'invite-job',
        name: 'Cargo',
        meaning: 'Opcional, para identificar a função na lista.',
      },
      {
        id: 'invite-dept',
        name: 'Departamento',
        meaning: 'Opcional, se já criou departamentos.',
      },
    ],
  }),
  defineIntent({
    id: 'settings-tags',
    title: 'Para que servem as etiquetas?',
    shortDescription: 'etiquetas',
    answer:
      'As etiquetas classificam clientes (e outros registos) para filtrar a carteira. Crie-as aqui e aplique-as na ficha ou na lista de clientes. Não substituem o tipo de cliente nem o regime de IVA.',
    steps: ['Abra Definições → Etiquetas', 'Crie as etiquetas do escritório', 'Aplique-as nos clientes'],
    deepLink: '/app/firm/settings?tab=etiquetas',
    relatedIntents: ['clients', 'settings'],
    ctaLabel: 'Abrir Etiquetas',
  }),
  defineIntent({
    id: 'settings-notifications',
    title: 'Notificações do escritório',
    shortDescription: 'notificações',
    answer:
      'Em Notificações escolhe que avisos o escritório quer receber sobre a operação no Teglion. Não é a Central de Alertas (essa envia comunicados aos clientes).',
    steps: ['Abra Definições → Notificações', 'Ligue só o que a equipa precisa', 'Guarde'],
    deepLink: '/app/firm/settings?tab=notificacoes',
    relatedIntents: ['alerts', 'settings'],
    ctaLabel: 'Abrir Notificações',
  }),
  defineIntent({
    id: 'settings-close',
    title: 'Encerrar a conta do escritório',
    shortDescription: 'encerrar conta',
    answer:
      'Encerrar conta só aparece ao responsável com permissão para tal. É irreversível. Não serve para sair da sessão nem para remover um colaborador — isso faz-se em Equipa. Se só quer cancelar a mensalidade, comece por Plano e subscrição.',
    steps: [
      'Confirme que é mesmo para encerrar o escritório no Teglion',
      'Se for só a mensalidade, use Plano e subscrição',
      'Se precisar de ajuda, fale com o suporte humano',
    ],
    deepLink: '/app/firm/settings?tab=encerrar',
    relatedIntents: ['billing', 'human-support'],
    ownerOnly: true,
    ctaLabel: 'Ver Encerrar conta',
  }),
  defineIntent({
    id: 'public-page',
    title: 'Como configurar a página pública?',
    shortDescription: 'página pública do escritório',
    answer:
      'A página pública é o site do escritório em teglion.com/o-seu-slug. Em Definições → Página pública edita pela ordem do visitante: link (slug) e nome na barra → cores da barra → destaque (foto, título, frase, parágrafo, botões) → secções (Sobre, Serviços, FAQ, Contactos, Rodapé, etc.) → tema e textos legais → Guardar rascunho → Pré-visualizar → Publicar. Sem publicar, o site não fica visível. O slug do escritório só o responsável altera. Os serviços que aparecem vêm do Catálogo / IRS publicados, não se inventam aqui.',
    steps: [
      'Abrir Definições → Página pública',
      'Definir o link público (slug) e o nome na barra',
      'Barra do topo — cores (o texto vem do nome)',
      'Destaque — foto, título, frase, parágrafo e botões',
      'Percorrer as secções da lista',
      'Guardar rascunho → Pré-visualizar → Publicar',
    ],
    deepLink: '/app/firm/settings?tab=pagina-publica',
    relatedIntents: ['public-page-sections', 'public-page-publish', 'service', 'booking'],
    followUpPrompt: 'Quer o mapa das secções ou só como publicar?',
    nextSteps: [
      { label: 'Secções do site', intentId: 'public-page-sections' },
      { label: 'Publicar o site', intentId: 'public-page-publish' },
      { label: 'Ligar um serviço', intentId: 'service-publish' },
    ],
  }),
  defineIntent({
    id: 'public-page-sections',
    title: 'Secções da página pública',
    shortDescription: 'secções do site',
    answer:
      'As secções, pela ordem do visitante: Barra do topo (cores), Destaque principal (foto, título, frase, parágrafo, botões), Sobre o escritório, Consultorias com agendamento (título da grelha de serviços com marcação), Outros serviços, Diferenciais, Como funciona, Perguntas frequentes, Contactos, Rodapé. Cada uma edita-se na lista. Serviços concretos não se criam aqui — criam-se em Serviços ou IRS e publicam-se lá.',
    steps: [
      'Siga a lista de cima para baixo — é a ordem da página',
      'Preencha o Destaque com uma frase que o cliente entenda',
      'Em Contactos coloque e-mail, telefone e morada reais',
      'Guarde o rascunho com frequência',
    ],
    deepLink: '/app/firm/settings?tab=pagina-publica',
    relatedIntents: ['public-page', 'public-page-publish', 'service'],
    ctaLabel: 'Abrir Página pública',
    fields: [
      {
        id: 'header',
        name: 'Barra do topo',
        meaning: 'Cores da barra. O texto do nome vem do nome definido acima, não se escreve aqui.',
      },
      {
        id: 'hero',
        name: 'Destaque principal',
        meaning: 'Primeira impressão: foto de capa, título, frase, parágrafo e botões.',
        usedWhere: 'Topo do site público.',
      },
      {
        id: 'about',
        name: 'Sobre o escritório',
        meaning: 'Texto e foto institucional.',
      },
      {
        id: 'services-heading',
        name: 'Consultorias com agendamento',
        meaning: 'Título da grelha. Os cartões vêm dos serviços publicados com marcação.',
      },
      {
        id: 'other-services',
        name: 'Outros serviços',
        meaning: 'Título da zona dos restantes serviços publicados.',
      },
      {
        id: 'features',
        name: 'Diferenciais',
        meaning: 'Pontos fortes em lista (título + descrição por item).',
      },
      {
        id: 'process',
        name: 'Como funciona',
        meaning: 'Passos do processo que o visitante lê.',
      },
      {
        id: 'faq',
        name: 'Perguntas frequentes',
        meaning: 'Perguntas e respostas no site.',
      },
      {
        id: 'contact',
        name: 'Contactos',
        meaning: 'E-mail, telefone, morada visíveis ao público.',
      },
      {
        id: 'footer',
        name: 'Rodapé',
        meaning: 'Cores e fecho da página, com temas/legais à parte.',
      },
    ],
  }),
  defineIntent({
    id: 'public-page-publish',
    title: 'Publicar a página pública',
    shortDescription: 'publicar o site',
    answer:
      'Guardar rascunho não torna o site visível. Depois de pré-visualizar, use Publicar. O link fica teglion.com/o-seu-slug. Sem publicar, potenciais clientes não vêem o escritório — mesmo que os serviços já estejam marcados para o site. Alterar o slug é acção do responsável.',
    steps: [
      'Guarde o rascunho',
      'Pré-visualize',
      'Publique',
      'Abra o link numa janela anónima para confirmar',
      'Publique pelo menos um serviço no Catálogo ou IRS',
    ],
    deepLink: '/app/firm/settings?tab=pagina-publica',
    relatedIntents: ['public-page', 'service-publish', 'requests'],
    ctaLabel: 'Abrir Página pública',
    nextSteps: [{ label: 'Publicar um serviço', intentId: 'service-publish' }],
  }),
  defineIntent({
    id: 'payments',
    title: 'Como receber pagamentos dos clientes?',
    shortDescription: 'Stripe Connect',
    answer:
      'Em Definições → Pagamentos o responsável liga a conta Stripe do escritório. Os clientes pagam no Checkout; o dinheiro vai para a conta do escritório — o Teglion só faz a ponte técnica. É preciso ler e aceitar a política registada e concluir o onboarding Stripe até o estado ficar Pronto. Só depois Cartões e MB WAY ficam utilizáveis nos serviços. A mensalidade Teglion é outro fluxo (Plano e subscrição). Quem não é responsável vê a área mas não liga a conta.',
    steps: [
      'Abrir Definições → Pagamentos (responsável do escritório)',
      'Ler e aceitar a política',
      'Concluir o onboarding Stripe',
      'Esperar o estado Pronto',
      'No serviço, escolher Cartões ou MB WAY e guardar',
    ],
    deepLink: '/app/firm/settings?tab=pagamentos',
    relatedIntents: ['billing', 'service-payment', 'settings'],
    ownerOnly: true,
    ctaLabel: 'Abrir Pagamentos',
    commonProblems: [
      {
        id: 'staff',
        title: 'Sou da equipa e não consigo ligar',
        answer:
          'É esperado. Só o responsável (dono) liga ou gere a Stripe Connect. Peça-lhe para concluir Pagamentos; depois pode seleccionar os meios no serviço.',
      },
    ],
  }),
  defineIntent({
    id: 'billing',
    title: 'Como funciona o plano Teglion?',
    shortDescription: 'plano e subscrição',
    answer:
      'Em Plano e subscrição gere o acesso do escritório ao Teglion: teste gratuito, depois mensal ou anual. O checkout e o portal de pagamento abrem na Stripe. Isto não cobra os seus clientes finais — esses pagamentos configuram-se em Pagamentos e em cada serviço. O estado no topo diz se o acesso está activo ou em pausa.',
    steps: [
      'Abra Plano e subscrição',
      'Veja se está em teste ou já subscrito',
      'Escolha mensal ou anual se for a altura de pagar',
      'Use o portal Stripe para facturas e cartão quando estiver disponível',
    ],
    deepLink: '/app/firm/billing',
    relatedIntents: ['payments', 'tour'],
    ctaLabel: 'Abrir Plano',
  }),
]
