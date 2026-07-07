export function digitsOnly(input: unknown): string {
  return String(input ?? '').replace(/\D+/g, '')
}

export function isValidCPF(input: unknown): boolean {
  const cpf = digitsOnly(input)
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  const calc = (len: number) => {
    let sum = 0
    for (let i = 0; i < len; i++) {
      sum += Number(cpf[i]) * (len + 1 - i)
    }
    const mod = sum % 11
    return mod < 2 ? 0 : 11 - mod
  }

  const d1 = calc(9)
  const d2 = calc(10)
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10])
}

export function isValidNIF(input: unknown): boolean {
  const nif = digitsOnly(input)
  if (nif.length !== 9) return false
  if (/^(\d)\1{8}$/.test(nif)) return false

  let sum = 0
  for (let i = 0; i < 8; i++) {
    sum += Number(nif[i]) * (9 - i)
  }
  const mod = sum % 11
  const check = mod < 2 ? 0 : 11 - mod
  return check === Number(nif[8])
}

export function isValidCNPJ(input: unknown): boolean {
  const cnpj = digitsOnly(input)
  if (cnpj.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cnpj)) return false

  const calc = (base: string, weights: number[]) => {
    let sum = 0
    for (let i = 0; i < weights.length; i++) {
      sum += Number(base[i]) * weights[i]
    }
    const mod = sum % 11
    return mod < 2 ? 0 : 11 - mod
  }

  const base12 = cnpj.slice(0, 12)
  const d1 = calc(base12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const base13 = cnpj.slice(0, 13)
  const d2 = calc(base13, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])

  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13])
}

export type PostalCountry = 'BR' | 'PT' | 'ES' | 'US' | 'EN-US' | '' | null | undefined

export function normalizePostalCountry(country: PostalCountry): 'BR' | 'PT' | 'ES' | 'US' | null {
  const c = String(country ?? '').trim().toUpperCase()
  if (c === 'EN-US') return 'US'
  if (c === 'BR' || c === 'PT' || c === 'ES' || c === 'US') return c
  return null
}

export function isValidPostalCode(country: PostalCountry, postalCode: unknown): boolean {
  const raw = String(postalCode ?? '').trim()
  if (!raw) return true
  const c = normalizePostalCountry(country)
  if (c === 'BR') return /^\d{5}-?\d{3}$/.test(raw)
  if (c === 'PT') return /^\d{4}-?\d{3}$/.test(raw)
  if (c === 'ES') return /^\d{5}$/.test(raw)
  if (c === 'US') return /^\d{5}(-?\d{4})?$/.test(raw)
  return true
}

export function formatNifInput(value: string): string {
  const d = digitsOnly(value).slice(0, 9)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
}

export function formatPostalCode(country: PostalCountry, value: string): string {
  const c = normalizePostalCountry(country)
  const digits = digitsOnly(value)

  if (c === 'BR') {
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`
  }

  if (c === 'PT') {
    if (digits.length <= 4) return digits
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}`
  }

  if (c === 'US') {
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`
  }

  if (c === 'ES') {
    return digits.slice(0, 5)
  }

  return value
}
