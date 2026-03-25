import { FastifyInstance, FastifyRequest } from 'fastify'
import { requireAuthSession } from '../auth/auth.service.js'
import type { MembershipPlan } from '../../lib/membership.js'

interface AuthSession {
  user: {
    id: bigint
    userCode: string
    membershipPlan: string | null
  }
}

async function getSession(request: FastifyRequest) {
  try {
    const session = await requireAuthSession(request)
    return session as unknown as AuthSession
  } catch {
    return null
  }
}

export function buildCheckMembershipLimit(plan: string | null) {
  const limits: Record<string, { dailyCandidates: number; watchlistLimit: number }> = {
    TRIAL: { dailyCandidates: 3, watchlistLimit: 10 },
    OBSERVER: { dailyCandidates: 5, watchlistLimit: 50 },
    STANDARD: { dailyCandidates: 10, watchlistLimit: 200 },
    ADVANCED: { dailyCandidates: 9999, watchlistLimit: 9999 },
  }

  return limits[plan || 'TRIAL'] || limits.TRIAL
}

export async function checkCandidateLimit(request: FastifyRequest, count: number) {
  const session = await getSession(request)
  if (!session) {
    return { allowed: false, limit: 0, current: count, message: '请先登录' }
  }

  const limits = buildCheckMembershipLimit(session.user.membershipPlan)
  const allowed = count < limits.dailyCandidates

  return {
    allowed,
    limit: limits.dailyCandidates,
    current: count,
    remaining: Math.max(0, limits.dailyCandidates - count),
    message: allowed
      ? `今日还可查看 ${limits.dailyCandidates - count} 只候选股票`
      : `当前套餐每日仅可查看${limits.dailyCandidates}只，升级后可查看更多`,
    upgradeHint: !allowed && session.user.membershipPlan !== 'ADVANCED' ? '升级套餐解锁无限查看' : null,
  }
}

export async function checkWatchlistLimit(request: FastifyRequest, count: number) {
  const session = await getSession(request)
  if (!session) {
    return { allowed: false, limit: 0, current: count, message: '请先登录' }
  }

  const limits = buildCheckMembershipLimit(session.user.membershipPlan)
  const allowed = count < limits.watchlistLimit

  return {
    allowed,
    limit: limits.watchlistLimit,
    current: count,
    remaining: Math.max(0, limits.watchlistLimit - count),
    message: allowed
      ? `还可添加 ${limits.watchlistLimit - count} 只自选股`
      : `当前套餐最多添加${limits.watchlistLimit}只自选股，升级后可添加更多`,
    upgradeHint: !allowed && session.user.membershipPlan !== 'ADVANCED' ? '升级套餐解锁更多名额' : null,
  }
}

export async function checkFeatureAccess(request: FastifyRequest, feature: 'deep_diagnosis' | 'data_export' | 'backtest' | 'push') {
  const session = await getSession(request)
  if (!session) {
    return { allowed: false, message: '请先登录' }
  }

  const featureMap: Record<string, string[]> = {
    TRIAL: [],
    OBSERVER: ['data_export'],
    STANDARD: ['deep_diagnosis', 'data_export', 'backtest', 'push'],
    ADVANCED: ['deep_diagnosis', 'data_export', 'backtest', 'push', 'api_access'],
  }

  const allowed = featureMap[session.user.membershipPlan || 'TRIAL']?.includes(feature)

  return {
    allowed,
    message: allowed ? '功能可用' : `当前套餐不支持此功能，升级后可用`,
    upgradeHint: !allowed && session.user.membershipPlan !== 'ADVANCED' ? '升级套餐解锁此功能' : null,
  }
}

export async function enforceSubscription(request: FastifyRequest, reply: any, requiredPlan: MembershipPlan[]) {
  const session = await getSession(request)
  
  if (!session) {
    reply.code(401)
    return { error: '请先登录', redirectTo: '/login' }
  }

  if (!requiredPlan.includes(session.user.membershipPlan as MembershipPlan)) {
    reply.code(403)
    return { 
      error: '当前套餐不支持此功能',
      currentPlan: session.user.membershipPlan,
      requiredPlans: requiredPlan,
      upgradeTo: '/pricing'
    }
  }

  return null
}
