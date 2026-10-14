/// <reference lib="webworker" />

import { initializeApp } from 'firebase/app'
import {
  getMessaging,
  onBackgroundMessage,
} from 'firebase/messaging/sw'
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{
    revision?: string | null
    url: string
  }>
}

// Keep exactly ONE reference to self.__WB_MANIFEST.
const precacheManifest = self.__WB_MANIFEST

cleanupOutdatedCaches()
precacheAndRoute(precacheManifest)

// Find the app shell from the local manifest variable.
// This avoids another literal reference to self.__WB_MANIFEST.
const appShell = precacheManifest.find((entry) => {
  const url = typeof entry === 'string' ? entry : entry.url
  return new URL(url, self.location.origin).pathname === '/index.html'
})

if (appShell) {
  const appShellUrl = typeof appShell === 'string' ? appShell : appShell.url

  registerRoute(
    new NavigationRoute(createHandlerBoundToURL(appShellUrl), {
      denylist: [/^\/api(?:\/|$)/],
    }),
  )
}

// Firebase configuration.
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

// Handle Firebase messages when NaPack is in the background.
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

// Open or focus NaPack when a notification is clicked.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = new URL(
    String(event.notification.data?.url ?? '/'),
    self.location.origin,
  )

  // Only allow URLs belonging to the current app origin.
  if (targetUrl.origin !== self.location.origin) {
    return
  }

  event.waitUntil(
    self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clients) => {
        const existingClient = clients.find(
          (client) => client.url === targetUrl.href,
        )

        if (existingClient) {
          return existingClient.focus()
        }

        return self.clients.openWindow(targetUrl.href)
      }),
  )
})