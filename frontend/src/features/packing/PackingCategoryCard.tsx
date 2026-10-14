import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ProgressBar } from '../../components/ProgressBar'
import { calculateCategoryProgress } from './packingProgress'
import type { PackingCategory, PackingItem } from './types'

interface PackingCategoryCardProps {
  category: PackingCategory
  searchQuery: string
  onAddItem: (
    categoryId: string,
    name: string,
    quantity?: number,
  ) => void
  onToggleItem: (categoryId: string, itemId: string) => void
  onPackAllItems: (categoryId: string) => void
  onEditItem: (
    categoryId: string,
    itemId: string,
    name: string,
    quantity?: number,
  ) => void
  onDeleteItem: (categoryId: string, itemId: string) => void
  onRenameCategory: (categoryId: string, name: string) => void
  onDeleteCategory: (categoryId: string) => void
}

interface ItemFormProps {
  initialName?: string
  initialQuantity?: number
  submitLabel: string
  onSubmit: (name: string, quantity?: number) => void
  onCancel: () => void
}

type ItemFilter = 'all' | 'unpacked' | 'packed'
type ItemSortOrder = 'default' | 'unpacked-first' | 'alphabetical'

const VALID_SORT_ORDERS: ItemSortOrder[] = [
  'default',
  'unpacked-first',
  'alphabetical',
]

function getSortPreferenceKey(categoryId: string): string {
  return `napack:category-sort:v1:${categoryId}`
}

function getInitialSortOrder(categoryId: string): ItemSortOrder {
  try {
    const savedOrder = window.localStorage.getItem(
      getSortPreferenceKey(categoryId),
    )

    if (
      savedOrder &&
      VALID_SORT_ORDERS.includes(savedOrder as ItemSortOrder)
    ) {
      return savedOrder as ItemSortOrder
    }
  } catch {
    // Continue with the default order if local storage is unavailable.
  }

  return 'default'
}

interface ItemFormProps {
  initialName?: string
  initialQuantity?: number
  submitLabel: string
  onSubmit: (name: string, quantity?: number) => void
  onCancel: () => void
}

function ItemForm({
  initialName = '',
  initialQuantity,
  submitLabel,
  onSubmit,
  onCancel,
}: ItemFormProps) {
  const [name, setName] = useState(initialName)
  const [quantity, setQuantity] = useState(
    initialQuantity === undefined ? '' : String(initialQuantity),
  )
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = name.trim()
    const trimmedQuantity = quantity.trim()
    const parsedQuantity =
      trimmedQuantity === '' ? undefined : Number(trimmedQuantity)

    if (!trimmedName) {
      setError('Please enter an item name.')
      return
    }

    if (
      parsedQuantity !== undefined &&
      (!Number.isInteger(parsedQuantity) || parsedQuantity < 1)
    ) {
      setError('Quantity must be a positive whole number.')
      return
    }

    setError('')
    onSubmit(trimmedName, parsedQuantity)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label>
        Item name
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setError('')
          }}
          maxLength={100}
          required
          aria-invalid={error === 'Please enter an item name.'}
        />
      </label>

      <label>
        Quantity needed (optional)
        <input
          type="number"
          inputMode="numeric"
          value={quantity}
          onChange={(event) => {
            setQuantity(event.target.value)
            setError('')
          }}
          aria-invalid={
            error === 'Quantity must be a positive whole number.'
          }
          aria-describedby={error ? 'item-form-error' : undefined}
        />
      </label>

      {error && (
        <p id="item-form-error" className="form-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit">{submitLabel}</button>

      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  )
}

export function PackingCategoryCard({
  category,
  searchQuery,
  onAddItem,
  onToggleItem,
  onPackAllItems,
  onEditItem,
  onDeleteItem,
  onRenameCategory,
  onDeleteCategory,
}: PackingCategoryCardProps) {
  const [addingItem, setAddingItem] = useState(false)
  const [editingItem, setEditingItem] = useState<PackingItem | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [categoryName, setCategoryName] = useState(category.name)
  const [itemFilter, setItemFilter] = useState<ItemFilter>('all')
  const [sortOrder, setSortOrder] = useState<ItemSortOrder>(() =>
    getInitialSortOrder(category.id),
  )
  const [isExpanded, setIsExpanded] = useState(true)

  const progress = calculateCategoryProgress(category)
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase()
  const sortPreferenceKey = getSortPreferenceKey(category.id)

  useEffect(() => {
    try {
      window.localStorage.setItem(sortPreferenceKey, sortOrder)
    } catch {
      // Sorting still works for this session if local storage is unavailable.
    }
  }, [sortPreferenceKey, sortOrder])

  const matchingItems = category.items.filter((item) =>
    item.name.toLocaleLowerCase().includes(normalizedQuery),
  )

  const sortedMatchingItems = [...matchingItems].sort((a, b) => {
    switch (sortOrder) {
      case 'unpacked-first':
        return Number(a.isPacked) - Number(b.isPacked)

      case 'alphabetical':
        return a.name.localeCompare(b.name, undefined, {
          sensitivity: 'base',
        })

      case 'default':
      default:
        return 0
    }
  })

  const remainingItems = sortedMatchingItems.filter((item) => !item.isPacked)

  const visibleItems = sortedMatchingItems.filter((item) => {
    if (itemFilter === 'unpacked') return !item.isPacked
    if (itemFilter === 'packed') return item.isPacked
    return true
  })

  function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = categoryName.trim()

    if (!trimmedName) return

    onRenameCategory(category.id, trimmedName)
    setRenaming(false)
  }

  return (
    <section className="category-card">
      <header className="category-card__header">
        <div className="category-card__heading">
          <button
            type="button"
            className="category-card__toggle"
            aria-expanded={isExpanded}
            aria-controls={`category-content-${category.id}`}
            onClick={() => setIsExpanded((expanded) => !expanded)}
          >
            <span aria-hidden="true">{isExpanded ? '▼' : '▶'}</span>
            <span>{category.name}</span>
          </button>

          <p>
            {progress.completed} of {progress.total} items packed
            {' · '}
            {progress.percentage}%
          </p>
        </div>

        {!renaming && (
          <div className="category-card__actions">
            <button
              type="button"
              onClick={() => {
                setCategoryName(category.name)
                setRenaming(true)
                setIsExpanded(true)
              }}
            >
              Rename
            </button>

            {!category.isDefault && (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete "${category.name}" and all its items?`,
                    )
                  ) {
                    onDeleteCategory(category.id)
                  }
                }}
              >
                Delete category
              </button>
            )}
          </div>
        )}
      </header>

      {renaming && (
        <form onSubmit={handleRename}>
          <label>
            Category name
            <input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              maxLength={60}
              required
            />
          </label>

          <button type="submit">Save name</button>

          <button
            type="button"
            onClick={() => {
              setCategoryName(category.name)
              setRenaming(false)
            }}
          >
            Cancel
          </button>
        </form>
      )}

      <ProgressBar
        percentage={progress.percentage}
        label={`${category.name} completion`}
      />

      <div
        id={`category-content-${category.id}`}
        hidden={!isExpanded}
      >
        <div className="packing-item-controls">
          <label>
            Sort items
            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value as ItemSortOrder)
              }
            >
              <option value="default">Default order</option>
              <option value="unpacked-first">Unpacked first</option>
              <option value="alphabetical">Alphabetical (A–Z)</option>
            </select>
          </label>
        </div>

        <div
          className="packing-item-filters"
          role="group"
          aria-label={`${category.name} item filters`}
        >
          <button
            type="button"
            aria-pressed={itemFilter === 'all'}
            onClick={() => setItemFilter('all')}
          >
            All ({matchingItems.length})
          </button>

          <button
            type="button"
            aria-pressed={itemFilter === 'unpacked'}
            onClick={() => setItemFilter('unpacked')}
          >
            To pack ({remainingItems.length})
          </button>

          <button
            type="button"
            aria-pressed={itemFilter === 'packed'}
            onClick={() => setItemFilter('packed')}
          >
            Packed ({matchingItems.filter((item) => item.isPacked).length})
          </button>
        </div>

        {!normalizedQuery && remainingItems.length > 0 && (
          <button
            type="button"
            onClick={() => onPackAllItems(category.id)}
          >
            Pack all remaining items (
            {category.items.filter((item) => !item.isPacked).length})
          </button>
        )}

        {visibleItems.length === 0 ? (
          <p>
            {normalizedQuery
              ? itemFilter === 'packed'
                ? 'No matching packed items.'
                : itemFilter === 'unpacked'
                  ? 'No matching items left to pack.'
                  : 'No matching items.'
              : category.items.length === 0
                ? 'No items yet. Add something you need to pack.'
                : itemFilter === 'packed'
                  ? 'No items packed yet.'
                  : 'All items are packed. Nice work!'}
          </p>
        ) : (
          <ul className="packing-item-list">
            {visibleItems.map((item) => (
              <li key={item.id} className="packing-item">
                <label>
                  <input
                    type="checkbox"
                    checked={item.isPacked}
                    onChange={() => onToggleItem(category.id, item.id)}
                  />

                  <span>
                    {item.name}
                    {item.quantity !== undefined && ` (${item.quantity})`}
                  </span>
                </label>

                <div className="packing-item__actions">
                  <button
                    type="button"
                    onClick={() => setEditingItem(item)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete "${item.name}"?`)) {
                        onDeleteItem(category.id, item.id)
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>

                {editingItem?.id === item.id && (
                  <ItemForm
                    initialName={item.name}
                    initialQuantity={item.quantity}
                    submitLabel="Save item"
                    onSubmit={(name, quantity) => {
                      onEditItem(category.id, item.id, name, quantity)
                      setEditingItem(null)
                    }}
                    onCancel={() => setEditingItem(null)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}

        {addingItem ? (
          <ItemForm
            submitLabel="Add item"
            onSubmit={(name, quantity) => {
              onAddItem(category.id, name, quantity)
              setAddingItem(false)
            }}
            onCancel={() => setAddingItem(false)}
          />
        ) : (
          <button type="button" onClick={() => setAddingItem(true)}>
            + Add item
          </button>
        )}
      </div>
    </section>
  )
}