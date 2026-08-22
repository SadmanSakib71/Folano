import axios from 'axios'
import type { Order } from '../../types'
import api from '../client'

export interface OrderListFilters {
  status?: string
  order_type?: string
}

function filterValue(value?: string) {
  const trimmed = value?.trim()
  return trimmed && trimmed !== 'all' ? trimmed : undefined
}

export async function getAllOrders(filters?: OrderListFilters) {
  const params: Record<string, string> = {}
  const status = filterValue(filters?.status)
  const orderType = filterValue(filters?.order_type)

  if (status) {
    params.status = status
  }

  if (orderType) {
    params.order_type = orderType
  }

  const response = await api.get<Order[]>('/orders', {
    params: Object.keys(params).length > 0 ? params : undefined,
  })

  return Array.isArray(response.data) ? response.data : []
}

export async function updateOrderStatus(id: number, status: string) {
  const response = await api.patch<{ order: Order }>(`/orders/${id}/status`, {
    status,
  })
  return response.data
}

export async function updatePaymentStatus(id: number, paymentStatus: string) {
  const response = await api.patch<{ order: Order }>(
    `/orders/${id}/payment-status`,
    { payment_status: paymentStatus },
  )
  return response.data
}

const ORDER_ERROR_MESSAGES: Record<string, string> = {
  Unauthorized: 'এই কাজ করার অনুমতি নেই',
  'Invalid order_type': 'অর্ডারের ধরন সঠিক নয়',
  'Order not found': 'অর্ডার খুঁজে পাওয়া যায়নি',
  'status is required': 'অর্ডার স্ট্যাটাস দিতে হবে',
  'Invalid order status': 'অর্ডার স্ট্যাটাস সঠিক নয়',
  'payment_status is required': 'পেমেন্ট স্ট্যাটাস দিতে হবে',
  'Invalid payment status': 'পেমেন্ট স্ট্যাটাস সঠিক নয়',
  'Something went wrong': 'অনুরোধ সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।',
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

export function getAdminOrderErrorMessage(error: unknown): string {
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

  if (serverError) {
    return ORDER_ERROR_MESSAGES[serverError] ?? 'অর্ডার আপডেট করা যায়নি। আবার চেষ্টা করুন।'
  }

  return 'অর্ডার আপডেট করা যায়নি। আবার চেষ্টা করুন।'
}
