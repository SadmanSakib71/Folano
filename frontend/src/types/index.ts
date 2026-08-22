export interface User {
  id: number
  name: string
  phone: string
  email: string | null
  role: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  is_active: boolean
}

export interface Product {
  id: number
  category_id: number
  name: string
  slug: string
  description: string | null
  unit: string
  price: number
  image_url: string | null
  is_seasonal: boolean
  is_preorder_only: boolean
  stock_quantity: number
  is_active: boolean
}

export interface PreorderBatch {
  id: number
  product_id: number
  batch_name: string
  total_quantity: number
  reserved_quantity: number
  available_quantity: number
  price_per_unit: number
  preorder_start_date: string
  preorder_end_date: string
  expected_delivery_date: string
  status: string
  product_name?: string
  unit?: string
  image_url?: string | null
}

export interface OrderItem {
  id: number
  order_id?: number
  product_id: number
  product_name?: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface Order {
  id: number
  user_id: number
  address_text: string
  order_type: string
  status: string
  subtotal: number
  delivery_charge: number
  total_amount: number
  payment_status: string
  expected_delivery_date: string | null
  created_at: string
  items?: OrderItem[]
  order_items?: OrderItem[]
}
