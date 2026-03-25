import { FastifyRequest, FastifyReply } from 'fastify'

interface AuthSession {
  user: {
    id: bigint
    userCode: string
    membershipPlan: string | null
  }
}

interface LimitCheckResult {
  allowed: boolean
  limit: number
  current: number
  remaining?: number
  message: string
  upgradeHint?: string | null
}

interface FeatureCheckResult {
  allowed: boolean
  message: string
  upgradeHint?: string | null
}

export const MEMBERSHIP_LIMITS = {
  TRIAL: { dailyCandidates: 3, watchlistLimit: 10, diagnosisDepth: 'basic' as const },
  OBSERVER: { dailyCandidates: 5, watchlistLimit: 50, diagnosisDepth: 'standard' as const },
  STANDARD: { dailyCandidates: 10, watchlistLimit: 200, diagnosisDepth: 'deep' as const },
  ADVANCED: { dailyCandidates: 9999, watchlistLimit: 9999, diagnosisDepth: 'deep' as const },
}

export const FEATURE_ACCESS: Record<string, string[]> = {
  TRIAL: [],
  OBSERVER: ['data_export'],
  STANDARD: ['deep_diagnosis', 'data_export', 'backtest', 'push'],
  ADVANCED: ['deep_diagnosis', 'data_export', 'backtest', 'push', 'api_access'],
}

async function getSession(request: FastifyRequest): Promise<AuthSession | null> {
  try {
    // 尝试从 request 上下文中获取 session
    const ctx = request as any
    const session = ctx.session || ctx.state?.session
    
    if (!session) {
      console.log('[Middleware] No session found in request')
      return null
    }
    
    // Session 对象可能是 { user: {...} } 或 { profile: {...} }
    const user = session.user || session.profile
    if (!user) {
      console.log('[Middleware] No user in session')
      return null
    }
    
    console.log('[Middleware] Session user:', user.userCode, 'plan:', user.membershipPlan)
    
    return {
      user: {
        id: user.id,
        userCode: user.userCode,
        membershipPlan: user.membershipPlan,
      },
    }
  } catch (e) {
    console.log('[Middleware] getSession error:', e)
    return null
  }
}

export function getMembershipLimits(plan: string | null) {
  const key = (plan || 'TRIAL') as keyof typeof MEMBERSHIP_LIMITS
  return MEMBERSHIP_LIMITS[key] || MEMBERSHIP_LIMITS.TRIAL
}

export function hasFeatureAccess(plan: string | null, feature: string) {
  const key = (plan || 'TRIAL') as keyof typeof FEATURE_ACCESS
  const features = FEATURE_ACCESS[key] || []
  return features.includes(feature)
}

export async function checkCandidateLimit(request: FastifyRequest, count: number, providedSession?: any): Promise<LimitCheckResult> {
  // 如果提供了 session，直接使用
  const session = providedSession || await getSession(request)
  
  if (!session) {
    return {
      allowed: false,
      limit: 0,
      current: count,
      message: '请先登录',
      upgradeHint: '登录后即可体验',
    }
  }

  const limits = getMembershipLimits(session.user.membershipPlan)
  const allowed = count < limits.dailyCandidates

  return {
    allowed,
    limit: limits.dailyCandidates,
    current: count,
    remaining: Math.max(0, limits.dailyCandidates - count),
    message: allowed
      ? `今日还可查看 ${limits.dailyCandidates - count} 只候选股票`
      : `当前套餐每日仅可查看${limits.dailyCandidates}只`,
    upgradeHint: !allowed && session.user.membershipPlan !== 'ADVANCED' ? '升级套餐解锁无限查看' : null,
  }
}

export async function checkWatchlistLimit(request: FastifyRequest, count: number, providedSession?: any): Promise<LimitCheckResult> {
  const session = providedSession || await getSession(request)
  if (!session) {
    return {
      allowed: false,
      limit: 0,
      current: count,
      message: '请先登录',
      upgradeHint: '登录后即可体验',
    }
  }

  const limits = getMembershipLimits(session.user.membershipPlan)
  const allowed = count < limits.watchlistLimit

  return {
    allowed,
    limit: limits.watchlistLimit,
    current: count,
    remaining: Math.max(0, limits.watchlistLimit - count),
    message: allowed
      ? `还可添加 ${limits.watchlistLimit - count} 只自选股`
      : `当前套餐最多添加${limits.watchlistLimit}只自选股`,
    upgradeHint: !allowed && session.user.membershipPlan !== 'ADVANCED' ? '升级套餐解锁更多名额' : null,
  }
}

export async function checkFeatureAccess(
  request: FastifyRequest,
  feature: 'deep_diagnosis' | 'data_export' | 'backtest' | 'push' | 'api_access'
): Promise<FeatureCheckResult> {
  const session = await getSession(request)
  if (!session) {
    return {
      allowed: false,
      message: '请先登录',
      upgradeHint: '登录后即可体验',
    }
  }

  const allowed = hasFeatureAccess(session.user.membershipPlan, feature)

  return {
    allowed,
    message: allowed ? '功能可用' : `当前套餐不支持此功能`,
    upgradeHint: !allowed && session.user.membershipPlan !== 'ADVANCED' ? '升级套餐解锁此功能' : null,
  }
}

export async function requireMembership(
  request: FastifyRequest,
  reply: FastifyReply,
  requiredPlans: string[]
): Promise<boolean> {
  const session = await getSession(request)
  
  if (!session) {
    reply.code(401).send({
      error: '请先登录',
      code: 'UNAUTHORIZED',
      redirectTo: '/login',
    })
    return false
  }

  if (!requiredPlans.includes(session.user.membershipPlan || '')) {
    reply.code(403).send({
      error: '当前套餐不支持此功能',
      code: 'FORBIDDEN',
      currentPlan: session.user.membershipPlan,
      requiredPlans,
      upgradeTo: '/pricing',
    })
    return false
  }

  return true
}

export async function enforceCandidateLimit(
  request: FastifyRequest,
  reply: FastifyReply,
  count: number
): Promise<boolean> {
  const result = await checkCandidateLimit(request, count)
  
  if (!result.allowed) {
    reply.code(result.current === 0 ? 401 : 403).send({
      error: result.message,
      code: result.current === 0 ? 'UNAUTHORIZED' : 'LIMIT_EXCEEDED',
      limit: result.limit,
      current: result.current,
      upgradeHint: result.upgradeHint,
      upgradeTo: '/pricing',
    })
    return false
  }
  
  return true
}

export async function enforceWatchlistLimit(
  request: FastifyRequest,
  reply: FastifyReply,
  count: number,
  providedSession?: any
): Promise<boolean> {
  const result = await checkWatchlistLimit(request, count, providedSession)
  
  if (!result.allowed) {
    reply.code(result.current === 0 ? 401 : 403).send({
      error: result.message,
      code: result.current === 0 ? 'UNAUTHORIZED' : 'LIMIT_EXCEEDED',
      limit: result.limit,
      current: result.current,
      upgradeHint: result.upgradeHint,
      upgradeTo: '/pricing',
    })
    return false
  }
  
  return true
}
