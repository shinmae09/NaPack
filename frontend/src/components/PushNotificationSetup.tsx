import { useCallback, useEffect, useState } from 'react'
import {
  enablePushNotifications,
  syncPushNotifications,
} from '../services/pushNotifications'
import {
  savePushSubscription,
  setPushSubscriptionEnabled,
} from '../services/pushSubscriptionStorage'

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
  const [status, setStatus] = useState('')
  const [showHint, setShowHint] = useState(false)

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
  }, [])

  useEffect(() => {
    let cancelled = false
    const showTimer = window.setTimeout(() => {
      if (!cancelled && !isEnabled) {
        setShowHint(true)
        window.setTimeout(() => {
          if (!cancelled) setShowHint(false)
        }, 5000)
      }
    }, 5000)

    const synchronize = () => {
      if (!cancelled) void synchronizeSubscription()
    }
    void Promise.resolve().then(synchronize)
    window.addEventListener('focus', synchronize)

    return () => {
      cancelled = true
      window.clearTimeout(showTimer)
      window.removeEventListener('focus', synchronize)
    }
  }, [isEnabled, synchronizeSubscription])

  async function handleEnableNotifications() {
    if (isEnabled || isEnabling) return
    setIsEnabling(true)
    setShowHint(false)
    setStatus('')

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

  return (
    <div className="notification-control">
      <button
        className={`notification-control__button${isEnabled ? ' is-enabled' : ''}`}
        type="button"
        onClick={handleEnableNotifications}
        disabled={isEnabling || isEnabled}
        aria-label={
          isEnabling
            ? 'Enabling travel reminders'
            : isEnabled
              ? 'Travel reminders enabled'
              : 'Enable travel reminders'
        }
        title={isEnabled ? 'Travel reminders enabled' : 'Enable travel reminders'}
      >
        <BellIcon enabled={isEnabled} />
        {isEnabled && <span className="notification-control__dot" aria-hidden="true" />}
      </button>

      {showHint && !isEnabled && (
        <div className="notification-control__tooltip" role="status">
          <strong>Travel reminders</strong>
          <span>Enable notifications so NaPack can remind you about your upcoming trip.</span>
          <button
            type="button"
            className="notification-control__tooltip-action"
            onClick={handleEnableNotifications}
            disabled={isEnabling}
          >
            {isEnabling ? 'Enabling…' : 'Enable'}
          </button>
        </div>
      )}

      {status && (
        <span className="notification-control__status" role="status">
          {status}
        </span>
      )}
    </div>
  )
}