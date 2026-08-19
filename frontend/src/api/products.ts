import type { Product } from '../types'
import api from './client'

export const getProducts = async (categoryId?: number) => {
  const response = await api.get<Product[]>('/products', {
    params: categoryId ? { category_id: categoryId } : undefined,
  })

  return response.data
}

export const getProductById = async (id: number) => {
  const response = await api.get<Product>(`/products/${id}`)

  return response.data
}
