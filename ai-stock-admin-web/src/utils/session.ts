type AdminProfile = {
  userCode: string
  nickname: string
  roleCode: string
  membershipPlan: string
  status: string
  lastLoginAt: string | null
}

export type AdminSession = {
  profile: AdminProfile
  accessToken: string
  expiresAt: string
}

const ADMIN_SESSION_KEY = 'ai-stock-admin.current-session'

function isExpired(expiresAt: string) {
  const time = Date.parse(expiresAt)
  return Number.isNaN(time) || time <= Date.now()
}

export function getAdminSession() {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(ADMIN_SESSION_KEY)
  if (!raw) {
    return null
  }

  try {
    const session = JSON.parse(raw) as AdminSession
    if (!session.expiresAt || isExpired(session.expiresAt)) {
      window.localStorage.removeItem(ADMIN_SESSION_KEY)
      return null
    }

    return session
  } catch {
    window.localStorage.removeItem(ADMIN_SESSION_KEY)
    return null
  }
}

export function getAdminToken() {
  return getAdminSession()?.accessToken || ''
}

export function saveAdminSession(session: AdminSession) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
}

export function clearAdminSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(ADMIN_SESSION_KEY)
}