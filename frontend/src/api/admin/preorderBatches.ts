import axios from 'axios'
import type { PreorderBatch } from '../../types'
import api from '../client'

export interface CreatePreorderBatchInput {
  product_id: number
  batch_name: string
  total_quantity: number
  price_per_unit: number
  preorder_start_date: string
  preorder_end_date: string
  expected_delivery_date: string
}

export async function createBatch(data: CreatePreorderBatchInput) {
  const response = await api.post<PreorderBatch>('/preorder-batches', data)
  return response.data
}

export async function updateBatchStatus(id: number, status: string) {
  const response = await api.patch<PreorderBatch>(`/preorder-batches/${id}/status`, {
    status,
  })
  return response.data
}

const BATCH_ERROR_MESSAGES: Record<string, string> = {
  Unauthorized: 'এই কাজ করার অনুমতি নেই',
  'product_id, batch_name, total_quantity, price_per_unit, preorder_start_date, preorder_end_date, and expected_delivery_date are required':
    'প্রয়োজনীয় তথ্য পূরণ করুন',
  'product_id is invalid': 'প্রোডাক্ট নির্বাচন সঠিক নয়',
  'total_quantity must be greater than 0': 'মোট পরিমাণ ০-এর বেশি হতে হবে',
  'price_per_unit must be greater than or equal to 0': 'ইউনিট মূল্য সঠিক নয়',
  'Invalid status': 'স্ট্যাটাস সঠিক নয়',
  'Product does not exist': 'প্রোডাক্ট খুঁজে পাওয়া যায়নি',
  'Preorder batch not found': 'ব্যাচ খুঁজে পাওয়া যায়নি',
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

function looksLikeBengali(text: string) {
  return /[\u0980-\u09FF]/.test(text)
}

export function getAdminPreorderBatchErrorMessage(
  error: unknown,
  fallback = 'অনুরোধ সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।',
) {
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
    if (looksLikeBengali(serverError)) {
      return serverError
    }

    return BATCH_ERROR_MESSAGES[serverError] ?? fallback
  }

  return fallback
}
