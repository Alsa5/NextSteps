export const capitalizeWord = (word) => {
  if (!word) return ''
  const trimmed = word.trim()
  if (!trimmed) return ''
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

/** Title-case every word in a display name (e.g. madhav v s → Madhav V S). */
export const formatDisplayName = (name) => {
  if (!name?.trim()) return 'Explorer'
  return name.trim().split(/\s+/).filter(Boolean).map(capitalizeWord).join(' ')
}

export const formatFirstName = (name) => {
  const parts = name?.trim().split(/\s+/).filter(Boolean)
  return parts.length ? capitalizeWord(parts[0]) : 'Maverick'
}

/** Profile photo from personal email (Google avatar for Gmail, etc.). */
export const getEmailProfilePhotoUrl = (email, size = 128) => {
  const normalized = email?.trim().toLowerCase()
  if (!normalized?.includes('@')) return null
  return `https://unavatar.io/${encodeURIComponent(normalized)}?size=${size}`
}

export const resolveProfilePhotoUrl = ({ graphPhotoUrl, email, size = 128 }) => {
  if (graphPhotoUrl) return graphPhotoUrl
  return getEmailProfilePhotoUrl(email, size)
}

const PROFILE_PHOTO_KEY = 'nextsteps_profile_photo_v1'

export const cacheProfilePhoto = (url) => {
  try {
    if (url) sessionStorage.setItem(PROFILE_PHOTO_KEY, url)
    else sessionStorage.removeItem(PROFILE_PHOTO_KEY)
  } catch {
    /* private mode */
  }
}

export const getCachedProfilePhoto = () => {
  try {
    return sessionStorage.getItem(PROFILE_PHOTO_KEY) || null
  } catch {
    return null
  }
}
