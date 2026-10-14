import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNaPack } from '../app/useNaPack'

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function SetupPage() {
  const navigate = useNavigate()
  const { user, createTrip, isLoading, storageError } = useNaPack()

  const [tripName, setTripName] = useState('')
  const [name, setName] = useState('')
  const [departureDate, setDepartureDate] = useState('')
  const [error, setError] = useState('')

  const today = new Date()
  const minimumDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const trimmedTripName = tripName.trim()
    const trimmedName = name.trim()

    if (!trimmedTripName) {
      setError('Please give your trip a name.')
      return
    }

    if (!user && !trimmedName) {
      setError('Please enter your name.')
      return
    }

    if (!departureDate) {
      setError('Please choose your departure date.')
      return
    }

    if (departureDate < minimumDate) {
      setError('Your departure date cannot be in the past.')
      return
    }

    try {
      createTrip({
        tripName: trimmedTripName,
        ...(!user && { name: trimmedName }),
        departureDate,
      })
      navigate('/packing')
    } catch (submitError) {
      console.error('Could not create trip:', submitError)
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Could not create your trip. Please try again.',
      )
    }
  }

  if (isLoading) {
    return (
      <main className="app-page setup-page">
        <div className="loading-state" role="status">
          <span className="loading-state__mark" aria-hidden="true">N</span>
          <h1>Getting things ready…</h1>
          <p>Restoring your saved trips.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="app-page setup-page">
      <button
        className="back-action"
        type="button"
        onClick={() => navigate('/')}
        disabled={Boolean(storageError)}
      >
        <BackIcon />
      </button>

      <header className="setup-intro">
        <span className="setup-intro__step">LET'S GET YOU READY</span>
        <h1>Where are you headed?</h1>
        <p>A few details now, and your packing checklist is ready to go.</p>
        {user && <p className="setup-intro__welcome">Welcome back, {user.name}.</p>}
      </header>

      {storageError && (
        <p className="form-message form-message--error" role="alert">
          {storageError}
        </p>
      )}

      <form className="trip-setup-form" onSubmit={handleSubmit}>
        <div className="trip-setup-form__field">
          <label htmlFor="tripName">Name your trip</label>
          <input
            id="tripName"
            name="tripName"
            type="text"
            value={tripName}
            onChange={(event) => setTripName(event.target.value)}
            placeholder="e.g. Japan adventure"
            maxLength={80}
            autoComplete="off"
            required
            disabled={Boolean(storageError)}
          />
          <p className="field-hint">Something you'll recognize later.</p>
        </div>

        {!user && (
          <div className="trip-setup-form__field">
            <label htmlFor="name">What should we call you?</label>
            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              maxLength={60}
              autoComplete="given-name"
              required
              disabled={Boolean(storageError)}
            />
          </div>
        )}

        <div className="trip-setup-form__field">
          <label htmlFor="departureDate">When do you leave?</label>
          <input
            id="departureDate"
            name="departureDate"
            type="date"
            value={departureDate}
            onChange={(event) => setDepartureDate(event.target.value)}
            min={minimumDate}
            required
            disabled={Boolean(storageError)}
          />
        </div>

        {error && (
          <p className="form-message form-message--error" role="alert">
            {error}
          </p>
        )}

        <button className="primary-action trip-setup-form__submit" type="submit" disabled={Boolean(storageError)}>
          <span>Build my checklist</span>
          <ArrowRightIcon />
        </button>
        <p className="trip-setup-form__footnote">You can change your checklist anytime.</p>
      </form>
    </main>
  )
}