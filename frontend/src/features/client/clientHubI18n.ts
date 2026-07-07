import type { AppLocale } from '@/shared/i18n/appLocale'

export type ClientHubLocale = 'pt-PT' | 'pt-BR' | 'es-ES' | 'en'

export type ClientHubCopy = {
  tabs: {
    home: string
    obligations: string
    tasks: string
    documents: string
    requests: string
    messages: string
    archive: string
    booking: string
    news: string
    services: string
    alerts: string
  }
  home: {
    greeting: string
    period: string
    statusOk: string
    statusPending: string
    cardObligations: string
    cardTasks: string
    cardDocuments: string
    cardMessages: string
    actionRequired: string
    viewAllTasks: string
    complete: string
    uploadCta: string
    nextObligation: string
    fiscalOk: string
    fiscalAttention: string
    fiscalCritical: string
    fiscalStatus: string
    allClear: string
    upcomingConsultations: string
    scheduleAnother: string
  }
  obligations: {
    empty: string
    due: string
    upload: string
    delivered: string
    deliver: string
    instruction: string
    amount: string
    markPaid: string
    viewDoc: string
    accountantNotes: string
  }
  news: { empty: string; readMore: string; featured: string; search: string; readingTime: string }
  messages: { empty: string; placeholder: string; send: string }
  booking: {
    emptyServices: string
    pickService: string
    priceLabel: string
    slotsTitle: string
    loadingSlots: string
    noSlots: string
    reserved: string
    confirmError: string
    myUpcoming: string
    noMyUpcoming: string
  }
  tasks: { empty: string; markDone: string; sendDoc: string; due: string }
  documents: {
    uploadTitle: string
    uploadHint: string
    uploading: string
    linkedTask: string
    linkedObligation: string
    open: string
    historyByMonth: string
    empty: string
    workflow: string
    sentBy: string
    fromFirm: string
    myUploads: string
    fromFirmEmpty: string
  }
  refresh: string
  refreshing: string
  status: Record<string, string>
  loading: string
  loadError: string
  taskDone: string
  uploadSuccess: string
  uploadError: string
  taskError: string
}

const COPY: Record<ClientHubLocale, ClientHubCopy> = {
  'pt-PT': {
    tabs: {
      home: 'Início',
      obligations: 'Agenda',
      tasks: 'Tarefas',
      documents: 'Documentos',
      requests: 'Pedidos',
      messages: 'Mensagens',
      archive: 'Ficheiro',
      booking: 'Agendar',
      news: 'Notícias',
      services: 'Serviços',
      alerts: 'Alertas',
    },
    home: {
      greeting: 'Olá',
      period: 'Período',
      statusOk: 'Em dia',
      statusPending: 'Tem pendências',
      cardObligations: 'Obrigações do mês',
      cardTasks: 'Tarefas pendentes',
      cardDocuments: 'Documentos pedidos',
      cardMessages: 'Pedidos do escritório',
      actionRequired: 'Ação necessária',
      viewAllTasks: 'Ver todas as tarefas',
      complete: 'Concluir',
      uploadCta: 'Enviar documento pedido pelo contabilista',
      nextObligation: 'Próxima obrigação',
      fiscalOk: 'Fiscal em dia',
      fiscalAttention: 'Atenção fiscal',
      fiscalCritical: 'Situação crítica',
      fiscalStatus: 'Estado fiscal',
      allClear: 'Tudo em dia neste período',
      upcomingConsultations: 'Próximas marcações',
      scheduleAnother: 'Agendar nova reunião',
    },
    obligations: {
      empty: 'Sem obrigações neste período.',
      due: 'Prazo',
      upload: 'Enviar documento',
      delivered: 'Entregue pelo escritório',
      deliver: 'Marcar como entregue',
      instruction: 'Consulte a guia, efetue o pagamento na app do seu banco e confirme aqui.',
      amount: 'Valor',
      markPaid: 'Marcar como pago',
      viewDoc: 'Ver documento / guia',
      accountantNotes: 'Notas do contabilista',
    },
    news: {
      empty: 'O escritório ainda não publicou notícias.',
      readMore: 'Ler artigo',
      featured: 'Em destaque',
      search: 'Pesquisar notícias…',
      readingTime: 'min de leitura',
    },
    messages: {
      empty: 'Sem mensagens. O escritório contactá-lo-á aqui quando precisar.',
      placeholder: 'Escreva ao escritório…',
      send: 'Enviar',
    },
    booking: {
      emptyServices: 'O escritório ainda não configurou serviços para marcação online.',
      pickService: 'Serviço',
      priceLabel: 'O preço acordado pode ser ajustado pelo escritório após a reunião.',
      slotsTitle: 'Horários disponíveis (próximos 7 dias)',
      loadingSlots: 'A carregar horários…',
      noSlots: 'Sem horários livres neste período. Tente outro serviço ou contacte o escritório.',
      reserved: 'Marcação confirmada',
      confirmError: 'Não foi possível concluir a marcação',
      myUpcoming: 'As minhas próximas reuniões',
      noMyUpcoming: 'Ainda não tem marcações. Escolha um serviço e um horário abaixo.',
    },
    tasks: { empty: 'Sem tarefas pendentes.', markDone: 'Marcar feito', sendDoc: 'Enviar ficheiro', due: 'Prazo' },
    documents: {
      uploadTitle: 'Enviar documento',
      uploadHint: 'Toque para foto ou ficheiro',
      uploading: 'A enviar…',
      linkedTask: 'Ligado à tarefa selecionada',
      linkedObligation: 'Ligado à obrigação selecionada',
      open: 'Abrir',
      historyByMonth: 'Por mês',
      empty: 'Ainda não enviou documentos neste período.',
      workflow: 'Estado',
      sentBy: 'Enviado por',
      fromFirm: 'Recebidos do escritório',
      myUploads: 'Os seus envios',
      fromFirmEmpty: 'O escritório ainda não partilhou ficheiros aqui.',
    },
    refresh: 'Actualizar',
    refreshing: 'A actualizar…',
    status: {
      PENDING: 'Pendente',
      IN_PROGRESS: 'Em tratamento',
      WAITING_CLIENT: 'Aguarda envio',
      DELIVERED: 'Concluído',
      OVERDUE: 'Em atraso',
      CANCELLED: 'Cancelada',
      OPEN: 'Aberta',
      SUBMITTED: 'Enviado',
      APPROVED: 'Concluído',
    },
    loading: 'A carregar…',
    loadError: 'Não foi possível carregar o portal',
    taskDone: 'Tarefa enviada ao escritório',
    uploadSuccess: 'Documento enviado',
    uploadError: 'Falha no envio',
    taskError: 'Não foi possível concluir a tarefa',
  },
  'pt-BR': {
    tabs: {
      home: 'Início',
      obligations: 'Agenda',
      tasks: 'Tarefas',
      documents: 'Documentos',
      requests: 'Pedidos',
      messages: 'Mensagens',
      archive: 'Arquivo',
      booking: 'Agendar',
      news: 'Notícias',
      services: 'Serviços',
      alerts: 'Alertas',
    },
    home: {
      greeting: 'Olá',
      period: 'Período',
      statusOk: 'Em dia',
      statusPending: 'Há pendências',
      cardObligations: 'Obrigações do mês',
      cardTasks: 'Tarefas pendentes',
      cardDocuments: 'Documentos solicitados',
      cardMessages: 'Pedidos do escritório',
      actionRequired: 'Ação necessária',
      viewAllTasks: 'Ver todas as tarefas',
      complete: 'Concluir',
      uploadCta: 'Enviar documento pedido pelo contador',
      nextObligation: 'Próxima obrigação',
      fiscalOk: 'Fiscal em dia',
      fiscalAttention: 'Atenção fiscal',
      fiscalCritical: 'Situação crítica',
      fiscalStatus: 'Estado fiscal',
      allClear: 'Tudo em dia neste período',
      upcomingConsultations: 'Próximos agendamentos',
      scheduleAnother: 'Agendar outra reunião',
    },
    obligations: {
      empty: 'Sem obrigações neste período.',
      due: 'Prazo',
      upload: 'Enviar documento',
      delivered: 'Entregue pelo escritório',
      deliver: 'Marcar como entregue',
      instruction: 'Envie os documentos solicitados e confirme a entrega quando estiver pronto.',
      amount: 'Valor',
      markPaid: 'Marcar como pago',
      viewDoc: 'Ver documento / guia',
      accountantNotes: 'Notas do contador',
    },
    messages: { empty: 'Sem mensagens.', placeholder: 'Escreva ao escritório…', send: 'Enviar' },
    booking: {
      emptyServices: 'O escritório ainda não definiu serviços para agendamento online.',
      pickService: 'Serviço',
      priceLabel: 'O preço pode ser ajustado pelo contador após a reunião.',
      slotsTitle: 'Horários disponíveis (próximos 7 dias)',
      loadingSlots: 'Carregando horários…',
      noSlots: 'Sem horários neste período.',
      reserved: 'Agendamento confirmado',
      confirmError: 'Não foi possível confirmar',
      myUpcoming: 'Suas próximas reuniões',
      noMyUpcoming: 'Você ainda não tem agendamentos. Escolha um serviço e um horário abaixo.',
    },
    tasks: { empty: 'Sem tarefas pendentes.', markDone: 'Marcar feito', sendDoc: 'Enviar arquivo', due: 'Prazo' },
    documents: {
      uploadTitle: 'Enviar documento',
      uploadHint: 'Toque para foto ou arquivo',
      uploading: 'Enviando…',
      linkedTask: 'Vinculado à tarefa selecionada',
      linkedObligation: 'Vinculado à obrigação selecionada',
      open: 'Abrir',
      historyByMonth: 'Por mês',
      empty: 'Ainda não enviou documentos neste período.',
      workflow: 'Estado',
      sentBy: 'Enviado por',
      fromFirm: 'Recebidos do escritório',
      myUploads: 'Os seus envios',
      fromFirmEmpty: 'O escritório ainda não partilhou ficheiros aqui.',
    },
    news: {
      empty: 'O escritório ainda não publicou notícias.',
      readMore: 'Ler artigo',
      featured: 'Em destaque',
      search: 'Pesquisar notícias…',
      readingTime: 'min de leitura',
    },
    refresh: 'Atualizar',
    refreshing: 'Atualizando…',
    status: {
      PENDING: 'Pendente',
      IN_PROGRESS: 'Em tratamento',
      WAITING_CLIENT: 'Aguardando envio',
      DELIVERED: 'Concluído',
      OVERDUE: 'Em atraso',
      CANCELLED: 'Cancelada',
      OPEN: 'Aberta',
      SUBMITTED: 'Enviado',
      APPROVED: 'Concluído',
    },
    loading: 'Carregando…',
    loadError: 'Não foi possível carregar o portal',
    taskDone: 'Tarefa enviada ao escritório',
    uploadSuccess: 'Documento enviado',
    uploadError: 'Falha no envio',
    taskError: 'Não foi possível concluir a tarefa',
  },
  'es-ES': {
    tabs: {
      home: 'Inicio',
      obligations: 'Agenda',
      tasks: 'Tareas',
      documents: 'Documentos',
      requests: 'Solicitudes',
      messages: 'Mensagens',
      archive: 'Archivo',
      booking: 'Agendar',
      news: 'Noticias',
      services: 'Servicios',
      alerts: 'Alertas',
    },
    home: {
      greeting: 'Hola',
      period: 'Período',
      statusOk: 'Al día',
      statusPending: 'Tiene pendientes',
      cardObligations: 'Obligaciones del mes',
      cardTasks: 'Tareas pendientes',
      cardDocuments: 'Documentos solicitados',
      cardMessages: 'Mensajes',
      actionRequired: 'Acción necesaria',
      viewAllTasks: 'Ver todas las tareas',
      complete: 'Completar',
      uploadCta: 'Enviar documento solicitado',
      nextObligation: 'Próxima obligación',
      fiscalOk: 'Fiscal al día',
      fiscalAttention: 'Atención fiscal',
      fiscalCritical: 'Situación crítica',
      fiscalStatus: 'Estado fiscal',
      allClear: 'Todo al día en este período',
      upcomingConsultations: 'Próximas citas',
      scheduleAnother: 'Agendar otra reunión',
    },
    obligations: {
      empty: 'Sin obligaciones en este período.',
      due: 'Plazo',
      upload: 'Enviar documento',
      delivered: 'Entregado por la asesoría',
      deliver: 'Marcar como entregado',
      instruction: 'Envíe los documentos solicitados y confirme la entrega.',
      amount: 'Importe',
      markPaid: 'Marcar como pagado',
      viewDoc: 'Ver documento / guía',
      accountantNotes: 'Notas del asesor',
    },
    messages: { empty: 'Sin mensajes.', placeholder: 'Escriba a la asesoría…', send: 'Enviar' },
    booking: {
      emptyServices: 'La asesoría no ha configurado citas online.',
      pickService: 'Servicio',
      priceLabel: 'El precio puede ajustarse después de la reunión.',
      slotsTitle: 'Huecos disponibles (próximos 7 días)',
      loadingSlots: 'Cargando huecos…',
      noSlots: 'Sin huecos en este período.',
      reserved: 'Cita confirmada',
      confirmError: 'No se pudo confirmar',
      myUpcoming: 'Mis próximas reuniones',
      noMyUpcoming: 'Todavía no tiene citas. Elija servicio y horario abajo.',
    },
    tasks: { empty: 'Sin tareas pendientes.', markDone: 'Marcar hecho', sendDoc: 'Enviar archivo', due: 'Plazo' },
    documents: {
      uploadTitle: 'Enviar documento',
      uploadHint: 'Toque para foto o archivo',
      uploading: 'Enviando…',
      linkedTask: 'Vinculado a la tarea seleccionada',
      linkedObligation: 'Vinculado a la obligación seleccionada',
      open: 'Abrir',
      historyByMonth: 'Por mes',
      empty: 'Aún no ha enviado documentos en este período.',
      workflow: 'Estado',
      sentBy: 'Enviado por',
      fromFirm: 'Recibidos de la asesoría',
      myUploads: 'Sus envíos',
      fromFirmEmpty: 'La asesoría aún no ha compartido archivos aquí.',
    },
    news: {
      empty: 'La asesoría aún no ha publicado noticias.',
      readMore: 'Leer artículo',
      featured: 'Destacado',
      search: 'Buscar noticias…',
      readingTime: 'min de lectura',
    },
    refresh: 'Actualizar',
    refreshing: 'Actualizando…',
    status: {
      PENDING: 'Pendiente',
      IN_PROGRESS: 'En tratamiento',
      WAITING_CLIENT: 'Esperando envío',
      DELIVERED: 'Completado',
      OVERDUE: 'Atrasado',
      CANCELLED: 'Cancelada',
      OPEN: 'Abierta',
      SUBMITTED: 'Enviado',
      APPROVED: 'Completado',
    },
    loading: 'Cargando…',
    loadError: 'No se pudo cargar el portal',
    taskDone: 'Tarea enviada a la asesoría',
    uploadSuccess: 'Documento enviado',
    uploadError: 'Error al enviar',
    taskError: 'No se pudo completar la tarea',
  },
  en: {
    tabs: {
      home: 'Home',
      obligations: 'Agenda',
      tasks: 'Tasks',
      documents: 'Documents',
      requests: 'Requests',
      messages: 'Mensagens',
      archive: 'Archive',
      booking: 'Book',
      news: 'News',
      services: 'Services',
      alerts: 'Alerts',
    },
    home: {
      greeting: 'Hi',
      period: 'Period',
      statusOk: 'On track',
      statusPending: 'Action needed',
      cardObligations: 'Monthly obligations',
      cardTasks: 'Pending tasks',
      cardDocuments: 'Requested documents',
      cardMessages: 'Messages',
      actionRequired: 'Action required',
      viewAllTasks: 'View all tasks',
      complete: 'Complete',
      uploadCta: 'Upload document requested by your accountant',
      nextObligation: 'Next obligation',
      fiscalOk: 'Tax on track',
      fiscalAttention: 'Tax attention',
      fiscalCritical: 'Critical situation',
      fiscalStatus: 'Tax status',
      allClear: 'All clear for this period',
      upcomingConsultations: 'Your upcoming bookings',
      scheduleAnother: 'Schedule another meeting',
    },
    obligations: {
      empty: 'No obligations this period.',
      due: 'Due',
      upload: 'Upload document',
      delivered: 'Delivered by firm',
      deliver: 'Mark as submitted',
      instruction: 'Upload requested documents and confirm when ready.',
      amount: 'Amount',
      markPaid: 'Mark as paid',
      viewDoc: 'View document / guide',
      accountantNotes: 'Accountant notes',
    },
    messages: { empty: 'No messages yet.', placeholder: 'Write to your firm…', send: 'Send' },
    booking: {
      emptyServices: 'Your firm has not set up online booking yet.',
      pickService: 'Service',
      priceLabel: 'Price may be adjusted by the firm after the meeting.',
      slotsTitle: 'Available times (next 7 days)',
      loadingSlots: 'Loading times…',
      noSlots: 'No slots available in this period.',
      reserved: 'Booking confirmed',
      confirmError: 'Could not complete booking',
      myUpcoming: 'My upcoming meetings',
      noMyUpcoming: 'No bookings yet. Pick a service and time below.',
    },
    tasks: { empty: 'No pending tasks.', markDone: 'Mark done', sendDoc: 'Upload file', due: 'Due' },
    documents: {
      uploadTitle: 'Upload document',
      uploadHint: 'Tap for photo or file',
      uploading: 'Uploading…',
      linkedTask: 'Linked to selected task',
      linkedObligation: 'Linked to selected obligation',
      open: 'Open',
      historyByMonth: 'By month',
      empty: 'No documents uploaded for this period yet.',
      workflow: 'Status',
      sentBy: 'Sent by',
      fromFirm: 'From your firm',
      myUploads: 'Your uploads',
      fromFirmEmpty: 'Your firm has not shared files here yet.',
    },
    news: {
      empty: 'Your firm has not published news yet.',
      readMore: 'Read article',
      featured: 'Featured',
      search: 'Search news…',
      readingTime: 'min read',
    },
    refresh: 'Refresh',
    refreshing: 'Refreshing…',
    status: {
      PENDING: 'Pending',
      IN_PROGRESS: 'In progress',
      WAITING_CLIENT: 'Waiting for you',
      DELIVERED: 'Completed',
      OVERDUE: 'Overdue',
      CANCELLED: 'Cancelled',
      OPEN: 'Open',
      SUBMITTED: 'Submitted',
      APPROVED: 'Completed',
    },
    loading: 'Loading…',
    loadError: 'Could not load portal',
    taskDone: 'Task sent to your firm',
    uploadSuccess: 'Document uploaded',
    uploadError: 'Upload failed',
    taskError: 'Could not complete task',
  },
}

export function toClientHubLocale(_locale?: AppLocale): ClientHubLocale {
  return 'pt-PT'
}

export function getClientHubCopy(_locale?: ClientHubLocale): ClientHubCopy {
  return COPY['pt-PT']
}
