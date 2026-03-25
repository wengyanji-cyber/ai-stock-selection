import type { AuthSession } from '../types/demo'

const CURRENT_SESSION_KEY = 'ai-stock-web.current-session'

function isExpired(expiresAt: string) {
  const time = Date.parse(expiresAt)
  return Number.isNaN(time) || time <= Date.now()
}

function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(CURRENT_SESSION_KEY)
  if (!raw) {
    return null
  }

  try {
    const session = JSON.parse(raw) as AuthSession
    if (!session.expiresAt || isExpired(session.expiresAt)) {
      window.localStorage.removeItem(CURRENT_SESSION_KEY)
      return null
    }

    return session
  } catch {
    window.localStorage.removeItem(CURRENT_SESSION_KEY)
    return null
  }
}

export function getCurrentUserCode() {
  return readStoredSession()?.profile.userCode || ''
}

export function getAuthToken() {
  return readStoredSession()?.accessToken || ''
}

export function getCurrentSession() {
  return readStoredSession()
}

export function saveCurrentSession(session: AuthSession) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session))
}

export function clearCurrentUserCode() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(CURRENT_SESSION_KEY)
}

export function clearCurrentSession() {
  clearCurrentUserCode()
}