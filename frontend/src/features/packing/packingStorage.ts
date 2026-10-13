import { openDB } from 'idb'
import type { PackingCategory } from './types'

export interface UserProfile {
  id: string
  name: string
}

export interface TripSetup {
  name: string
  departureDate: string
}

export type TripStatus = 'active' | 'completed'

export interface PackingTrip {
  id: string
  tripName: string
  setup: TripSetup
  categories: PackingCategory[]
  status: TripStatus
  createdAt: string
  completedAt: string | null
}

export interface NaPackData {
  user: UserProfile | null
  trips: PackingTrip[]
  activeTripId: string | null
}

const DATABASE_NAME = 'napack-db'
const DATABASE_VERSION = 1
const STORE_NAME = 'app-data'
const DATA_KEY = 'current-trip'

function createId(): string {
  return crypto.randomUUID()
}

interface LegacySingleTripData {
  setup: TripSetup | null
  categories: PackingCategory[]
}

function isLegacySingleTripData(
  value: unknown,
): value is LegacySingleTripData {
  if (!value || typeof value !== 'object') return false

  return (
    'setup' in value &&
    'categories' in value &&
    !('trips' in value)
  )
}

function migrateLegacySingleTrip(
  legacy: LegacySingleTripData,
): NaPackData {
  if (!legacy.setup) {
    return {
      user: null,
      trips: [],
      activeTripId: null,
    }
  }

  const user: UserProfile = {
    id: createId(),
    name: legacy.setup.name,
  }

  const tripId = createId()

  return {
    user,
    trips: [
      {
        id: tripId,
        tripName: 'My Trip',
        setup: legacy.setup,
        categories: legacy.categories,
        status: 'active',
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
    ],
    activeTripId: tripId,
  }
}

function migrateTripsWithoutUser(
  legacy: Omit<NaPackData, 'user'>,
): NaPackData {
  const existingName =
    legacy.trips.find((trip) => trip.status === 'active')?.setup.name ??
    legacy.trips[0]?.setup.name ??
    ''

  return {
    user: existingName
      ? {
          id: createId(),
          name: existingName,
        }
      : null,
    trips: legacy.trips,
    activeTripId: legacy.activeTripId,
  }
}

async function openNaPackDatabase() {
  return openDB(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    },
  })
}

export async function loadPackingData(): Promise<NaPackData | undefined> {
  const db = await openNaPackDatabase()

  try {
    const saved: unknown = await db.get(STORE_NAME, DATA_KEY)

    if (!saved) return undefined

    if (isLegacySingleTripData(saved)) {
      return migrateLegacySingleTrip(saved)
    }

    if (
      typeof saved === 'object' &&
      saved !== null &&
      'trips' in saved &&
      !('user' in saved)
    ) {
      return migrateTripsWithoutUser(
        saved as Omit<NaPackData, 'user'>,
      )
    }

    return saved as NaPackData
  } finally {
    db.close()
  }
}

let saveQueue: Promise<void> = Promise.resolve()

export function savePackingData(data: NaPackData): Promise<void> {
  const nextSave = saveQueue.then(async () => {
    const db = await openNaPackDatabase()

    try {
      await db.put(STORE_NAME, data, DATA_KEY)
    } finally {
      db.close()
    }
  })

  // Allow later saves to proceed even if an earlier save fails.
  saveQueue = nextSave.catch(() => undefined)

  return nextSave
}