import { useState } from 'react'
import { enablePushNotifications } from '../services/pushNotifications'

export function PushNotificationSetup() {
  const [isEnabling, setIsEnabling] = useState(false)
  const [status, setStatus] = useState('')
  const [isEnabled, setIsEnabled] = useState(false)

  async function handleEnableNotifications() {
    setIsEnabling(true)
    setStatus('')

    try {
      const token = await enablePushNotifications()

      // Temporary development check. We'll save the token securely later.
      console.info('NaPack FCM token registered:', token)
      setIsEnabled(true)
      setStatus('Notifications are enabled for this browser.')
    } catch (error) {
      console.error('Could not enable push notifications:', error)

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