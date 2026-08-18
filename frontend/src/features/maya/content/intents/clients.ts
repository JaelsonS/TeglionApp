import {
  CLIENT_CREATE_FIELDS,
  CLIENT_LIST_FIELDS,
  pickClientFields,
} from '@/features/maya/content/intents/clientFields'
import { defineIntent } from '@/features/maya/content/types'

const IDENTIFICATION_FIELD_IDS = [
  'clientType',
  'taxId',
  'legalName',
  'displayName',
  'legalForm',
  'phone',
  'email',
  'postalCode',
  'locality',
  'parish',
  'street',
]

const FISCAL_FIELD_IDS = [
  'accountingType',
  'activityStartDate',
  'shareCapital',
  'caePrimary',
  'caeSecondary',
  'caeSecondary2',
  'vatRegime',
  'vatExemptionReason',
  'irsFramework',
  'socialSecurityArea',
  'socialSecurityOneYearExemption',
  'socialSecurityStartDate',
  'socialSecurityQuarterlyDeclaration',
]

const SINGULAR_FIELD_IDS = ['spouse', 'irsDelivery', 'validateEInvoice', 'communicateHousehold']

const OWNERS_FIELD_IDS = [
  'assignedStaff',
  'contactName',
  'contactRole',
  'contactEmail',
  'contactPhone',
]

export const CLIENT_INTENTS = [
  defineIntent({
    id: 'clients',
    title: 'O que é esta área de Clientes?',
    shortDescription: 'módulo Clientes',
    answer:
      'Está na carteira do escritório — os clientes que a sua equipa administra no Teglion. Não é o portal do cliente: o portal é a área onde o próprio cliente entra, depois de convite. Aqui cadastra, procura, filtra e abre a ficha de cada empresa ou particular. O botão «Novo cliente» abre o assistente de cadastro neste ecrã (não existe uma página /clients/new). Clicar num cliente abre a ficha em /app/firm/clients/… com Resumo, Perfil, Acessos, Actividade, Obrigações, Documentos, Tarefas e Comunicação. «Ficha CSV» exporta a carteira (sem senhas) ou importa um modelo de texto; células vazias não apagam dados e .xlsx/macros são recusados.',
    steps: [
      'Se a lista estiver vazia, clique em Novo cliente',
      'Use a pesquisa ou os filtros para encontrar um cliente existente',
      'Abra a ficha para continuar o trabalho (documentos, obrigações, mensagens)',
      'Convide ao portal só quando o cadastro tiver e-mail',
    ],
    deepLink: '/app/firm/clients',
    relatedIntents: [
      'clients-create',
      'clients-search',
      'clients-filters',
      'clients-list',
      'client-hub',
      'clients-invite',
    ],
    followUpPrompt: 'O que quer fazer?',
    ctaLabel: 'Ir para Clientes',
    nextSteps: [
      { label: 'Criar cliente', intentId: 'clients-create' },
      { label: 'Procurar cliente', intentId: 'clients-search' },
      { label: 'Entender filtros', intentId: 'clients-filters' },
      { label: 'Abrir a ficha', intentId: 'client-hub' },
      { label: 'O que fazer depois', intentId: 'clients-next-steps' },
    ],
  }),
  defineIntent({
    id: 'clients-list',
    title: 'Como ler a lista de clientes?',
    shortDescription: 'lista de clientes',
    answer:
      'A vista em lista (computador) mostra: selecção, Cliente (nome, NIF, etiquetas), Tipo, Regime IVA, Obrigações pendentes, Última actividade, Estado e o menu ⋯. Em telemóvel a vista é sempre em grelha (cartões). A paginação mostra 12 clientes por página. Clique na linha ou no cartão para abrir a ficha. O menu ⋯ tem Abrir cockpit, Mensagem (abre Mensagens já filtradas neste cliente) e Arquivar.',
    steps: [
      'Confirme se está em lista ou grelha (no telemóvel só há grelha)',
      'Clique no nome para abrir a ficha',
      'Use ⋯ para mensagem ou para remover da carteira',
      'Seleccione vários para «Gerar e enviar convite»',
    ],
    deepLink: '/app/firm/clients',
    relatedIntents: ['clients-search', 'clients-filters', 'client-hub', 'clients-archive', 'clients-invite'],
    fields: CLIENT_LIST_FIELDS,
    ctaLabel: 'Ir para Clientes',
    nextSteps: [
      { label: 'Procurar', intentId: 'clients-search' },
      { label: 'Filtros', intentId: 'clients-filters' },
      { label: 'Arquivar', intentId: 'clients-archive' },
    ],
  }),
  defineIntent({
    id: 'clients-search',
    title: 'Como procurar um cliente?',
    shortDescription: 'pesquisa de clientes',
    answer:
      'O campo «Procurar por nome ou NIF…» filtra a lista no instante em que escreve — não precisa de Enter. O Teglion compara o texto com nome, nome completo, NIF, e-mail e telefone. É uma pesquisa nesta página (os clientes já carregados), não uma pesquisa no portal do cliente. Para limpar, apague o texto. Se não houver resultados e já existirem clientes, vê «Nenhum cliente neste filtro». Se a carteira estiver vazia, vê «Ainda não tem clientes».',
    steps: [
      'Clique no campo de pesquisa',
      'Escreva nome, NIF, e-mail ou telefone',
      'Abra o resultado',
      'Apague o texto para voltar à lista completa (ainda sujeita aos filtros)',
    ],
    deepLink: '/app/firm/clients',
    relatedIntents: ['clients-filters', 'clients-list', 'clients-create'],
    fields: pickClientFields(CLIENT_LIST_FIELDS, ['search']),
    ctaLabel: 'Ir para Clientes',
    commonProblems: [
      {
        id: 'no-results',
        title: 'Não encontro o cliente',
        answer:
          'Confirme se o filtro Estado não está em Ativos (predefinição) — um cliente removido da carteira só aparece em Inativos ou Todos. Limpe também tipo, regime, etiqueta e a pesquisa.',
      },
    ],
  }),
  defineIntent({
    id: 'clients-filters',
    title: 'Como funcionam os filtros?',
    shortDescription: 'filtros de clientes',
    answer:
      'Há quatro filtros. Tipo: Todos, Lda, SA, ENI ou Outro. Regime: filtra o regime de IVA normalizado na lista. Estado: Ativos (predefinição — esconde inactivos e os que estão em atenção/crítico), Atenção, Inativos ou Todos. Etiqueta: só aparece se o escritório tiver etiquetas. Combinam-se com a pesquisa. Para limpar, volte cada filtro a Todos / Ativos / Todas e apague a pesquisa. A paginação volta à página 1 sempre que muda um filtro.',
    steps: [
      'Escolha Tipo se quiser só Lda, SA, ENI ou Outro',
      'Escolha Regime se quiser um IVA específico',
      'Use Estado: Inativos para ver quem foi removido da carteira activa',
      'Use Etiqueta só se o filtro estiver visível',
    ],
    deepLink: '/app/firm/clients',
    relatedIntents: ['clients-search', 'clients-list', 'clients-archive'],
    fields: pickClientFields(CLIENT_LIST_FIELDS, [
      'filter-type',
      'filter-vat',
      'filter-status',
      'filter-tag',
    ]),
    ctaLabel: 'Ir para Clientes',
  }),
  defineIntent({
    id: 'clients-create',
    title: 'Vamos cadastrar um cliente',
    shortDescription: 'criar cliente',
    answer:
      'O cadastro é o assistente «Adicionar novo cliente», aberto por «Novo cliente». Passos: Identificação → Fiscal → Pessoa Singular (só Independente e Particular) → Responsáveis → Serviços. Em cada passo use Continuar; no último o botão passa a «Criar cliente». Cancelar ou o X fecham sem criar. Depois de criar, o assistente fecha, a lista actualiza e vê o aviso «Cliente criado com sucesso» — a ficha não abre sozinha.',
    steps: [
      'Clique em Novo cliente',
      'Escolha o tipo — os campos seguintes mudam',
      'Valide o NIF antes de Continuar',
      'Complete Fiscal e, se aparecer, Pessoa Singular',
      'Indique o responsável da equipa',
      'Marque serviços se já existirem no catálogo',
      'Clique em Criar cliente',
    ],
    deepLink: '/app/firm/clients?create=1',
    relatedIntents: [
      'clients-create-identification',
      'clients-create-fiscal',
      'clients-create-singular',
      'clients-create-owners',
      'clients-create-services',
      'clients-create-save',
      'clients-next-steps',
    ],
    fields: CLIENT_CREATE_FIELDS,
    followUpPrompt: 'Que parte do cadastro quer perceber?',
    ctaLabel: 'Abrir cadastro',
    nextSteps: [
      { label: 'Dados pessoais e morada', intentId: 'clients-create-identification' },
      { label: 'Dados fiscais', intentId: 'clients-create-fiscal' },
      { label: 'Pessoa Singular', intentId: 'clients-create-singular' },
      { label: 'Responsáveis', intentId: 'clients-create-owners' },
      { label: 'Serviços e notas', intentId: 'clients-create-services' },
      { label: 'Como guardar', intentId: 'clients-create-save' },
    ],
    commonProblems: [
      {
        id: 'cannot-continue',
        title: 'Não consigo avançar',
        answer:
          'No passo Identificação o assistente exige tipo, NIF validado, nome, morada e código postal válido (0000-000) e localidade. No Fiscal exige o enquadramento visível para aquele tipo. Nos Responsáveis exige o membro da equipa.',
      },
    ],
  }),
  defineIntent({
    id: 'clients-create-identification',
    title: 'Como preencher a identificação?',
    shortDescription: 'passo identificação',
    answer:
      'É o primeiro passo. Tipo de cliente muda o resto do formulário. NIF: escreva os 9 dígitos e clique em Validar NIF — sem isto o Continuar falha. Nome: designação social ou nome da pessoa. Empresa mostra ainda nome comercial e forma jurídica. Morada: comece pelo código postal (formato 0000-000) para sugerir localidade e freguesia; a morada é obrigatória. Telefone e e-mail são opcionais neste passo, mas o e-mail vai ser preciso para o portal.',
    steps: [
      'Escolha o tipo',
      'Valide o NIF',
      'Preencha o nome',
      'Preencha código postal, localidade e morada',
      'Continuar',
    ],
    deepLink: '/app/firm/clients?create=1',
    relatedIntents: ['clients-create', 'clients-create-fiscal'],
    fields: pickClientFields(CLIENT_CREATE_FIELDS, IDENTIFICATION_FIELD_IDS),
    ctaLabel: 'Abrir cadastro',
    nextSteps: [{ label: 'Passo fiscal', intentId: 'clients-create-fiscal' }],
  }),
  defineIntent({
    id: 'clients-create-fiscal',
    title: 'Como preencher os dados fiscais?',
    shortDescription: 'passo fiscal',
    answer:
      'O passo Fiscal pede o enquadramento que o escritório usa internamente. Empresa e Independente: tipo de contabilidade, início de actividade e CAE principal são obrigatórios; capital social e CAE secundários são opcionais. Empresa (não Particular): regime de IVA obrigatório; se for Isento, o motivo também. IRS/IRC é obrigatório. Segurança Social (área, isenção de 1 ano, data, declaração trimestral) é opcional. Particular não vê os campos de empresa (CAE, contabilidade, IVA de empresa). Isto não calcula impostos nem substitui a Autoridade Tributária.',
    steps: [
      'Preencha o que estiver visível e obrigatório',
      'Se o IVA for Isento, indique o motivo',
      'A Segurança Social pode ficar em branco',
      'Continuar',
    ],
    deepLink: '/app/firm/clients?create=1',
    relatedIntents: ['clients-create', 'clients-create-singular', 'clients-create-identification'],
    fields: pickClientFields(CLIENT_CREATE_FIELDS, FISCAL_FIELD_IDS),
    ctaLabel: 'Abrir cadastro',
    nextSteps: [
      { label: 'Pessoa Singular', intentId: 'clients-create-singular' },
      { label: 'Responsáveis', intentId: 'clients-create-owners' },
    ],
  }),
  defineIntent({
    id: 'clients-create-singular',
    title: 'O que é o passo Pessoa Singular?',
    shortDescription: 'passo pessoa singular',
    answer:
      'Este passo só aparece se o tipo for Trabalhador Independente ou Particular. Tem quatro perguntas Sim/Não: cônjuge, entrega de IRS, validar e-Fatura e comunicar agregado familiar. São notas de cadastro — nenhuma envia a declaração de IRS nem abre a campanha IRS. Se o tipo for Empresa, este passo não existe e o assistente segue de Fiscal para Responsáveis.',
    steps: [
      'Confirme que o tipo é Independente ou Particular',
      'Responda às quatro perguntas se souber',
      'Continuar para Responsáveis',
    ],
    deepLink: '/app/firm/clients?create=1',
    relatedIntents: ['clients-create', 'irs-campaign', 'clients-create-owners'],
    fields: pickClientFields(CLIENT_CREATE_FIELDS, SINGULAR_FIELD_IDS),
    ctaLabel: 'Abrir cadastro',
    nextSteps: [{ label: 'Responsáveis', intentId: 'clients-create-owners' }],
  }),
  defineIntent({
    id: 'clients-create-owners',
    title: 'Como indicar responsáveis?',
    shortDescription: 'passo responsáveis',
    answer:
      'Responsável na equipa é obrigatório — escolhe um membro da lista da equipa do escritório. Abaixo, o contacto principal no cliente (nome, função, e-mail, telefone) é opcional e não substitui o e-mail do cadastro usado no convite ao portal.',
    steps: [
      'Escolha o membro da equipa',
      'Preencha o contacto no cliente se já o conhecer',
      'Continuar',
    ],
    deepLink: '/app/firm/clients?create=1',
    relatedIntents: ['clients-create', 'clients-create-services'],
    fields: pickClientFields(CLIENT_CREATE_FIELDS, OWNERS_FIELD_IDS),
    ctaLabel: 'Abrir cadastro',
    nextSteps: [{ label: 'Serviços e notas', intentId: 'clients-create-services' }],
  }),
  defineIntent({
    id: 'clients-create-services',
    title: 'Como associar serviços no cadastro?',
    shortDescription: 'passo serviços',
    answer:
      'Último passo: caixas dos serviços activos do catálogo. Marcar associa internamente este cliente a esses serviços — não publica na página pública e não cria um pedido. Se não houver serviços activos, o assistente avisa e o cliente nasce sem serviços pré-seleccionados. Os serviços do catálogo criam-se em Serviços. No mesmo passo há Observações (notas internas). O botão final é «Criar cliente».',
    steps: [
      'Marque os serviços que este cliente já tem, se existirem',
      'Escreva notas internas se precisar',
      'Clique em Criar cliente',
    ],
    deepLink: '/app/firm/clients?create=1',
    relatedIntents: ['clients-create-save', 'client-services', 'service'],
    fields: pickClientFields(CLIENT_CREATE_FIELDS, ['services', 'notes']),
    ctaLabel: 'Abrir cadastro',
    nextSteps: [{ label: 'O que acontece ao guardar', intentId: 'clients-create-save' }],
  }),
  defineIntent({
    id: 'clients-create-save',
    title: 'O que acontece quando crio o cliente?',
    shortDescription: 'guardar cadastro',
    answer:
      '«Criar cliente» volta a validar a identificação. Se estiver incompleta, o assistente regressa a esse passo. Se estiver válida, envia o cadastro, mostra «Cliente criado com sucesso», fecha o assistente e recarrega a lista. Não abre a ficha, não envia convite ao portal e não cria documentos. Se falhar, vê «Não foi possível criar o cliente» com o detalhe do erro. Continuar nos passos intermédios só valida e avança — ainda não cria o cliente. Cancelar descarta tudo.',
    steps: [
      'No último passo clique em Criar cliente',
      'Espere o aviso de sucesso',
      'Encontre o cliente na lista e abra a ficha',
    ],
    deepLink: '/app/firm/clients?create=1',
    relatedIntents: ['clients-next-steps', 'clients-problems', 'client-hub'],
    ctaLabel: 'Ir para Clientes',
    nextSteps: [
      { label: 'Próximo passo recomendado', intentId: 'clients-next-steps' },
      { label: 'Abrir a ficha', intentId: 'client-hub' },
    ],
  }),
  defineIntent({
    id: 'clients-next-steps',
    title: 'Cadastrei o cliente. E agora?',
    shortDescription: 'depois de criar',
    answer:
      'O cliente já está na carteira. Abra a ficha (clique no nome) para completar o que faltar no Perfil — as alterações lá guardam automaticamente. Depois: convide ao portal se houver e-mail; peça documentos em Documentos → Pedidos (a tab Documentos da ficha só lista pedidos deste cliente); associe ou ajuste serviços no Perfil; crie obrigações e tarefas nos módulos respectivos, já filtrados a partir da ficha. Solicitações de pessoas novas ficam em Serviços → Solicitações; pedidos de clientes que já usam a app ficam em Serviços → Central. Um formulário de IRS não se envia desta lista: configura-se em IRS, publica-se, e a resposta chega em Solicitações.',
    steps: [
      'Abra a ficha do cliente na lista',
      'Confirme e-mail e dados no Perfil',
      'Convide ao portal se fizer sentido',
      'Peça documentos ou configure serviços conforme o trabalho',
    ],
    deepLink: '/app/firm/clients',
    relatedIntents: [
      'client-hub',
      'clients-invite',
      'client-documents',
      'client-services',
      'client-requests',
      'irs-send',
    ],
    ctaLabel: 'Ir para Clientes',
    nextSteps: [
      { label: 'Ficha do cliente', intentId: 'client-hub' },
      { label: 'Convite ao portal', intentId: 'clients-invite' },
      { label: 'Documentos deste cliente', intentId: 'client-documents' },
      { label: 'Serviços deste cliente', intentId: 'client-services' },
      { label: 'Solicitações', intentId: 'client-requests' },
    ],
  }),
  defineIntent({
    id: 'clients-invite',
    title: 'Como convidar o cliente ao portal?',
    shortDescription: 'acesso ao portal',
    answer:
      'O portal é a área do cliente, distinta desta carteira. Na lista, seleccione um ou mais clientes e use «Gerar e enviar convite». Na ficha: se ainda não tiver acesso, o botão de convite; se o acesso estiver activo ou revogado, «Gerir acesso». Pode copiar o link. Sem e-mail válido no cadastro, o convite por correio não segue — complete o e-mail no Perfil. Revogar corta o acesso e as sessões, mas não apaga a ficha, documentos, histórico nem mensagens. Reemitir gera um link novo. Um convite pendente não é o mesmo que acesso activo.',
    steps: [
      'Confirme o e-mail no cadastro',
      'Na ficha, convide ou copie o link',
      'Ou, na lista, seleccione e use Gerar e enviar convite',
      'Se expirar, reenvie; se deixar de precisar, revogue',
    ],
    deepLink: '/app/firm/clients',
    relatedIntents: ['client-hub', 'client-profile', 'messages'],
    ctaLabel: 'Ir para Clientes',
    commonProblems: [
      {
        id: 'no-email',
        title: 'O convite pede e-mail',
        answer:
          'Abra a ficha → Editar (Perfil) e preencha o e-mail do cadastro. O e-mail do contacto principal não substitui este campo.',
      },
    ],
  }),
  defineIntent({
    id: 'clients-archive',
    title: 'O que faz «Remover da carteira»?',
    shortDescription: 'arquivar cliente',
    answer:
      'No menu ⋯ da lista, «Arquivar» abre a confirmação «Remover da carteira?». Confirmar marca o cliente como inactivo: deixa de aparecer na lista activa (filtro Estado: Ativos). Continua encontrável em Estado: Inativos ou Todos. Não é o mesmo que revogar o portal. Nesta lista não existe botão para reactivar. A acção pede confirmação; o texto do diálogo diz que deixa de aparecer na lista activa.',
    steps: [
      'Abra ⋯ na linha do cliente',
      'Escolha Arquivar',
      'Confirme Remover da carteira',
      'Para o voltar a ver, use Estado: Inativos',
    ],
    deepLink: '/app/firm/clients',
    relatedIntents: ['clients-filters', 'clients-invite', 'client-actions'],
    ctaLabel: 'Ir para Clientes',
  }),
  defineIntent({
    id: 'clients-problems',
    title: 'Problemas comuns em Clientes',
    shortDescription: 'problemas clientes',
    answer:
      'Lista vazia: ainda não criou clientes, ou os filtros/pesquisa escondem resultados. Não avança no assistente: NIF por validar, tipo, nome, morada, código postal, enquadramento fiscal ou responsável em falta. Convite falha: falta e-mail no cadastro. Não encontra um cliente «desaparecido»: está inactivo — mude o filtro Estado. Remover da carteira não é revogar o portal. Solicitações não estão nesta lista: estão em Serviços. A Maya não ensina a contornar permissões da equipa.',
    steps: [
      'Limpe pesquisa e filtros',
      'Valide o NIF no assistente',
      'Complete o e-mail antes do convite',
      'Use Estado: Inativos se o cliente saiu da lista activa',
    ],
    deepLink: '/app/firm/clients',
    relatedIntents: ['clients-create', 'clients-search', 'clients-invite', 'clients-archive'],
    ctaLabel: 'Ir para Clientes',
    commonProblems: [
      {
        id: 'empty',
        title: 'Ainda não tem clientes',
        answer: 'Clique em Novo cliente e complete o assistente. Depois o cliente aparece nesta lista.',
      },
      {
        id: 'hidden-by-filter',
        title: 'A lista diz que não há clientes neste filtro',
        answer: 'Há clientes na carteira, mas a pesquisa ou os filtros escondem-nos. Limpe os filtros ou mude o Estado.',
      },
      {
        id: 'nif',
        title: 'O NIF não passa',
        answer: 'Tem de ter 9 dígitos e dígito de controlo válido. Clique em Validar NIF antes de Continuar.',
      },
    ],
  }),
]
