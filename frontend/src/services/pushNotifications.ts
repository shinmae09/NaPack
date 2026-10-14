import { getToken } from 'firebase/messaging'
import { getFirebaseMessaging } from './firebase'

async function getCurrentPushToken(): Promise<string> {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications.')
  }

  if (!('serviceWorker' in navigator)) {
    throw new Error('This browser does not support service workers.')
  }

  if (Notification.permission !== 'granted') {
    throw new Error('Notification permission has not been granted.')
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY

  if (!vapidKey) {
    throw new Error('The Firebase VAPID public key is not configured.')
  }

  const messaging = await getFirebaseMessaging()

  if (!messaging) {
    throw new Error(
      'Firebase push notifications are not supported in this browser.',
    )
  }

  const serviceWorkerRegistration = await navigator.serviceWorker.ready

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration,
  })

  if (!token) {
    throw new Error(
      'Firebase could not register this browser for push notifications.',
    )
  }

  return token
}

/**
 * Called when the user explicitly enables notifications.
 */
export async function enablePushNotifications(): Promise<string> {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications.')
  }

  if (Notification.permission === 'denied') {
    throw new Error(
      'Notifications are blocked in your browser settings.',
    )
  }

  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission()

    if (permission !== 'granted') {
      throw new Error(
        permission === 'denied'
          ? 'Notifications are blocked in your browser settings.'
          : 'Notification permission was not granted.',
      )
    }
  }

  return getCurrentPushToken()
}

/**
 * Called on startup when permission has already been granted.
 * Does not display a permission prompt.
 */
export async function syncPushNotifications(): Promise<string> {
  return getCurrentPushToken()
}