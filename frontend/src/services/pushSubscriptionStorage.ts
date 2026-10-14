import {
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db, ensureAnonymousUser } from './firebase'

function getSubscriptionRef(uid: string) {
  return doc(
    db,
    'users',
    uid,
    'pushSubscriptions',
    'current',
  )
}

export async function savePushSubscription(
  token: string,
): Promise<void> {
  if (!token.trim()) {
    throw new Error('Cannot save an empty Firebase push token.')
  }

  const user = await ensureAnonymousUser()

  await setDoc(
    getSubscriptionRef(user.uid),
    {
      token,
      enabled: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function setPushSubscriptionEnabled(
  enabled: boolean,
): Promise<void> {
  const user = await ensureAnonymousUser()

  await setDoc(
    getSubscriptionRef(user.uid),
    {
      enabled,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}