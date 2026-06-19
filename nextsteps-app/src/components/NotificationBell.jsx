import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { AuthContext } from '../context/AuthContext'
import {
  loadNotifications,
  markNotificationRead,
} from '../data/appNotifications'
import { fetchNotifications, markNotificationReadApi } from '../services/sessionApi'

export default function NotificationBell() {
  const { user } = useContext(AuthContext)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const panelRef = useRef(null)

  const refresh = useCallback(async () => {
    const local = loadNotifications(user?.role)
    try {
      const { notifications: server } = await fetchNotifications()
      const merged = new Map()
      for (const n of [...server, ...local]) {
        merged.set(n.id, { ...n, read: n.read ?? n.meta?.read })
      }
      setItems([...merged.values()].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)))
    } catch {
      setItems(local)
    }
  }, [user?.role])

  useEffect(() => {
    refresh()
    const onLocal = () => refresh()
    window.addEventListener('app-notification', onLocal)
    const timer = setInterval(refresh, 30000)
    return () => {
      window.removeEventListener('app-notification', onLocal)
      clearInterval(timer)
    }
  }, [refresh])

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const unread = items.filter((n) => !n.read).length

  const handleRead = async (note) => {
    markNotificationRead(note.id)
    try {
      await markNotificationReadApi(note.id)
    } catch {
      /* local mark is enough */
    }
    refresh()
    setOpen(false)
  }

  return (
    <div className="notification-bell" ref={panelRef}>
      <button
        type="button"
        className="notification-bell__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
      >
        <Bell size={18} />
        {unread > 0 && <span className="notification-bell__badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notification-bell__panel">
          <div className="notification-bell__header">Notifications</div>
          {items.length === 0 ? (
            <p className="notification-bell__empty">No notifications yet</p>
          ) : (
            <ul className="notification-bell__list">
              {items.slice(0, 12).map((note) => (
                <li key={note.id} className={note.read ? '' : 'is-unread'}>
                  {note.link ? (
                    <Link
                      to={note.link}
                      className="notification-bell__item"
                      onClick={() => handleRead(note)}
                    >
                      <strong>{note.title}</strong>
                      <span>{note.body}</span>
                    </Link>
                  ) : (
                    <button type="button" className="notification-bell__item" onClick={() => handleRead(note)}>
                      <strong>{note.title}</strong>
                      <span>{note.body}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
