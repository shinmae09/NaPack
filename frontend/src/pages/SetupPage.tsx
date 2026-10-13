import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNaPack } from '../app/useNaPack'

export function SetupPage() {
  const navigate = useNavigate()
  const { user, createTrip, isLoading, storageError } = useNaPack()

  const [tripName, setTripName] = useState('')
  const [name, setName] = useState('')
  const [departureDate, setDepartureDate] = useState('')
  const [error, setError] = useState('')

  // Get today's date in local time using YYYY-MM-DD format.
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
      setError('Please enter a name for your trip.')
      return
    }

    // Ask for a name only when no user profile exists yet.
    if (!user && !trimmedName) {
      setError('Please enter your name.')
      return
    }

    if (!departureDate) {
      setError('Please select your departure date.')
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
      <main>
        <h1>Loading your saved trips...</h1>
        <p>Please wait before creating a new trip.</p>
      </main>
    )
  }

  return (
    <main>
      <button
        type="button"
        onClick={() => navigate('/')}
        disabled={Boolean(storageError)}
      >
        ← Back
      </button>

      <h1>Plan your next trip</h1>

      <p>Tell us about your trip so we can prepare your checklist.</p>

      {user && <p>Welcome back, {user.name}!</p>}

      {storageError && <p role="alert">{storageError}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="tripName">What is your trip called?</label>

          <input
            id="tripName"
            name="tripName"
            type="text"
            value={tripName}
            onChange={(event) => setTripName(event.target.value)}
            placeholder="e.g. Japan Trip"
            maxLength={80}
            required
            disabled={Boolean(storageError)}
          />
        </div>

        {!user && (
          <div>
            <label htmlFor="name">What should we call you?</label>

            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              maxLength={60}
              autoComplete="given-name"
              required
              disabled={Boolean(storageError)}
            />
          </div>
        )}

        <div>
          <label htmlFor="departureDate">When are you leaving?</label>

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

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={Boolean(storageError)}>
          Create Trip
        </button>
      </form>
    </main>
  )
}
