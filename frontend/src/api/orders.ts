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
