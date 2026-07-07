import { z } from 'zod'

export const PASSWORD_MIN_LENGTH = 10

/** Mensagens alinhadas com o backend (`password-policy.js`). */
export const passwordPolicyMessages = {
  minLength: `A palavra-passe deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`,
  lowercase: 'Inclua pelo menos uma letra minúscula.',
  uppercase: 'Inclua pelo menos uma letra maiúscula.',
  digit: 'Inclua pelo menos um número.',
} as const

export const passwordPolicySchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, passwordPolicyMessages.minLength)
  .regex(/[a-z]/, passwordPolicyMessages.lowercase)
  .regex(/[A-Z]/, passwordPolicyMessages.uppercase)
  .regex(/\d/, passwordPolicyMessages.digit)
