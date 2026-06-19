import { describe, expect, it } from 'vitest'
import { getWelcomeCopy, WELCOME_ROLES } from './maverickNebula'
import {
  isWelcomeCoachDismissed,
  markWelcomeCoachDismissed,
  welcomeCoachStorageKey,
} from './welcomeStorage'

describe('getWelcomeCopy', () => {
  it.each(WELCOME_ROLES)('returns chapter and coach copy for %s', (role) => {
    const copy = getWelcomeCopy(role)
    expect(copy.chapterLine).toBeTruthy()
    expect(copy.dashboardCodename).toBeTruthy()
    expect(copy.coachTitle).toBeTruthy()
    expect(copy.coachBody).toBeTruthy()
    expect(copy.spotlightSelector).toBeTruthy()
    expect(copy.chapterLine.toLowerCase()).not.toContain('mentor')
    expect(copy.coachBody.toLowerCase()).not.toContain('mentor')
  })

  it('falls back to maverick for unknown role', () => {
    const copy = getWelcomeCopy('unknown')
    expect(copy.dashboardCodename).toBe(getWelcomeCopy('maverick').dashboardCodename)
  })
})

describe('welcomeCoachStorageKey', () => {
  it('builds per-user per-role key', () => {
    expect(welcomeCoachStorageKey('u1', 'trainer')).toBe('ns.welcome.v1.u1.trainer')
  })
})

describe('welcome coach flags', () => {
  it('tracks dismiss per role without clearing other roles', () => {
    const userId = `test-${crypto.randomUUID()}`
    const maverickKey = welcomeCoachStorageKey(userId, 'maverick')
    const trainerKey = welcomeCoachStorageKey(userId, 'trainer')
    localStorage.removeItem(maverickKey)
    localStorage.removeItem(trainerKey)

    markWelcomeCoachDismissed(userId, 'maverick')
    expect(isWelcomeCoachDismissed(userId, 'maverick')).toBe(true)
    expect(isWelcomeCoachDismissed(userId, 'trainer')).toBe(false)

    localStorage.removeItem(maverickKey)
    localStorage.removeItem(trainerKey)
  })
})
