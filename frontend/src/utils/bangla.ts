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
