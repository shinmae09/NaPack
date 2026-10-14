import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db, ensureAnonymousUser } from './firebase'

export interface TripReminderMetadata {
  tripId: string
  tripName: string
  departureDate: string
  status: 'active' | 'completed'
}

function getTripReminderRef(userId: string, tripId: string) {
  return doc(db, 'users', userId, 'tripReminders', tripId)
}

/**
 * Save only the trip information required for scheduled reminders.
 * Packing items and checklist data remain in IndexedDB.
 */
export async function saveTripReminder(
  trip: TripReminderMetadata,
): Promise<void> {
  if (!trip.tripId.trim()) {
    throw new Error('Trip ID is required.')
  }

  if (!trip.tripName.trim()) {
    throw new Error('Trip name is required.')
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trip.departureDate)) {
    throw new Error('Departure date must use YYYY-MM-DD format.')
  }

  if (trip.status !== 'active' && trip.status !== 'completed') {
    throw new Error('Trip status is invalid.')
  }

  const user = await ensureAnonymousUser()
  const reminderRef = getTripReminderRef(user.uid, trip.tripId)

  await setDoc(
    reminderRef,
    {
      tripId: trip.tripId,
      tripName: trip.tripName.trim(),
      departureDate: trip.departureDate,
      status: trip.status,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

/**
 * Remove reminder metadata when a trip is permanently deleted.
 * Completing a trip should instead save it with status "completed".
 */
export async function deleteTripReminder(
  tripId: string,
): Promise<void> {
  if (!tripId.trim()) {
    throw new Error('Trip ID is required.')
  }

  const user = await ensureAnonymousUser()
  await deleteDoc(getTripReminderRef(user.uid, tripId))
}