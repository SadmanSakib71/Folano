import type { Category } from '../types'
import api from './client'

export const getCategories = async () => {
  const response = await api.get<Category[]>('/categories')

  return response.data
}
