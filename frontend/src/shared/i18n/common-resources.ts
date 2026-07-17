/**
 * Namespace `common` — TegLion .
 */
import { criticalCommonResources } from '@/shared/i18n/critical-common'

const motivationalQuotesPt = [
  'Cada pequeno passo conta.',
  'Respire fundo e siga com calma.',
  'Hoje é uma nova oportunidade para fazer bem.',
  'A gentileza multiplica-se.',
  'Está no caminho certo.',
  'Foque-se no agora.',
  'Pequenas vitórias somam.',
  'Confie no seu processo.',
  'Escolha a clareza, não a pressa.',
  'Boa energia gera bons resultados.',
]

const motivationalQuotesEn = [
  'Every small step counts.',
  'Take a breath and move forward calmly.',
  'Today is a new opportunity to do well.',
  'Kindness multiplies.',
  'You are on the right track.',
  'Focus on the present.',
  'Small wins add up.',
  'Trust your process.',
  'Choose clarity over rush.',
  'Good energy leads to good results.',
]

function baseExtra(locale: 'pt-PT' | 'pt-BR' | 'en' | 'es-ES') {
  const isPt = locale === 'pt-PT' || locale === 'pt-BR'
  const isBr = locale === 'pt-BR'
  return {
    cookieBanner: isPt
      ? {
        title: 'Cookies',
        description: isBr
          ? 'Usamos cookies para manter a sessão e melhorar a experiência. Você pode aceitar ou rejeitar; cookies essenciais podem ser necessários para login.'
          : 'Usamos cookies para manter a sessão e melhorar a experiência. Pode aceitar ou rejeitar; cookies essenciais podem ser necessários para login.',
        linkLabel: 'Política de Cookies',
        accept: isBr ? 'Aceitar cookies' : 'Aceitar cookies',
        reject: 'Rejeitar',
        error: isBr
          ? 'Não foi possível registrar o consentimento de cookies'
          : 'Não foi possível registar o consentimento de cookies',
      }
      : locale === 'es-ES'
        ? {
          title: 'Cookies',
          description:
            'Usamos cookies para mantener la sesión y mejorar la experiencia. Puede aceptar o rechazar.',
          linkLabel: 'Política de cookies',
          accept: 'Aceptar cookies',
          reject: 'Rechazar',
          error: 'No se pudo registrar el consentimiento de cookies',
        }
        : {
          title: 'Cookies',
          description:
            'We use cookies to maintain your session and improve your experience. You can accept or reject; essential cookies may be required for login.',
          linkLabel: 'Cookie Policy',
          accept: 'Accept cookies',
          reject: 'Reject',
          error: 'Could not record cookie consent',
        },
    errors: {
      serverStarting: isPt
        ? isBr
          ? 'O sistema está iniciando. Isso pode levar alguns segundos. Por favor, tente novamente.'
          : 'O sistema está a iniciar. Este processo pode demorar alguns segundos. Por favor, tente novamente.'
        : locale === 'es-ES'
          ? 'El sistema se está iniciando. Espere unos segundos e vuelva a intentarlo.'
          : 'The system is starting. This may take a few seconds. Please try again.',
      dataConflict: isPt
        ? isBr
          ? 'Conflito de dados. Verifique as informações e tente novamente.'
          : 'Conflito de dados. Verifique as informações e tente novamente.'
        : locale === 'es-ES'
          ? 'Conflicto de datos. Verifique la información e inténtelo de nuevo.'
          : 'Data conflict. Check the information and try again.',
      userNotFound: isPt
        ? isBr
          ? 'Usuário não encontrado. Verifique seu e-mail ou registre-se.'
          : 'Utilizador não encontrado. Verifique o seu e-mail ou registe-se.'
        : locale === 'es-ES'
          ? 'Usuario no encontrado. Verifique su correo o regístrese.'
          : 'User not found. Check your email or sign up.',
      invalidPassword: isPt
        ? isBr
          ? 'Senha incorreta. Tente novamente ou clique em “Esqueci minha senha”.'
          : 'Password incorreta. Tente novamente ou clique em “Esqueci a minha password”.'
        : locale === 'es-ES'
          ? 'Contraseña incorrecta. Inténtelo de nuevo.'
          : 'Incorrect password. Try again or use “Forgot password”.',
      emailNotFound: isPt
        ? isBr
          ? 'E-mail não cadastrado. Verifique o endereço ou crie uma conta.'
          : 'E-mail não registado. Verifique o endereço ou crie uma conta.'
        : locale === 'es-ES'
          ? 'Correo no registrado. Verifique la dirección o cree una cuenta.'
          : 'Email not registered. Check the address or create an account.',
      accountInactive: isPt
        ? isBr
          ? 'Conta desativada. Contacte o escritório.'
          : 'Conta desativada. Contacte o escritório.'
        : locale === 'es-ES'
          ? 'Cuenta desactivada. Contacte con la oficina.'
          : 'Account deactivated. Contact your firm.',
      notAuthenticated: isPt
        ? isBr
          ? 'Sessão inválida. Faça login novamente.'
          : 'Sessão inválida. Faça login novamente.'
        : locale === 'es-ES'
          ? 'Sesión no válida. Inicie sesión de nuevo.'
          : 'Invalid session. Please sign in again.',
      network: isPt
        ? isBr
          ? 'Falha de rede. Verifique sua conexão e tente novamente.'
          : 'Falha de rede. Verifique a sua ligação e tente novamente.'
        : locale === 'es-ES'
          ? 'Error de red. Compruebe su conexión e inténtelo de nuevo.'
          : 'Network error. Check your connection and try again.',
      statusFallback: isPt
        ? 'Erro {{status}}: {{message}}'
        : locale === 'es-ES'
          ? 'Error {{status}}: {{message}}'
          : 'Error {{status}}: {{message}}',
      cryptoDecryptFailed: isPt
        ? 'Não foi possível ler os dados protegidos. Contacte o suporte.'
        : locale === 'es-ES'
          ? 'No se pudieron leer los datos protegidos. Contacte con soporte.'
          : 'Could not read protected data. Contact support.',
      invalidToken: isPt
        ? 'Token inválido ou expirado.'
        : locale === 'es-ES'
          ? 'Token no válido o caducado.'
          : 'Invalid or expired token.',
      csrfBlocked: isPt
        ? isBr
          ? 'Pedido bloqueado por segurança. Atualize a página e tente novamente.'
          : 'Pedido bloqueado por segurança. Actualize a página e volte a tentar.'
        : locale === 'es-ES'
          ? 'Solicitud bloqueada por seguridad. Actualice la página e inténtelo de nuevo.'
          : 'Request blocked for security. Refresh the page and try again.',
    },
    actions: {
      toggleTheme: isPt ? (isBr ? 'Alternar tema' : 'Alternar tema') : locale === 'es-ES' ? 'Cambiar tema' : 'Toggle theme',
      create: isPt ? 'Criar' : locale === 'es-ES' ? 'Crear' : 'Create',
      cancel: isPt ? 'Cancelar' : locale === 'es-ES' ? 'Cancelar' : 'Cancel',
      update: isPt ? (isBr ? 'Atualizar' : 'Actualizar') : locale === 'es-ES' ? 'Actualizar' : 'Update',
      saveChanges: isPt
        ? isBr
          ? 'Salvar alterações'
          : 'Guardar alterações'
        : locale === 'es-ES'
          ? 'Guardar cambios'
          : 'Save changes',
      search: isPt ? 'Pesquisar' : locale === 'es-ES' ? 'Buscar' : 'Search',
      refresh: isPt ? (isBr ? 'Atualizar' : 'Actualizar') : locale === 'es-ES' ? 'Actualizar' : 'Refresh',
      send: isPt ? 'Enviar' : locale === 'es-ES' ? 'Enviar' : 'Send',
    },
    auth: {
      registerSuccess: isPt
        ? isBr
          ? 'Conta criada com sucesso.'
          : 'Conta criada com sucesso.'
        : locale === 'es-ES'
          ? 'Cuenta creada correctamente.'
          : 'Account created successfully.',
      adminCreated: isPt
        ? 'Administrador criado com sucesso.'
        : locale === 'es-ES'
          ? 'Administrador creado correctamente.'
          : 'Administrator created successfully.',
    },
    labels: {
      userFallback: isPt ? 'Utilizador' : locale === 'es-ES' ? 'Usuario' : 'User',
      accountMenu: isPt ? 'Conta' : locale === 'es-ES' ? 'Cuenta' : 'Account',
      profile: isPt ? 'Perfil' : locale === 'es-ES' ? 'Perfil' : 'Profile',
      countryLabel: isPt ? 'País' : locale === 'es-ES' ? 'País' : 'Country',
    },
    nav: {
      main: isPt ? 'Menu principal' : locale === 'es-ES' ? 'Menú principal' : 'Main menu',
      more: isPt ? 'Mais' : locale === 'es-ES' ? 'Más' : 'More',
      moreMenu: isPt ? 'Mais módulos' : locale === 'es-ES' ? 'Más módulos' : 'More modules',
      settings: isPt ? (isBr ? 'Configurações' : 'Definições') : locale === 'es-ES' ? 'Ajustes' : 'Settings',
      dashboard: isPt ? 'Painel' : locale === 'es-ES' ? 'Panel' : 'Dashboard',
      billing: isPt ? 'Plano' : locale === 'es-ES' ? 'Plan' : 'Billing',
    },
    staffSidebar: {
      guideTitle: isPt ? 'Guia do menu' : locale === 'es-ES' ? 'Guía del menú' : 'Menu guide',
    },
    contabil: {
      firm: {
        subtitle: isPt ? 'Escritório' : locale === 'es-ES' ? 'Despacho' : 'Firm',
        fallback: 'TegLion',
        nav: {
          overview: isPt ? 'Visão geral' : 'Overview',
          clients: isPt ? 'Clientes' : 'Clients',
          clientsList: isPt ? 'Empresas' : 'Companies',
          comms: isPt ? 'Comunicação' : 'Comms',
          documents: isPt ? 'Documentos' : 'Documents',
          chat: isPt ? 'Mensagens' : 'Messages',
          operations: isPt ? 'Operação' : 'Operations',
          tasks: isPt ? 'Tarefas' : 'Tasks',
          consultations: isPt ? 'Consultorias' : 'Consultations',
          fiscalCalendar: isPt ? 'Calendário fiscal' : 'Fiscal calendar',
          admin: isPt ? 'Gestão' : 'Admin',
          alerts: isPt ? 'Central de Alertas' : 'Alerts',
          services: isPt ? 'Serviços' : 'Services',
        },
      },
    },
    motivationalQuotes:
      locale === 'en' ? motivationalQuotesEn : locale === 'es-ES' ? motivationalQuotesEn : motivationalQuotesPt,
    resetPassword: {
      errors: {
        min8: isPt
          ? isBr
            ? 'A senha deve ter pelo menos 10 caracteres.'
            : 'A palavra-passe deve ter pelo menos 10 caracteres.'
          : locale === 'es-ES'
            ? 'La contraseña debe tener al menos 10 caracteres.'
            : 'Password must be at least 10 characters.',
        uppercase: isPt
          ? 'Inclua pelo menos uma letra maiúscula.'
          : locale === 'es-ES'
            ? 'Incluya al menos una letra mayúscula.'
            : 'Include at least one uppercase letter.',
        lowercase: isPt
          ? 'Inclua pelo menos uma letra minúscula.'
          : locale === 'es-ES'
            ? 'Incluya al menos una letra minúscula.'
            : 'Include at least one lowercase letter.',
        number: isPt
          ? 'Inclua pelo menos um algarismo.'
          : locale === 'es-ES'
            ? 'Incluya al menos un número.'
            : 'Include at least one number.',
        confirmRequired: isPt
          ? isBr
            ? 'Confirme a nova senha.'
            : 'Confirme a nova palavra-passe.'
          : locale === 'es-ES'
            ? 'Confirme la nueva contraseña.'
            : 'Confirm your new password.',
        mismatch: isPt
          ? isBr
            ? 'As senhas não coincidem.'
            : 'As palavras-passe não coincidem.'
          : locale === 'es-ES'
            ? 'Las contraseñas no coinciden.'
            : 'Passwords do not match.',
      },
      documentTitle: isPt ? (isBr ? 'Redefinir senha · TegLion' : 'Redefinir palavra-passe · TegLion') : 'Reset password · TegLion',
      title: isPt ? (isBr ? 'Redefinir senha' : 'Redefinir palavra-passe') : locale === 'es-ES' ? 'Restablecer contraseña' : 'Reset password',
      subtitle: isPt
        ? isBr
          ? 'Digite sua nova senha para reativar sua conta'
          : 'Introduza a nova palavra-passe para reactivar a sua conta'
        : 'Enter your new password to reactivate your account',
      validatingLink: isPt ? (isBr ? 'Validando link…' : 'A validar link…') : 'Validating link…',
      validatingDescription: isPt
        ? isBr
          ? 'Aguarde enquanto verificamos seu link de redefinição'
          : 'Aguarde enquanto verificamos o seu link de redefinição'
        : 'Please wait while we verify your reset link',
      tokenNotProvided: isPt ? 'Token não fornecido' : 'Token not provided',
      invalidOrExpiredTokenMessage: isPt
        ? isBr
          ? 'Token inválido ou expirado. Solicite uma nova redefinição de senha.'
          : 'Token inválido ou expirado. Solicite uma nova redefinição de palavra-passe.'
        : 'Invalid or expired token. Request a new reset link.',
      validateTokenError: isPt ? 'Erro ao validar token. Tente novamente mais tarde.' : 'Error validating token.',
      expiredToken: isPt ? 'Token expirado' : 'Token expired',
      successRedirect3s: isPt
        ? isBr
          ? 'Senha redefinida com sucesso! Você será redirecionado em 3 segundos.'
          : 'Palavra-passe redefinida com sucesso! Será redireccionado em 3 segundos.'
        : 'Password reset successfully! Redirecting in 3 seconds.',
      tooManyAttempts: isPt ? 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.' : 'Too many attempts.',
      genericResetError: isPt
        ? isBr
          ? 'Erro ao redefinir senha. Tente novamente.'
          : 'Erro ao redefinir palavra-passe. Tente novamente.'
        : 'Error resetting password.',
      resetErrorTitle: isPt ? (isBr ? 'Erro ao redefinir senha' : 'Erro ao redefinir palavra-passe') : 'Reset error',
      expiredOrInvalidLink: isPt ? 'Link expirado ou inválido' : 'Expired or invalid link',
      linkExpiresHint: isPt
        ? isBr
          ? 'O link de redefinição de senha expira após 15 minutos por segurança.'
          : 'O link de redefinição de palavra-passe expira após 15 minutos por segurança.'
        : 'The reset link expires after 15 minutes for security.',
      whatYouCanDo: isPt ? 'O que pode fazer:' : 'What you can do:',
      requestNewLink: isPt ? 'Solicite um novo link de redefinição' : 'Request a new reset link',
      checkSpam: isPt ? 'Verifique a pasta de spam' : 'Check your spam folder',
      contactSupport: isPt ? 'Contacte o suporte' : 'Contact support',
      backToLogin: isPt ? (isBr ? 'Voltar ao login' : 'Voltar ao início de sessão') : 'Back to sign in',
      requestNewLinkButton: isPt ? 'Solicitar novo link' : 'Request new link',
      passwordResetSuccessTitle: isPt
        ? isBr
          ? 'Senha redefinida com sucesso!'
          : 'Palavra-passe redefinida com sucesso!'
        : 'Password reset successfully!',
      redirectingToLoginSoon: isPt
        ? isBr
          ? 'Você será redirecionado para o login em alguns segundos.'
          : 'Será redireccionado para o início de sessão em alguns segundos.'
        : 'Redirecting to sign in shortly.',
      canLoginNow: isPt
        ? isBr
          ? 'Você pode agora fazer login com sua nova senha.'
          : 'Já pode iniciar sessão com a nova palavra-passe.'
        : 'You can now sign in with your new password.',
      goToLoginNow: isPt ? (isBr ? 'Ir para login agora' : 'Ir para início de sessão') : 'Go to sign in',
      securityReasonExpiredHint: isPt
        ? 'Por motivos de segurança, o link pode ter expirado. Solicite um novo link.'
        : 'For security, the link may have expired. Request a new one.',
      newPasswordLabel: isPt ? (isBr ? 'Nova senha' : 'Nova palavra-passe') : 'New password',
      newPasswordPlaceholder: isPt
        ? isBr
          ? 'Digite sua nova senha'
          : 'Introduza a nova palavra-passe'
        : 'Enter new password',
      confirmPasswordLabel: isPt ? (isBr ? 'Confirmar senha' : 'Confirmar palavra-passe') : 'Confirm password',
      confirmPasswordPlaceholder: isPt
        ? isBr
          ? 'Confirme sua nova senha'
          : 'Confirme a nova palavra-passe'
        : 'Confirm new password',
      securityTipTitle: isPt ? 'Dica de segurança' : 'Security tip',
      securityTipUnique: isPt
        ? isBr
          ? 'Use uma senha única (não reutilize)'
          : 'Use uma palavra-passe única (não reutilize)'
        : 'Use a unique password',
      securityTipMinLength: isPt ? 'Mínimo 10 caracteres' : 'At least 10 characters',
      securityTipMixChars: isPt ? 'Misture maiúsculas, minúsculas e algarismos' : 'Mix upper, lower and numbers',
      submitting: isPt ? 'A redefinir…' : 'Resetting…',
      submitButton: isPt ? (isBr ? 'Redefinir senha' : 'Redefinir palavra-passe') : 'Reset password',
    },
    passwordStrength: {
      messageWeak: isPt ? (isBr ? 'Senha fraca' : 'Palavra-passe fraca') : locale === 'es-ES' ? 'Contraseña débil' : 'Weak password',
      messageFair: isPt ? (isBr ? 'Senha adequada' : 'Palavra-passe adequada') : locale === 'es-ES' ? 'Contraseña aceptable' : 'Fair password',
      messageGood: isPt ? (isBr ? 'Senha forte' : 'Palavra-passe forte') : locale === 'es-ES' ? 'Contraseña fuerte' : 'Strong password',
      messageStrong: isPt
        ? isBr
          ? 'Senha muito forte'
          : 'Palavra-passe muito forte'
        : locale === 'es-ES'
          ? 'Contraseña muy fuerte'
          : 'Very strong password',
      feedback: {
        uppercaseOk: '✓ ' + (isPt ? 'Maiúsculas' : locale === 'es-ES' ? 'Mayúsculas' : 'Uppercase'),
        uppercaseMissing: '✗ ' + (isPt ? 'Adicione maiúsculas' : locale === 'es-ES' ? 'Añada mayúsculas' : 'Add uppercase'),
        lowercaseOk: '✓ ' + (isPt ? 'Minúsculas' : locale === 'es-ES' ? 'Minúsculas' : 'Lowercase'),
        lowercaseMissing: '✗ ' + (isPt ? 'Adicione minúsculas' : locale === 'es-ES' ? 'Añada minúsculas' : 'Add lowercase'),
        numbersOk: '✓ ' + (isPt ? 'Números' : locale === 'es-ES' ? 'Números' : 'Numbers'),
        numbersMissing: '✗ ' + (isPt ? 'Adicione números' : locale === 'es-ES' ? 'Añada números' : 'Add numbers'),
        specialOk: '✓ ' + (isPt ? 'Caracteres especiais' : locale === 'es-ES' ? 'Caracteres especiales' : 'Special characters'),
        repeatedChars: '✗ ' + (isPt ? 'Evite repetições' : locale === 'es-ES' ? 'Evite repeticiones' : 'Avoid repeated characters'),
        obviousSequence: '✗ ' + (isPt ? 'Evite sequências óbvias' : locale === 'es-ES' ? 'Evite secuencias obvias' : 'Avoid obvious sequences'),
      },
    },
    clientWizard: {
      title: isPt ? 'Adicionar novo cliente' : locale === 'es-ES' ? 'Agregar nuevo cliente' : 'Add new client',
      clientTypes: {
        company: isPt ? 'Empresa' : locale === 'es-ES' ? 'Empresa' : 'Company',
        selfEmployed: isPt ? 'Trabalhador Independente' : locale === 'es-ES' ? 'Autonomo' : 'Self-employed',
        individual: isPt ? 'Particular' : locale === 'es-ES' ? 'Particular' : 'Individual',
      },
      steps: {
        navLabel: isPt ? 'Passos' : locale === 'es-ES' ? 'Pasos' : 'Steps',
        1: isPt ? 'Identificacao' : locale === 'es-ES' ? 'Identificacion' : 'Identification',
        2: isPt ? 'Fiscal' : locale === 'es-ES' ? 'Fiscal' : 'Fiscal',
        3: isPt ? 'Responsaveis' : locale === 'es-ES' ? 'Responsables' : 'Owners',
        4: isPt ? 'Servicos' : locale === 'es-ES' ? 'Servicios' : 'Services',
        identification: isPt ? 'Identificacao' : locale === 'es-ES' ? 'Identificacion' : 'Identification',
        fiscal: isPt ? 'Fiscal' : locale === 'es-ES' ? 'Fiscal' : 'Fiscal',
        singularFiscal: isPt ? 'Pessoa Singular' : locale === 'es-ES' ? 'Persona fisica' : 'Individual data',
        owners: isPt ? 'Responsaveis' : locale === 'es-ES' ? 'Responsables' : 'Owners',
        services: isPt ? 'Servicos' : locale === 'es-ES' ? 'Servicios' : 'Services',
      },
      sections: {
        identification: {
          title: isPt ? 'Identificacao do cliente' : locale === 'es-ES' ? 'Identificacion del cliente' : 'Client identification',
        },
        fiscal: {
          title: isPt ? 'Enquadramento fiscal' : locale === 'es-ES' ? 'Marco fiscal' : 'Fiscal framework',
          subtitle: isPt
            ? 'CAE, contabilidade, IVA, Seguranca Social, capital social e inicio de atividade.'
            : locale === 'es-ES'
              ? 'CNAE, contabilidad, IVA, Seguridad Social, capital social e inicio de actividad.'
              : 'Economic activity, accounting, VAT, social security and activity start date.',
        },
        singularFiscal: {
          title: isPt ? 'Dados da Pessoa Singular' : locale === 'es-ES' ? 'Datos de persona fisica' : 'Individual fiscal details',
          subtitle: isPt
            ? 'Informacao complementar aplicavel a Trabalhador Independente e Particular.'
            : locale === 'es-ES'
              ? 'Informacion complementaria para autonomo y particular.'
              : 'Additional details for self-employed and individual clients.',
        },
        socialSecurity: isPt ? 'Seguranca Social' : locale === 'es-ES' ? 'Seguridad Social' : 'Social security',
        identificationCard: isPt ? 'Identificacao' : locale === 'es-ES' ? 'Identificacion' : 'Identification',
        owners: {
          title: isPt ? 'Responsaveis' : locale === 'es-ES' ? 'Responsables' : 'Owners',
          subtitle: isPt
            ? 'Equipa do escritorio e contacto principal no cliente.'
            : locale === 'es-ES'
              ? 'Equipo del despacho y contacto principal del cliente.'
              : 'Firm team and primary contact for the client.',
        },
        primaryContact: isPt ? 'Contacto principal no cliente' : locale === 'es-ES' ? 'Contacto principal del cliente' : 'Primary contact',
        services: {
          title: isPt ? 'Servicos contratados' : locale === 'es-ES' ? 'Servicios contratados' : 'Subscribed services',
          subtitle: isPt
            ? 'Selecione os servicos que o escritorio presta a este cliente.'
            : locale === 'es-ES'
              ? 'Seleccione los servicios que el despacho presta a este cliente.'
              : 'Select services provided by the firm for this client.',
        },
      },
      fields: {
        clientType: isPt ? 'Tipo de cliente' : locale === 'es-ES' ? 'Tipo de cliente' : 'Client type',
        individualName: isPt ? 'Nome do cliente' : locale === 'es-ES' ? 'Nombre del cliente' : 'Client name',
        legalName: isPt ? 'Designacao social' : locale === 'es-ES' ? 'Razon social' : 'Legal name',
        displayName: isPt ? 'Nome comercial' : locale === 'es-ES' ? 'Nombre comercial' : 'Trade name',
        legalForm: isPt ? 'Forma Juridica' : locale === 'es-ES' ? 'Forma juridica' : 'Legal form',
        accountingType: isPt ? 'Tipo de contabilidade' : locale === 'es-ES' ? 'Tipo de contabilidad' : 'Accounting type',
        activityStartDate: isPt ? 'Inicio de atividade' : locale === 'es-ES' ? 'Inicio de actividad' : 'Activity start date',
        shareCapital: isPt ? 'Capital social' : locale === 'es-ES' ? 'Capital social' : 'Share capital',
        caePrimary: isPt ? 'CAE principal' : locale === 'es-ES' ? 'CNAE principal' : 'Primary economic activity',
        caeSecondary: isPt ? 'CAE secundario' : locale === 'es-ES' ? 'CNAE secundario' : 'Secondary economic activity',
        caeSecondary2: isPt ? 'CAE secundario (2)' : locale === 'es-ES' ? 'CNAE secundario (2)' : 'Secondary economic activity (2)',
        phone: isPt ? 'Telefone' : locale === 'es-ES' ? 'Telefono' : 'Phone',
        email: isPt ? 'Email' : locale === 'es-ES' ? 'Correo' : 'Email',
        vatRegime: isPt ? 'Regime de IVA' : locale === 'es-ES' ? 'Regimen de IVA' : 'VAT regime',
        vatExemptionReason: isPt ? 'Motivo da isencao' : locale === 'es-ES' ? 'Motivo de exencion' : 'Exemption reason',
        irsFramework: isPt ? 'Enquadramento IRS / IRC' : locale === 'es-ES' ? 'Marco fiscal IRPF / IS' : 'Income tax framework',
        socialSecurityArea: isPt ? 'Area da Seguranca Social' : locale === 'es-ES' ? 'Area de Seguridad Social' : 'Social security area',
        socialSecurityOneYearExemption: isPt ? 'Isencao de 1 ano' : locale === 'es-ES' ? 'Exencion de 1 ano' : 'One-year exemption',
        socialSecurityStartDate: isPt ? 'Data de inicio' : locale === 'es-ES' ? 'Fecha de inicio' : 'Start date',
        socialSecurityQuarterlyDeclaration: isPt
          ? 'Entrega da declaracao trimestral'
          : locale === 'es-ES'
            ? 'Entrega de declaracion trimestral'
            : 'Quarterly declaration',
        spouse: isPt ? 'Conjuge' : locale === 'es-ES' ? 'Conyuge' : 'Spouse',
        irsDelivery: isPt ? 'Entrega de IRS' : locale === 'es-ES' ? 'Presentacion de IRPF' : 'Tax return filing',
        validateEInvoice: isPt ? 'Validar e-Fatura' : locale === 'es-ES' ? 'Validar e-Factura' : 'Validate e-Invoice',
        communicateHousehold: isPt
          ? 'Comunicar Agregado Familiar'
          : locale === 'es-ES'
            ? 'Comunicar unidad familiar'
            : 'Communicate household',
        assignedStaff: isPt ? 'Responsavel no escritorio' : locale === 'es-ES' ? 'Responsable del despacho' : 'Assigned staff',
        name: isPt ? 'Nome' : locale === 'es-ES' ? 'Nombre' : 'Name',
        role: isPt ? 'Funcao' : locale === 'es-ES' ? 'Funcion' : 'Role',
        notes: isPt ? 'Notas internas' : locale === 'es-ES' ? 'Notas internas' : 'Internal notes',
      },
      hints: {
        clientType: isPt
          ? 'Define os campos apresentados mais a frente.'
          : locale === 'es-ES'
            ? 'Define los campos mostrados a continuacion.'
            : 'Defines which fields are shown next.',
        displayName: isPt
          ? 'Designacao pela qual o cliente e conhecido no mercado.'
          : locale === 'es-ES'
            ? 'Nombre por el que el cliente es conocido en el mercado.'
            : 'Market-facing trade name.',
        legalForm: isPt
          ? 'Disponivel conforme o pais configurado no escritorio.'
          : locale === 'es-ES'
            ? 'Disponible segun el pais configurado en el despacho.'
            : 'Available according to the firm country configuration.',
        activityStartDate: isPt
          ? 'Data de inicio de atividade.'
          : locale === 'es-ES'
            ? 'Fecha de inicio de actividad.'
            : 'Activity start date.',
        caePrimary: isPt
          ? 'Classificacao principal de atividade economica.'
          : locale === 'es-ES'
            ? 'Clasificacion principal de actividad economica.'
            : 'Primary economic activity classification.',
        optional: isPt ? 'Opcional.' : locale === 'es-ES' ? 'Opcional.' : 'Optional.',
        phone: isPt ? 'Contacto telefonico do cliente.' : locale === 'es-ES' ? 'Telefono de contacto del cliente.' : 'Client phone contact.',
        email: isPt ? 'Endereco de email do cliente.' : locale === 'es-ES' ? 'Correo del cliente.' : 'Client email address.',
      },
      placeholders: {
        individualName: isPt ? 'Ex.: Joao Silva' : locale === 'es-ES' ? 'Ej.: Juan Garcia' : 'Ex.: John Doe',
        legalName: isPt ? 'Ex.: Padaria Atlantico, Lda' : locale === 'es-ES' ? 'Ej.: Empresa Ejemplo, SL' : 'Ex.: Example Company Ltd',
        displayName: isPt ? 'Ex.: Padaria Atlantico' : locale === 'es-ES' ? 'Ej.: Panaderia Atlantico' : 'Ex.: Example Trade Name',
        caePrimary: isPt ? 'Ex.: 10711 - Fabricacao de produtos de padaria' : locale === 'es-ES' ? 'Ej.: 10711 - Actividad principal' : 'Ex.: 10711 - Primary activity',
        email: isPt ? 'geral@empresa.pt' : locale === 'es-ES' ? 'general@empresa.es' : 'hello@company.com',
        socialSecurityArea: isPt ? 'Ex.: Centro Distrital do Porto' : locale === 'es-ES' ? 'Ej.: Centro provincial' : 'Ex.: District center',
        assignedStaff: isPt ? 'Nome do responsavel' : locale === 'es-ES' ? 'Nombre del responsable' : 'Owner name',
        role: isPt ? 'Ex.: Gerente' : locale === 'es-ES' ? 'Ej.: Gerente' : 'Ex.: Manager',
        notes: isPt ? 'Observacoes visiveis apenas no escritorio' : locale === 'es-ES' ? 'Observaciones visibles solo para el despacho' : 'Notes visible only to the firm',
      },
      options: {
        select: isPt ? 'Selecionar...' : locale === 'es-ES' ? 'Seleccionar...' : 'Select...',
      },
      validation: {
        taxIdLength: isPt ? 'NIF deve ter 9 digitos.' : locale === 'es-ES' ? 'El NIF debe tener 9 digitos.' : 'Tax ID must have 9 digits.',
        taxIdLengthGeneric: isPt
          ? 'Documento fiscal invalido.'
          : locale === 'es-ES'
            ? 'Documento fiscal invalido.'
            : 'Invalid tax document.',
        taxIdChecksum: isPt
          ? 'NIF invalido (digito de controlo incorreto).'
          : locale === 'es-ES'
            ? 'NIF invalido (digito de control incorrecto).'
            : 'Tax ID is invalid (checksum failed).',
        taxIdValid: isPt ? 'NIF valido.' : locale === 'es-ES' ? 'NIF valido.' : 'Tax ID is valid.',
        taxIdInvalid: isPt ? 'NIF invalido.' : locale === 'es-ES' ? 'NIF invalido.' : 'Tax ID is invalid.',
        validateTaxIdBeforeProceed: isPt
          ? 'Valide o NIF antes de continuar'
          : locale === 'es-ES'
            ? 'Valide el NIF antes de continuar'
            : 'Validate tax ID before continuing',
        clientTypeRequired: isPt ? 'Selecione o tipo de cliente' : locale === 'es-ES' ? 'Seleccione el tipo de cliente' : 'Select client type',
        individualNameRequired: isPt ? 'Indique o nome do cliente' : locale === 'es-ES' ? 'Indique el nombre del cliente' : 'Provide client name',
        legalNameRequired: isPt ? 'Indique a designacao social' : locale === 'es-ES' ? 'Indique la razon social' : 'Provide legal name',
        accountingTypeRequired: isPt ? 'Selecione o tipo de contabilidade' : locale === 'es-ES' ? 'Seleccione el tipo de contabilidad' : 'Select accounting type',
        caePrimaryRequired: isPt ? 'Indique o CAE principal' : locale === 'es-ES' ? 'Indique el CNAE principal' : 'Provide primary activity',
        activityStartDateRequired: isPt ? 'Indique o inicio de atividade' : locale === 'es-ES' ? 'Indique el inicio de actividad' : 'Provide activity start date',
        addressRequired: isPt ? 'Indique a morada' : locale === 'es-ES' ? 'Indique la direccion' : 'Provide address',
        invalidPostalCode: isPt ? 'Codigo postal invalido' : locale === 'es-ES' ? 'Codigo postal invalido' : 'Invalid postal code',
        localityRequired: isPt ? 'Indique a localidade' : locale === 'es-ES' ? 'Indique la localidad' : 'Provide locality',
        fiscalFrameworkRequired: isPt ? 'Preencha o enquadramento fiscal' : locale === 'es-ES' ? 'Complete el marco fiscal' : 'Fill fiscal framework',
        vatExemptionReasonRequired: isPt ? 'Selecione o motivo da isencao' : locale === 'es-ES' ? 'Seleccione el motivo de exencion' : 'Select exemption reason',
        assignedStaffRequired: isPt ? 'Indique o responsavel no escritorio' : locale === 'es-ES' ? 'Indique el responsable del despacho' : 'Provide assigned staff member',
      },
      actions: {
        close: isPt ? 'Fechar' : locale === 'es-ES' ? 'Cerrar' : 'Close',
        validateTaxId: isPt ? 'Validar NIF' : locale === 'es-ES' ? 'Validar NIF' : 'Validate Tax ID',
        cancel: isPt ? 'Cancelar' : locale === 'es-ES' ? 'Cancelar' : 'Cancel',
        back: isPt ? 'Voltar' : locale === 'es-ES' ? 'Volver' : 'Back',
        continue: isPt ? 'Continuar' : locale === 'es-ES' ? 'Continuar' : 'Continue',
        create: isPt ? 'Criar cliente' : locale === 'es-ES' ? 'Crear cliente' : 'Create client',
        creating: isPt ? 'A criar...' : locale === 'es-ES' ? 'Creando...' : 'Creating...',
      },
      services: {
        emptyState: isPt
          ? 'Nenhum servico ativo no catalogo - o cliente sera criado sem servicos pre-selecionados.'
          : locale === 'es-ES'
            ? 'No hay servicios activos en el catalogo; el cliente sera creado sin servicios preseleccionados.'
            : 'No active services in catalog; client will be created without preselected services.',
      },
      summary: {
        newClient: isPt ? 'Novo cliente' : locale === 'es-ES' ? 'Nuevo cliente' : 'New client',
      },
      toasts: {
        createdSuccess: isPt ? 'Cliente criado com sucesso' : locale === 'es-ES' ? 'Cliente creado correctamente' : 'Client created successfully',
        createError: isPt ? 'Nao foi possivel criar o cliente' : locale === 'es-ES' ? 'No fue posible crear el cliente' : 'Could not create client',
      },
    },
    toasts: {
      genericError: isPt
        ? isBr
          ? 'Falha ao processar'
          : 'Falha ao processar'
        : locale === 'es-ES'
          ? 'Error al procesar'
          : 'Processing failed',
    },
    dialogs: {
      cancel: isPt ? 'Cancelar' : locale === 'es-ES' ? 'Cancelar' : 'Cancel',
    },
    loading: isPt ? 'A carregar…' : locale === 'es-ES' ? 'Cargando…' : 'Loading…',
  }
}

function mergeCommon(locale: 'pt-PT') {
  const critical = criticalCommonResources[locale].common
  const extra = baseExtra(locale)
  return {
    ...critical,
    ...extra,
    errors: { ...critical.errors, ...extra.errors },
    actions: { ...critical.actions, ...extra.actions },
    auth: { ...critical.auth, ...extra.auth },
  }
}

export const commonResourcesByLocale = {
  'pt-PT': mergeCommon('pt-PT'),
} as const
