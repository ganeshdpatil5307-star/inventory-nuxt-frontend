export interface PaginationMeta {
  page: number
  size: number
  total: number
  pages: number
  has_next: boolean
  has_prev: boolean
}

export interface Page<T> {
  items: T[]
  meta: PaginationMeta
}

export interface User {
  id: number
  email: string
  full_name: string
  is_active: boolean
  is_admin: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface Category {
  id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: number
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  sku: string
  name: string
  description: string | null
  unit_price: string | number
  quantity: number
  reorder_level: number
  is_low_stock: boolean
  category_id: number | null
  supplier_id: number | null
  category: Category | null
  supplier: Supplier | null
  created_at: string
  updated_at: string
}

export type MovementType = 'IN' | 'OUT' | 'ADJUST'

export interface StockMovement {
  id: number
  product_id: number
  movement_type: MovementType
  quantity: number
  quantity_after: number
  reference: string | null
  note: string | null
  created_by_id: number | null
  created_at: string
  product_name: string | null
  product_sku: string | null
}

export interface DashboardCounts {
  products: number
  categories: number
  suppliers: number
  users: number
  low_stock: number
  out_of_stock: number
  total_units: number
  inventory_value: string | number
}

export interface CategoryBreakdown {
  category_id: number | null
  category_name: string
  product_count: number
  total_quantity: number
}

export interface DashboardSummary {
  counts: DashboardCounts
  low_stock_products: Product[]
  recent_movements: StockMovement[]
  category_breakdown: CategoryBreakdown[]
}
