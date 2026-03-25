import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { createUserSession } from '../auth/auth.service.js'

const DEFAULT_USER_CODE = 'trial_user_a'

function asRecord(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string')
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function pickBadge(level: string) {
  if (level.includes('重点')) {
    return 'brand'
  }

  return 'accent'
}

function pickRiskLabel(riskScore: number | null) {
  if (riskScore === null) {
    return '中风险'
  }

  if (riskScore >= 35) {
    return '高波动'
  }

  if (riskScore >= 28) {
    return '中高风险'
  }

  return '中风险'
}

function getWatchBadge(index: number) {
  return index === 0 ? 'warn' : index === 1 ? 'brand' : 'accent'
}

function getWatchStatus(index: number) {
  if (index === 0) {
    return { status: '转弱预警', statusKey: 'warning' }
  }

  if (index === 1) {
    return { status: '继续观察', statusKey: 'watching' }
  }

  return { status: '结构转强', statusKey: 'stronger' }
}

function normalizeUserCode(userCode?: string) {
  return userCode?.trim() || DEFAULT_USER_CODE
}

function buildTrialUserCode() {
  return `trial_${Date.now().toString(36)}`
}

async function findUserByCode(userCode?: string) {
  return prisma.appUser.findUnique({
    where: { userCode: normalizeUserCode(userCode) },
  })
}

async function ensureUser(input: { userCode?: string; nickname?: string; mobile?: string }) {
  const requestedCode = input.userCode?.trim()
  const userCode = requestedCode || buildTrialUserCode()
  const existing = await prisma.appUser.findUnique({ where: { userCode } })

  if (existing) {
    return prisma.appUser.update({
      where: { id: existing.id },
      data: {
        nickname: input.nickname?.trim() || existing.nickname,
        mobile: input.mobile?.trim() || existing.mobile,
        lastLoginAt: new Date(),
      },
    })
  }

  return prisma.appUser.create({
    data: {
      userCode,
      nickname: input.nickname?.trim() || `用户${userCode.slice(-4)}`,
      mobile: input.mobile?.trim() || null,
      membershipPlan: 'TRIAL',
      status: 'TRIAL',
      lastLoginAt: new Date(),
    },
  })
}

function calcTrialDaysRemaining(createdAt: Date) {
  const diffDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, 14 - diffDays)
}

async function buildUserProfile(userCode?: string) {
  const user = await findUserByCode(userCode)

  if (!user) {
    return null
  }

  const [watchlistCount, recentPushCount, latestWatchlist] = await Promise.all([
    prisma.watchlistItem.count({ where: { userId: user.id } }),
    prisma.pushTask.count({ where: { userId: user.id } }),
    prisma.watchlistItem.findMany({
      where: { userId: user.id },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: 3,
    }),
  ])

  return {
    userCode: user.userCode,
    nickname: user.nickname || user.userCode,
    membershipPlan: user.membershipPlan || 'TRIAL',
    status: user.status,
    trialDaysRemaining: user.status === 'TRIAL' ? calcTrialDaysRemaining(user.createdAt) : 0,
    watchlistCount,
    diagnosisCount: await prisma.diagnosisSnapshot.count(),
    recentPushCount,
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
    nextActions: [
      watchlistCount === 0 ? '先把 1 到 2 只重点股票加入自选观察。' : '午后刷新一次自选状态，确认关键位是否失效。',
      recentPushCount === 0 ? '开启试用提醒，建立每天回看的理由。' : '对照最近触达内容，检查是否按提醒完成复盘。',
      user.status === 'TRIAL' ? '在试用期内至少完成 3 次诊股和 3 次复盘。' : '继续关注热点板块轮动，避免把工具当成直接交易指令。',
    ],
    recentActivities: latestWatchlist.map((item) => `${item.stockName}：${item.status}，${item.reason || '继续观察。'}`),
  }
}

async function buildUserProfileById(userId: bigint) {
  const user = await prisma.appUser.findUnique({ where: { id: userId } })

  if (!user) {
    return null
  }

  return buildUserProfile(user.userCode)
}

function toWatchItem(item: {
  stockCode: string
  stockName: string
  sectorName: string | null
  status: string
  statusKey: string
  reason: string | null
  advice: string | null
}, index: number) {
  return {
    name: item.stockName,
    code: item.stockCode,
    sector: item.sectorName || '未分类',
    status: item.status,
    statusKey: item.statusKey,
    reason: item.reason || '暂无说明',
    advice: item.advice || '继续观察关键位变化。',
    badge: getWatchBadge(index),
  }
}

async function getLatestCandidateSnapshot() {
  return prisma.candidatePoolSnapshot.findFirst({
    orderBy: [{ snapshotDate: 'desc' }, { id: 'desc' }],
    include: {
      candidateItems: {
        orderBy: [{ score: 'desc' }, { id: 'asc' }],
      },
    },
  })
}

async function getLatestDiagnoses() {
  const rows = await prisma.diagnosisSnapshot.findMany({
    orderBy: [{ tradeDate: 'desc' }, { id: 'desc' }],
  })

  const byCode = new Map<string, (typeof rows)[number]>()
  for (const row of rows) {
    if (!byCode.has(row.stockCode)) {
      byCode.set(row.stockCode, row)
    }
  }

  return byCode
}

export async function getWebDemoData() {
  const [hotSectorSnapshot, latestCandidateSnapshot, latestReview, latestDiagnoses, latestBars, watchlistRows] = await Promise.all([
    prisma.sourceSnapshot.findFirst({
      where: { sourceCode: 'akshare-hot-sector' },
      orderBy: [{ snapshotDate: 'desc' }, { id: 'desc' }],
    }),
    getLatestCandidateSnapshot(),
    prisma.reviewSnapshot.findFirst({
      orderBy: [{ reviewDate: 'desc' }, { id: 'desc' }],
    }),
    getLatestDiagnoses(),
    prisma.marketDailyBar.findMany({
      orderBy: [{ tradeDate: 'desc' }, { amount: 'desc' }],
      take: 10,
    }),
    prisma.watchlistItem.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      take: 10,
    }),
  ])

  const hotSectorPayload = asRecord(hotSectorSnapshot?.payload)
  const marketSummary = asRecord(latestCandidateSnapshot?.marketSummary)
  const reviewPayload = asRecord(latestReview?.detailPayload)
  const candidateItems = latestCandidateSnapshot?.candidateItems ?? []

  const sectorMap = new Map<string, { count: number; amount: number }>()
  for (const bar of latestBars) {
    if (!bar.sectorName) {
      continue
    }

    const current = sectorMap.get(bar.sectorName) ?? { count: 0, amount: 0 }
    sectorMap.set(bar.sectorName, {
      count: current.count + 1,
      amount: current.amount + Number(bar.amount ?? 0),
    })
  }

  const sectors = Array.from(sectorMap.entries())
    .sort((left, right) => right[1].amount - left[1].amount)
    .slice(0, 3)
    .map(([name, metrics], index) => ({
      name,
      status: index === 0 ? '持续强势' : '分歧中偏强',
      reason: `${name} 当前有 ${metrics.count} 只样本股进入快照，资金关注仍集中。`,
      risk: index === 0 ? '高位股波动放大，追高容错率下降。' : '板块轮动较快，需观察后续承接。',
      badge: index === 0 ? 'brand' : 'accent',
    }))

  const candidates = candidateItems.map((candidate) => {
    const diagnosis = latestDiagnoses.get(candidate.stockCode)
    const summary = asRecord(diagnosis?.summary)
    const factors = asRecord(diagnosis?.factors)
    const signalTags = asStringArray(candidate.tags)

    return {
      code: candidate.stockCode,
      name: candidate.stockName,
      sector: candidate.sectorName || '未分类',
      level: candidate.signalLevel,
      riskLevel: pickRiskLabel(candidate.riskScore ? Number(candidate.riskScore) : null),
      summary: candidate.driverSummary || readString(summary.summary, '暂无摘要'),
      reasons: asStringArray(factors.reasons).length > 0 ? asStringArray(factors.reasons) : signalTags,
      observe: readString(summary.observe, '待补充'),
      support: readString(summary.support, '待补充'),
      pressure: readString(summary.pressure, '待补充'),
      stopLoss: readString(summary.stopLoss, '待补充'),
      invalid: readString(summary.action, '若趋势破坏则失效。'),
      risks: asStringArray(factors.risks),
      style: pickBadge(candidate.signalLevel),
    }
  })

  const diagnoses = Object.fromEntries(
    Array.from(latestDiagnoses.entries()).map(([code, diagnosis]) => {
      const summary = asRecord(diagnosis.summary)
      const factors = asRecord(diagnosis.factors)

      return [
        code,
        {
          name: readString(summary.name, code),
          code,
          sector: readString(summary.sector, '未分类'),
          summary: readString(summary.summary, '暂无摘要'),
          trend: diagnosis.trendLabel || '待判断',
          strength: diagnosis.biasLabel || '待判断',
          observe: readString(summary.observe, '待补充'),
          support: readString(summary.support, '待补充'),
          pressure: readString(summary.pressure, '待补充'),
          stopLoss: readString(summary.stopLoss, '待补充'),
          reasons: asStringArray(factors.reasons),
          risks: asStringArray(factors.risks),
          action: readString(summary.action, '保持观察。'),
        },
      ]
    }),
  )

  const watchlist = (watchlistRows.length > 0 ? watchlistRows : candidates.slice(0, 3).map((candidate, index) => ({
    stockCode: candidate.code,
    stockName: candidate.name,
    sectorName: candidate.sector,
    status: getWatchStatus(index).status,
    statusKey: getWatchStatus(index).statusKey,
    reason: candidate.summary,
    advice: '继续观察关键位变化。',
    sortOrder: index,
  }))).map((item, index) => ({
    name: item.stockName,
    code: item.stockCode,
    sector: item.sectorName || '未分类',
    status: item.status,
    statusKey: item.statusKey,
    reason: item.reason || '暂无说明',
    advice: item.advice || '继续观察关键位变化。',
    badge: getWatchBadge(index),
  }))

  const candidateReview = (reviewPayload.candidateReview as Array<Record<string, unknown>> | undefined)?.map((item, index) => ({
    name: readString(item.name, `候选 ${index + 1}`),
    result: readString(item.result, '观察中'),
    note: readString(item.note, '暂无说明'),
    badge: index === 0 ? 'brand' : index === 1 ? 'warn' : 'accent',
  })) ?? []

  return {
    marketSummary: readString(
      marketSummary.marketSummary,
      '市场短线情绪仍偏活跃，重点关注热点板块内的强势候选。',
    ),
    marketTemperature: readString(hotSectorPayload.marketTemperature, '中高'),
    marketTags: sectors.slice(0, 2).map((sector) => `重点方向：${sector.name}`).concat(['主要风险：高位分歧']),
    sectors,
    candidates,
    diagnoses,
    watchlist,
    review: {
      summary: readString(reviewPayload.summary, '今日热点板块维持活跃，需继续关注分歧扩散。'),
      candidateReview,
      risks: asStringArray(reviewPayload.risks),
      nextFocus: readString(reviewPayload.nextFocus, '继续跟踪热点板块承接与候选池强弱变化。'),
    },
  }
}

export async function getMarketOverview() {
  const [snapshot, bars] = await Promise.all([
    prisma.sourceSnapshot.findFirst({
      where: { sourceCode: 'akshare-hot-sector' },
      orderBy: [{ snapshotDate: 'desc' }, { id: 'desc' }],
    }),
    prisma.marketDailyBar.findMany({
      orderBy: [{ tradeDate: 'desc' }, { amount: 'desc' }],
      take: 10,
    }),
  ])

  const payload = asRecord(snapshot?.payload)
  const grouped = new Map<string, { heat: number; changeRate: number }>()

  for (const bar of bars) {
    if (!bar.sectorName) {
      continue
    }

    const current = grouped.get(bar.sectorName) ?? { heat: 70, changeRate: 0 }
    grouped.set(bar.sectorName, {
      heat: Math.min(99, current.heat + 8),
      changeRate: current.changeRate + Number(asRecord(bar.extraMetrics).changeRate ?? 0),
    })
  }

  return {
    tradeDate: snapshot?.snapshotDate.toISOString().slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    hotSectors: Array.from(grouped.entries()).slice(0, 3).map(([name, metrics]) => ({
      name,
      heat: metrics.heat,
      changeRate: Number((metrics.changeRate || 0).toFixed(2)),
    })),
    riskFlags: ['高位分歧加剧', '题材轮动速度快', ...asStringArray(payload.sectors).map((sector) => `${sector} 仍处热点范围`)].slice(0, 3),
    strategyFocus: '只看热点板块内的强势股，控制持有窗口在 1-3 天。',
  }
}

export async function getMarketHome() {
  const demoData = await getWebDemoData()

  return {
    marketSummary: demoData.marketSummary,
    marketTemperature: demoData.marketTemperature,
    marketTags: demoData.marketTags,
    sectors: demoData.sectors,
    focusCandidateCount: demoData.candidates.filter((item) => item.level === '重点候选').length,
  }
}

export async function getCandidateList() {
  const snapshot = await getLatestCandidateSnapshot()

  return (snapshot?.candidateItems ?? []).map((candidate) => ({
    stockCode: candidate.stockCode,
    stockName: candidate.stockName,
    sectorName: candidate.sectorName,
    signalLevel: candidate.signalLevel,
    score: Number(candidate.score),
    riskScore: candidate.riskScore ? Number(candidate.riskScore) : null,
    driverSummary: candidate.driverSummary,
  }))
}

export async function getCandidateDetails() {
  const demoData = await getWebDemoData()

  return demoData.candidates
}

export async function getDiagnosisList(keyword?: string) {
  const demoData = await getWebDemoData()
  const diagnoses = Object.values(demoData.diagnoses)
  const normalizedKeyword = keyword?.trim()

  if (!normalizedKeyword) {
    return diagnoses
  }

  return diagnoses.filter(
    (item) =>
      item.name.includes(normalizedKeyword) ||
      item.code.includes(normalizedKeyword) ||
      item.sector.includes(normalizedKeyword),
  )
}

export async function getLatestReview() {
  const demoData = await getWebDemoData()

  return demoData.review
}

export async function getWatchlistItems(userId: bigint) {
  const rows = await prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  })

  return rows.map((item, index) => toWatchItem(item, index))
}

export async function upsertWatchlistItem(input: {
  userId: bigint
  stockCode: string
  stockName: string
  sectorName?: string
  reason?: string
  advice?: string
  status?: string
  statusKey?: string
}) {
  const existing = await prisma.watchlistItem.findFirst({
    where: {
      userId: input.userId,
      stockCode: input.stockCode,
    },
  })

  const total = await prisma.watchlistItem.count({ where: { userId: input.userId } })
  const fallbackStatus = total % 3 === 0 ? '继续观察' : total % 3 === 1 ? '转弱预警' : '结构转强'
  const fallbackStatusKey = total % 3 === 0 ? 'watching' : total % 3 === 1 ? 'warning' : 'stronger'

  const row = existing
    ? await prisma.watchlistItem.update({
        where: { id: existing.id },
        data: {
          stockName: input.stockName,
          sectorName: input.sectorName,
          status: input.status || existing.status,
          statusKey: input.statusKey || existing.statusKey,
          reason: input.reason || existing.reason,
          advice: input.advice || existing.advice,
        },
      })
    : await prisma.watchlistItem.create({
        data: {
          userId: input.userId,
          stockCode: input.stockCode,
          stockName: input.stockName,
          sectorName: input.sectorName,
          status: input.status || fallbackStatus,
          statusKey: input.statusKey || fallbackStatusKey,
          reason: input.reason || '新加入观察列表，等待后续承接确认。',
          advice: input.advice || '先观察关键位与量能变化。',
          sortOrder: total + 1,
        },
      })

  return toWatchItem(row, 0)
}

export async function updateWatchlistItem(input: {
  userId: bigint
  stockCode: string
  status?: string
  statusKey?: string
  reason?: string
  advice?: string
  sortOrder?: number
}) {
  const existing = await prisma.watchlistItem.findFirst({
    where: {
      userId: input.userId,
      stockCode: input.stockCode,
    },
  })

  if (!existing) {
    return null
  }

  const updated = await prisma.watchlistItem.update({
    where: { id: existing.id },
    data: {
      status: input.status || existing.status,
      statusKey: input.statusKey || existing.statusKey,
      reason: input.reason || existing.reason,
      advice: input.advice || existing.advice,
      sortOrder: input.sortOrder ?? existing.sortOrder,
    },
  })

  return toWatchItem(updated, 0)
}

export async function deleteWatchlistItem(stockCode: string, userId: bigint) {
  const existing = await prisma.watchlistItem.findFirst({
    where: {
      userId,
      stockCode,
    },
  })

  if (!existing) {
    return { removed: false }
  }

  await prisma.watchlistItem.delete({ where: { id: existing.id } })

  return { removed: true }
}

export async function loginTrialUser(input: { userCode?: string; nickname?: string; mobile?: string }) {
  const user = await ensureUser(input)
  const profile = await buildUserProfile(user.userCode)

  if (!profile) {
    throw new Error('用户初始化失败')
  }

  return {
    profile,
    ...(await createUserSession(user.id)),
  }
}

export async function getUserProfile(userId: bigint) {
  const profile = await buildUserProfileById(userId)

  if (!profile) {
    return null
  }

  return profile
}