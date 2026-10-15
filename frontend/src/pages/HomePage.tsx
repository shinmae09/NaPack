import { useNavigate } from 'react-router-dom'
import { useNaPack } from '../app/useNaPack'
import { PushNotificationSetup } from '../components/PushNotificationSetup'

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function PlaneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m21 3-7.2 18-3.6-7.2L3 10.2 21 3Z" />
      <path d="M10.2 13.8 15 9" />
    </svg>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const { trips } = useNaPack()

  const completedTrips = trips.filter(
    (trip) => trip.status === 'completed',
  )

  return (
    <main className="app-page home-page">
      <header className="brand-header">
        <img
          className="brand-header__icon"
          src="/napack-icon-192x192.png"
          alt=""
          width="48"
          height="48"
        />

        <span className="brand-header__name">NaPack</span>
        <div className="brand-header__notifications"><PushNotificationSetup showTooltip /></div>
      </header>

      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__eyebrow">
          <PlaneIcon />
          <span>TRAVEL LIGHT. FEEL READY.</span>
        </div>

        <h1 id="home-title">
          Your next trip, <span>all packed.</span>
        </h1>

        <p className="home-hero__description">
          A simple checklist for the things you need, so you can focus on the
          moments ahead.
        </p>

        <button
          className="primary-action home-hero__action"
          type="button"
          onClick={() => navigate('/setup')}
        >
          <span>
            {completedTrips.length > 0
              ? 'Plan another trip'
              : 'Plan your trip'}
          </span>
          <ArrowRightIcon />
        </button>

        <p className="home-hero__note">
          Your checklist stays saved on this device.
        </p>
      </section>

      {completedTrips.length > 0 && (
        <section
          className="home-section"
          aria-labelledby="completed-trips-title"
        >
          <div className="home-section__heading">
            <div>
              <h2 id="completed-trips-title">Past adventures</h2>
              <p>Your completed trips</p>
            </div>

            <span className="home-section__count">
              {completedTrips.length}
            </span>
          </div>

          <ul className="trip-history">
            {completedTrips.map((trip) => (
              <li className="trip-history__item" key={trip.id}>
                <span className="trip-history__icon" aria-hidden="true">
                  <PlaneIcon />
                </span>

                <span className="trip-history__details">
                  <strong title={trip.tripName}>{trip.tripName}</strong>
                  <span>{trip.setup.departureDate}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="app-footer">
        <span className="app-footer__tagline">NaPack™ · All set. No sweat.</span>
        <span className="app-footer__meta">© 2026 · v0.0.0</span>
      </footer>
    </main>
  )
}