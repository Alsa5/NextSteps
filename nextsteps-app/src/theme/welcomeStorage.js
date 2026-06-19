const WELCOME_FLAG_PREFIX = 'ns.welcome.v1'

export const welcomeCoachStorageKey = (userId, role) =>
  `${WELCOME_FLAG_PREFIX}.${userId}.${role}`

export const isWelcomeCoachDismissed = (userId, role) => {
  if (!userId || !role) return true
  try {
    return localStorage.getItem(welcomeCoachStorageKey(userId, role)) === '1'
  } catch {
    return true
  }
}

export const markWelcomeCoachDismissed = (userId, role) => {
  if (!userId || !role) return
  try {
    localStorage.setItem(welcomeCoachStorageKey(userId, role), '1')
  } catch {
    /* storage unavailable */
  }
}
