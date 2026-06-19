import { useContext } from 'react'
import toast from 'react-hot-toast'
import { AuthContext } from '../context/AuthContext'
import { ROLES } from '../theme/maverickNebula'

export default function RoleSwitcher() {
  const { user, switchRole } = useContext(AuthContext)

  if (!user?.isAppAdmin) {
    return null
  }

  const handleSwitch = async (roleId) => {
    if (roleId === user.role) return

    try {
      const nextUser = await switchRole(roleId)
      toast.success(`Viewing as ${ROLES.find((r) => r.id === nextUser.role)?.name ?? nextUser.role}`)
    } catch (error) {
      toast.error(error.message || 'Could not switch role')
    }
  }

  return (
    <div className="role-switcher" style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--brand-amber)',
          marginBottom: 8,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        App Admin · Switch Role
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6,
        }}
      >
        {ROLES.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => handleSwitch(role.id)}
            aria-pressed={user.role === role.id}
            aria-label={`Switch to ${role.name}`}
            style={{
              padding: '8px 6px',
              borderRadius: 10,
              border: user.role === role.id ? '1px solid var(--brand-amber)' : '1px solid rgba(123,92,245,0.25)',
              background: user.role === role.id ? 'rgba(247,201,72,0.12)' : 'rgba(0,0,0,0.25)',
              color: user.role === role.id ? 'var(--brand-amber)' : 'rgba(255,255,255,0.75)',
              fontSize: 11,
              fontWeight: user.role === role.id ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <span style={{ display: 'block', fontSize: 14, marginBottom: 2 }}>{role.icon}</span>
            {role.name}
          </button>
        ))}
      </div>
    </div>
  )
}
