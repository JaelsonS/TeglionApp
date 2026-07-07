import React from 'react'
import { Check, X, AlertCircle } from 'lucide-react'
import type { PasswordStrength } from '@/shared/hooks/usePasswordStrength'

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength
  score: number
  message: string
  feedback: string[]
  showFeedback?: boolean
}

const PASSWORD_STRENGTH_LABEL = String.fromCharCode(70, 111, 114, 231, 97, 32, 100, 97, 32, 115, 101, 110, 104, 97)

function feedbackColorClass(item: string) {
  if (item.startsWith('✓')) return 'text-green-700'
  if (item.startsWith('✗')) return 'text-red-700'
  return 'text-yellow-700'
}

export function PasswordStrengthIndicator({
  strength,
  score,
  message,
  feedback,
  showFeedback = true,
}: PasswordStrengthIndicatorProps) {
  const strengthColors = {
    weak: 'from-red-500 to-red-600',
    fair: 'from-yellow-500 to-yellow-600',
    good: 'from-blue-500 to-blue-600',
    strong: 'from-green-500 to-green-600',
  }

  const strengthBgColors = {
    weak: 'bg-red-100',
    fair: 'bg-yellow-100',
    good: 'bg-blue-100',
    strong: 'bg-green-100',
  }

  const strengthTextColors = {
    weak: 'text-red-700',
    fair: 'text-yellow-700',
    good: 'text-blue-700',
    strong: 'text-green-700',
  }

  const strengthBorder = {
    weak: 'border-red-200',
    fair: 'border-yellow-200',
    good: 'border-blue-200',
    strong: 'border-green-200',
  }

  return (
    <div className="space-y-2">
      {/* Barra de força */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-slate-600">{PASSWORD_STRENGTH_LABEL}</label>
          <span className={`text-xs font-semibold ${strengthTextColors[strength]}`}>
            {message}
          </span>
        </div>

        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${strengthColors[strength]} transition-all duration-300`}
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Score numérico */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">{score}/100</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  score > i * 25 ? `bg-${strength === 'weak' ? 'red' : strength === 'fair' ? 'yellow' : strength === 'good' ? 'blue' : 'green'}-500` : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Feedback com dicas */}
      {showFeedback && feedback.length > 0 && (
        <div
          className={`rounded-lg p-3 border ${strengthBgColors[strength]} ${strengthBorder[strength]}`}
        >
          <div className="space-y-1">
            {feedback.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                {item.startsWith('✓') ? (
                  <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                ) : item.startsWith('✗') ? (
                  <X className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                )}
                <span
                  className={feedbackColorClass(item)}
                >
                  {item.replace(/^[✓✗]/, '').trim()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
