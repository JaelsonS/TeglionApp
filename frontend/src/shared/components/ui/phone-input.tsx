import React from 'react'
import { useTranslation } from 'react-i18next'
import PhoneInput from 'react-phone-number-input'
import type { Country } from 'react-phone-number-input'
import flags from 'react-phone-number-input/flags'
import 'react-phone-number-input/style.css'

import { cn } from '@/shared/lib/utils'

export type PhoneInputValue = string | undefined
type UnknownProps = { [key: string]: unknown }

export function PhoneNumberInput({
  value,
  onChange,
  defaultCountry,
  onCountryChange,
  disabled,
  placeholder,
  name,
  id,
  className,
  inputClassName,
  inputProps,
  countryLabel,
  'aria-invalid': ariaInvalid,
}: {
  value?: PhoneInputValue
  onChange: (value?: string) => void
  defaultCountry?: Country
  onCountryChange?: (country?: Country) => void
  disabled?: boolean
  placeholder?: string
  name?: string
  id?: string
  className?: string
  inputClassName?: string
  inputProps?: React.InputHTMLAttributes<HTMLInputElement> & UnknownProps
  countryLabel?: string
  'aria-invalid'?: boolean
}) {
  const { t } = useTranslation()
  const resolvedCountryLabel = countryLabel ?? t('common.labels.countryLabel')

  return (
    <PhoneInput
      flags={flags}
      international
      countryCallingCodeEditable={false}
      defaultCountry={defaultCountry}
      onCountryChange={onCountryChange}
      value={value}
      onChange={onChange}
      disabled={disabled}
      name={name}
      id={id}
      placeholder={placeholder}
      className={cn('PhoneInput', className)}
      countrySelectProps={{
        className: 'PhoneInputCountrySelect',
        disabled,
        'aria-label': resolvedCountryLabel,
      }}
      numberInputProps={{
        className: cn('PhoneInputInput', inputClassName),
        'aria-invalid': ariaInvalid ? 'true' : undefined,
        ...inputProps,
      }}
    />
  )
}
