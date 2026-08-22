import axios from 'axios'
import type { Category } from '../../types'
import api from '../client'

export interface CategoryInput {
  name: string
  slug: string
  description?: string | null
  is_active?: boolean
}

export const getAdminCategories = async () => {
  const response = await api.get<Category[]>('/admin/categories')
  return Array.isArray(response.data) ? response.data : []
}

export const createCategory = async (data: CategoryInput) => {
  const response = await api.post<Category>('/categories', data)
  return response.data
}

export const updateCategory = async (id: number, data: Partial<CategoryInput>) => {
  const response = await api.put<Category>(`/categories/${id}`, data)
  return response.data
}

export const deleteCategory = async (id: number) => {
  const response = await api.delete<{ message: string; category: Category }>(
    `/categories/${id}`,
  )
  return response.data
}

const CATEGORY_ERROR_MESSAGES: Record<string, string> = {
  'name and slug are required': 'নাম এবং slug দিতে হবে',
  'Slug already exists': 'এই slug ইতিমধ্যে ব্যবহৃত',
  'Category not found': 'ক্যাটাগরি খুঁজে পাওয়া যায়নি',
  'Cannot delete category with existing products':
    'এই ক্যাটাগরিতে প্রোডাক্ট আছে, ডিঅ্যাক্টিভেট করা যাবে না',
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

export function getAdminCategoryErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && !error.response) {
    return 'সার্ভারের সাথে সংযোগ করা যায়নি। আবার চেষ্টা করুন।'
  }

  const serverError = readServerError(error)

  if (serverError) {
    return CATEGORY_ERROR_MESSAGES[serverError] ?? serverError
  }

  return 'অনুরোধ সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।'
}
