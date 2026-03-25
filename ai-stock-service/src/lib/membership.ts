import { Prisma } from '@prisma/client'
import { prisma } from './prisma.js'

export type MembershipPlan = 'TRIAL' | 'OBSERVER' | 'STANDARD' | 'ADVANCED'

export interface MembershipConfig {
  plan: MembershipPlan
  name: string
  price: number
  period: 'day' | 'month' | 'year'
  features: MembershipFeatures
}

export interface MembershipFeatures {
  dailyCandidates: number
  watchlistLimit: number
  diagnosisDepth: 'basic' | 'standard' | 'deep'
  pushNotifications: boolean
  dataExport: boolean
  strategyBacktest: boolean
  apiAccess: boolean
  customerSupport: 'none' | 'email' | 'priority' | 'dedicated'
}

export const MEMBERSHIP_PLANS: MembershipConfig[] = [
  {
    plan: 'TRIAL',
    name: '试用版',
    price: 0,
    period: 'day',
    features: {
      dailyCandidates: 3,
      watchlistLimit: 10,
      diagnosisDepth: 'standard',
      pushNotifications: false,
      dataExport: false,
      strategyBacktest: false,
      apiAccess: false,
      customerSupport: 'none',
    },
  },
  {
    plan: 'OBSERVER',
    name: '观察版',
    price: 99,
    period: 'month',
    features: {
      dailyCandidates: 5,
      watchlistLimit: 50,
      diagnosisDepth: 'standard',
      pushNotifications: false,
      dataExport: true,
      strategyBacktest: false,
      apiAccess: false,
      customerSupport: 'email',
    },
  },
  {
    plan: 'STANDARD',
    name: '标准版',
    price: 299,
    period: 'month',
    features: {
      dailyCandidates: 10,
      watchlistLimit: 200,
      diagnosisDepth: 'deep',
      pushNotifications: true,
      dataExport: true,
      strategyBacktest: true,
      apiAccess: false,
      customerSupport: 'priority',
    },
  },
  {
    plan: 'ADVANCED',
    name: '进阶版',
    price: 999,
    period: 'month',
    features: {
      dailyCandidates: 999,
      watchlistLimit: 999,
      diagnosisDepth: 'deep',
      pushNotifications: true,
      dataExport: true,
      strategyBacktest: true,
      apiAccess: true,
      customerSupport: 'dedicated',
    },
  },
]

export function getMembershipPlan(plan: MembershipPlan | null | undefined): MembershipConfig {
  return MEMBERSHIP_PLANS.find(p => p.plan === plan) || MEMBERSHIP_PLANS[0]
}

export function checkFeatureLimit(
  plan: MembershipPlan | null | undefined,
  feature: keyof MembershipFeatures,
  value?: number,
): { allowed: boolean; limit?: number; message?: string } {
  const config = getMembershipPlan(plan)

  switch (feature) {
    case 'dailyCandidates':
      const candidateLimit = config.features.dailyCandidates
      if (value !== undefined && value >= candidateLimit) {
        return {
          allowed: false,
          limit: candidateLimit,
          message: `当前套餐每日仅可查看${candidateLimit}只候选股票，升级后可查看更多。`,
        }
      }
      return { allowed: true, limit: candidateLimit }

    case 'watchlistLimit':
      const watchlistLimit = config.features.watchlistLimit
      if (value !== undefined && value >= watchlistLimit) {
        return {
          allowed: false,
          limit: watchlistLimit,
          message: `当前套餐最多添加${watchlistLimit}只自选股，升级后可添加更多。`,
        }
      }
      return { allowed: true, limit: watchlistLimit }

    default:
      return { allowed: true }
  }
}

export async function upgradeMembership(
  userId: bigint,
  newPlan: MembershipPlan,
  paymentId?: string,
) {
  const user = await prisma.appUser.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error('用户不存在')
  }

  const now = new Date()
  let expiresAt: Date | null = null

  if (newPlan !== 'TRIAL') {
    // 计算到期时间（按月）
    expiresAt = new Date(now)
    expiresAt.setMonth(expiresAt.getMonth() + 1)
  }

  const updated = await prisma.appUser.update({
    where: { id: userId },
    data: {
      membershipPlan: newPlan,
      status: newPlan === 'TRIAL' ? 'TRIAL' : 'ACTIVE',
      trialExpiresAt: expiresAt,
    },
  })

  // 记录订阅历史
  if (paymentId) {
    await prisma.pushTask.create({
      data: {
        userId,
        channel: 'APP',
        templateCode: 'subscription_upgrade',
        payload: {
          fromPlan: user.membershipPlan,
          toPlan: newPlan,
          paymentId,
          upgradedAt: now.toISOString(),
        },
      },
    })
  }

  return {
    userId: updated.id,
    newPlan,
    expiresAt,
  }
}

export async function getMembershipStats(userId: bigint) {
  const user = await prisma.appUser.findUnique({
    where: { id: userId },
    select: {
      membershipPlan: true,
      trialExpiresAt: true,
      createdAt: true,
    },
  })

  if (!user) {
    return null
  }

  const plan = getMembershipPlan(user.membershipPlan)
  const isTrial = user.membershipPlan === 'TRIAL'
  const expiresAt = isTrial ? user.trialExpiresAt : user.trialExpiresAt

  return {
    plan: user.membershipPlan,
    planName: plan.name,
    isTrial,
    trialDaysRemaining: expiresAt
      ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0,
    expiresAt,
    features: plan.features,
  }
}
