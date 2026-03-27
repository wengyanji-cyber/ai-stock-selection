import { WEB_API_BASE_URL, WEB_DATA_MODE } from '../constants/runtime'
import { demoData } from '../mock/demoData'
import { clearCurrentSession, getAuthToken, saveCurrentSession } from '../utils/session'
import type { AuthSession, Candidate, DemoData, Diagnosis, MarketHome, ReviewSummary, UserProfile, WatchItem } from '../types/demo'

class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function buildAuthHeaders() {
  const token = getAuthToken()
  const headers: Record<string, string> = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

function redirectToLogin() {
  if (typeof window === 'undefined') {
    return
  }

  if (window.location.pathname === '/login') {
    return
  }

  const currentPath = `${window.location.pathname}${window.location.search}`
  window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
}

function handleUnauthorized() {
  clearCurrentSession()
  redirectToLogin()
}

async function parsePayload<T>(response: Response) {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

async function requireJson<T>(response: Response) {
  const payload = await parsePayload<T>(response)

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized()
    }

    throw new ApiError(response.status, `Request failed: ${response.status}`)
  }

  return payload as T
}

function shouldFallback(error: unknown) {
  return !(error instanceof ApiError && (error.status === 401 || error.status === 403))
}

export function readDemoData(): DemoData {
  return demoData
}

export async function fetchDemoData(): Promise<{ data: DemoData; source: 'api' | 'mock' }> {
  if (WEB_DATA_MODE === 'mock') {
    return { data: demoData, source: 'mock' }
  }

  try {
    const response = await fetch(`${WEB_API_BASE_URL}/api/v1/web/demo-data`)
    const payload = await requireJson<{ data: DemoData }>(response)
    return { data: payload.data, source: 'api' }
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error
    }

    return { data: demoData, source: 'mock' }
  }
}

export async function fetchMarketHome(): Promise<{ data: MarketHome; source: 'api' | 'mock' }> {
  const mockData = {
    marketSummary: demoData.marketSummary,
    marketTemperature: demoData.marketTemperature,
    marketTags: demoData.marketTags,
    sectors: demoData.sectors,
    focusCandidateCount: demoData.candidates.filter((item) => item.level === '重点候选').length,
  }

  if (WEB_DATA_MODE === 'mock') {
    return { data: mockData, source: 'mock' }
  }

  try {
    const response = await fetch(`${WEB_API_BASE_URL}/api/v1/market/home`)
    const payload = await requireJson<{ data: MarketHome }>(response)
    return { data: payload.data, source: 'api' }
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error
    }

    return { data: mockData, source: 'mock' }
  }
}

export async function fetchCandidateDetails(): Promise<{ data: Candidate[]; source: 'api' | 'mock' }> {
  if (WEB_DATA_MODE === 'mock') {
    return { data: demoData.candidates, source: 'mock' }
  }

  try {
    const response = await fetch(`${WEB_API_BASE_URL}/api/v1/candidates/detail`)
    const payload = await requireJson<{ data: Candidate[] }>(response)
    return { data: payload.data, source: 'api' }
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error
    }

    return { data: demoData.candidates, source: 'mock' }
  }
}

export async function fetchDiagnoses(keyword?: string): Promise<{ data: Diagnosis[]; source: 'api' | 'mock' }> {
  const mockList = Object.values(demoData.diagnoses)

  if (WEB_DATA_MODE === 'mock') {
    if (!keyword?.trim()) {
      return { data: mockList, source: 'mock' }
    }

    return {
      data: mockList.filter((item) => item.name.includes(keyword) || item.code.includes(keyword) || item.sector.includes(keyword)),
      source: 'mock',
    }
  }

  try {
    const search = new URLSearchParams()
    if (keyword?.trim()) {
      search.set('keyword', keyword.trim())
    }

    const query = search.toString() ? `?${search.toString()}` : ''
    const response = await fetch(`${WEB_API_BASE_URL}/api/v1/diagnoses${query}`)
    const payload = await requireJson<{ data: Diagnosis[] }>(response)
    return { data: payload.data, source: 'api' }
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error
    }

    return { data: mockList, source: 'mock' }
  }
}

export async function fetchLatestReview(): Promise<{ data: ReviewSummary; source: 'api' | 'mock' }> {
  if (WEB_DATA_MODE === 'mock') {
    return { data: demoData.review, source: 'mock' }
  }

  try {
    const response = await fetch(`${WEB_API_BASE_URL}/api/v1/reviews/latest`)
    const payload = await parsePayload<{ data: ReviewSummary | null }>(response)
    
    // 如果 data 为 null（未登录或其他原因），回退到 mock
    if (!payload || payload.data === null) {
      return { data: demoData.review, source: 'mock' }
    }
    
    return { data: payload.data, source: 'api' }
  } catch (error) {
    // 任何错误都回退到 mock
    return { data: demoData.review, source: 'mock' }
  }
}

export async function fetchWatchlist(): Promise<{ data: WatchItem[]; source: 'api' | 'mock' }> {
  if (WEB_DATA_MODE === 'mock') {
    return { data: demoData.watchlist, source: 'mock' }
  }

  try {
    const response = await fetch(`${WEB_API_BASE_URL}/api/v1/watchlist`, {
      headers: buildAuthHeaders(),
    })
    const payload = await requireJson<{ data: WatchItem[] }>(response)
    return { data: payload.data, source: 'api' }
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error
    }

    return { data: demoData.watchlist, source: 'mock' }
  }
}

export async function createWatchlistItem(input: {
  stockCode: string
  stockName: string
  sectorName: string
  reason?: string
  advice?: string
  status?: string
  statusKey?: WatchItem['statusKey']
}): Promise<{ data: WatchItem; source: 'api' | 'mock' }> {
  if (WEB_DATA_MODE === 'mock') {
    return {
      data: {
        code: input.stockCode,
        name: input.stockName,
        sector: input.sectorName,
        status: '继续观察',
        statusKey: 'watching',
        reason: '本地 mock 新增观察项。',
        advice: '继续观察关键位变化。',
        badge: 'brand',
      },
      source: 'mock',
    }
  }

  const response = await fetch(`${WEB_API_BASE_URL}/api/v1/watchlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...buildAuthHeaders() },
    body: JSON.stringify(input),
  })

  const payload = await requireJson<{ data: WatchItem }>(response)
  return { data: payload.data, source: 'api' }
}

export async function updateWatchlistItem(input: {
  stockCode: string
  status?: string
  statusKey?: WatchItem['statusKey']
  reason?: string
  advice?: string
}): Promise<{ data: WatchItem | null; source: 'api' | 'mock' }> {
  if (WEB_DATA_MODE === 'mock') {
    return {
      data: {
        code: input.stockCode,
        name: demoData.watchlist.find((item) => item.code === input.stockCode)?.name || input.stockCode,
        sector: demoData.watchlist.find((item) => item.code === input.stockCode)?.sector || '未分类',
        status: input.status || '继续观察',
        statusKey: input.statusKey || 'watching',
        reason: input.reason || '本地 mock 已更新观察状态。',
        advice: input.advice || '继续观察关键位变化。',
        badge: input.statusKey === 'warning' ? 'warn' : input.statusKey === 'stronger' ? 'accent' : 'brand',
      },
      source: 'mock',
    }
  }

  const response = await fetch(`${WEB_API_BASE_URL}/api/v1/watchlist/${input.stockCode}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...buildAuthHeaders() },
    body: JSON.stringify(input),
  })

  const payload = await requireJson<{ data: WatchItem | null }>(response)
  return { data: payload.data, source: 'api' }
}

export async function removeWatchlistItem(stockCode: string): Promise<{ removed: boolean; source: 'api' | 'mock' }> {
  if (WEB_DATA_MODE === 'mock') {
    return { removed: true, source: 'mock' }
  }

  const response = await fetch(`${WEB_API_BASE_URL}/api/v1/watchlist/${stockCode}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  })

  const payload = await requireJson<{ data: { removed: boolean } }>(response)
  return { removed: payload.data.removed, source: 'api' }
}

export async function loginTrialUser(input: {
  userCode?: string
  nickname?: string
  mobile?: string
}): Promise<{ data: AuthSession; source: 'api' | 'mock' }> {
  if (WEB_DATA_MODE === 'mock') {
    return {
      data: {
        profile: {
          userCode: input.userCode || 'mock_user',
          nickname: input.nickname || '演示用户',
          membershipPlan: 'TRIAL',
          status: 'TRIAL',
          trialDaysRemaining: 14,
          watchlistCount: demoData.watchlist.length,
          diagnosisCount: Object.keys(demoData.diagnoses).length,
          recentPushCount: 1,
          lastLoginAt: new Date().toISOString(),
          nextActions: ['加入 1 到 2 只股票进入观察列表。'],
          recentActivities: demoData.watchlist.slice(0, 2).map((item) => `${item.name}：${item.status}`),
        },
        accessToken: 'mock-token',
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
      source: 'mock',
    }
  }

  const response = await fetch(`${WEB_API_BASE_URL}/api/v1/auth/trial-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  const payload = await requireJson<{ data: AuthSession }>(response)
  saveCurrentSession(payload.data)
  return { data: payload.data, source: 'api' }
}

export async function loginUserAccount(input: { userCode?: string; mobile?: string; password: string }) {
  const response = await fetch(`${WEB_API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  const payload = await requireJson<{ data: AuthSession }>(response)
  saveCurrentSession(payload.data)
  return payload.data
}

export async function registerUserAccount(input: { userCode?: string; nickname?: string; mobile?: string; password: string }) {
  const response = await fetch(`${WEB_API_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  const payload = await requireJson<{ data: AuthSession }>(response)
  saveCurrentSession(payload.data)
  return payload.data
}

export async function refreshCurrentSession() {
  const response = await fetch(`${WEB_API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: buildAuthHeaders(),
  })

  const payload = await requireJson<{ data: AuthSession }>(response)
  saveCurrentSession(payload.data)
  return payload.data
}

export async function fetchUserProfile(): Promise<{ data: UserProfile | null; source: 'api' | 'mock' }> {
  if (WEB_DATA_MODE === 'mock') {
    return {
      data: {
        userCode: 'mock_user',
        nickname: '演示用户',
        membershipPlan: 'TRIAL',
        status: 'TRIAL',
        trialDaysRemaining: 14,
        watchlistCount: demoData.watchlist.length,
        diagnosisCount: Object.keys(demoData.diagnoses).length,
        recentPushCount: 1,
        lastLoginAt: new Date().toISOString(),
        nextActions: ['继续观察热点板块中的强势股。'],
        recentActivities: demoData.watchlist.map((item) => `${item.name}：${item.status}`).slice(0, 3),
      },
      source: 'mock',
    }
  }

  const response = await fetch(`${WEB_API_BASE_URL}/api/v1/users/profile`, {
    headers: buildAuthHeaders(),
  })

  const payload = await requireJson<{ data: UserProfile | null }>(response)
  return { data: payload.data, source: 'api' }
}

export async function logoutCurrentSession(): Promise<{ removed: boolean; source: 'api' | 'mock' }> {
  if (WEB_DATA_MODE === 'mock') {
    clearCurrentSession()
    return { removed: true, source: 'mock' }
  }

  const response = await fetch(`${WEB_API_BASE_URL}/api/v1/auth/logout`, {
    method: 'POST',
    headers: buildAuthHeaders(),
  })

  if (response.status === 401) {
    clearCurrentSession()
    return { removed: false, source: 'api' }
  }

  const payload = await requireJson<{ data: { removed: boolean } }>(response)
  clearCurrentSession()
  return { removed: payload.data.removed, source: 'api' }
}

export async function changeUserPassword(input: { currentPassword: string; newPassword: string }) {
  const response = await fetch(`${WEB_API_BASE_URL}/api/v1/users/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...buildAuthHeaders() },
    body: JSON.stringify(input),
  })

  const payload = await requireJson<{ data: AuthSession }>(response)
  saveCurrentSession(payload.data)
  return payload.data
}