const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']

const UNIT_LABELS: Record<string, string> = {
  kg: 'কেজি',
  g: 'গ্রাম',
  dozen: 'ডজন',
  piece: 'পিস',
  pc: 'পিস',
  pcs: 'পিস',
}

export function toBanglaDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => BANGLA_DIGITS[Number(digit)])
}

export function formatBanglaNumber(value: string | number): string {
  const numeric = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(numeric)) {
    return toBanglaDigits(value)
  }

  if (Number.isInteger(numeric)) {
    return toBanglaDigits(numeric)
  }

  return toBanglaDigits(numeric.toFixed(2).replace(/\.00$/, ''))
}

export function formatUnit(unit: string): string {
  return UNIT_LABELS[unit.trim().toLowerCase()] ?? unit
}

export function formatPriceWithUnit(price: string | number, unit: string): string {
  return `৳${formatBanglaNumber(price)}/${formatUnit(unit)}`
}

const BANGLA_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
]

function parseDisplayDate(value: string | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const trimmed = value.trim()
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)

  if (dateOnly) {
    const date = new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
    )
    return Number.isNaN(date.getTime()) ? null : date
  }

  const date = new Date(trimmed)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatBanglaDate(value: string | Date | null | undefined): string | null {
  if (!value) {
    return null
  }

  const date = parseDisplayDate(value)

  if (!date) {
    return null
  }

  return `${toBanglaDigits(date.getDate())} ${BANGLA_MONTHS[date.getMonth()]} ${toBanglaDigits(date.getFullYear())}`
}
