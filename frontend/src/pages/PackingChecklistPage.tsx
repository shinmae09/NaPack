import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useNaPack } from '../app/useNaPack'
import { PackingCategoryCard } from '../features/packing/PackingCategoryCard'
import { PushNotificationSetup } from '../components/PushNotificationSetup'
import type { PackingCategory } from '../features/packing/types'

interface ToggleUndoAction {
  type: 'toggle'
  categoryId: string
  itemId: string
  itemName: string
  wasPacked: boolean
}

interface BulkPackUndoItem {
  id: string
  name: string
  quantity?: number
  wasPacked: boolean
}

interface BulkPackUndoAction {
  type: 'bulk'
  categoryId: string
  categoryName: string
  items: BulkPackUndoItem[]
}

type UndoAction = ToggleUndoAction | BulkPackUndoAction


function UndoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 7v6h6" />
      <path d="M5.2 12a8 8 0 1 0 2.1-5.4L3 13" />
    </svg>
  )
}

function CancelIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
}


function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

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
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newlyCreatedCategoryId, setNewlyCreatedCategoryId] = useState<string | null>(null)
  const [isProgressCompact, setIsProgressCompact] = useState(false)

  useEffect(() => {
    // Use separate enter/exit thresholds so the compact card's own layout
    // changes cannot repeatedly toggle its state near a single threshold.
    const ENTER_COMPACT_AT = 280
    const EXIT_COMPACT_AT = 220

    const handleScroll = () => {
      const scrollY = window.scrollY

      setIsProgressCompact((wasCompact) => {
        if (!wasCompact && scrollY > ENTER_COMPACT_AT) {
          return true
        }

        if (wasCompact && scrollY < EXIT_COMPACT_AT) {
          return false
        }

        return wasCompact
      })
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    if (!undoAction) return

    const timeoutId = window.setTimeout(() => {
      setUndoAction(null)
    }, 5000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [undoAction])

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
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase()

  const matchingCategories = categories.filter((category) =>
    category.items.some((item) =>
      item.name.toLocaleLowerCase().includes(normalizedQuery),
    ),
  )

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

    const createdCategoryId = createId()
    setCategories((current) => [
      ...current,
      {
        id: createdCategoryId,
        name,
        isDefault: false,
        items: [],
      },
    ])
    setNewlyCreatedCategoryId(createdCategoryId)

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
    const category = categories.find((entry) => entry.id === categoryId)
    const item = category?.items.find((entry) => entry.id === itemId)

    if (!item) return

    setUndoAction({
      type: 'toggle',
      categoryId,
      itemId,
      itemName: item.name,
      wasPacked: item.isPacked,
    })

    updateCategory(categoryId, (currentCategory) => ({
      ...currentCategory,
      items: currentCategory.items.map((currentItem) =>
        currentItem.id === itemId
          ? { ...currentItem, isPacked: !currentItem.isPacked }
          : currentItem,
      ),
    }))
  }

  function handlePackAllItems(categoryId: string) {
    const category = categories.find(
      (entry) => entry.id === categoryId,
    )

    if (!category) return

    const itemsToPack = category.items.filter((item) => !item.isPacked)

    if (itemsToPack.length === 0) return

    setUndoAction({
      type: 'bulk',
      categoryId,
      categoryName: category.name,
      items: itemsToPack.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        wasPacked: item.isPacked,
      })),
    })

    updateCategory(categoryId, (currentCategory) => ({
      ...currentCategory,
      items: currentCategory.items.map((item) =>
        item.isPacked ? item : { ...item, isPacked: true },
      ),
    }))
  }

  function handleUndoAction() {
    if (!undoAction) return

    const actionToUndo = undoAction

    if (actionToUndo.type === 'toggle') {
      updateCategory(actionToUndo.categoryId, (category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === actionToUndo.itemId
            ? { ...item, isPacked: actionToUndo.wasPacked }
            : item,
        ),
      }))
    } else {
      const snapshotsById = new Map(
        actionToUndo.items.map((item) => [item.id, item]),
      )

      updateCategory(actionToUndo.categoryId, (category) => ({
        ...category,
        items: category.items.map((item) => {
          const snapshot = snapshotsById.get(item.id)

          if (!snapshot) return item

          const unchangedSinceBulkPack =
            item.name === snapshot.name &&
            item.quantity === snapshot.quantity &&
            item.isPacked === true

          if (!unchangedSinceBulkPack) return item

          return { ...item, isPacked: snapshot.wasPacked }
        }),
      }))
    }

    setUndoAction(null)
  }

  function handleDeleteItem(categoryId: string, itemId: string) {
    updateCategory(categoryId, (category) => ({
      ...category,
      items: category.items.filter((item) => item.id !== itemId),
    }))

    setUndoAction((current) => {
      if (!current) return null

      if (
        current.type === 'toggle' &&
        current.categoryId === categoryId &&
        current.itemId === itemId
      ) {
        return null
      }

      return current
    })
  }

  function handleDeleteCategory(categoryId: string) {
    setCategories((current) =>
      current.filter((category) => category.id !== categoryId),
    )

    setUndoAction((current) =>
      current?.categoryId === categoryId ? null : current,
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
    <main className="app-page checklist-page">
      <div className="page-brand-row">
        <div className="page-brand-mark"><img src="/napack-icon-192x192.png" alt="" /><span className="page-brand-mark__name">NaPack</span></div>
        <div className="brand-header__notifications"><PushNotificationSetup /></div>
      </div>
      <header className="checklist-trip-header">
        <div className="checklist-trip-header__title-row">
          <span className="checklist-trip-header__icon" aria-hidden="true">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="18" height="15" rx="2" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 11h18M10 11v2h4v-2" />
            </svg>
          </span>
          <h1 className="checklist-page__title">
            <span className="checklist-page__trip-name">
              {tripName ? tripName.charAt(0).toLocaleUpperCase() + tripName.slice(1) : tripName}
            </span>
            <span className="checklist-page__title-suffix">Packing Checklist</span>
          </h1>
        </div>

        <div className="checklist-trip-header__details">
          <div className="checklist-trip-header__detail">
            <span className="checklist-trip-header__detail-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            </span>
            <span><span className="checklist-trip-header__label">Prepared for</span><strong>{setup.name}</strong></span>
          </div>
          <div className="checklist-trip-header__detail">
            <span className="checklist-trip-header__detail-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" />
              </svg>
            </span>
            <span><span className="checklist-trip-header__label">Departure date</span><strong><time dateTime={setup.departureDate}>{formatDate(setup.departureDate)}</time></strong></span>
          </div>
        </div>
      </header>

      {storageError && <p role="alert">{storageError}</p>}

      <section
        className={`overall-progress${isProgressCompact ? ' overall-progress--compact' : ''}`}
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

      {undoAction && createPortal(
        <div className="undo-notice" role="status" aria-live="polite">
          <span>
            {undoAction.type === 'toggle'
              ? undoAction.wasPacked
                ? `"${undoAction.itemName}" marked as unpacked.`
                : `"${undoAction.itemName}" marked as packed.`
              : `Packed ${undoAction.items.length} items in "${undoAction.categoryName}".`}
          </span>

          <button
            type="button"
            className="undo-notice__button"
            title="Undo last packing change"
            aria-label="Undo last packing change"
            onClick={handleUndoAction}
          >
            <UndoIcon />
            <span>Undo</span>
          </button>
        </div>,
        document.body,
      )}

      <section
        className="checklist-search"
        aria-label="Search packing checklist"
      >
        <label htmlFor="packing-item-search">Search your items</label>

        <input
          id="packing-item-search"
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Try passport, charger, medicine..."
          autoComplete="off"
        />

        {normalizedQuery && (
          <div className="checklist-search__results" role="status">
            {matchingCategories.reduce(
              (count, category) =>
                count +
                category.items.filter((item) =>
                  item.name.toLocaleLowerCase().includes(normalizedQuery),
                ).length,
              0,
            )}{' '}
            matching item(s) in {matchingCategories.length}{' '}
            {matchingCategories.length === 1 ? 'category' : 'categories'}.
            <button
              type="button"
              onClick={() => setSearchQuery('')}
            >
              Clear search
            </button>
          </div>
        )}
      </section>

      <section aria-label="Packing categories">
        {normalizedQuery && matchingCategories.length === 0 ? (
          <p className="checklist-search__empty">
            No items match “{searchQuery.trim()}”. Try another search term.
          </p>
        ) : (
          (normalizedQuery ? matchingCategories : categories).map(
            (category, index) => (
              <PackingCategoryCard
                key={`${category.id}-${showCategoryForm ? 'category-form' : newlyCreatedCategoryId ? `new-${newlyCreatedCategoryId}` : 'normal'}`}
                category={category}
                defaultExpanded={
                  normalizedQuery.length > 0 ||
                  (!showCategoryForm &&
                    (newlyCreatedCategoryId
                      ? category.id === newlyCreatedCategoryId
                      : index === 0))
                }
                searchQuery={searchQuery}
                onAddItem={handleAddItem}
                onToggleItem={handleToggleItem}
                onPackAllItems={handlePackAllItems}
                onEditItem={handleEditItem}
                onDeleteItem={handleDeleteItem}
                onRenameCategory={handleRenameCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            ),
          )
        )}
      </section>

      {showCategoryForm ? (
        <form className="packing-form packing-form--category-add" onSubmit={handleAddCategory}>
          <label>
            Give this category a name
            <input
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              maxLength={60}
              required
            />
          </label>

          <div className="packing-form__actions">
            <button type="submit" className="icon-button icon-button--primary" title="Create category" aria-label="Create category"><PlusIcon /></button>
            <button type="button" className="icon-button" title="Cancel" aria-label="Cancel" onClick={() => { setShowCategoryForm(false); setNewCategoryName('') }}><CancelIcon /></button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="icon-text-button add-category-button"
          onClick={() => { setNewlyCreatedCategoryId(null); setShowCategoryForm(true) }}
        >
          <PlusIcon />
          <span>Add category</span>
        </button>
      )}

      <section aria-label="Complete trip" className="complete-trip complete-trip--prominent">
        <div className="complete-trip__heading">
          <span className="complete-trip__icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="m8 12 2.5 2.5L16 9" />
            </svg>
          </span>
          <h2>Finished packing for this trip?</h2>
        </div>
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
      <footer className="app-footer"><span className="app-footer__tagline">NaPack™ · All set. No sweat.</span><span className="app-footer__meta">© 2026 · v0.0.0</span></footer>
    </main>
  )
}