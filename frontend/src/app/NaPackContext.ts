import { createContext } from 'react'
import type {
  PackingTrip,
  TripSetup,
  UserProfile,
} from '../features/packing/packingStorage'
import type { PackingCategory } from '../features/packing/types'

export interface CreateTripInput {
  tripName: string
  name?: string
  departureDate: string
}

export interface NaPackContextValue {
  user: UserProfile | null
  trips: PackingTrip[]
  activeTrip: PackingTrip | null
  isLoading: boolean
  storageError: string | null
  initializeUser: (name: string) => void
  createTrip: (input: CreateTripInput) => void
  updateTripSetup: (setup: TripSetup) => void
  setCategories: (
    update:
      | PackingCategory[]
      | ((current: PackingCategory[]) => PackingCategory[]),
  ) => void
  completeTrip: () => void
}

export const NaPackContext = createContext<NaPackContextValue | null>(null)