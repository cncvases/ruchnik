export type RecordType = 'income' | 'expense'
export type PaymentMethod = 'card' | 'cash' | 'fop'
export type RecordStatus = 'paid' | 'pending'

export interface User {
  id: string
  telegram_id: number
  name: string
  created_at: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  phone: string | null
  telegram_username: string | null
  notes: string | null
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: RecordType
  color: string
}

export interface Subcategory {
  id: string
  category_id: string
  name: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
}

export interface Dimensions {
  width?: number
  height?: number
  thickness?: number
}

export interface Record {
  id: string
  user_id: string
  client_id: string | null
  type: RecordType
  amount: number
  date: string
  description: string | null
  category_id: string | null
  subcategory_id: string | null
  payment_method: PaymentMethod
  status: RecordStatus
  dimensions: Dimensions | null
  photos: string[]
  created_at: string
  updated_at: string
  // joined
  client?: Client
  category?: Category
  subcategory?: Subcategory
  tags?: Tag[]
}
