import { defineIntent } from '@/features/maya/content/types'

export const SETTINGS_INTENTS = [
  defineIntent({
    id: 'settings',
    title: 'O que configuro em Definições?',
    shortDescription: 'hub de Definições',
    answer:
      'Definições é o centro de configuração: identidade, site público, dados do escritório, equipa, pagamentos (só o responsável) e o seu perfil. Para captar clientes na internet, o passo decisivo é Página pública — publique o site e ligue serviços do catálogo.',
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
      'Em Identidade carrega o logótipo do portal: menu lateral do escritório e área dos clientes. Não configura sozinho o site público (teglion.com/…). Para a vitrine na internet use Definições → Página pública → «Logótipos (só site público)», onde pode usar este logótipo, outro diferente ou nenhum — barra e destaque são independentes. Na página de cada serviço, a opção «Mostrar logótipo do escritório» usa o logótipo de Identidade.',
    steps: [
      'Abra Definições → Identidade',
      'Carregue a imagem do logótipo',
      'Guarde',
      'Confirme no menu do escritório',
      'Se quiser outro logótipo só no site, vá a Página pública (não é obrigatório)',
    ],
    deepLink: '/app/firm/settings?tab=identidade',
    relatedIntents: ['public-page-logos', 'public-page', 'service-editor', 'settings'],
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
      'A página pública é o site do escritório (teglion.com/o-seu-slug). À esquerda edita secções; à direita vê telemóvel/tablet. Bloco A: link e nome. Bloco B: secções (destaque, serviços, contactos…). Bloco C: cores e SEO. Guardar rascunho não publica — use Publicar quando estiver pronto. Os serviços listados vêm do Catálogo ou IRS já marcados para o site.',
    steps: [
      'Abrir Definições → Página pública',
      'Definir link (slug) e nome na barra',
      'Configurar logótipos só do site (painel à direita)',
      'Editar destaque e secções na lista',
      'Guardar rascunho → Pré-visualizar → Publicar',
    ],
    deepLink: '/app/firm/settings?tab=pagina-publica',
    relatedIntents: ['public-page-logos', 'public-page-media', 'public-page-sections', 'public-page-publish', 'service', 'booking'],
    followUpPrompt: 'Toque num tema abaixo ou abra a página pública.',
    nextSteps: [
      { label: 'Logótipos barra vs destaque', intentId: 'public-page-logos' },
      { label: 'Fotos e posição', intentId: 'public-page-media' },
      { label: 'Destaques e catálogo de serviços', intentId: 'public-page-featured' },
      { label: 'Secções do site', intentId: 'public-page-sections' },
      { label: 'Publicar o site', intentId: 'public-page-publish' },
    ],
  }),
  defineIntent({
    id: 'public-page-featured',
    title: 'Destaques e catálogo na página pública',
    shortDescription: 'cartões de destaque e grelha',
    answer:
      'Em Definições → Página pública, nas secções «Consultorias com agendamento» e «Outros serviços» (ou listas extra que criar): 1) Título opcional — se deixar vazio, o visitante não vê título de secção. 2) Bloco «Destaques (cartões grandes)»: marque até 12 ofertas (hubs com modalidades); aparecem cartões com opções e «Ver opções». 3) Quando há destaques, pode editar o subtítulo «Catálogo de serviços» (campo catalogHeading) para a grelha abaixo. 4) Serviços vêm do Catálogo ou IRS com «Aparece na página pública». 5) Contactos: secção Contactos ou, se a desactivar, email/telefone/morada no Rodapé (herdam Definições → Escritório quando vazios). 6) Use «Pronto para publicar?» abaixo de Identidade → Guardar rascunho → Pré-visualizar → Publicar.',
    steps: [
      'Abrir a secção de serviços na lista (consultorias ou outros)',
      'Opcional: marcar até 12 destaques e ajustar o título do catálogo',
      'Confirmar serviços publicados no Catálogo',
      'Verificar contactos (Contactos ou Rodapé)',
      'Checklist «Pronto para publicar?» → Guardar → Publicar',
    ],
    deepLink: '/app/firm/settings?tab=pagina-publica',
    relatedIntents: ['public-page', 'public-page-media', 'public-page-publish', 'service'],
    ctaLabel: 'Abrir Página pública',
  }),
  defineIntent({
    id: 'public-page-logos',
    title: 'Logótipos na página pública (barra e destaque)',
    shortDescription: 'logótipo do site vs portal',
    answer:
      'O site público não tem de usar o logótipo de Definições → Identidade. No painel «Logótipos (só site público)» (pré-visualização à direita) configure a Barra do topo e o Destaque principal em separado. Em cada um escolha: Definições → Logótipo (portal), Imagem só desta página (carregar ficheiro) ou Sem logótipo aqui. Dentro de «Barra do topo» e «Destaque principal» há também «Mostrar logótipo…» para esconder só nessa zona. Remover o logótipo em Identidade não apaga a escolha do site se tiver «só esta página» ou «sem logótipo».',
    steps: [
      'Abra Definições → Página pública',
      'No painel à direita, veja Barra do topo e Destaque principal',
      'Escolha a origem do logótipo em cada um',
      'Se escolher «só esta página», carregue a imagem',
      'Opcional: desmarque «Mostrar logótipo» dentro da secção',
      'Guardar rascunho → Publicar',
    ],
    deepLink: '/app/firm/settings?tab=pagina-publica',
    relatedIntents: ['settings-identity', 'public-page', 'public-page-sections', 'public-page-publish'],
    ctaLabel: 'Abrir Página pública',
    nextSteps: [
      { label: 'Identidade (portal)', intentId: 'settings-identity' },
      { label: 'Publicar', intentId: 'public-page-publish' },
    ],
  }),
  defineIntent({
    id: 'public-page-media',
    title: 'Imagens nas secções da página pública',
    shortDescription: 'fotos, posição e fundo',
    answer:
      'Em Sobre o escritório, Diferenciais, Como funciona, Perguntas frequentes, Contactos (e outras secções com o bloco «Imagens») pode carregar uma foto de conteúdo, escolher posição (acima, esquerda ou direita do texto), tamanho (pequeno a largura total) e, opcionalmente, imagem de fundo suave por baixo do texto. No Destaque principal a imagem é de fundo atrás do título e da frase (não uma faixa gigante acima): use o painel de foco 3×3, «Preencher» ou «Mostrar inteira» e o slider para escurecer o fundo e ler o texto. Isto não altera Definições → Identidade nem Escritório — só o site teglion.com/…. Desmarque «Mostrar imagem de conteúdo» para esconder a foto mantendo o texto.',
    steps: [
      'Abra a secção na lista (ex.: Sobre o escritório)',
      'Use «Imagens (só página pública)»',
      'Carregue a foto e escolha posição e tamanho',
      'Opcional: active imagem de fundo',
      'Guardar rascunho → confirme na pré-visualização → Publicar',
    ],
    deepLink: '/app/firm/settings?tab=pagina-publica',
    relatedIntents: ['public-page-sections', 'public-page', 'public-page-publish'],
    ctaLabel: 'Abrir Página pública',
  }),
  defineIntent({
    id: 'public-page-sections',
    title: 'Secções da página pública',
    shortDescription: 'secções do site',
    answer:
      'As secções seguem a ordem da lista: Barra do topo (cores, links, mostrar logótipo), Destaque principal (imagem de fundo, título e frase por cima, logótipo redondo opcional), Sobre, Consultorias com agendamento, Outros serviços, Diferenciais, Como funciona, FAQ, Contactos, Rodapé. Várias secções têm bloco «Imagens (só página pública)». Serviços concretos criam-se em Serviços ou IRS — aqui só títulos e apresentação.',
    steps: [
      'Siga a lista — é a ordem do visitante',
      'Configure logótipos no painel à direita se precisar',
      'Preencha o Destaque com frase clara e imagem de fundo opcional (reposicione com a grelha de foco)',
      'Em Sobre/FAQ/Contactos use imagens se quiser',
      'Guarde o rascunho com frequência',
    ],
    deepLink: '/app/firm/settings?tab=pagina-publica',
    relatedIntents: ['public-page-logos', 'public-page-media', 'public-page', 'public-page-publish', 'service'],
    ctaLabel: 'Abrir Página pública',
    fields: [
      {
        id: 'header',
        name: 'Barra do topo',
        meaning: 'Cores, links de menu e «Mostrar logótipo na barra». O logótipo em si configura-se no painel «Logótipos (só site público)» — Barra.',
      },
      {
        id: 'hero',
        name: 'Destaque principal',
        meaning: 'Imagem de fundo atrás do texto, título, frase, parágrafo, botões, grelha de foco e escurecer fundo. «Mostrar logótipo no destaque». Logótipos barra vs destaque: painel à direita.',
        usedWhere: 'Topo do site público.',
      },
      {
        id: 'about',
        name: 'Sobre o escritório',
        meaning: 'Texto, bloco Imagens (foto, posição, tamanho, fundo opcional).',
      },
      {
        id: 'services-heading',
        name: 'Consultorias com agendamento',
        meaning: 'Título da grelha. Os cartões vêm dos serviços publicados com marcação.',
      },
      {
        id: 'other-services',
        name: 'Outros serviços',
        meaning: 'Título da zona, bloco «Destaques (cartões grandes)» (até 6 ofertas com modalidades visíveis) e catálogo em grelha por grupo.',
      },
      {
        id: 'features',
        name: 'Diferenciais',
        meaning: 'Pontos fortes em lista (título + descrição por item); bloco Imagens opcional.',
      },
      {
        id: 'process',
        name: 'Como funciona',
        meaning: 'Passos do processo que o visitante lê; bloco Imagens opcional.',
      },
      {
        id: 'faq',
        name: 'Perguntas frequentes',
        meaning: 'Perguntas e respostas; bloco Imagens (foto, posição, tamanho, fundo opcional).',
      },
      {
        id: 'contact',
        name: 'Contactos e redes',
        meaning: 'E-mail, telefone, morada e redes sociais; botões opcionais; imagem opcional.',
      },
      {
        id: 'footer',
        name: 'Rodapé legal (visual)',
        meaning: 'Cores do rodapé, termos, privacidade, livro de reclamações e elogios.',
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
