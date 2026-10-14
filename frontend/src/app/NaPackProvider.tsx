
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createDefaultCategories } from '../features/packing/defaultCategories'
import {
  loadPackingData,
  savePackingData,
  type NaPackData,
  type PackingTrip,
  type TripSetup,
  type UserProfile,
} from '../features/packing/packingStorage'
import type { PackingCategory } from '../features/packing/types'
import { saveTripReminder } from '../services/tripReminderStorage'
import { NaPackContext } from './NaPackContext'
import type { CreateTripInput } from './NaPackContext'

function createId(): string {
  return crypto.randomUUID()
}

/**
 * Sync only reminder metadata to Firestore.
 * Local trip operations should continue even if cloud sync fails.
 */
function syncTripReminder(trip: PackingTrip): void {
  void saveTripReminder({
    tripId: trip.id,
    tripName: trip.tripName,
    departureDate: trip.setup.departureDate,
    status: trip.status,
  }).catch((error: unknown) => {
    console.error(
      `Could not sync reminder metadata for trip ${trip.id}:`,
      error,
    )
  })
}

export function NaPackProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [trips, setTrips] = useState<PackingTrip[]>([])
  const [activeTripId, setActiveTripId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [storageError, setStorageError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function restoreData() {
      try {
        const saved = await loadPackingData()

        if (cancelled) return

        if (saved) {
          setUser(saved.user)
          setTrips(saved.trips)
          setActiveTripId(saved.activeTripId)

          // Register existing trips for scheduled reminders.
          saved.trips.forEach(syncTripReminder)
        }
      } catch (error) {
        console.error('Could not restore NaPack data:', error)

        if (!cancelled) {
          setStorageError(
            'Your saved trips could not be loaded. Changes may not be saved.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void restoreData()

    return () => {
      cancelled = true
    }
  }, [])

  const activeTrip = useMemo(
    () =>
      trips.find(
        (trip) => trip.id === activeTripId && trip.status === 'active',
      ) ?? null,
    [trips, activeTripId],
  )

  useEffect(() => {
    if (isLoading || storageError) return

    const data: NaPackData = {
      user,
      trips,
      activeTripId,
    }

    void savePackingData(data).catch((error: unknown) => {
      console.error('Could not save NaPack data:', error)
      setStorageError(
        'Your changes could not be saved. Check your browser storage.',
      )
    })
  }, [user, trips, activeTripId, isLoading, storageError])

  function initializeUser(name: string) {
    const trimmedName = name.trim()

    if (!trimmedName) {
      throw new Error('Please enter your name.')
    }

    if (user) return

    setUser({
      id: createId(),
      name: trimmedName,
    })

    setStorageError(null)
  }

  function createTrip(input: CreateTripInput) {
    if (activeTrip) {
      throw new Error('Complete the current trip before creating a new one.')
    }

    const tripName = input.tripName.trim()

    if (!tripName) {
      throw new Error('Please enter a name for your trip.')
    }

    // First-time users must initialize their profile before creating a trip.
    if (!user) {
      const name = input.name?.trim()

      if (!name) {
        throw new Error('Please enter your name.')
      }

      setUser({
        id: createId(),
        name,
      })
    }

    const tripUserName = user?.name ?? input.name?.trim()

    if (!tripUserName) {
      throw new Error('Your user profile could not be created.')
    }

    const newTrip: PackingTrip = {
      id: createId(),
      tripName,
      setup: {
        name: tripUserName,
        departureDate: input.departureDate,
      },
      categories: createDefaultCategories(),
      status: 'active',
      createdAt: new Date().toISOString(),
      completedAt: null,
    }

    setTrips((current) => [...current, newTrip])
    setActiveTripId(newTrip.id)
    setStorageError(null)

    // Save only reminder metadata to Firestore.
    syncTripReminder(newTrip)
  }

  function updateTripSetup(setup: TripSetup) {
    if (!activeTrip) return

    setTrips((current) =>
      current.map((trip) =>
        trip.id === activeTrip.id
          ? { ...trip, setup }
          : trip,
      ),
    )

    // Keep the cloud departure date in sync with local changes.
    syncTripReminder({
      ...activeTrip,
      setup,
    })
  }

  function setCategories(
    update:
      | PackingCategory[]
      | ((current: PackingCategory[]) => PackingCategory[]),
  ) {
    if (!activeTrip) return

    setTrips((current) =>
      current.map((trip) => {
        if (trip.id !== activeTrip.id) return trip

        const categories =
          typeof update === 'function'
            ? update(trip.categories)
            : update

        return { ...trip, categories }
      }),
    )
  }

  function completeTrip() {
    if (!activeTrip) return

    const completedTrip: PackingTrip = {
      ...activeTrip,
      status: 'completed',
      completedAt: new Date().toISOString(),
    }

    setTrips((current) =>
      current.map((trip) =>
        trip.id === activeTrip.id
          ? completedTrip
          : trip,
      ),
    )

    setActiveTripId(null)

    // Retain the record but mark it completed so scheduled reminders skip it.
    syncTripReminder(completedTrip)
  }

  return (
    <NaPackContext.Provider
      value={{
        user,
        trips,
        activeTrip,
        isLoading,
        storageError,
        initializeUser,
        createTrip,
        updateTripSetup,
        setCategories,
        completeTrip,
      }}
    >
      {children}
    </NaPackContext.Provider>
  )
}