import type { AppLocale } from '@/shared/i18n/appLocale'

export type AuthProfileLocale = 'pt-PT' | 'pt-BR' | 'es-ES' | 'en'

type Copy = {
  brand: string
  title: string
  subtitle: string
  firm: { title: string; description: string; cta: string }
  client: { title: string; description: string; cta: string }
  back: string
  intents: { login: string; register: string; trial: string }
}

const COPY: Record<AuthProfileLocale, Copy> = {
  'pt-PT': {
    brand: 'Teglion',
    title: 'Quem está a entrar?',
    subtitle: 'Gabinete e cliente têm áreas diferentes — escolha o perfil certo para não misturar acessos.',
    firm: {
      title: 'Sou um gabinete de contabilidade',
      description: 'Painel da equipa: clientes, obrigações, documentos e mensagens.',
      cta: 'Continuar como gabinete',
    },
    client: {
      title: 'Sou cliente de um gabinete',
      description: 'Portal: enviar documentos, ver pedidos e falar com o gabinete.',
      cta: 'Continuar como cliente',
    },
    back: 'Voltar ao início',
    intents: { login: 'Entrar', register: 'Criar conta', trial: 'Testar sistema' },
  },
  'pt-BR': {
    brand: 'Teglion',
    title: 'Como você quer acessar?',
    subtitle: 'Escolha seu perfil para continuar para login ou cadastro.',
    firm: {
      title: 'Sou um gabinete de contabilidade',
      description: 'Gerenciar clientes, obrigações, documentos e equipe.',
      cta: 'Continuar como gabinete',
    },
    client: {
      title: 'Sou cliente de um gabinete',
      description: 'Ver obrigações, enviar documentos e responder pedidos.',
      cta: 'Continuar como cliente',
    },
    back: 'Voltar ao início',
    intents: { login: 'Entrar', register: 'Criar conta', trial: 'Testar o sistema' },
  },
  'es-ES': {
    brand: 'Teglion',
    title: '¿Cómo desea acceder?',
    subtitle: 'Elija su perfil para continuar al inicio de sesión o registro.',
    firm: {
      title: 'Soy una asesoría contable',
      description: 'Gestionar clientes, obligaciones, documentos y equipo.',
      cta: 'Continuar como asesoría',
    },
    client: {
      title: 'Soy cliente de una asesoría',
      description: 'Ver obligaciones, enviar documentos y responder solicitudes.',
      cta: 'Continuar como cliente',
    },
    back: 'Volver al inicio',
    intents: { login: 'Entrar', register: 'Crear cuenta', trial: 'Probar el sistema' },
  },
  en: {
    brand: 'Teglion',
    title: 'How do you want to sign in?',
    subtitle: 'Choose your profile to continue to login or registration.',
    firm: {
      title: 'I run an accounting firm',
      description: 'Manage clients, obligations, documents, and your team.',
      cta: 'Continue as firm',
    },
    client: {
      title: "I'm a firm's client",
      description: 'View obligations, upload documents, and complete requests.',
      cta: 'Continue as client',
    },
    back: 'Back to home',
    intents: { login: 'Sign in', register: 'Create account', trial: 'Start trial' },
  },
}

export function toAuthProfileLocale(_locale?: AppLocale): AuthProfileLocale {
  return 'pt-PT'
}

export function getAuthProfileCopy(_locale?: AuthProfileLocale): Copy {
  return COPY['pt-PT']
}
