import { PRICING_TEXT } from '@/shared/config/pricingConstants'

/** Textos Teglion — Português de Portugal (pt-PT) */
export const contabilPt = {
  brand: 'Teglion',
  nav: { login: 'Entrar', trial: 'Começar gratuitamente' },
  hero: {
    badge: 'Para escritórios de contabilidade em Portugal',
    title: 'O escritório e o portal do cliente no mesmo sítio.',
    subtitle:
      'Chega de Excel, WhatsApp e e-mails perdidos. Obrigações, documentos e mensagens com histórico — e o cliente sabe o que falta entregar.',
    ctaFirm: 'Começar gratuitamente',
    ctaClient: 'Sou cliente de um escritório',
    ctaDemo: 'Ver demonstração',
    trustLine: `${PRICING_TEXT.trialDays} dias grátis · depois a partir de ${PRICING_TEXT.yearlyMonthlyLabel}/mês (anual) · sem cartão no registo`,
  },
  pricing: {
    eyebrow: 'Preços',
    title: 'Quanto custa',
    subtitle: `Começas com ${PRICING_TEXT.trialDays} dias grátis. Se ficar, escolhes mensal (${PRICING_TEXT.monthlyLabel}) ou anual (${PRICING_TEXT.yearlyTotalLabel} — equivale a ${PRICING_TEXT.yearlyMonthlyLabel}/mês).`,
    trial: {
      name: 'Teste gratuito',
      price: '0 €',
      period: `${PRICING_TEXT.trialDays} dias`,
      description: 'Usa o escritório e o portal como se já fosses cliente. Sem cartão.',
      features: [
        'Sem cartão no registo',
        'Dados só do teu escritório',
        'Convida clientes e testa o mês real',
        'Apoio por e-mail em dias úteis',
      ],
      cta: 'Começar o teste',
    },
    plan: {
      name: 'Plano Escritório',
      price: PRICING_TEXT.monthlyLabel,
      period: 'por mês · por escritório',
      vatNote: 'IVA à taxa legal, se aplicável.',
      description: 'Depois do teste, o mesmo sistema para toda a equipa.',
      features: [
        'Clientes e obrigações no plano base',
        'Portal do cliente incluído',
        'Documentos e mensagens',
        'Cancela quando quiseres — sem fidelização',
      ],
      afterTrial: `No fim dos ${PRICING_TEXT.trialDays} dias pedimos que actives um plano. Avisamos antes.`,
      cta: 'Começar com teste grátis',
      monthly: {
        name: 'Mensal',
        price: PRICING_TEXT.monthlyLabel,
        period: '/ mês',
        note: 'Flexível',
      },
      yearly: {
        name: 'Anual',
        price: PRICING_TEXT.yearlyMonthlyLabel,
        period: '/ mês',
        note: `${PRICING_TEXT.yearlyTotalLabel} cobrados uma vez por ano`,
        badge: 'Melhor valor',
      },
    },
    faq: [
      {
        q: 'Preciso de cartão para experimentar?',
        a: `Não. Os ${PRICING_TEXT.trialDays} dias correm sem débito.`,
      },
      {
        q: 'O que acontece no dia 15?',
        a: 'O acesso fica em pausa até activares o plano. Podes exportar o que precisares antes.',
      },
      {
        q: 'O preço é por utilizador ou por cliente?',
        a: 'Por escritório. Toda a equipa usa a mesma subscrição.',
      },
      {
        q: 'Mensal ou anual?',
        a: `Mensal: ${PRICING_TEXT.monthlyLabel}/mês. Anual: ${PRICING_TEXT.yearlyTotalLabel}/ano (cerca de ${PRICING_TEXT.yearlyMonthlyLabel}/mês). O teste de ${PRICING_TEXT.trialDays} dias é igual nos dois.`,
      },
    ],
    launchNote:
      'Aos primeiros escritórios do piloto podemos fazer condições especiais — o preço público é este.',
  },
  howItWorks: {
    title: 'Como funciona',
    subtitle: 'Do convite ao fecho do período, sem e-mails perdidos.',
    steps: [
      { title: 'Configure o escritório', body: 'Crie a conta, importe clientes e defina responsáveis internos.' },
      { title: 'Peça documentos com clareza', body: 'O cliente recebe tarefas e envia ficheiros em dois cliques.' },
      { title: 'Feche obrigações com controlo', body: 'IVA, SS e IRC com estados visuais e histórico de mensagens.' },
    ],
  },
  problem: {
    title: 'O dia a dia do escritório não devia depender de e-mails e folhas soltas',
    items: [
      { title: 'Documentos perdidos', body: 'PDFs e fotografias espalhados por e-mail, WhatsApp e pastas partilhadas.' },
      { title: 'Prazos fiscais em risco', body: 'IVA, SS e IRC sem visão clara do que falta por cliente.' },
      { title: 'Comunicação caótica', body: 'Pedidos repetidos, chamadas e mensagens sem histórico centralizado.' },
    ],
  },
  solution: {
    title: 'Uma plataforma, dois espaços',
    body: 'O escritório gere a carteira com controlo total. O cliente entrega documentos em dois cliques no telemóvel.',
  },
  product: {
    title: 'Tudo o que precisa no ciclo mensal',
    items: [
      { title: 'Clientes', body: 'Carteira com estado de risco, convites e histórico por empresa.' },
      { title: 'Obrigações', body: 'IVA, IRC, SS e prazos com alertas automáticos.' },
      { title: 'Documentos', body: 'Upload, validação e organização por período.' },
      { title: 'Mensagens', body: 'Comunicação profissional com cada cliente no mesmo lugar.' },
    ],
  },
  benefits: {
    title: 'Menos erros. Menos chamadas. Mais controlo.',
    items: [
      'Reduza falhas por documentação em falta',
      'Menos tempo a perseguir clientes por telefone',
      'Visão imediata de clientes em risco',
      'Automação de lembretes de obrigações',
    ],
  },
  trust: {
    title: 'Feito para contabilidade em Portugal',
    body: 'Pensado para escritórios certificados e PME que precisam de clareza, não de mais um Excel.',
  },
  preview: {
    title: 'Produto real — não mockups genéricos',
    subtitle: 'Painel do escritório e portal do cliente, desenhados para o ciclo mensal em Portugal.',
    firm: 'Painel do escritório',
    client: 'Portal do cliente',
  },
  clientPortal: {
    badge: 'Portal do cliente',
    title: 'O cliente sente que tem tudo sob controlo',
    body: 'Linguagem simples, estados fiscais claros e upload rápido — no telemóvel, tablet ou computador.',
    points: [
      '“Está tudo em dia” ou “Falta entregar X” em destaque',
      'Upload por câmara, galeria ou arrastar ficheiros',
      'Mensagens com o contabilista no mesmo sítio',
    ],
  },
  security: {
    title: 'Os seus dados, tratados como deve ser',
    body:
      'Cada escritório opera num espaço isolado — os dados dos seus clientes nunca se misturam com outros. Ligações encriptadas, acessos por perfil e conformidade com o RGPD desde o primeiro dia.',
    tags: ['Dados isolados por escritório', 'Encriptação', 'RGPD', 'Controlo de acessos', 'Histórico de ações'],
  },
  ctaFinal: {
    title: 'Comece a digitalizar o seu escritório hoje',
    subtitle: 'Crie a conta em minutos, convide a equipa e o primeiro cliente — com conformidade RGPD activa.',
    firm: 'Começar gratuitamente',
    client: 'Entrar como cliente',
  },
  landing: {
    stats: [
      { value: '1 sistema', label: 'Substitui folhas soltas e chats dispersos' },
      { value: '2 portais', label: 'Escritório + cliente final integrados' },
      { value: 'RGPD', label: 'Consentimento e DPA auditáveis' },
    ],
    product: {
      title: 'O produto que vai usar no dia a dia',
      subtitle: 'Mesmos ecrãs da aplicação, com dados de demonstração — o que vê é o que existe no sistema.',
      tabs: {
        clientPortal: 'Portal do cliente',
        dashboard: 'Painel do escritório',
        clients: 'Carteira de clientes',
        obligations: 'Obrigações fiscais',
      },
    },
    previewNote: 'Pré-visualização ao vivo (componentes reais · dados demo · sem imagens estáticas).',
  },
  footer: {
    contact: 'Contacto',
    terms: 'Termos',
    privacy: 'Privacidade',
    dpa: 'DPA',
    cookies: 'Cookies',
    notice: 'Aviso legal',
    login: 'Área de login',
    rights: 'Todos os direitos reservados.',
  },
  auth: {
    chooseTitle: 'Como pretende aceder?',
    chooseSubtitle: 'Escolha o seu perfil para continuar.',
    firmTitle: 'Sou um escritório de contabilidade',
    firmDesc: 'Gerir clientes, obrigações e equipa.',
    clientTitle: 'Sou cliente de um escritório',
    clientDesc: 'Ver obrigações e enviar documentos.',
    registerFirmTitle: 'Criar conta do escritório',
    registerFirmSubtitle:
      '14 dias grátis, sem cartão.. Aproveite para convidar o primeiro cliente e testar o ciclo mensal completo.',
    firmName: 'Nome do escritório',
    ownerName: 'O seu nome',
    email: 'E-mail',
    password: 'Palavra-passe',
    registerSubmit: 'Criar conta',
    hasAccount: 'Já tem conta?',
    loginLink: 'Entrar',
    backChoice: 'Voltar à escolha de perfil',
    loginFirmTitle: 'Entrar no escritório',
    loginFirmSubtitle: 'Aceda ao painel da sua equipa.',
    loginClientTitle: 'Entrar como cliente',
    loginClientSubtitle: 'Veja obrigações e envie documentos ao seu contabilista.',
  },
  invite: {
    title: 'Criar conta de cliente',
    invitedBy: 'Convite do escritório',
    name: 'Nome completo',
    email: 'E-mail',
    password: 'Palavra-passe',
    submit: 'Criar conta e entrar',
    invalid: 'Convite inválido ou expirado.',
    loading: 'A validar convite…',
  },
  firm: {
    inviteLink: 'Gerar convite',
    inviteCopied: 'Link copiado para a área de transferência',
    inviteCopyManual: 'Não foi possível copiar automaticamente. Selecione o link abaixo e copie manualmente (Cmd+C / menu).',
    inviteError: 'Não foi possível gerar o convite',
    inviteDialogTitle: 'Link de convite do cliente',
    inviteDialogHint:
      'Envie este endereço ao cliente (e-mail, WhatsApp, etc.). Ele pode colar no browser para criar conta e aceder ao portal.',
    inviteCopyAgain: 'Copiar de novo',
    inviteShare: 'Partilhar…',
    inviteShareTitle: 'Convite portal Teglion',
    inviteShareBody: 'Olá! Usa este link para criar o teu acesso ao portal:',
  },
} as const
