export interface PackingItem {
  id: string
  name: string
  quantity?: number
  isPacked: boolean
}

export interface PackingCategory {
  id: string
  name: string
  isDefault: boolean
  items: PackingItem[]
}

export interface CategoryProgress {
  completed: number
  total: number
  percentage: number
}