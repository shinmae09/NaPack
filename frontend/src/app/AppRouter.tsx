import { Navigate, Route, Routes } from 'react-router-dom'
import { useNaPack } from './useNaPack'
import { HomePage } from '../pages/HomePage'
import { SetupPage } from '../pages/SetupPage'
import { PackingChecklistPage } from '../pages/PackingChecklistPage'

export function AppRouter() {
  const { activeTrip, isLoading } = useNaPack()

  if (isLoading) {
    return (
      <main>
        <h1>Loading NaPack...</h1>
        <p>Restoring your saved trips.</p>
      </main>
    )
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          activeTrip
            ? <Navigate to="/packing" replace />
            : <HomePage />
        }
      />

      <Route
        path="/setup"
        element={
          activeTrip
            ? <Navigate to="/packing" replace />
            : <SetupPage />
        }
      />

      <Route
        path="/packing"
        element={
          activeTrip
            ? <PackingChecklistPage />
            : <Navigate to="/" replace />
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}