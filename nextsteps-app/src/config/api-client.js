const API_BASE = import.meta.env.VITE_API_URL ?? ''

let appToken = null

export const setAppToken = (token) => {
  appToken = token
  if (token) {
    sessionStorage.setItem('nextsteps_token', token)
  } else {
    sessionStorage.removeItem('nextsteps_token')
  }
}

export const getAppToken = () => appToken || sessionStorage.getItem('nextsteps_token')

export const clearAppToken = () => setAppToken(null)

export const apiRequest = async (method, path, body, azureToken) => {
  const headers = { 'Content-Type': 'application/json' }
  const token = azureToken || getAppToken()

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  })

  return response
}

export const fetchGraphProfile = async (accessToken) => {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me?$select=${encodeURIComponent('id,displayName,mail,userPrincipalName,jobTitle,department,employeeType,employeeId')}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    throw new Error('Failed to load Microsoft profile')
  }

  return response.json()
}

/** Fetch the user's Microsoft Graph photo as a data-URL (returns null on failure) */
export const fetchGraphPhoto = async (accessToken) => {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) return null
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export const exchangeSsoForAppToken = async (azureToken, profile) => {
  const response = await apiRequest('POST', '/api/v1/auth/sso', {
    designation: profile.jobTitle,
  }, azureToken)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'SSO exchange failed')
  }

  const data = await response.json()
  setAppToken(data.token)
  return data
}

export const switchAppRole = async (role) => {
  const response = await apiRequest('POST', '/api/v1/auth/switch-role', { role })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Role switch failed')
  }

  const data = await response.json()
  setAppToken(data.token)
  return data
}

export const fetchCurrentUser = async () => {
  const response = await apiRequest('GET', '/api/v1/auth/me')
  if (!response.ok) {
    return null
  }
  return response.json()
}

export const requestMagicLink = async (email) => {
  const response = await apiRequest('POST', '/api/v1/auth/magic-link/request', { email })

  if (!response.ok) {
    const data = await response.json().catch(async () => {
      const text = await response.text().catch(() => '')
      return { error: text || `Sign-in request failed (${response.status})` }
    })
    throw new Error(data.error || data.message || 'Unable to send sign-in code')
  }

  return response.json()
}

export const verifyMagicLink = async (token) => {
  const response = await apiRequest('POST', '/api/v1/auth/magic-link/verify', { token })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || 'Magic link verification failed')
  }

  const data = await response.json()
  setAppToken(data.token)
  return data
}

export const verifyMagicLinkOtp = async (email, otp) => {
  const response = await apiRequest('POST', '/api/v1/auth/magic-link/verify-otp', { email, otp })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || 'Invalid or expired code')
  }

  const data = await response.json()
  setAppToken(data.token)
  return data
}

export const sendOnboardingMail = async (payload) => {
  const response = await apiRequest('POST', '/api/v1/ld/onboarding-mail', payload)

  const data = await response.json().catch(async () => {
    const text = await response.text().catch(() => '')
    return { error: text || `Request failed (${response.status})` }
  })

  if (!response.ok) {
    throw new Error(data.error || 'Failed to send onboarding mail')
  }

  return data
}
