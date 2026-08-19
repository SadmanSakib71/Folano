import type { PreorderBatch } from '../types'
import { toBanglaDigits } from './bangla'
import { getPlaceholderImage } from './placeholderImages'

const DAY_MS = 24 * 60 * 60 * 1000

export function getBatchUnit(batch: PreorderBatch): string {
  return batch.unit?.trim() || 'kg'
}

export function getBatchImage(batch: PreorderBatch): string {
  const image = batch.image_url?.trim()

  if (image) {
    return image
  }

  return getPlaceholderImage(batch.product_name || batch.batch_name)
}

export function getReservationPercent(batch: PreorderBatch): number {
  if (batch.total_quantity <= 0) {
    return 0
  }

  const percent = (batch.reserved_quantity / batch.total_quantity) * 100
  return Math.min(100, Math.max(0, percent))
}

function parseEndDate(value: string): Date | null {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed)

  if (dateOnly) {
    // Treat date-only deadlines as the end of that local day so a passed date is safe to display.
    const date = new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
      23,
      59,
      59,
      999,
    )

    return Number.isNaN(date.getTime()) ? null : date
  }

  const date = new Date(trimmed)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getCountdownText(endDate: string): string | null {
  const end = parseEndDate(endDate)

  if (!end) {
    return null
  }

  const diffMs = end.getTime() - Date.now()

  if (diffMs <= 0) {
    return 'সময় শেষ'
  }

  const days = Math.ceil(diffMs / DAY_MS)

  if (days > 7) {
    return null
  }

  if (days <= 1) {
    return 'আজ শেষ হচ্ছে'
  }

  return `শেষ হতে ${toBanglaDigits(days)} দিন বাকি`
}

export function roundQuantity(value: number): number {
  return Math.round(value * 100) / 100
}

export function getMinQuantity(available: number): number {
  if (available > 0 && available < 1) {
    return roundQuantity(available)
  }

  return 1
}

export function getQuantityStep(unit: string): number {
  const normalized = unit.trim().toLowerCase()

  if (['dozen', 'piece', 'pc', 'pcs'].includes(normalized)) {
    return 1
  }

  return 0.5
}

export function clampQuantity(value: number, available: number): number {
  const min = getMinQuantity(available)

  if (available <= 0) {
    return min
  }

  return Math.min(available, Math.max(min, roundQuantity(value)))
}

// Step by 0.5 kg (or 1 for piece units) without rounding the max available amount away.
export function stepQuantity(
  current: number,
  available: number,
  direction: 1 | -1,
  unit: string,
): number {
  const step = getQuantityStep(unit)
  const min = getMinQuantity(available)
  const next = roundQuantity(current + direction * step)

  if (direction < 0) {
    return Math.max(min, next)
  }

  if (next >= available) {
    return roundQuantity(available)
  }

  return next
}
