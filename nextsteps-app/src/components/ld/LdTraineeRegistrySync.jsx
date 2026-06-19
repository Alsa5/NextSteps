import { useEffect, useRef } from 'react'
import { loadTrainees } from '../../data/ldTraineeStore'
import { syncTraineeRegistry } from '../../config/trainee-registry-sync'

/** Push localStorage roster to API so magic-link sign-in matches the L&D roster view. */
export default function LdTraineeRegistrySync() {
  const syncedRef = useRef(false)

  useEffect(() => {
    if (syncedRef.current) return
    syncedRef.current = true

    syncTraineeRegistry(loadTrainees()).catch((err) => {
      console.warn('[trainee-registry] sync failed:', err.message)
      syncedRef.current = false
    })
  }, [])

  return null
}
