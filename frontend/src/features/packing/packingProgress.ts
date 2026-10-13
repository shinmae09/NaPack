import type {
  CategoryProgress,
  PackingCategory,
} from './types'

export function calculateCategoryProgress(
  category: PackingCategory,
): CategoryProgress {
  const total = category.items.length
  const completed = category.items.filter(
    (item) => item.isPacked,
  ).length

  return {
    completed,
    total,
    percentage:
      total === 0 ? 0 : Math.round((completed / total) * 100),
  }
}