import axios from 'axios'
import api from './client'

export async function createOrder(data: {
  address_text: string
  delivery_charge: number
  items: {
    product_id: number
    quantity: number
  }[]
}) {
  const response = await api.post('/orders', data)
  return response.data
}

export async function getMyOrders() {
  const response = await api.get('/orders/my')
  return response.data
}

export async function getOrderById(id: number) {
  const response = await api.get(`/orders/${id}`)
  return response.data
}

export async function submitPaymentClaim(data: {
  order_id: number
  bkash_number_used?: string
  bkash_trx_last_digits: string
}) {
  const payload: {
    order_id: number
    bkash_trx_last_digits: string
    bkash_number_used?: string
  } = {
    order_id: data.order_id,
    bkash_trx_last_digits: data.bkash_trx_last_digits,
  }

  const bkashNumber = data.bkash_number_used?.trim()

  if (bkashNumber) {
    payload.bkash_number_used = bkashNumber
  }

  const response = await api.post('/orders/payment-claim', payload)
  return response.data
}

export type CreatedOrder = {
  id: number
  order_code: string
  total_amount: number
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  return value as Record<string, unknown>
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

export function parseCreatedOrder(data: unknown): CreatedOrder | null {
  const root = asRecord(data)

  if (!root) {
    return null
  }

  const nested = asRecord(root.order)
  const raw = nested ?? root
  const id = toFiniteNumber(raw.id)
  const orderCode = typeof raw.order_code === 'string' ? raw.order_code.trim() : ''
  const totalAmount = toFiniteNumber(raw.total_amount)

  if (
    id === null ||
    !Number.isInteger(id) ||
    id <= 0 ||
    orderCode === '' ||
    totalAmount === null
  ) {
    return null
  }

  return {
    id,
    order_code: orderCode,
    total_amount: totalAmount,
  }
}

const ORDER_ERROR_MESSAGES: Record<string, string> = {
  Unauthorized: 'অর্ডার করতে লগইন করুন',
  'address_text is required and must be a non-empty string':
    'ডেলিভারি ঠিকানা লিখুন',
  'delivery_charge is required and must be a number >= 0':
    'ডেলিভারি চার্জ সঠিক নয়',
  'items is required and must be an array': 'কার্টে পণ্য নেই',
  'items must contain at least one item': 'কার্টে পণ্য নেই',
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

export function getOrderErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && !error.response) {
    return 'সার্ভারের সাথে সংযোগ করা যায়নি। আবার চেষ্টা করুন।'
  }

  if (axios.isAxiosError(error) && error.response?.status === 401) {
    return 'অর্ডার করতে লগইন করুন'
  }

  const serverError = readServerError(error)

  if (serverError) {
    const stockWithName = serverError.match(
      /Requested quantity for "(.+)" exceeds available stock/,
    )

    if (stockWithName) {
      return `"${stockWithName[1]}" এর পর্যাপ্ত স্টক নেই। পরিমাণ কমিয়ে আবার চেষ্টা করুন।`
    }

    if (/exceeds available stock/i.test(serverError)) {
      return 'স্টকে পর্যাপ্ত পরিমাণ নেই। কার্ট চেক করে আবার চেষ্টা করুন।'
    }

    if (/does not exist or is inactive/i.test(serverError)) {
      return 'কিছু ফল এখন আর পাওয়া যাচ্ছে না। কার্ট থেকে সরিয়ে আবার চেষ্টা করুন।'
    }

    if (ORDER_ERROR_MESSAGES[serverError]) {
      return ORDER_ERROR_MESSAGES[serverError]
    }
  }

  return 'অর্ডার সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।'
}

export function getPaymentClaimErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && !error.response) {
    return 'সার্ভারের সাথে সংযোগ করা যায়নি। আবার চেষ্টা করুন।'
  }

  if (axios.isAxiosError(error) && error.response?.status === 401) {
    return 'পেমেন্ট তথ্য সাবমিট করতে লগইন করুন'
  }

  const serverError = readServerError(error)

  if (serverError && /[\u0980-\u09FF]/.test(serverError)) {
    return serverError
  }

  return 'পেমেন্ট তথ্য সাবমিট করা যায়নি। আবার চেষ্টা করুন।'
}
