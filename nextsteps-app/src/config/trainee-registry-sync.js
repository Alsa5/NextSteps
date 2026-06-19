/**
 * Sync L&D trainee roster to API for magic-link sign-in eligibility.
 * Roster = has batch; queue-only recruits are blocked on sign-in.
 */
import { apiRequest, getAppToken } from './api-client.js'

const mapTrainees = (trainees) =>
  trainees.map((t) => ({
    id: t.id,
    name: t.name,
    personalEmail: t.personalEmail,
    batch: t.batch ?? null,
    status: t.status,
  }))

export const syncTraineeRegistry = async (trainees) => {
  if (!Array.isArray(trainees) || trainees.length === 0) return null

  const body = { trainees: mapTrainees(trainees) }
  const devPath = '/api/v1/trainee-registry/sync'
  const prodPath = '/api/v1/ld/trainee-registry/sync'

  if (import.meta.env.DEV) {
    const response = await fetch(`${import.meta.env.VITE_API_URL ?? ''}${devPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || `Registry sync failed (${response.status})`)
    }
    return response.json()
  }

  if (!getAppToken()) {
    throw new Error('Sign in as L&D to sync the trainee roster')
  }

  const response = await apiRequest('POST', prodPath, body)
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || `Registry sync failed (${response.status})`)
  }

  return response.json()
}
