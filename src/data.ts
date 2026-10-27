export const categories = ['Everything', 'Laptops', 'Phones & tablets', 'Cameras', 'Audio']

export function money(value: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value)
}

export function makeId(prefix: string): string {
  return `${prefix}-${globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10)}`
}

export function normalizeKenyanPhone(value: string): string | null {
  const digits = value.replace(/\D/g, '')
  if (/^254[17]\d{8}$/.test(digits)) return digits
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`
  return null
}
