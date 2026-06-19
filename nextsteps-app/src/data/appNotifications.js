const KEY = 'nextsteps_app_notifications_v1'

export const loadNotifications = (role = null) => {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '[]')
    if (!role) return all
    return all.filter((n) => n.role === role || n.role === 'all')
  } catch {
    return []
  }
}

export const addNotification = ({ id: customId, role, title, body, link = null, meta = {} }) => {
  const all = loadNotifications()
  const noteId = customId ?? `note-${Date.now()}`
  if (customId && all.some((n) => n.id === customId)) {
    return all.find((n) => n.id === customId)
  }
  const note = {
    id: noteId,
    role,
    title,
    body,
    link,
    meta,
    read: false,
    createdAt: new Date().toISOString(),
  }
  all.unshift(note)
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 100)))
  window.dispatchEvent(new CustomEvent('app-notification', { detail: note }))
  return note
}

export const markNotificationRead = (id) => {
  const all = loadNotifications()
  const next = all.map((n) => (n.id === id ? { ...n, read: true } : n))
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}
