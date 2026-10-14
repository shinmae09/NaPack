
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ProgressBar } from '../../components/ProgressBar'
import { calculateCategoryProgress } from './packingProgress'
import type { PackingCategory, PackingItem } from './types'

interface PackingCategoryCardProps {
  category: PackingCategory
  defaultExpanded: boolean
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

type ActionIconName =
  | 'edit'
  | 'delete'
  | 'undo'
  | 'pack'
  | 'add'
  | 'chevron'
  | 'save'
  | 'cancel'

function ActionIcon({ name }: { name: ActionIconName }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
    focusable: false as const,
  }

  switch (name) {
    case 'edit':
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
      )
    case 'delete':
      return (
        <svg {...common}>
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="m19 6-1 14H6L5 6" />
          <path d="M10 10v6M14 10v6" />
        </svg>
      )
    case 'undo':
      return (
        <svg {...common}>
          <path d="M3 7v6h6" />
          <path d="M5.2 12a8 8 0 1 0 2.1-5.4L3 13" />
        </svg>
      )
    case 'pack':
      return (
        <svg {...common}>
          <path d="m8 12 3 3 5-6" />
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M16 3h5v5" />
        </svg>
      )
    case 'add':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case 'chevron':
      return (
        <svg {...common}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      )
    case 'save':
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      )
    case 'cancel':
      return (
        <svg {...common}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      )
  }
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
    <form
      className="packing-form packing-form--item"
      onSubmit={handleSubmit}
      noValidate
    >
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

      <div className="packing-form__actions">
        <button
          type="submit"
          className="icon-button icon-button--primary"
          title={submitLabel}
          aria-label={submitLabel}
        >
          <ActionIcon name="save" />
        </button>

        <button
          type="button"
          className="icon-button"
          title="Cancel"
          aria-label="Cancel"
          onClick={onCancel}
        >
          <ActionIcon name="cancel" />
        </button>
      </div>
    </form>
  )
}

export function PackingCategoryCard({
  category,
  defaultExpanded,
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
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

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
            <span className="category-card__chevron" aria-hidden="true">
              <ActionIcon name="chevron" />
            </span>
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
              className="icon-button"
              title="Rename category"
              aria-label={`Rename ${category.name} category`}
              onClick={() => {
                setCategoryName(category.name)
                setRenaming(true)
                setIsExpanded(true)
              }}
            >
              <ActionIcon name="edit" />
            </button>

            {!category.isDefault && (
              <button
                type="button"
                className="icon-button icon-button--danger"
                title="Delete category"
                aria-label={`Delete ${category.name} category and its items`}
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
                <ActionIcon name="delete" />
              </button>
            )}
          </div>
        )}
      </header>

      {renaming && (
        <form
          className="packing-form packing-form--category"
          onSubmit={handleRename}
        >
          <label>
            Category name
            <input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              maxLength={60}
              required
            />
          </label>

          <div className="packing-form__actions">
            <button
              type="submit"
              className="icon-button icon-button--primary"
              title="Save category name"
              aria-label="Save category name"
            >
              <ActionIcon name="save" />
            </button>

            <button
              type="button"
              className="icon-button"
              title="Cancel"
              aria-label="Cancel"
              onClick={() => {
                setCategoryName(category.name)
                setRenaming(false)
              }}
            >
              <ActionIcon name="cancel" />
            </button>
          </div>
        </form>
      )}

      <ProgressBar
        percentage={progress.percentage}
        label={`${category.name} completion`}
      />

      <div
        id={`category-content-${category.id}`}
        className={`category-card__content${isExpanded ? ' category-card__content--expanded' : ''}`}
        aria-hidden={!isExpanded}
      >
        <div className="category-card__content-inner">
        <div className="packing-item-controls">
          <label className="packing-item-controls__label">
            <span>Sort items</span>
            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value as ItemSortOrder)
              }
            >
              <option value="default">Default order</option>
              <option value="unpacked-first">Unpacked</option>
              <option value="alphabetical">Alphabetical</option>
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

        {!normalizedQuery && category.items.length > 0 && (
          <button
            type="button"
            className={`pack-all-button${remainingItems.length === 0 ? ' is-complete' : ''}`}
            title={
              remainingItems.length === 0
                ? 'All items are packed'
                : 'Pack all remaining items'
            }
            aria-label={
              remainingItems.length === 0
                ? `All items in ${category.name} are packed`
                : `Pack all ${category.items.filter((item) => !item.isPacked).length} remaining items in ${category.name}`
            }
            aria-pressed={remainingItems.length === 0}
            disabled={remainingItems.length === 0}
            onClick={() => onPackAllItems(category.id)}
          >
            <span className="pack-all-button__checkbox" aria-hidden="true">
              {remainingItems.length === 0 ? '✓' : ''}
            </span>
            <ActionIcon name="pack" />
            <span className="pack-all-button__label">Pack All</span>
            <span className="icon-text-button__count">
              {category.items.filter((item) => !item.isPacked).length}
            </span>
          </button>
        )}

        {visibleItems.length === 0 ? (
          <p
            className={`packing-empty-state${
              !normalizedQuery && category.items.length === 0
                ? ' packing-empty-state--no-items'
                : ''
            }`}
          >
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
              <li key={item.id} className="packing-item-wrap">
                <div className="packing-item">
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
                      className="icon-button"
                      title="Edit item"
                      aria-label={`Edit ${item.name}`}
                      onClick={() => setEditingItem(item)}
                    >
                      <ActionIcon name="edit" />
                    </button>

                    <button
                      type="button"
                      className="icon-button icon-button--danger"
                      title="Delete item"
                      aria-label={`Delete ${item.name}`}
                      onClick={() => {
                        if (window.confirm(`Delete "${item.name}"?`)) {
                          onDeleteItem(category.id, item.id)
                        }
                      }}
                    >
                      <ActionIcon name="delete" />
                    </button>
                  </div>
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
          <button
            type="button"
            className="icon-text-button"
            onClick={() => setAddingItem(true)}
          >
            <ActionIcon name="add" />
            <span>Add item</span>
          </button>
        )}
        </div>
      </div>
    </section>
  )
}