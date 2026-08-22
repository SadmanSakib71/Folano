import axios from 'axios'
import type { Product } from '../../types'
import api from '../client'

export interface ProductInput {
  name: string
  category_id: number
  slug: string
  description?: string | null
  unit: string
  price: number
  image_url?: string | null
  is_seasonal?: boolean
  is_preorder_only?: boolean
  stock_quantity?: number
  is_active?: boolean
}

export const getAdminProducts = async () => {
  const response = await api.get<Product[]>('/admin/products')
  return Array.isArray(response.data) ? response.data : []
}

export const createProduct = async (data: ProductInput) => {
  const response = await api.post<Product>('/products', data)
  return response.data
}

export const updateProduct = async (id: number, data: Partial<ProductInput>) => {
  const response = await api.put<Product>(`/products/${id}`, data)
  return response.data
}

export const deleteProduct = async (id: number) => {
  const response = await api.delete<{ message: string; product: Product }>(
    `/products/${id}`,
  )
  return response.data
}

const PRODUCT_ERROR_MESSAGES: Record<string, string> = {
  'name, category_id, slug, unit, and price are required':
    'প্রয়োজনীয় তথ্য পূরণ করুন',
  'Category does not exist': 'ক্যাটাগরি খুঁজে পাওয়া যায়নি',
  'Slug already exists': 'এই নামে প্রোডাক্ট ইতিমধ্যে আছে',
  'Product not found': 'প্রোডাক্ট খুঁজে পাওয়া যায়নি',
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

export function getAdminProductErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && !error.response) {
    return 'সার্ভারের সাথে সংযোগ করা যায়নি। আবার চেষ্টা করুন।'
  }

  const serverError = readServerError(error)

  if (serverError) {
    return PRODUCT_ERROR_MESSAGES[serverError] ?? serverError
  }

  return 'অনুরোধ সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।'
}
