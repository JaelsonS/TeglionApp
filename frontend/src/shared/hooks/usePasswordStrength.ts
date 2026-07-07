import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong'

interface PasswordStrengthResult {
  strength: PasswordStrength
  score: number
  message: string
  feedback: string[]
}

export function usePasswordStrength(password: string): PasswordStrengthResult {
  const { t } = useTranslation('common')
  const [result, setResult] = useState<PasswordStrengthResult>({
    strength: 'weak',
    score: 0,
    message: '',
    feedback: [],
  })

  useEffect(() => {
    if (!password) {
      setResult({
        strength: 'weak',
        score: 0,
        message: '',
        feedback: [],
      })
      return
    }

    let score = 0
    const feedback: string[] = []

    if (password.length >= 8) score += 10
    if (password.length >= 12) score += 8
    if (password.length >= 16) score += 7

    if (/[A-Z]/.test(password)) {
      score += 10
      feedback.push(t('passwordStrength.feedback.uppercaseOk'))
    } else {
      feedback.push(t('passwordStrength.feedback.uppercaseMissing'))
    }

    if (/[a-z]/.test(password)) {
      score += 10
      feedback.push(t('passwordStrength.feedback.lowercaseOk'))
    } else {
      feedback.push(t('passwordStrength.feedback.lowercaseMissing'))
    }

    if (/\d/.test(password)) {
      score += 10
      feedback.push(t('passwordStrength.feedback.numbersOk'))
    } else {
      feedback.push(t('passwordStrength.feedback.numbersMissing'))
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 15
      feedback.push(t('passwordStrength.feedback.specialOk'))
    }

    if (/(.)\1{2,}/.test(password)) {
      score -= 10
      feedback.push(t('passwordStrength.feedback.repeatedChars'))
    }

    if (/abc|bcd|123|234/.test(password.toLowerCase())) {
      score -= 10
      feedback.push(t('passwordStrength.feedback.obviousSequence'))
    }

    // Garantir score entre 0-100
    score = Math.min(100, Math.max(0, score))

    // Determinar nível
    let strength: PasswordStrength = 'weak'
    let message = t('passwordStrength.messageWeak')

    if (score >= 75) {
      strength = 'strong'
      message = t('passwordStrength.messageStrong')
    } else if (score >= 60) {
      strength = 'good'
      message = t('passwordStrength.messageGood')
    } else if (score >= 40) {
      strength = 'fair'
      message = t('passwordStrength.messageFair')
    }

    setResult({
      strength,
      score,
      message,
      feedback,
    })
  }, [password, t])

  return result
}
