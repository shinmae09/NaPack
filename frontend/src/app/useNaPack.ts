import { useContext } from 'react'
import { NaPackContext } from './NaPackContext'

export function useNaPack() {
  const context = useContext(NaPackContext)

  if (!context) {
    throw new Error('useNaPack must be used inside NaPackProvider')
  }

  return context
}