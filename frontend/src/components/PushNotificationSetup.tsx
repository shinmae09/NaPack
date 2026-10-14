import { useCallback, useEffect, useState } from 'react'
import {
  enablePushNotifications,
  syncPushNotifications,
} from '../services/pushNotifications'
import {
  savePushSubscription,
  setPushSubscriptionEnabled,
} from '../services/pushSubscriptionStorage'

const NOTIFICATIONS_DISABLED_KEY = 'napack:notifications-disabled:v1'

function BellIcon({ enabled }: { enabled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {enabled ? (
        <>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
          <path d="m9 12 2 2 4-4" />
        </>
      ) : (
        <>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </>
      )}
    </svg>
  )
}

export function PushNotificationSetup() {
  const [isEnabling, setIsEnabling] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [isOptedOut, setIsOptedOut] = useState(() => {
    try {
      return window.localStorage.getItem(NOTIFICATIONS_DISABLED_KEY) === 'true'
    } catch {
      return false
    }
  })
  const [status, setStatus] = useState('')
  const [showHint, setShowHint] = useState(false)

  const synchronizeSubscription = useCallback(async () => {
    if (isOptedOut) {
      setIsEnabled(false)
      return
    }

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
            ? 'Notifications are blocked in browser settings.'
            : 'Notifications are not enabled for this browser.',
        )
      } catch (error) {
        console.error('Could not update notification status:', error)
        setStatus(
          'Notifications are off, but the reminder settings could not be updated. Check your connection and retry.',
        )
      }

      return
    }

    try {
      const token = await syncPushNotifications()
      await savePushSubscription(token)
      setIsEnabled(true)
      setStatus('Travel reminders are enabled.')
    } catch (error) {
      console.error('Could not synchronize push notifications:', error)
      setIsEnabled(false)
      setStatus('Could not verify notification setup. Check your connection and retry.')
    }
  }, [isOptedOut])

  useEffect(() => {
    let cancelled = false
    let hideTimer: number | undefined
    const isMobile = window.matchMedia('(max-width: 480px)').matches

    const showTimer = isMobile
      ? window.setTimeout(() => {
          if (!cancelled && !isEnabled && !isOptedOut) {
            setShowHint(true)
            hideTimer = window.setTimeout(() => {
              if (!cancelled) setShowHint(false)
            }, 5000)
          }
        }, 5000)
      : undefined

    const synchronize = () => {
      if (!cancelled) void synchronizeSubscription()
    }
    void Promise.resolve().then(synchronize)
    window.addEventListener('focus', synchronize)

    return () => {
      cancelled = true
      if (showTimer !== undefined) window.clearTimeout(showTimer)
      if (hideTimer !== undefined) window.clearTimeout(hideTimer)
      window.removeEventListener('focus', synchronize)
    }
  }, [isEnabled, isOptedOut, synchronizeSubscription])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        NOTIFICATIONS_DISABLED_KEY,
        isOptedOut ? 'true' : 'false',
      )
    } catch {
      // Notification preference still applies for this session.
    }
  }, [isOptedOut])

  async function handleEnableNotifications() {
    if (isEnabled || isEnabling) return
    setIsEnabling(true)
    setShowHint(false)
    setStatus('')
    setIsOptedOut(false)

    try {
      const token = await enablePushNotifications()
      await savePushSubscription(token)
      setIsEnabled(true)
      setStatus('Travel reminders are enabled.')
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

  async function handleToggleNotifications() {
    if (isEnabling) return

    if (isEnabled) {
      setIsEnabling(true)
      setStatus('')
      try {
        await setPushSubscriptionEnabled(false)
        setIsEnabled(false)
        setIsOptedOut(true)
        setStatus('Travel reminders are turned off.')
      } catch (error) {
        console.error('Could not disable travel reminders:', error)
        setStatus('Could not turn off travel reminders. Check your connection and retry.')
      } finally {
        setIsEnabling(false)
      }
      return
    }

    await handleEnableNotifications()
  }

  return (
    <div className="notification-control">
      <button
        className={`notification-control__button${isEnabled ? ' is-enabled' : ''}`}
        type="button"
        onClick={handleToggleNotifications}
        disabled={isEnabling}
        role="switch"
        aria-checked={isEnabled}
        aria-label="Travel reminders"
        title={isEnabled ? 'Turn off travel reminders' : 'Turn on travel reminders'}
      >
        <BellIcon enabled={isEnabled} />
        {isEnabled && <span className="notification-control__dot" aria-hidden="true" />}
      </button>

      {showHint && !isEnabled && (
        <>
          <div className="notification-control__backdrop" aria-hidden="true" />
          <div className="notification-control__tooltip" role="status">
          <strong>Travel reminders</strong>
          <span>Enable notifications so NaPack can remind you about your upcoming trip.</span>
            <span className="notification-control__tooltip-note">
              Tap the bell to turn reminders on.
            </span>
          </div>
        </>
      )}

      {status && (
        <span className="notification-control__status" role="status">
          {status}
        </span>
      )}
    </div>
  )
}