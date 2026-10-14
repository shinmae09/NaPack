import { useCallback, useEffect, useState } from 'react'
import {
  enablePushNotifications,
  syncPushNotifications,
} from '../services/pushNotifications'
import {
  savePushSubscription,
  setPushSubscriptionEnabled,
} from '../services/pushSubscriptionStorage'

export function PushNotificationSetup() {
  const [isEnabling, setIsEnabling] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [status, setStatus] = useState('')

  const synchronizeSubscription = useCallback(async () => {
    if (!('Notification' in window)) {
      setIsEnabled(false)
      setStatus('Notifications are not supported by this browser.')
      return
    }

    if (Notification.permission !== 'granted') {
      setIsEnabled(false)

      try {
        await setPushSubscriptionEnabled(false)

        setStatus(
          Notification.permission === 'denied'
            ? 'Notifications are blocked in Chrome settings.'
            : 'Notifications are not enabled for this browser.',
        )
      } catch (error) {
        console.error('Could not update notification status:', error)
        setStatus(
          'Notifications are off, but Firestore could not be updated. Check your connection and retry.',
        )
      }

      return
    }

    try {
      setStatus('Checking notification setup...')

      const token = await syncPushNotifications()
      await savePushSubscription(token)

      setIsEnabled(true)
      setStatus('Notifications are enabled for this browser.')
    } catch (error) {
      console.error('Could not synchronize push notifications:', error)
      setIsEnabled(false)
      setStatus(
        'Could not verify notification setup. Check your connection and retry.',
      )
    }
  }, [])

  
  useEffect(() => {
    let cancelled = false

    function synchronize() {
      if (!cancelled) {
        void synchronizeSubscription()
      }
    }

    // Start synchronization asynchronously after the effect runs.
    void Promise.resolve().then(synchronize)

    window.addEventListener('focus', synchronize)

    return () => {
      cancelled = true
      window.removeEventListener('focus', synchronize)
    }
  }, [synchronizeSubscription])

  async function handleEnableNotifications() {
    setIsEnabling(true)
    setStatus('')

    try {
      const token = await enablePushNotifications()
      await savePushSubscription(token)

      setIsEnabled(true)
      setStatus('Notifications are enabled for this browser.')
    } catch (error) {
      console.error('Could not enable push notifications:', error)

      setIsEnabled(false)
      setStatus(
        error instanceof Error
          ? error.message
          : 'Could not enable notifications. Please try again.',
      )
    } finally {
      setIsEnabling(false)
    }
  }

  return (
    <section aria-labelledby="notification-setup-heading">
      <h2 id="notification-setup-heading">Travel reminders</h2>

      <p>
        Enable notifications so NaPack can remind you about your upcoming trip.
      </p>

      <button
        type="button"
        onClick={handleEnableNotifications}
        disabled={isEnabling || isEnabled}
      >
        {isEnabling
          ? 'Enabling notifications...'
          : isEnabled
            ? 'Notifications enabled'
            : 'Enable Notifications'}
      </button>

      {status && <p role="status">{status}</p>}
    </section>
  )
}