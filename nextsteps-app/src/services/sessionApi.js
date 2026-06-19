import { apiRequest } from '../config/api-client'
import { addNotification } from '../data/appNotifications'

const parseJson = async (response) => {
  const data = await response.json().catch(async () => {
    const text = await response.text().catch(() => '')
    return { error: text || `Request failed (${response.status})` }
  })
  if (!response.ok) {
    throw new Error(data.error || 'Request failed')
  }
  return data
}

export const createPreOnboardingSession = async (payload) => {
  const response = await apiRequest('POST', '/api/v1/ld/pre-onboarding-sessions', payload)
  return parseJson(response)
}

export const fetchLdSessions = async () => {
  const response = await apiRequest('GET', '/api/v1/ld/sessions')
  return parseJson(response)
}

export const completeLdSession = async (sessionId) => {
  const response = await apiRequest('POST', `/api/v1/ld/sessions/${sessionId}/complete`)
  return parseJson(response)
}

export const fetchTrainerSessions = async () => {
  const response = await apiRequest('GET', '/api/v1/trainer/sessions')
  return parseJson(response)
}

export const fetchMaverickSessions = async () => {
  const response = await apiRequest('GET', '/api/v1/maverick/sessions')
  return parseJson(response)
}

export const fetchSessionAnalytics = async (sessionId) => {
  const response = await apiRequest('GET', `/api/v1/trainer/sessions/${sessionId}/analytics`)
  return parseJson(response)
}

export const fetchTranscriptSummary = async (sessionId) => {
  const response = await apiRequest('GET', `/api/v1/maverick/sessions/${sessionId}/transcript-summary`)
  return parseJson(response)
}

export const fetchNotifications = async () => {
  const response = await apiRequest('GET', '/api/v1/notifications')
  return parseJson(response)
}

export const markNotificationReadApi = async (id) => {
  const response = await apiRequest('POST', `/api/v1/notifications/${id}/read`)
  return parseJson(response)
}

export const fetchGoogleOAuthStatus = async () => {
  const response = await apiRequest('GET', '/api/v1/integrations/google/oauth/status')
  return parseJson(response)
}

export const fetchGoogleOAuthStartUrl = async () => {
  const response = await apiRequest('GET', '/api/v1/integrations/google/oauth/start-url')
  return parseJson(response)
}

export const disconnectGoogleOAuth = async () => {
  const response = await apiRequest('DELETE', '/api/v1/integrations/google/oauth/disconnect')
  return parseJson(response)
}

/** Mirror server notifications into local inbox for the bell UI */
export const syncServerNotifications = async (role) => {
  try {
    const { notifications } = await fetchNotifications()
    for (const n of notifications) {
      addNotification({
        id: n.id,
        role: n.role,
        title: n.title,
        body: n.body,
        link: n.link,
        meta: { ...n.meta, server: true, read: n.read },
      })
    }
    return notifications
  } catch {
    return []
  }
}
