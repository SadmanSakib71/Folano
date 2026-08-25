import axios from 'axios'
import type { Order, OrderItem } from '../../types'
import api from '../client'

export interface PendingPaymentClaim {
  id: number
  user_id: number
  order_code: string
  customer_name?: string
  customer_phone?: string
  order_type: string
  status: string
  payment_status: string
  address_text?: string
  delivery_charge?: number
  subtotal?: number
  total_amount: number
  bkash_number_used: string | null
  bkash_trx_last_digits: string | null
  payment_submitted_at: string
  payment_confirmed_at?: string | null
  expected_delivery_date?: string | null
  created_at?: string
  items?: OrderItem[]
  order_items?: OrderItem[]
}

export async function getPendingPaymentClaims() {
  const response = await api.get<PendingPaymentClaim[]>('/orders/pending-payments')
  return Array.isArray(response.data) ? response.data : []
}

export async function confirmPayment(orderId: number) {
  const response = await api.patch<{ order: Order }>(`/orders/${orderId}/confirm-payment`)
  return response.data
}

export async function rejectPaymentClaim(orderId: number, reason?: string) {
  const trimmedReason = reason?.trim()
  const response = await api.patch<{ order: Order }>(
    `/orders/${orderId}/reject-payment`,
    trimmedReason ? { reason: trimmedReason } : undefined,
  )
  return response.data
}

function readServerError(error: unknown): string | null {
  if (!axios.isAxiosError(error)) {
    return null
  }

  const data: unknown = error.response?.data

  if (!data || typeof data !== 'object') {
    return null
  }

  if ('error' in data && typeof data.error === 'string') {
    return data.error
  }

  if ('message' in data && typeof data.message === 'string') {
    return data.message
  }

  return null
}

function getPaymentActionErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && !error.response) {
    return 'সার্ভারের সাথে সংযোগ করা যায়নি। আবার চেষ্টা করুন।'
  }

  if (axios.isAxiosError(error) && error.response?.status === 401) {
    return 'লগইন সেশন শেষ হয়েছে। আবার লগইন করুন।'
  }

  if (axios.isAxiosError(error) && error.response?.status === 403) {
    return 'এই কাজ করার অনুমতি নেই'
  }

  const serverError = readServerError(error)

  if (serverError && /[\u0980-\u09FF]/.test(serverError)) {
    return serverError
  }

  return fallback
}

export function getConfirmPaymentErrorMessage(error: unknown): string {
  return getPaymentActionErrorMessage(
    error,
    'পেমেন্ট ভেরিফাই করা যায়নি। আবার চেষ্টা করুন।',
  )
}

export function getRejectPaymentErrorMessage(error: unknown): string {
  return getPaymentActionErrorMessage(
    error,
    'পেমেন্ট বাতিল করা যায়নি। আবার চেষ্টা করুন।',
  )
}
