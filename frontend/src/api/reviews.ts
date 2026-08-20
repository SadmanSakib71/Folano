import axios from 'axios'
import api from './client'

export interface Review {
  id: number
  user_id: number
  product_id: number
  order_id: number
  rating: number
  comment: string | null
  created_at: string
  updated_at?: string
  user_name: string
}

export interface ProductReviewsResponse {
  reviews: Review[]
  average_rating: number
  total_reviews: number
}

export async function getProductReviews(productId: number) {
  const response = await api.get<ProductReviewsResponse>(
    `/products/${productId}/reviews`,
  )

  return response.data
}

export async function createReview(data: {
  product_id: number
  order_id: number
  rating: number
  comment?: string
}) {
  const response = await api.post<Review>('/reviews', data)

  return response.data
}

const REVIEW_ERROR_MESSAGES: Record<string, string> = {
  Unauthorized: 'রিভিউ দিতে লগইন করুন',
  'product_id is required': 'প্রোডাক্ট খুঁজে পাওয়া যায়নি',
  'order_id is required': 'Order ID দিন',
  'rating is required': 'রেটিং দিন',
  'Invalid product ID': 'প্রোডাক্ট খুঁজে পাওয়া যায়নি',
  'Invalid order ID': 'সঠিক Order ID দিন',
  'rating must be an integer between 1 and 5':
    'রেটিং ১ থেকে ৫ এর মধ্যে হতে হবে',
  'comment must be a string': 'মন্তব্য সঠিক নয়',
  'Product not found': 'প্রোডাক্ট খুঁজে পাওয়া যায়নি',
  'Something went wrong': 'রিভিউ জমা দেওয়া যায়নি। আবার চেষ্টা করুন।',
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

function hasBengali(value: string) {
  return /[\u0980-\u09FF]/.test(value)
}

export function getReviewErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && !error.response) {
    return 'সার্ভারের সাথে সংযোগ করা যায়নি। আবার চেষ্টা করুন।'
  }

  if (axios.isAxiosError(error) && error.response?.status === 401) {
    return 'রিভিউ দিতে লগইন করুন'
  }

  const serverError = readServerError(error)

  if (serverError) {
    if (hasBengali(serverError)) {
      return serverError
    }

    if (REVIEW_ERROR_MESSAGES[serverError]) {
      return REVIEW_ERROR_MESSAGES[serverError]
    }
  }

  return 'রিভিউ জমা দেওয়া যায়নি। আবার চেষ্টা করুন।'
}
