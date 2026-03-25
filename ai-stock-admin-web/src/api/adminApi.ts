import { ADMIN_API_BASE_URL, ADMIN_DATA_MODE } from '../constants/runtime'
import { adminData } from '../mock/adminData'
import { clearAdminSession, getAdminToken, saveAdminSession, type AdminSession } from '../utils/session'
import type { AdminData, AdminUser, ComplianceSummary, FailedJobCleanupResult, JobRunItem, ModelRule, QueueHealth } from '../types/admin'

class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function buildAdminHeaders() {
  const token = getAdminToken()
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
  clearAdminSession()
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
    if (response.status === 401 || response.status === 403) {
      handleUnauthorized()
    }

    throw new ApiError(response.status, `Request failed: ${response.status}`)
  }

  return payload as T
}

function shouldFallback(error: unknown) {
  return !(error instanceof ApiError && (error.status === 401 || error.status === 403))
}

function buildMockJobRuns() {
  return adminData.dataJobs.map((job, index) => ({
    id: `${index + 1}`,
    jobCode: job.name,
    queueName: job.owner,
    status: job.status,
    scheduledAt: job.schedule,
    startedAt: null,
    finishedAt: null,
    durationMs: null,
    traceId: null,
    resultSummary: 'mock 数据',
    errorMessage: null,
  }))
}

function buildMockUsers() {
  return adminData.trialUsers.map((item, index) => ({
    userCode: `mock_user_${index + 1}`,
    name: item.name,
    phase: item.phase,
    behavior: item.behavior,
    nextAction: item.nextAction,
    watchlistCount: index + 1,
    membershipPlan: index === 0 ? 'STANDARD' : 'TRIAL',
    lastLoginAt: new Date().toISOString(),
    latestPushTemplate: 'mock-template',
  }))
}

export function readAdminData(): AdminData {
  return adminData
}

export async function fetchAdminData(): Promise<{ data: AdminData; source: 'api' | 'mock' }> {
  if (ADMIN_DATA_MODE === 'mock') {
    return { data: adminData, source: 'mock' }
  }

  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/api/v1/admin/demo-data`, { headers: buildAdminHeaders() })
    const payload = await requireJson<{ data: AdminData }>(response)
    return { data: payload.data, source: 'api' }
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error
    }

    return { data: adminData, source: 'mock' }
  }
}

export async function fetchJobRuns(): Promise<{ data: JobRunItem[]; source: 'api' | 'mock' }> {
  if (ADMIN_DATA_MODE === 'mock') {
    return { data: buildMockJobRuns(), source: 'mock' }
  }

  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/api/v1/jobs/runs`, { headers: buildAdminHeaders() })
    const payload = await requireJson<{ data: JobRunItem[] }>(response)
    return { data: payload.data, source: 'api' }
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error
    }

    return { data: buildMockJobRuns(), source: 'mock' }
  }
}

export async function dispatchDemoJobs(): Promise<{ count: number; source: 'api' | 'mock' }> {
  if (ADMIN_DATA_MODE === 'mock') {
    return { count: 3, source: 'mock' }
  }

  const response = await fetch(`${ADMIN_API_BASE_URL}/api/v1/jobs/demo-dispatch`, {
    method: 'POST',
    headers: buildAdminHeaders(),
  })

  const payload = await requireJson<{ data: Array<unknown> }>(response)
  return { count: payload.data.length, source: 'api' }
}

export async function cleanupFailedJobs(): Promise<{ data: FailedJobCleanupResult; source: 'api' | 'mock' }> {
  if (ADMIN_DATA_MODE === 'mock') {
    return {
      data: {
        removedJobRuns: 0,
        queues: [
          { name: 'market-fetch', removed: 0 },
          { name: 'market-analyze', removed: 0 },
          { name: 'user-push', removed: 0 },
        ],
      },
      source: 'mock',
    }
  }

  const response = await fetch(`${ADMIN_API_BASE_URL}/api/v1/jobs/cleanup-failed`, {
    method: 'POST',
    headers: buildAdminHeaders(),
  })

  const payload = await requireJson<{ data: FailedJobCleanupResult }>(response)
  return { data: payload.data, source: 'api' }
}

export async function fetchModelRules(): Promise<{ data: ModelRule[]; source: 'api' | 'mock' }> {
  if (ADMIN_DATA_MODE === 'mock') {
    return { data: adminData.modelRules, source: 'mock' }
  }

  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/api/v1/admin/model-rules`, { headers: buildAdminHeaders() })
    const payload = await requireJson<{ data: ModelRule[] }>(response)
    return { data: payload.data, source: 'api' }
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error
    }

    return { data: adminData.modelRules, source: 'mock' }
  }
}

export async function createModelRule(input: ModelRule): Promise<{ data: ModelRule; source: 'api' | 'mock' }> {
  if (ADMIN_DATA_MODE === 'mock') {
    return { data: { ...input }, source: 'mock' }
  }

  const response = await fetch(`${ADMIN_API_BASE_URL}/api/v1/admin/model-rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...buildAdminHeaders() },
    body: JSON.stringify(input),
  })

  const payload = await requireJson<{ data: ModelRule }>(response)
  return { data: payload.data, source: 'api' }
}

export async function patchModelRule(input: ModelRule, previousRuleCode?: string): Promise<{ data: ModelRule; source: 'api' | 'mock' }> {
  if (ADMIN_DATA_MODE === 'mock') {
    return { data: { ...input }, source: 'mock' }
  }

  const response = await fetch(`${ADMIN_API_BASE_URL}/api/v1/admin/model-rules/${previousRuleCode || input.ruleCode}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...buildAdminHeaders() },
    body: JSON.stringify(input),
  })

  const payload = await requireJson<{ data: ModelRule }>(response)
  return { data: payload.data, source: 'api' }
}

export async function deleteModelRule(ruleCode: string): Promise<{ removed: boolean; source: 'api' | 'mock' }> {
  if (ADMIN_DATA_MODE === 'mock') {
    return { removed: true, source: 'mock' }
  }

  const response = await fetch(`${ADMIN_API_BASE_URL}/api/v1/admin/model-rules/${ruleCode}`, {
    method: 'DELETE',
    headers: buildAdminHeaders(),
  })

  const payload = await requireJson<{ data: { removed: boolean } }>(response)
  return { removed: payload.data.removed, source: 'api' }
}

export async function fetchAdminUsers(): Promise<{ data: AdminUser[]; source: 'api' | 'mock' }> {
  if (ADMIN_DATA_MODE === 'mock') {
    return { data: buildMockUsers(), source: 'mock' }
  }

  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/api/v1/admin/users`, { headers: buildAdminHeaders() })
    const payload = await requireJson<{ data: AdminUser[] }>(response)
    return { data: payload.data, source: 'api' }
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error
    }

    return { data: buildMockUsers(), source: 'mock' }
  }
}

export async function patchAdminUser(input: {
  userCode: string
  nickname?: string
  membershipPlan?: string
  status?: string
}): Promise<{ data: AdminUser; source: 'api' | 'mock' }> {
  if (ADMIN_DATA_MODE === 'mock') {
    return {
      data: {
        userCode: input.userCode,
        name: input.nickname || input.userCode,
        phase: input.status === 'TRIAL' ? '试用中' : '标准版使用中',
        behavior: 'mock 更新',
        nextAction: 'mock 更新',
        watchlistCount: 0,
        membershipPlan: input.membershipPlan || 'TRIAL',
        lastLoginAt: new Date().toISOString(),
        latestPushTemplate: null,
      },
      source: 'mock',
    }
  }

  const response = await fetch(`${ADMIN_API_BASE_URL}/api/v1/admin/users/${input.userCode}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...buildAdminHeaders() },
    body: JSON.stringify(input),
  })

  const payload = await requireJson<{ data: AdminUser }>(response)
  return { data: payload.data, source: 'api' }
}

export async function deleteAdminUser(userCode: string): Promise<{ removed: boolean; source: 'api' | 'mock' }> {
  if (ADMIN_DATA_MODE === 'mock') {
    return { removed: true, source: 'mock' }
  }

  const response = await fetch(`${ADMIN_API_BASE_URL}/api/v1/admin/users/${userCode}`, {
    method: 'DELETE',
    headers: buildAdminHeaders(),
  })

  const payload = await requireJson<{ data: { removed: boolean } }>(response)
  return { removed: payload.data.removed, source: 'api' }
}

export async function fetchComplianceSummary(): Promise<{ data: ComplianceSummary; source: 'api' | 'mock' }> {
  const mockData = {
    blockedTerms: ['稳赚', '保本', '带单'],
    inspections: [
      { title: '客服会话抽检', status: '通过', detail: '未发现收益承诺类表述。' },
      { title: '营销素材扫描', status: '通过', detail: '营销素材保持结构化判断表述。' },
    ],
    alerts: ['mock 触达模板需继续复核边界话术'],
  }

  if (ADMIN_DATA_MODE === 'mock') {
    return { data: mockData, source: 'mock' }
  }

  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/api/v1/admin/compliance`, { headers: buildAdminHeaders() })
    const payload = await requireJson<{ data: ComplianceSummary }>(response)
    return { data: payload.data, source: 'api' }
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error
    }

    return { data: mockData, source: 'mock' }
  }
}

export async function fetchQueueHealth(): Promise<{ data: QueueHealth; source: 'api' | 'mock' }> {
  const mockData = {
    status: 'degraded',
    reason: '队列接口不可用，已回退 mock。',
    queues: [
      { name: 'market-fetch', waiting: null, active: null, completed: null, failed: null, delayed: null },
      { name: 'market-analyze', waiting: null, active: null, completed: null, failed: null, delayed: null },
      { name: 'user-push', waiting: null, active: null, completed: null, failed: null, delayed: null },
    ],
  }

  if (ADMIN_DATA_MODE === 'mock') {
    return {
      data: {
        status: 'ready',
        queues: [
          { name: 'market-fetch', waiting: 0, active: 0, completed: 4, failed: 0, delayed: 0 },
          { name: 'market-analyze', waiting: 0, active: 0, completed: 4, failed: 0, delayed: 0 },
          { name: 'user-push', waiting: 0, active: 0, completed: 4, failed: 0, delayed: 0 },
        ],
      },
      source: 'mock',
    }
  }

  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/api/v1/jobs/queues`, { headers: buildAdminHeaders() })
    const payload = await requireJson<{ data: QueueHealth }>(response)
    return { data: payload.data, source: 'api' }
  } catch (error) {
    if (!shouldFallback(error)) {
      throw error
    }

    return { data: mockData, source: 'mock' }
  }
}

export async function loginAdminAccount(input: { userCode?: string; mobile?: string; password: string }) {
  const response = await fetch(`${ADMIN_API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  const payload = await requireJson<{ data: AdminSession }>(response)
  saveAdminSession(payload.data)
  return payload.data
}

export async function refreshAdminSession() {
  const response = await fetch(`${ADMIN_API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: buildAdminHeaders(),
  })

  const payload = await requireJson<{ data: AdminSession }>(response)
  saveAdminSession(payload.data)
  return payload.data
}

export async function logoutAdminSession(): Promise<{ removed: boolean; source: 'api' | 'mock' }> {
  const response = await fetch(`${ADMIN_API_BASE_URL}/api/v1/auth/logout`, {
    method: 'POST',
    headers: buildAdminHeaders(),
  })

  if (response.status === 401) {
    clearAdminSession()
    return { removed: false, source: 'api' }
  }

  const payload = await requireJson<{ data: { removed: boolean } }>(response)
  clearAdminSession()
  return { removed: payload.data.removed, source: 'api' }
}

export async function resetAdminUserPassword(input: { userCode: string; newPassword: string }) {
  const response = await fetch(`${ADMIN_API_BASE_URL}/api/v1/admin/users/${input.userCode}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...buildAdminHeaders() },
    body: JSON.stringify({ newPassword: input.newPassword }),
  })

  const payload = await requireJson<{ data: { userCode: string; reset: boolean } }>(response)
  return payload.data
}