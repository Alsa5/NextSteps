import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAzureAuth } from '../auth/AzureAuthProvider'

export default function AuthCallback() {
  const { isBootstrapping } = useAzureAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isBootstrapping) {
      navigate('/', { replace: true })
    }
  }, [isBootstrapping, navigate])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#0f0a1f',
        color: '#e8e4ff',
      }}
    >
      <p>Completing Microsoft sign-in…</p>
    </div>
  )
}
