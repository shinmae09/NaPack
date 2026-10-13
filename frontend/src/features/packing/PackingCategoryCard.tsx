import { useState } from 'react'
import type { FormEvent } from 'react'
import { ProgressBar } from '../../components/ProgressBar'
import { calculateCategoryProgress } from './packingProgress'
import type { PackingCategory, PackingItem } from './types'

interface PackingCategoryCardProps {
  category: PackingCategory
  onAddItem: (
    categoryId: string,
    name: string,
    quantity?: number,
  ) => void
  onToggleItem: (categoryId: string, itemId: string) => void
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = name.trim()
    const parsedQuantity =
      quantity.trim() === '' ? undefined : Number(quantity)

    if (!trimmedName) return

    if (
      parsedQuantity !== undefined &&
      (!Number.isInteger(parsedQuantity) || parsedQuantity < 1)
    ) {
      return
    }

    onSubmit(trimmedName, parsedQuantity)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Item name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={100}
          required
        />
      </label>

      <label>
        Quantity (optional)
        <input
          type="number"
          min={1}
          step={1}
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
      </label>

      <button type="submit">{submitLabel}</button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  )
}

export function PackingCategoryCard({
  category,
  onAddItem,
  onToggleItem,
  onEditItem,
  onDeleteItem,
  onRenameCategory,
  onDeleteCategory,
}: PackingCategoryCardProps) {
  const [addingItem, setAddingItem] = useState(false)
  const [editingItem, setEditingItem] = useState<PackingItem | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [categoryName, setCategoryName] = useState(category.name)

  const progress = calculateCategoryProgress(category)

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
        {renaming ? (
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
        ) : (
          <div>
            <h2>{category.name}</h2>
            <p>
              {progress.completed} of {progress.total} items packed
              {' · '}
              {progress.percentage}%
            </p>
          </div>
        )}

        {!renaming && (
          <div className="category-card__actions">
            <button
              type="button"
              onClick={() => setRenaming(true)}
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

      <ProgressBar
        percentage={progress.percentage}
        label={`${category.name} completion`}
      />

      {category.items.length === 0 ? (
        <p>No items yet. Add something you need to pack.</p>
      ) : (
        <ul className="packing-item-list">
          {category.items.map((item) => (
            <li key={item.id} className="packing-item">
              <label>
                <input
                  type="checkbox"
                  checked={item.isPacked}
                  onChange={() =>
                    onToggleItem(category.id, item.id)
                  }
                />
                <span>
                  {item.name}
                  {item.quantity !== undefined &&
                    ` (${item.quantity})`}
                </span>
              </label>

              <div>
                <button
                  type="button"
                  onClick={() => setEditingItem(item)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(`Delete "${item.name}"?`)
                    ) {
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
                    onEditItem(
                      category.id,
                      item.id,
                      name,
                      quantity,
                    )
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
          onClick={() => setAddingItem(true)}
        >
          + Add item
        </button>
      )}
    </section>
  )
}