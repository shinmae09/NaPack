import { useNavigate } from 'react-router-dom'
import { useNaPack } from '../app/useNaPack'

export function HomePage() {
  const navigate = useNavigate()
  const { trips } = useNaPack()

  const completedTrips = trips.filter(
    (trip) => trip.status === 'completed',
  )

  function handleStartPacking() {
    navigate('/setup')
  }

  return (
    <main>
      <h1>NaPack</h1>

      <p>Your friendly travel-preparation companion.</p>

      <p>Pack what you need. Leave with peace of mind.</p>

      <button type="button" onClick={handleStartPacking}>
        {completedTrips.length > 0 ? 'Plan Another Trip' : 'Start Packing'}
      </button>

      {completedTrips.length > 0 && (
        <section aria-label="Completed trips">
          <h2>Completed Trips</h2>

          <ul>
            {completedTrips.map((trip) => (
              <li key={trip.id}>
                <strong>{trip.tripName}</strong>
                {' — '}
                {trip.setup.departureDate}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}