import {
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db, ensureAnonymousUser } from './firebase'

export async function savePushSubscription(
  token: string,
): Promise<void> {
  const user = await ensureAnonymousUser()

  // A browser installation gets a stable document ID for this user.
  const subscriptionRef = doc(
    db,
    'users',
    user.uid,
    'pushSubscriptions',
    'current',
  )

  await setDoc(
    subscriptionRef,
    {
      token,
      enabled: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}