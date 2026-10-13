import { getToken } from 'firebase/messaging'
import { getFirebaseMessaging } from './firebase'

export async function enablePushNotifications(): Promise<string> {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications.')
  }

  if (!('serviceWorker' in navigator)) {
    throw new Error('This browser does not support service workers.')
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY

  if (!vapidKey) {
    throw new Error('The Firebase VAPID public key is not configured.')
  }

  const messaging = await getFirebaseMessaging()

  if (!messaging) {
    throw new Error('Firebase push notifications are not supported in this browser.')
  }

  const permission = await Notification.requestPermission()

  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'Notifications are blocked in your browser settings.'
        : 'Notification permission was not granted.',
    )
  }

  const serviceWorkerRegistration = await navigator.serviceWorker.ready

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration,
  })

  if (!token) {
    throw new Error('Firebase could not register this browser for push notifications.')
  }

  return token
}