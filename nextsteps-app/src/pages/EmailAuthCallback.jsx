import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { verifyMagicLink } from '../config/api-client'

export default function EmailAuthCallback({ onAuthenticated }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError('Missing magic link token')
      return undefined
    }

    let cancelled = false

    const verify = async () => {
      try {
        const { user } = await verifyMagicLink(token)
        if (cancelled) return
        onAuthenticated?.(user)
        navigate('/', { replace: true })
      } catch (err) {
        if (cancelled) return
        setError(err.message || 'Magic link verification failed')
      }
    }

    verify()

    return () => {
      cancelled = true
    }
  }, [searchParams, navigate, onAuthenticated])

  return (
    <div className="login-email-callback">
      {error ? (
        <>
          <p className="login-email-callback__error">{error}</p>
          <a href="/" className="btn btn-primary">Back to sign in</a>
        </>
      ) : (
        <p>Verifying your magic link…</p>
      )}
    </div>
  )
}
