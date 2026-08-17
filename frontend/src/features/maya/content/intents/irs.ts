import { defineIntent } from '@/features/maya/content/types'

export const IRS_INTENTS = [
  defineIntent({
    id: 'irs',
    title: 'O que é esta área de IRS?',
    shortDescription: 'hub IRS',
    answer:
      'Está na Campanha IRS. Serve para o escritório divulgar o apoio à entrega do IRS e receber pedidos de potenciais clientes. O Teglion não calcula o imposto nem preenche a declaração na Autoridade Tributária — organiza o serviço, o formulário e os documentos. O estado no topo diz se já tem serviços publicados na página pública. À esquerda estão modelos prontos (Modelo 3, anexos, IRS Jovem…). À direita estão os serviços IRS deste escritório.',
    steps: [
      'Veja o cartão «Estado da campanha» — diz se já está a captar pedidos',
      'Active um modelo à esquerda ou clique em «Criar serviço» / «Modelo 3»',
      'Configure nome, perguntas e documentos',
      'Abra Editar no serviço e, no passo Publicação, marque para aparecer no site e defina o endereço (slug)',
      'Clique em Guardar serviço — só depois o link público fica válido',
      'Os pedidos chegam em Serviços → Solicitações, não nesta lista',
    ],
    deepLink: '/app/firm/irs',
    relatedIntents: ['irs-campaign', 'irs-create-service', 'irs-modelo3', 'irs-publish'],
    followUpPrompt: 'O que quer aprender a seguir?',
    nextSteps: [
      { label: 'Criar um serviço IRS', intentId: 'irs-create-service' },
      { label: 'Configurar o Modelo 3', intentId: 'irs-modelo3' },
      { label: 'Como publicar', intentId: 'irs-publish' },
    ],
    commonProblems: [
      {
        id: 'irs-not-tax-engine',
        title: 'O Teglion calcula o IRS?',
        answer:
          'Não. Esta área é de campanha e recolha de informação. O cálculo e a entrega na AT continuam a ser feitos pelo escritório, fora deste ecrã.',
      },
    ],
  }),
  defineIntent({
    id: 'irs-campaign',
    title: 'Como funciona a campanha IRS?',
    shortDescription: 'campanha IRS',
    answer:
      'A campanha IRS é o percurso completo: criar ou activar um serviço IRS → configurar o que o cliente preenche → publicar na página pública → a pessoa preenche o formulário → o pedido aparece em Solicitações. «Publicado» na lista da direita significa que o serviço já pode ser visto no site. «Só interno» significa que a equipa o vê aqui, mas o público ainda não. Os botões no topo: Ver pedidos (Solicitações), Página pública (abre o site), Criar serviço (editor completo) e Modelo 3 (assistente de anexos).',
    steps: [
      'Configurar ou activar o serviço IRS',
      'Se for Modelo 3, use o assistente de Anexos e depois Editar para publicar',
      'No editor completo: passo 4 Publicação — slug + «Publicar na página pública» + Guardar',
      'Abrir a página pública e confirmar que o serviço aparece',
      'Acompanhar Serviços → Solicitações quando chegarem pedidos',
    ],
    deepLink: '/app/firm/irs',
    relatedIntents: ['irs', 'irs-create-service', 'irs-publish', 'requests'],
    followUpPrompt: 'Quer que eu explique como criar o serviço ou como publicar?',
    nextSteps: [
      { label: 'Criar serviço', intentId: 'irs-create-service' },
      { label: 'Publicar', intentId: 'irs-publish' },
      { label: 'Acompanhar pedidos', intentId: 'irs-track' },
    ],
  }),
  defineIntent({
    id: 'irs-create-service',
    title: 'Criar um serviço de IRS',
    shortDescription: 'criar serviço IRS',
    answer:
      'Um serviço de IRS é a configuração que representa o que o escritório oferece ao cliente (por exemplo «Declaração de IRS 2026»). Ao criá-lo, está a dizer ao Teglion: quero disponibilizar isto. Há duas entradas nesta página: «Criar serviço» abre o editor completo (oferta, imagem, formulário, publicação). «Modelo 3» abre o assistente de anexos e perguntas Sim/Não. Activar um modelo à esquerda cria o serviço a partir do catálogo Teglion e abre o editor certo. Guardar ainda não publica.',
    steps: [
      'Clique em «Criar serviço» (editor completo) ou «Modelo 3» (assistente IRS)',
      'Ou, à esquerda, «Activar e editar» num modelo que ainda não tenha',
      'Preencha pelo menos o nome — é obrigatório para guardar',
      'Clique em Guardar serviço',
      'Depois abra Editar → Publicação para o tornar visível no site',
    ],
    deepLink: '/app/firm/irs',
    relatedIntents: ['irs-modelo3', 'service-editor', 'irs-publish', 'irs-form-questions'],
    followUpPrompt: 'Quer entender os campos do editor ou o Modelo 3?',
    nextSteps: [
      { label: 'Campos do editor completo', intentId: 'service-editor' },
      { label: 'Assistente Modelo 3', intentId: 'irs-modelo3' },
      { label: 'O que acontece depois de guardar', intentId: 'irs-publish' },
    ],
    fields: [
      {
        id: 'name',
        name: 'Nome do serviço',
        meaning: 'É o nome que o cliente vê na página pública e na lista do escritório.',
        why: 'Identifica o serviço na campanha e nos pedidos.',
        example: 'Declaração de IRS 2026',
        required: true,
        emptyConsequence: 'Não consegue guardar — o Teglion pede para indicar o nome.',
        usedWhere: 'Lista IRS, página pública, solicitações e pré-visualização.',
      },
    ],
    commonProblems: [
      {
        id: 'saved-not-public',
        title: 'Guardei e o cliente não vê nada',
        answer:
          'Guardar grava a configuração para continuar depois. Para o público ver, no editor completo abra o passo Publicação, defina o slug, marque «Publicar na página pública do escritório» e volte a Guardar. No assistente Modelo 3 não há publicação — use Editar na lista.',
      },
    ],
  }),
  defineIntent({
    id: 'irs-modelo3',
    title: 'Configurar o Modelo 3',
    shortDescription: 'assistente Modelo 3',
    answer:
      'O assistente Modelo 3 é o atalho IRS: nome, ano fiscal, duração, preço, anexos (A, B, C, F, G, H, J e IRS Jovem), perguntas Sim/Não com documento condicional, e pagamento. Não inclui imagem, logótipo, publicação nem apagar — isso fica no botão Editar da lista. Quando uma pergunta está em Sim, aparece o campo Documento; em Não, esse campo desaparece. Guardar serviço grava; não publica.',
    steps: [
      'Clique em «Modelo 3» no topo, ou «Activar e editar» no modelo irs-modelo-3',
      'Confirme o nome e o ano fiscal',
      'Active só os anexos que este serviço cobre e, se quiser, mude o título e a descrição',
      'Reveja cada pergunta; se a resposta prevista for Sim, indique o documento a pedir',
      'Escolha como o escritório recebe o pagamento',
      'Clique em Guardar serviço',
      'Na lista, clique em Editar para publicar na página pública',
    ],
    deepLink: '/app/firm/irs',
    relatedIntents: ['irs-anexos', 'irs-form-questions', 'irs-publish', 'service-payment'],
    followUpPrompt: 'Quer detalhe dos anexos, das perguntas ou de como publicar?',
    nextSteps: [
      { label: 'Entender os anexos', intentId: 'irs-anexos' },
      { label: 'Entender as perguntas', intentId: 'irs-form-questions' },
      { label: 'Publicar depois', intentId: 'irs-publish' },
    ],
    fields: [
      {
        id: 'name',
        name: 'Nome do serviço',
        meaning: 'Título visível para a equipa e, depois de publicado, para o cliente.',
        example: 'Declaração IRS Modelo 3',
        required: false,
        emptyConsequence: 'Pode guardar; o título no cabeçalho usa o nome anterior ou «Novo serviço IRS».',
        usedWhere: 'Lista IRS e página pública após publicar no editor completo.',
      },
      {
        id: 'taxYear',
        name: 'Ano fiscal',
        meaning: 'O ano a que esta campanha se refere. Aparece como selo na lista IRS.',
        why: 'Permite ter campanhas de anos diferentes sem misturar.',
        example: '2026',
        format: 'Número entre 2000 e 2100',
        usedWhere: 'Selo do ano na lista «Os vossos serviços IRS» e na configuração interna do formulário.',
      },
      {
        id: 'duration',
        name: 'Duração (min)',
        meaning: 'Tempo estimado do serviço, em minutos.',
        format: 'Entre 15 e 480 minutos (o editor completo recusa valores fora deste intervalo).',
        example: '60',
        usedWhere: 'Listagem do serviço e, se exigir agendamento, ajuda a dimensionar o horário.',
      },
      {
        id: 'price',
        name: 'Preço',
        meaning: 'Valor em euros apresentado ao cliente.',
        example: '120,00 €',
        usedWhere: 'Página pública e listagens. O texto de IVA configura-se no editor completo, não aqui.',
      },
    ],
    commonProblems: [
      {
        id: 'modelo3-no-publish',
        title: 'Onde está Publicar neste assistente?',
        answer:
          'Não está. O Modelo 3 guarda anexos e perguntas. Feche, na lista clique em Editar (ou Publicar se ainda não estiver publicado) e use o passo 4 — Publicação.',
      },
    ],
  }),
  defineIntent({
    id: 'irs-anexos',
    title: 'Para que servem os anexos?',
    shortDescription: 'anexos Modelo 3',
    answer:
      'No assistente Modelo 3, Anexos são interruptores com nome e descrição livres. Ligar um anexo diz que este serviço cobre essa área (por exemplo rendimentos prediais). Não envia nada à AT. Os nomes predefinidos: Anexo A (Dependente), B (Independente / recibos verdes), C (Capital), F (Prediais), G (Mais-valias imóveis), H (Benefícios fiscais), J (Não residentes) e IRS Jovem. Pode mudar o título e a descrição; o interruptor à direita liga ou desliga. Pode alterar mais tarde.',
    steps: [
      'Percorra a lista de anexos no assistente Modelo 3',
      'Ligue só os que este serviço cobre',
      'Edite o nome se o escritório usar outra linguagem com o cliente',
      'Guarde o serviço',
    ],
    deepLink: '/app/firm/irs',
    relatedIntents: ['irs-modelo3', 'irs-form-questions', 'irs-create-service'],
    ctaLabel: 'Ir para a área IRS',
    fields: [
      {
        id: 'anexo-toggle',
        name: 'Interruptor do anexo',
        meaning: 'Ligado = este serviço inclui esse anexo. Desligado = não entra nesta configuração.',
        why: 'Evita pedir informação que este serviço não trata.',
      },
      {
        id: 'anexo-title',
        name: 'Nome do anexo',
        meaning: 'Rótulo que o escritório vê; pode personalizar.',
        example: 'Anexo F — Arrendamentos',
      },
      {
        id: 'anexo-subtitle',
        name: 'Descrição do anexo',
        meaning: 'Frase de apoio debaixo do nome.',
        example: 'Rendimentos prediais',
      },
    ],
  }),
  defineIntent({
    id: 'irs-form-questions',
    title: 'Como funcionam as perguntas do IRS?',
    shortDescription: 'perguntas Modelo 3',
    answer:
      'No Modelo 3 as perguntas são Sim/Não. Se escolher Sim, o Teglion mostra o campo Documento para essa pergunta — é a dependência real do ecrã. Se escolher Não, o documento não é necessário nesta configuração. O texto da pergunta é editável. As perguntas de origem (pode alterar o texto) cobrem: dependentes; trabalho dependente; independente / recibos verdes; capitais; prediais; mais-valias; rendimentos no estrangeiro / não residente; benefícios fiscais; crédito à habitação; IRS Jovem. Nome, e-mail, telefone e NIF já são pedidos automaticamente no topo da página pública — não os volte a criar no formulário.',
    steps: [
      'Leia cada pergunta e ajuste o texto se o escritório falar de outra forma',
      'Seleccione Sim ou Não conforme o documento deve ser pedido nesta configuração',
      'Se Sim, escreva o documento ou escolha uma sugestão (recibos_vencimento, caderneta_predial, etc.)',
      'Formatos aceites no envio pelo cliente: PDF, JPG, PNG · máx. 10 MB (indicado no próprio assistente)',
      'Guarde o serviço',
    ],
    deepLink: '/app/firm/irs',
    relatedIntents: ['irs-modelo3', 'service-form', 'irs-send'],
    fields: [
      {
        id: 'q-label',
        name: 'Pergunta',
        meaning: 'O texto que o cliente vê (e que o escritório edita).',
        example: 'Tem dependentes a cargo (filhos ou outros)?',
        required: false,
      },
      {
        id: 'q-yesno',
        name: 'Sim / Não',
        meaning:
          'No assistente, isto configura se o documento associado deve ser pedido. Sim mostra o campo Documento; Não esconde-o.',
        dependsOn: 'A escolha Sim/Não controla a visibilidade do campo Documento logo abaixo.',
      },
      {
        id: 'q-doc',
        name: 'Documento',
        meaning: 'Nome do comprovativo a pedir quando a resposta está em Sim.',
        example: 'recibos_vencimento ou «Recibos de vencimento»',
        dependsOn: 'Só aparece quando a pergunta está em Sim.',
        usedWhere: 'Pedido de documentos ao cliente quando submete o formulário publicado.',
      },
    ],
    nextSteps: [
      { label: 'Ver anexos', intentId: 'irs-anexos' },
      { label: 'Formulário do editor completo', intentId: 'service-form' },
    ],
  }),
  defineIntent({
    id: 'irs-publish',
    title: 'Como publicar o serviço de IRS?',
    shortDescription: 'publicar IRS',
    answer:
      'Publicar não é um botão separado. No editor completo (Editar na lista), abra o passo 4 — Publicação. Precisa de: serviço activo, endereço público (slug) preenchido, e a opção «Publicar na página pública do escritório» marcada. Depois clique em Guardar serviço. Sem slug, o estado fica «Quase publicado». Sem a opção marcada, fica «Só interno». O assistente Modelo 3 não publica — use sempre Editar. A página pública do escritório também precisa de estar publicada em Definições, senão o site inteiro não está visível.',
    steps: [
      'Na lista IRS, clique em Editar (ou Publicar se ainda não estiver publicado)',
      'Vá ao passo 4 — Publicação',
      'Escreva o slug (ex.: irs-2026) — é o endereço depois de /servicos/',
      'Marque «Publicar na página pública do escritório»',
      'Clique em Guardar serviço',
      'Confirme no site (botão Página pública ou o ícone de olho na linha)',
    ],
    deepLink: '/app/firm/irs',
    relatedIntents: ['service-publish', 'public-page', 'irs-send', 'irs-track'],
    followUpPrompt: 'Depois de publicado, quer saber como o cliente chega ao formulário?',
    nextSteps: [
      { label: 'Enviar ao cliente', intentId: 'irs-send' },
      { label: 'Configurar a página pública', intentId: 'public-page' },
    ],
    fields: [
      {
        id: 'slug',
        name: 'Endereço público (slug)',
        meaning: 'A parte do link deste serviço, em minúsculas, sem espaços.',
        example: 'irs-2026 → teglion.com/o-seu-slug/servicos/irs-2026',
        required: true,
        emptyConsequence: 'Se marcar para publicar sem slug, o estado fica «Quase publicado» até definir e guardar.',
        usedWhere: 'URL público do serviço.',
        format: 'Texto curto, tipicamente com hífens (ex.: consultoria-fiscal)',
      },
      {
        id: 'listed',
        name: 'Publicar na página pública do escritório',
        meaning: 'Quando marcado (com slug válido) e depois de Guardar, o serviço pode aparecer no site.',
        why: 'Separa rascunhos internos do que o público vê.',
        emptyConsequence: 'O serviço permanece só interno — a equipa vê-o na lista IRS, o visitante não.',
      },
    ],
    commonProblems: [
      {
        id: 'questions-block',
        title: 'Não deixa publicar o formulário',
        answer:
          'Perguntas de escolha sem opções bloqueiam a publicação. Complete as opções ou remova a pergunta. Também não crie perguntas chamadas Nome, Email, Telefone ou NIF — já existem no topo da página pública.',
      },
    ],
  }),
  defineIntent({
    id: 'irs-send',
    title: 'Como o cliente preenche o formulário?',
    shortDescription: 'enviar formulário IRS',
    answer:
      'Não existe um botão «Enviar formulário» dentro da área IRS. Depois de publicado, o cliente chega pelo link da página pública do escritório ou pelo link directo do serviço (ícone de olho na linha, se já estiver Publicado). Pode copiar esse URL e enviá-lo por mensagem, e-mail ou WhatsApp fora do Teglion. Na página, o cliente identifica-se (nome, e-mail, telefone, NIF) e responde às perguntas do serviço. O resultado não volta para este ecrã IRS — aparece em Serviços → Solicitações.',
    steps: [
      'Confirme que o serviço está Publicado',
      'Abra o link (Página pública ou ícone de olho)',
      'Copie o URL e partilhe-o com o cliente',
      'Peça-lhe para submeter o formulário',
      'Abra Serviços → Solicitações para ver a resposta',
    ],
    deepLink: '/app/firm/services?tab=inquiries',
    relatedIntents: ['irs-publish', 'irs-track', 'requests', 'public-page'],
    ctaLabel: 'Abrir Solicitações',
    nextSteps: [{ label: 'Acompanhar respostas', intentId: 'irs-track' }],
  }),
  defineIntent({
    id: 'irs-track',
    title: 'Onde vejo as respostas?',
    shortDescription: 'acompanhar pedidos IRS',
    answer:
      'As respostas dos formulários públicos aparecem em Serviços → Solicitações (botão «Ver pedidos» no topo desta área). Não ficam na lista IRS nem na Central. A Central é só para clientes que já usam a app Teglion. Em Solicitações contacta o lead, pede documentos em falta e avança o estado. Quando fizer sentido, converte o contacto em cliente da carteira.',
    steps: [
      'Clique em «Ver pedidos» ou abra Serviços → Solicitações',
      'Abra o pedido para ler as respostas e os documentos',
      'Contacte a pessoa e avance o estado',
      'Se passar a ser cliente, crie o cadastro em Clientes',
    ],
    deepLink: '/app/firm/services?tab=inquiries',
    relatedIntents: ['requests', 'irs-send', 'clients-create'],
    ctaLabel: 'Abrir Solicitações',
    nextSteps: [
      { label: 'O que é Solicitações', intentId: 'requests' },
      { label: 'Criar cliente na carteira', intentId: 'clients-create' },
    ],
  }),
  defineIntent({
    id: 'irs-edit',
    title: 'Editar, duplicar ou apagar',
    shortDescription: 'editar serviço IRS',
    answer:
      'Na lista da direita: Editar abre o editor completo (incluindo publicação). Anexos (só Modelo 3) reabre o assistente. O ícone de olho só aparece se estiver Publicado e tiver slug. Dentro do editor completo, Duplicar cria uma cópia privada — mude o nome antes de publicar. Apagar pede confirmação e não pode ser desfeito; se o serviço já tiver solicitações, o Teglion impede apagar — desactive-o (passo 1, «Serviço activo») em vez de apagar.',
    steps: [
      'Editar = configuração completa',
      'Anexos = só Modelo 3',
      'Duplicar = cópia privada',
      'Apagar = só se ainda não houver solicitações ligadas',
    ],
    deepLink: '/app/firm/irs',
    relatedIntents: ['service-editor', 'irs-modelo3', 'irs-problems'],
    ctaLabel: 'Ir para a área IRS',
  }),
  defineIntent({
    id: 'irs-problems',
    title: 'Problemas comuns no IRS',
    shortDescription: 'problemas IRS',
    answer:
      'Situações reais deste módulo: o serviço está criado mas não publicado; publicou no editor mas a página pública do escritório ainda é rascunho; procurou o pedido na lista IRS ou na Central em vez de Solicitações; tentou publicar com perguntas de escolha vazias; repetiu Nome/Email/Telefone/NIF no formulário; tentou apagar um serviço com solicitações; esperava que Guardar no Modelo 3 publicasse o serviço.',
    steps: [
      'Estado da campanha no topo: lê se já há serviços publicados',
      'Falta o site? Definições → Página pública → Publicar',
      'Falta o serviço no site? Editar → Publicação → slug + marcar + Guardar',
      'Pedidos: Serviços → Solicitações',
    ],
    deepLink: '/app/firm/irs',
    relatedIntents: ['irs-publish', 'irs-track', 'public-page', 'service-form'],
    commonProblems: [
      {
        id: 'empty',
        title: 'A lista da direita está vazia',
        answer:
          'Ainda não há serviços IRS. Active um modelo à esquerda ou use «Criar serviço» / «Modelo 3». Pesquisar na esquerda só filtra modelos que ainda não activou.',
      },
      {
        id: 'cannot-save',
        title: 'Não consigo guardar no editor completo',
        answer:
          'O nome é obrigatório. A duração tem de estar entre 15 e 480 minutos. Perguntas reservadas (Nome, Email, Telefone, NIF e equivalentes) bloqueiam o guardar. Erros de rede mostram «Não foi possível guardar».',
      },
      {
        id: 'permissions',
        title: 'Não vejo Pagamentos ou não ligo a Stripe',
        answer:
          'Ligar a Stripe Connect só o responsável (dono) do escritório pode fazer, em Definições → Pagamentos. Pode configurar transferência ou Multibanco no serviço; cartão e MB WAY pedem a conta Stripe pronta.',
      },
    ],
  }),
]
