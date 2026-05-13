export type RecordType = 'income' | 'expense'
export type PaymentMethod = 'card' | 'cash'
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

export interface Worker {
  id: string
  user_id: string
  name: string
  phone: string | null
  role: string | null
  notes: string | null
  telegram_username: string | null
  worker_user_id: string | null
  created_at: string
}

export interface RecordWorker {
  id: string
  record_id: string
  worker_id: string
  amount_paid: number
  status: 'pending' | 'confirmed'
  confirmed_at: string | null
  created_at: string
  worker?: Worker
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
  title: string | null
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
  record_workers?: RecordWorker[]
}
