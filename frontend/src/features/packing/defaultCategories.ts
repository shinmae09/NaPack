import type { PackingCategory } from './types'

const defaultCategoryNames = [
  'Clothing',
  'Health Kits',
  'Electronics',
  'Documents',
  'Miscellaneous',
] as const

export function createDefaultCategories(): PackingCategory[] {
  return defaultCategoryNames.map((name, index) => ({
    id: `default-${index + 1}`,
    name,
    isDefault: true,
    items: [],
  }))
}