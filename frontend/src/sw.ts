/// <reference lib="webworker" />

import { initializeApp } from 'firebase/app'
import {
  getMessaging,
  onBackgroundMessage,
} from 'firebase/messaging/sw'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{
    revision?: string | null
    url: string
  }>
}

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const firebaseApp = initializeApp(firebaseConfig)
const messaging = getMessaging(firebaseApp)

onBackgroundMessage(messaging, (payload) => {
  const title = payload.data?.title ?? 'NaPack Reminder'
  const body =
    payload.data?.body ??
    'Your trip is coming up. Double-check your packing checklist.'

  void self.registration.showNotification(title, {
    body,
    icon: '/napack-icon-192x192.png',
    badge: '/napack-icon-192x192.png',
    data: {
      url: payload.data?.url ?? '/',
    },
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = new URL(
    String(event.notification.data?.url ?? '/'),
    self.location.origin,
  ).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(
      (clients) => {
        const existingClient = clients.find((client) => client.url === url)

        if (existingClient && 'focus' in existingClient) {
          return existingClient.focus()
        }

        return self.clients.openWindow(url)
      },
    ),
  )
})