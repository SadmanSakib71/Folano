import axios from 'axios'
import type { PreorderBatch } from '../types'
import api from './client'

// PostgreSQL decimal/numeric values may arrive as strings.
function toFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  return value as Record<string, unknown>
}

function normalizeBatch(raw: unknown): PreorderBatch | null {
  const row = asRecord(raw)

  if (!row) {
    return null
  }

  const id = toFiniteNumber(row.id, Number.NaN)

  if (!Number.isFinite(id)) {
    return null
  }

  const product = asRecord(row.product)
  const totalQuantity = toFiniteNumber(row.total_quantity)
  const reservedQuantity = toFiniteNumber(row.reserved_quantity)
  const hasAvailable =
    row.available_quantity !== undefined && row.available_quantity !== null

  return {
    id,
    product_id: toFiniteNumber(row.product_id),
    batch_name: readString(row.batch_name) ?? '',
    total_quantity: totalQuantity,
    reserved_quantity: reservedQuantity,
    available_quantity: hasAvailable
      ? toFiniteNumber(row.available_quantity)
      : totalQuantity - reservedQuantity,
    price_per_unit: toFiniteNumber(row.price_per_unit),
    preorder_start_date: readString(row.preorder_start_date) ?? String(row.preorder_start_date ?? ''),
    preorder_end_date: readString(row.preorder_end_date) ?? String(row.preorder_end_date ?? ''),
    expected_delivery_date:
      readString(row.expected_delivery_date) ?? String(row.expected_delivery_date ?? ''),
    status: readString(row.status) ?? '',
    product_name: readString(row.product_name) ?? readString(product?.name),
    unit:
      readString(row.unit) ??
      readString(row.product_unit) ??
      readString(product?.unit),
    image_url:
      readString(row.image_url) ??
      readString(row.product_image_url) ??
      readString(product?.image_url) ??
      null,
  }
}

export async function getPreorderBatches(status?: string) {
  const response = await api.get('/preorder-batches', {
    params: status ? { status } : undefined,
  })

  const list = Array.isArray(response.data) ? response.data : []

  return list
    .map((item: unknown) => normalizeBatch(item))
    .filter((batch: PreorderBatch | null): batch is PreorderBatch => batch !== null)
}

export async function getPreorderBatchById(id: number) {
  const response = await api.get(`/preorder-batches/${id}`)
  const batch = normalizeBatch(response.data)

  if (!batch) {
    const error = new Error('Preorder batch not found')
    throw error
  }

  return batch
}

export async function createPreorder(data: {
  batch_id: number
  quantity: number
  address_text: string
}) {
  const response = await api.post('/orders/preorder', data)
  return response.data
}

const PREORDER_ERROR_MESSAGES: Record<string, string> = {
  Unauthorized: 'প্রি-অর্ডার করতে লগইন করুন',
  'address_text is required and must be a non-empty string':
    'ডেলিভারি ঠিকানা লিখুন',
  'Not enough quantity available':
    'পর্যাপ্ত পরিমাণ নেই। পরিমাণ কমিয়ে আবার চেষ্টা করুন।',
  'Preorder batch is not open': 'এই ব্যাচ বন্ধ হয়ে গেছে',
  'Preorder batch not found': 'এই প্রি-অর্ডার ব্যাচ পাওয়া যায়নি',
  'batch_id is required': 'ব্যাচ নির্বাচন করা যায়নি',
  'batch_id is invalid': 'ব্যাচ নির্বাচন করা যায়নি',
  'quantity is required': 'পরিমাণ সঠিক নয়',
  'quantity must be greater than 0': 'পরিমাণ সঠিক নয়',
}

function readServerError(error: unknown): string | null {
  if (!axios.isAxiosError(error)) {
    return null
  }

  const data: unknown = error.response?.data

  if (data && typeof data === 'object' && 'error' in data) {
    const message = (data as { error: unknown }).error
    return typeof message === 'string' ? message : null
  }

  return null
}

export function getPreorderErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && !error.response) {
    return 'সার্ভারের সাথে সংযোগ করা যায়নি। আবার চেষ্টা করুন।'
  }

  if (axios.isAxiosError(error) && error.response?.status === 401) {
    return 'প্রি-অর্ডার করতে লগইন করুন'
  }

  const serverError = readServerError(error)

  if (serverError) {
    if (/not enough quantity available/i.test(serverError)) {
      return PREORDER_ERROR_MESSAGES['Not enough quantity available']
    }

    if (PREORDER_ERROR_MESSAGES[serverError]) {
      return PREORDER_ERROR_MESSAGES[serverError]
    }
  }

  return 'প্রি-অর্ডার সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।'
}
