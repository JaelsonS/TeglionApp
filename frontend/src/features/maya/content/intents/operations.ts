import { defineIntent } from '@/features/maya/content/types'

export const OPS_INTENTS = [
  defineIntent({
    id: 'documents',
    title: 'Como funcionam os documentos?',
    shortDescription: 'hub de documentos',
    answer:
      'Documentos tem três secções: Pedidos (pedir formalmente ao cliente), Ficheiros (o que já chegou, por cliente e período) e Histórico (rasto de submissões). O cliente envia pelo portal. Não misture com Mensagens: o chat serve para conversa; um pedido formal cria um rasto operacional.',
    steps: [
      'Em Pedidos, escolha o cliente e o que falta',
      'O cliente recebe no portal',
      'Consulte Ficheiros quando o documento chegar',
      'Use Histórico para o passado',
    ],
    deepLink: '/app/firm/documents/requests',
    relatedIntents: ['documents-requests', 'documents-files', 'documents-history', 'clients', 'messages'],
    nextSteps: [{ label: 'Fazer um pedido', intentId: 'documents-requests' }],
  }),
  defineIntent({
    id: 'documents-requests',
    title: 'Como pedir um documento?',
    shortDescription: 'pedidos formais',
    answer:
      'Em Documentos → Pedidos cria um pedido formal para um cliente da carteira. O cliente vê no portal e envia o ficheiro. Isto é diferente dos documentos «Pedir logo» dum serviço público: aqueles disparam na submissão do formulário da página pública; estes são pedidos à carteira já existente.',
    steps: [
      'Abra Documentos → Pedidos',
      'Escolha o cliente',
      'Indique o documento e envie o pedido',
      'Acompanhe pendentes e concluídos',
    ],
    deepLink: '/app/firm/documents/requests',
    relatedIntents: ['documents', 'clients', 'irs-form-questions'],
    ctaLabel: 'Abrir Pedidos',
  }),
  defineIntent({
    id: 'documents-files',
    title: 'Onde estão os ficheiros recebidos?',
    shortDescription: 'ficheiros',
    answer:
      'Em Documentos → Ficheiros estão os ficheiros já recebidos, por cliente e período. Use esta secção para consultar o arquivo corrente, não para criar o pedido inicial.',
    steps: ['Abra Documentos → Ficheiros', 'Escolha o cliente e o período', 'Abra o ficheiro de que precisa'],
    deepLink: '/app/firm/documents/files',
    relatedIntents: ['documents', 'documents-history'],
    ctaLabel: 'Abrir Ficheiros',
  }),
  defineIntent({
    id: 'documents-history',
    title: 'O que é o histórico de documentos?',
    shortDescription: 'histórico',
    answer:
      'O Histórico junta as submissões ao longo do tempo — o rasto do que foi pedido e entregue. Serve para contexto antigo e conferência, não para o trabalho do dia.',
    steps: ['Abra Documentos → Histórico', 'Filtre por cliente e período', 'Abra o evento que precisa'],
    deepLink: '/app/firm/documents/history',
    relatedIntents: ['documents', 'documents-files'],
    ctaLabel: 'Abrir Histórico',
  }),
  defineIntent({
    id: 'obligations',
    title: 'Obrigações vs tarefas — qual a diferença?',
    shortDescription: 'tarefas e obrigações',
    answer:
      'Obrigações são prazos e entregas dos clientes (IVA, IRS, Segurança Social…), muitas vezes alimentadas pelo Calendário fiscal. Tarefas são o trabalho interno da equipa. No Gestor de Operações: Resumo, Obrigações, Tarefas, Calendário e vista por cliente. «Nova tarefa» cria trabalho interno, não uma obrigação fiscal.',
    steps: [
      'Use Obrigações para prazos dos clientes',
      'Use Tarefas para trabalho interno',
      'Alterne as vistas no topo',
      'Abra o Calendário fiscal para prazos nacionais',
    ],
    deepLink: '/app/firm/tasks/overview',
    relatedIntents: ['tasks-manual', 'fiscal-calendar', 'clients', 'documents'],
    nextSteps: [
      { label: 'Tarefas internas', intentId: 'tasks-manual' },
      { label: 'Calendário fiscal', intentId: 'fiscal-calendar' },
    ],
  }),
  defineIntent({
    id: 'tasks-manual',
    title: 'Como criar uma tarefa?',
    shortDescription: 'tarefas internas',
    answer:
      'Em Tarefas (vista manual) cria trabalho interno: título, descrição, prazo, prioridade, cliente, responsável e, se quiser, ligação a uma obrigação e recorrência. Há vista de quadro e de grelha. Isto não substitui Obrigações dos Clientes.',
    steps: [
      'Abra Tarefas ou clique em Nova tarefa no Painel',
      'Preencha o título (o essencial)',
      'Associe cliente e responsável se já souber',
      'Guarde e acompanhe no quadro ou na grelha',
    ],
    deepLink: '/app/firm/tasks/manual',
    relatedIntents: ['obligations', 'clients'],
    ctaLabel: 'Abrir Tarefas',
    fields: [
      {
        id: 'title',
        name: 'Título',
        meaning: 'O que a equipa tem de fazer.',
        example: 'Pedir IES ao cliente X',
        required: true,
      },
      {
        id: 'description',
        name: 'Descrição',
        meaning: 'Detalhe interno, opcional.',
      },
      {
        id: 'dueDate',
        name: 'Prazo',
        meaning: 'Quando deve estar feita.',
      },
      {
        id: 'priority',
        name: 'Prioridade',
        meaning: 'Ajuda a ordenar o quadro. O valor inicial no formulário é NORMAL.',
      },
      {
        id: 'client',
        name: 'Cliente',
        meaning: 'Opcional. Liga a tarefa a uma empresa da carteira.',
      },
      {
        id: 'assignee',
        name: 'Responsável',
        meaning: 'Quem na equipa fica com a tarefa.',
      },
      {
        id: 'recurrence',
        name: 'Recorrência',
        meaning: 'NONE por omissão. Use só se a tarefa se repetir de propósito.',
      },
    ],
  }),
  defineIntent({
    id: 'fiscal-calendar',
    title: 'Como usar o calendário fiscal?',
    shortDescription: 'calendário fiscal',
    answer:
      'O Calendário Fiscal guarda prazos do escritório: importe o modelo Portugal, crie eventos e categorias, defina recorrência (mensal, trimestral, anual). Pode editar só uma ocorrência quando precisar. Alimenta a disciplina de prazos — as obrigações da carteira acompanham-se em Obrigações dos Clientes.',
    steps: [
      'Importe o modelo Portugal ou crie eventos',
      'Configure categorias e cores',
      'Defina recorrência quando fizer sentido',
      'Acompanhe os próximos prazos no resumo',
    ],
    deepLink: '/app/firm/fiscal-calendar',
    relatedIntents: ['obligations', 'tour'],
    ctaLabel: 'Abrir Calendário fiscal',
  }),
  defineIntent({
    id: 'agenda',
    title: 'Como usar a agenda?',
    shortDescription: 'agenda e reuniões',
    answer:
      'Na Agenda marca eventos com clientes da carteira (título, data, notas, serviço, responsável). Vistas de semana e mês. O botão Definições abre disponibilidade para a página pública e o Google Calendar. Criar um evento interno não chega para o site oferecer horários — isso é disponibilidade + serviço com «Exige agendamento» publicado.',
    steps: [
      'Abra Agenda',
      'Crie um evento ou abra Definições',
      'Para o site: grave disponibilidade e publique um serviço com agendamento',
      'Opcional: ligar Google Calendar',
    ],
    deepLink: '/app/firm/agenda',
    relatedIntents: ['booking', 'agenda-google', 'service'],
    fields: [
      {
        id: 'client',
        name: 'Cliente',
        meaning: 'Empresa da carteira com quem é a reunião.',
      },
      {
        id: 'title',
        name: 'Título',
        meaning: 'Nome do evento. O valor inicial no formulário é «Consulta fiscal».',
        example: 'Reunião IVA 1.º trimestre',
      },
      {
        id: 'when',
        name: 'Data e hora',
        meaning: 'Quando acontece a reunião.',
        required: true,
      },
      {
        id: 'service',
        name: 'Serviço',
        meaning: 'Opcional. Liga o evento a um serviço do catálogo.',
      },
      {
        id: 'assignee',
        name: 'Responsável',
        meaning: 'Quem da equipa participa.',
      },
      {
        id: 'notes',
        name: 'Notas',
        meaning: 'Contexto interno, opcional.',
      },
    ],
    nextSteps: [{ label: 'Agendamento no site', intentId: 'booking' }],
  }),
  defineIntent({
    id: 'booking',
    title: 'Como configurar o agendamento público?',
    shortDescription: 'marcação na página pública',
    answer:
      'O visitante só marca horário se: (1) em Agenda → Definições a disponibilidade estiver gravada (dias, intervalos, fuso, duração do slot, horizonte em dias); (2) o serviço tiver «Exige agendamento» e estiver publicado; (3) a página pública estiver publicada. Definições da agenda também lista os serviços e liga o Google Calendar. «Guardar disponibilidade» grava os horários — não publica o site.',
    steps: [
      'Agenda → Definições',
      'Defina dias, horas, fuso, minutos por slot e horizonte',
      'Clique em Guardar disponibilidade',
      'No serviço, ligue Exige agendamento e publique',
      'Teste o horário na página pública',
    ],
    deepLink: '/app/firm/agenda?panel=settings',
    relatedIntents: ['agenda', 'agenda-google', 'service', 'public-page'],
    ctaLabel: 'Abrir Definições da agenda',
    fields: [
      {
        id: 'schedule',
        name: 'Dias e horário',
        meaning: 'Intervalos em que o escritório aceita marcações (ex.: segunda a sexta, 09:00–17:00).',
        usedWhere: 'Horários oferecidos na página pública.',
      },
      {
        id: 'tz',
        name: 'Fuso horário',
        meaning: 'Fuso dos slots. O habitual em Portugal é Europe/Lisbon.',
      },
      {
        id: 'slot',
        name: 'Duração do intervalo (slot)',
        meaning: 'Minutos de cada horário oferecido ao cliente.',
        example: '30',
      },
      {
        id: 'horizon',
        name: 'Horizonte (dias)',
        meaning: 'Até quantos dias à frente o visitante pode marcar.',
        example: '14',
      },
    ],
    nextSteps: [{ label: 'Google Calendar', intentId: 'agenda-google' }],
  }),
  defineIntent({
    id: 'agenda-google',
    title: 'Ligar o Google Calendar',
    shortDescription: 'Google Calendar',
    answer:
      'Em Agenda → Definições, Google Calendar sincroniza os agendamentos do Teglion com a sua conta Google. Estados: desligado, ligado, ou precisa reconectar. Se a integração não estiver disponível neste ambiente, o painel indica-o. Ligar é opcional — a agenda do Teglion funciona na mesma.',
    steps: [
      'Abra Agenda → Definições',
      'Na zona Google Calendar, clique em Ligar',
      'Autorize a conta Google',
      'Se aparecer «precisa reconectar», volte a autorizar',
    ],
    deepLink: '/app/firm/agenda?panel=settings',
    relatedIntents: ['agenda', 'booking'],
    ctaLabel: 'Abrir Definições da agenda',
  }),
]
