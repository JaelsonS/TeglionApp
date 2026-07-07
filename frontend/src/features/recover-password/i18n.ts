export type RecoverLocale = 'pt-PT' | 'pt-BR' | 'es-ES' | 'en'

export type RecoverCountryCode = 'BR' | 'PT' | 'ES' | 'US'

export type RecoverCopy = {
  brand: string
  titleRecover: string
  subtitleRecover: string
  titleReset: string
  subtitleReset: string
  fields: {
    email: string
    newPassword: string
    confirmPassword: string
    country: string
  }
  countries: Record<RecoverCountryCode, string>
  placeholders: {
    email: string
    newPassword: string
    confirmPassword: string
  }
  actions: {
    sendLink: string
    sending: string
    resetPassword: string
    resetting: string
    backToLogin: string
  }
  messages: {
    requestSentTitle: string
    requestSentBody: string
    resetSuccessTitle: string
    resetSuccessBody: string
    ethics: string
  }
  validation: {
    required: string
    invalidEmail: string
    passwordMin: string
    passwordLetterNumber: string
    passwordMismatch: string
  }
  errors: {
    invalidOrExpired: string
    weakPassword: string
    tooManyAttempts: string
    generic: string
  }
}

export const LOCALES: RecoverLocale[] = ['pt-PT', 'pt-BR', 'es-ES', 'en']

export const COPY: Record<RecoverLocale, RecoverCopy> = {
  'pt-PT': {
    brand: 'TegLion',
    titleRecover: 'Esqueceu a palavra-passe?',
    subtitleRecover: 'Enviaremos um link para redefinir a sua palavra-passe.',
    titleReset: 'Redefinir palavra-passe',
    subtitleReset: 'Crie uma nova palavra-passe segura para a sua conta.',
    fields: {
      email: 'E-mail',
      newPassword: 'Nova palavra-passe',
      confirmPassword: 'Confirmar nova palavra-passe',
      country: 'País',
    },
    countries: {
      PT: 'Portugal',
      BR: 'Brasil',
      ES: 'Espanha',
      US: 'Estados Unidos',
    },
    placeholders: {
      email: 'Introduza o seu e-mail',
      newPassword: 'Mínimo 8 caracteres',
      confirmPassword: 'Repita a nova palavra-passe',
    },
    actions: {
      sendLink: 'Enviar link de redefinição',
      sending: 'A enviar…',
      resetPassword: 'Redefinir palavra-passe',
      resetting: 'A redefinir…',
      backToLogin: 'Voltar ao início de sessão',
    },
    messages: {
      requestSentTitle: 'Pedido enviado',
      requestSentBody: 'Se o e-mail estiver registado, enviaremos um link de redefinição.',
      resetSuccessTitle: 'Palavra-passe redefinida',
      resetSuccessBody: 'A sua palavra-passe foi redefinida. Já pode iniciar sessão.',
      ethics:
        'Os seus dados são protegidos e utilizados apenas para fins de prestação de serviços, conforme os nossos termos e consentimentos.',
    },
    validation: {
      required: 'Campo obrigatório',
      invalidEmail: 'E-mail inválido',
      passwordMin: 'Mínimo 8 caracteres',
      passwordLetterNumber: 'Deve conter pelo menos 1 letra e 1 algarismo',
      passwordMismatch: 'As palavras-passe não coincidem',
    },
    errors: {
      invalidOrExpired: 'Link inválido ou expirado. Solicite um novo.',
      weakPassword: 'Password fraca. Use pelo menos 8 caracteres com letras e números.', // Corrige termo para pt-PT.
      tooManyAttempts: 'Muitas tentativas. Aguarde e tente novamente.',
      generic: 'Não foi possível concluir agora. Tente novamente.',
    },
  },
  'pt-BR': {
    brand: 'TegLion',
    titleRecover: 'Esqueceu a senha?',
    subtitleRecover: 'Enviaremos um link para redefinir sua senha.',
    titleReset: 'Redefinir senha',
    subtitleReset: 'Crie uma nova senha segura para sua conta.',
    fields: {
      email: 'E-mail',
      newPassword: 'Nova senha',
      confirmPassword: 'Confirmar nova senha',
      country: 'País',
    },
    countries: {
      PT: 'Portugal',
      BR: 'Brasil',
      ES: 'Espanha',
      US: 'Estados Unidos',
    },
    placeholders: {
      email: 'Digite seu e-mail',
      newPassword: 'Mínimo 8 caracteres',
      confirmPassword: 'Repita a nova senha',
    },
    actions: {
      sendLink: 'Enviar link de redefinição',
      sending: 'Enviando…',
      resetPassword: 'Redefinir senha',
      resetting: 'Redefinindo…',
      backToLogin: 'Voltar ao login',
    },
    messages: {
      requestSentTitle: 'Pedido enviado',
      requestSentBody: 'Se o e-mail estiver cadastrado, enviaremos um link de redefinição.',
      resetSuccessTitle: 'Senha redefinida',
      resetSuccessBody: 'Sua senha foi redefinida. Agora você pode entrar.',
      ethics:
        'Seus dados clínicos são protegidos e usados apenas para fins de atendimento, conforme nossos termos e consentimentos.',
    },
    validation: {
      required: 'Campo obrigatório',
      invalidEmail: 'E-mail inválido',
      passwordMin: 'Mínimo 8 caracteres',
      passwordLetterNumber: 'Deve conter pelo menos 1 letra e 1 número',
      passwordMismatch: 'As senhas não coincidem',
    },
    errors: {
      invalidOrExpired: 'Link inválido ou expirado. Solicite um novo.',
      weakPassword: 'Senha fraca. Use pelo menos 8 caracteres com letras e números.',
      tooManyAttempts: 'Muitas tentativas. Aguarde e tente novamente.',
      generic: 'Não foi possível concluir agora. Tente novamente.',
    },
  },
  'es-ES': {
    brand: 'TegLion',
    titleRecover: '¿Olvidó su contraseña?',
    subtitleRecover: 'Te enviaremos un enlace para restablecerla.',
    titleReset: 'Restablecer contraseña',
    subtitleReset: 'Crea una nueva contraseña segura para tu cuenta.',
    fields: {
      email: 'Correo electrónico',
      newPassword: 'Nueva contraseña',
      confirmPassword: 'Confirmar nueva contraseña',
      country: 'País',
    },
    countries: {
      PT: 'Portugal',
      BR: 'Brasil',
      ES: 'España',
      US: 'Estados Unidos',
    },
    placeholders: {
      email: 'Introduce tu correo',
      newPassword: 'Mínimo 8 caracteres',
      confirmPassword: 'Repite la nueva contraseña',
    },
    actions: {
      sendLink: 'Enviar enlace de restablecimiento',
      sending: 'Enviando…',
      resetPassword: 'Restablecer contraseña',
      resetting: 'Restableciendo…',
      backToLogin: 'Volver al inicio de sesión',
    },
    messages: {
      requestSentTitle: 'Solicitud enviada',
      requestSentBody: 'Si el correo está registrado, recibirás un enlace pronto.',
      resetSuccessTitle: 'Contraseña restablecida',
      resetSuccessBody: 'Tu contraseña fue restablecida. Ahora puedes iniciar sesión.',
      ethics:
        'Sus datos clínicos están protegidos y solo se utilizan para fines de atención, según nuestros términos y consentimientos.',
    },
    validation: {
      required: 'Campo obligatorio',
      invalidEmail: 'Email inválido',
      passwordMin: 'Mínimo 8 caracteres',
      passwordLetterNumber: 'Debe contener al menos 1 letra y 1 número',
      passwordMismatch: 'Las contraseñas no coinciden',
    },
    errors: {
      invalidOrExpired: 'Enlace inválido o expirado. Solicita uno nuevo.',
      weakPassword: 'Contraseña débil. Usa al menos 8 caracteres con letras y números.',
      tooManyAttempts: 'Demasiados intentos. Espera y vuelve a intentarlo.',
      generic: 'No se pudo completar ahora. Inténtalo de nuevo.',
    },
  },
  en: {
    brand: 'TegLion',
    titleRecover: 'Forgot password?',
    subtitleRecover: 'We’ll send you a link to reset your password.',
    titleReset: 'Reset password',
    subtitleReset: 'Create a new secure password for your account.',
    fields: {
      email: 'Email',
      newPassword: 'New password',
      confirmPassword: 'Confirm new password',
      country: 'Country',
    },
    countries: {
      PT: 'Portugal',
      BR: 'Brazil',
      ES: 'Spain',
      US: 'United States',
    },
    placeholders: {
      email: 'Enter your email',
      newPassword: 'Minimum 8 characters',
      confirmPassword: 'Repeat the new password',
    },
    actions: {
      sendLink: 'Send reset link',
      sending: 'Sending…',
      resetPassword: 'Reset password',
      resetting: 'Resetting…',
      backToLogin: 'Back to login',
    },
    messages: {
      requestSentTitle: 'Request sent',
      requestSentBody: 'If the email is registered, you’ll receive a reset link shortly.',
      resetSuccessTitle: 'Password reset',
      resetSuccessBody: 'Your password has been reset. You can sign in now.',
      ethics:
        'Your fiscal data is protected and used only for accounting purposes, according to our terms and consents.',
    },
    validation: {
      required: 'Required',
      invalidEmail: 'Invalid email',
      passwordMin: 'Minimum 8 characters',
      passwordLetterNumber: 'Must contain at least 1 letter and 1 number',
      passwordMismatch: 'Passwords do not match',
    },
    errors: {
      invalidOrExpired: 'Invalid or expired link. Please request a new one.',
      weakPassword: 'Weak password. Use at least 8 characters with letters and numbers.',
      tooManyAttempts: 'Too many attempts. Please wait and try again.',
      generic: 'Could not complete right now. Please try again.',
    },
  },
}
