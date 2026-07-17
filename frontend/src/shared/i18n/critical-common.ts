/** Subconjunto mínimo de `common` no entry bundle (erros, auth, ações) — pt-PT only. */
export const criticalCommonResources = {
  'pt-PT': {
    common: {
      language: 'Idioma',
      menu: 'Menu',
      logout: 'Sair',
      authBootstrapping: { validatingSession: 'A validar sessão…' },
      errors: {
        requiredFields: 'Preencha todos os campos obrigatórios.',
        invalidRequest: 'Pedido inválido. Verifique os campos e tente novamente.',
        forbidden: 'Não tem permissão para aceder a esta funcionalidade.',
        rateLimited: 'Muitas tentativas. Aguarde alguns minutos.',
        emailConflict: 'E-mail já registado.',
        serverUnavailable: 'Não foi possível ligar ao servidor. Tente novamente.',
        noRecords: 'Ainda não há registos.',
        invalidPassword: 'Palavra-passe incorreta.',
        emailNotFound: 'E-mail não encontrado.',
        invalidCredentials:
          'E-mail ou palavra-passe incorretos. Verifique os dados e tente novamente.',
        accountLocked: 'Muitas tentativas falhadas. Aguarde alguns minutos e tente novamente.',
        weakPassword: 'A palavra-passe não cumpre os requisitos de segurança.',
        sessionExpired: 'A sua sessão expirou.',
        sessionExpiredDescription: 'Inicie sessão novamente para continuar.',
        generic: 'Não foi possível concluir o pedido.',
        statusFallback: 'Não foi possível concluir o pedido. Tente novamente.',
        csrfBlocked:
          'Pedido bloqueado por segurança. Actualize a página e volte a tentar.',
      },
      actions: {
        cancel: 'Cancelar',
        refresh: 'Actualizar',
        search: 'Pesquisar',
      },
      auth: {
        loginSuccess: 'Sessão iniciada.',
        logoutSuccess: 'Sessão terminada.',
      },
      nav: {
        main: 'Menu principal',
        more: 'Mais',
        moreMenu: 'Mais módulos',
        settings: 'Definições',
        dashboard: 'Painel',
        billing: 'Plano',
      },
      contabil: {
        firm: {
          subtitle: 'Escritório',
          fallback: 'TegLion',
          nav: {
            overview: 'Visão geral',
            clients: 'Clientes',
            clientsList: 'Empresas',
            comms: 'Comunicação',
            documents: 'Documentos',
            chat: 'Mensagens',
            operations: 'Operação',
            tasks: 'Tarefas',
            consultations: 'Consultorias',
            fiscalCalendar: 'Calendário fiscal',
            admin: 'Gestão',
            alerts: 'Central de Alertas',
            services: 'Serviços',
          },
        },
      },
    },
  },
} as const
