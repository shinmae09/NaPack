import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNaPack } from '../app/useNaPack'
import { PackingCategoryCard } from '../features/packing/PackingCategoryCard'
import type { PackingCategory } from '../features/packing/types'

function createId(): string {
  return crypto.randomUUID()
}

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number)

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function PackingChecklistPage() {
  const navigate = useNavigate()

  const {
    activeTrip,
    setCategories,
    completeTrip,
    isLoading,
    storageError,
  } = useNaPack()

  const [newCategoryName, setNewCategoryName] = useState('')
  const [showCategoryForm, setShowCategoryForm] = useState(false)

  if (isLoading) {
    return (
      <main>
        <h1>Loading your packing checklist...</h1>
        <p>Please wait while we restore your saved trip.</p>
      </main>
    )
  }

  if (!activeTrip) {
    return (
      <main>
        <h1>No active trip</h1>
        <p>Create a new trip to start packing.</p>
        <button type="button" onClick={() => navigate('/')}>
          Go to Home
        </button>
      </main>
    )
  }

  const { setup, tripName, categories } = activeTrip

  function updateCategory(
    categoryId: string,
    update: (category: PackingCategory) => PackingCategory,
  ) {
    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId ? update(category) : category,
      ),
    )
  }

  function handleAddCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = newCategoryName.trim()

    if (!name) return

    const duplicate = categories.some(
      (category) => category.name.toLowerCase() === name.toLowerCase(),
    )

    if (duplicate) {
      window.alert('A category with this name already exists.')
      return
    }

    setCategories((current) => [
      ...current,
      {
        id: createId(),
        name,
        isDefault: false,
        items: [],
      },
    ])

    setNewCategoryName('')
    setShowCategoryForm(false)
  }

  function handleRenameCategory(categoryId: string, name: string) {
    const duplicate = categories.some(
      (category) =>
        category.id !== categoryId &&
        category.name.toLowerCase() === name.toLowerCase(),
    )

    if (duplicate) {
      window.alert('A category with this name already exists.')
      return
    }

    updateCategory(categoryId, (category) => ({
      ...category,
      name,
    }))
  }

  function handleAddItem(
    categoryId: string,
    name: string,
    quantity?: number,
  ) {
    updateCategory(categoryId, (category) => ({
      ...category,
      items: [
        ...category.items,
        {
          id: createId(),
          name,
          quantity,
          isPacked: false,
        },
      ],
    }))
  }

  function handleEditItem(
    categoryId: string,
    itemId: string,
    name: string,
    quantity?: number,
  ) {
    updateCategory(categoryId, (category) => ({
      ...category,
      items: category.items.map((item) =>
        item.id === itemId ? { ...item, name, quantity } : item,
      ),
    }))
  }

  function handleToggleItem(categoryId: string, itemId: string) {
    updateCategory(categoryId, (category) => ({
      ...category,
      items: category.items.map((item) =>
        item.id === itemId
          ? { ...item, isPacked: !item.isPacked }
          : item,
      ),
    }))
  }

  function handlePackAllItems(categoryId: string) {
    updateCategory(categoryId, (category) => ({
      ...category,
      items: category.items.map((item) =>
        item.isPacked ? item : { ...item, isPacked: true },
      ),
    }))
  }

  function handleDeleteItem(categoryId: string, itemId: string) {
    updateCategory(categoryId, (category) => ({
      ...category,
      items: category.items.filter((item) => item.id !== itemId),
    }))
  }

  function handleDeleteCategory(categoryId: string) {
    setCategories((current) =>
      current.filter((category) => category.id !== categoryId),
    )
  }

  const totalItems = categories.reduce(
    (total, category) => total + category.items.length,
    0,
  )

  const packedItems = categories.reduce(
    (total, category) =>
      total + category.items.filter((item) => item.isPacked).length,
    0,
  )

  const remainingItems = totalItems - packedItems

  const overallProgress =
    totalItems === 0 ? 0 : Math.round((packedItems / totalItems) * 100)

  function handleCompleteTrip() {
    if (overallProgress < 100) {
      const confirmed = window.confirm(
        `Your packing progress is only ${overallProgress}%. Are you sure you want to mark "${tripName}" as complete? You can still complete the trip if some items are not packed.`,
      )

      if (!confirmed) return
    } else {
      const confirmed = window.confirm(
        `Mark "${tripName}" as complete? Your checklist will be saved, and you can then create a new trip.`,
      )

      if (!confirmed) return
    }

    completeTrip()
    navigate('/')
  }

  return (
    <main>
      <button type="button" onClick={() => navigate('/')}>
        ← Home
      </button>

      <h1>{tripName} Packing Checklist</h1>

      <p>Prepared for {setup.name}</p>

      <p>
        Departure date:{' '}
        <time dateTime={setup.departureDate}>
          {formatDate(setup.departureDate)}
        </time>
      </p>

      {storageError && <p role="alert">{storageError}</p>}

      <section
        className="overall-progress"
        aria-labelledby="overall-progress-heading"
      >
        <div className="overall-progress__header">
          <div>
            <h2 id="overall-progress-heading">Packing progress</h2>
            <p className="overall-progress__status">
              {totalItems === 0
                ? 'Add items to start tracking your packing.'
                : overallProgress === 100
                  ? 'Everything is packed. You are ready to go!'
                  : `${remainingItems} ${
                      remainingItems === 1 ? 'item' : 'items'
                    } left to pack`}
            </p>
          </div>

          <span
            className="overall-progress__percentage"
            aria-label={`${overallProgress}% complete`}
          >
            {overallProgress}%
          </span>
        </div>

        <div
          className="overall-progress__track"
          role="progressbar"
          aria-label="Overall packing progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={overallProgress}
          aria-valuetext={
            totalItems === 0
              ? 'No items added yet'
              : `${packedItems} of ${totalItems} items packed`
          }
        >
          <div
            className="overall-progress__fill"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        <div className="overall-progress__counts">
          <span>
            <strong>{packedItems}</strong> packed
          </span>
          <span>
            <strong>{remainingItems}</strong> remaining
          </span>
          <span>
            <strong>{totalItems}</strong> total
          </span>
        </div>
      </section>

      <section aria-label="Packing categories">
        {categories.map((category) => (
          <PackingCategoryCard
            key={category.id}
            category={category}
            onAddItem={handleAddItem}
            onToggleItem={handleToggleItem}
            onPackAllItems={handlePackAllItems}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onRenameCategory={handleRenameCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        ))}
      </section>

      {showCategoryForm ? (
        <form onSubmit={handleAddCategory}>
          <label>
            New category name
            <input
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              maxLength={60}
              required
            />
          </label>

          <button type="submit">Create category</button>

          <button
            type="button"
            onClick={() => {
              setShowCategoryForm(false)
              setNewCategoryName('')
            }}
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowCategoryForm(true)}
        >
          + Add category
        </button>
      )}

      <section aria-label="Complete trip" className="complete-trip">
        <h2>Finished packing for this trip?</h2>
        <p>
          Completing this trip saves its checklist and lets you create a
          separate checklist for your next trip.
        </p>

        <button
          type="button"
          onClick={handleCompleteTrip}
          disabled={Boolean(storageError)}
        >
          Mark Trip as Complete
        </button>
      </section>
    </main>
  )
}