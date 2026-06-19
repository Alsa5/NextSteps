import { useMemo, useState } from 'react'
import { createAvatar } from '@dicebear/core'
import * as personas from '@dicebear/personas'
import { getEmailProfilePhotoUrl } from '../utils/userDisplay'

export default function PersonAvatar({
  userId = '',
  size = 48,
  className = '',
  title,
  photoUrl = null,
  email = null,
}) {
  const [photoFailed, setPhotoFailed] = useState(false)

  const dicebearSrc = useMemo(() => {
    const avatar = createAvatar(personas, {
      seed: userId || email || 'guest',
      size,
      radius: 50,
      backgroundColor: ['transparent'],
      randomizeIds: true,
    })
    return avatar.toDataUri()
  }, [userId, email, size])

  const resolvedPhoto = useMemo(() => {
    if (photoUrl) return photoUrl
    if (email) return getEmailProfilePhotoUrl(email, Math.max(size, 64))
    return null
  }, [photoUrl, email, size])

  if (resolvedPhoto && !photoFailed) {
    return (
      <img
        src={resolvedPhoto}
        width={size}
        height={size}
        className={`person-avatar-img person-avatar-img--photo ${className}`.trim()}
        alt={title || 'User profile photo'}
        title={title}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setPhotoFailed(true)}
      />
    )
  }

  return (
    <img
      src={dicebearSrc}
      width={size}
      height={size}
      className={`person-avatar-img ${className}`.trim()}
      alt={title || 'User avatar'}
      title={title}
      loading="lazy"
      decoding="async"
    />
  )
}
