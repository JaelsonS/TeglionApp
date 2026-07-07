import { useContext } from 'react'
import { AuthContext } from '@/shared/contexts/AuthContext'

const USE_AUTH_PROVIDER_ERROR = String.fromCharCode(
  117, 115, 101, 65, 117, 116, 104, 32, 100, 101, 118, 101, 32, 115, 101, 114, 32, 117, 115, 97, 100, 111, 32, 100, 101, 110, 116, 114, 111, 32, 100, 101, 32, 60, 65, 117, 116, 104, 80, 114, 111, 118, 105, 100, 101, 114, 32, 47, 62,
)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error(USE_AUTH_PROVIDER_ERROR)
  }
  return ctx
}
