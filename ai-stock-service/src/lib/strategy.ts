import { prisma } from '../lib/prisma.js'
import type { Prisma } from '@prisma/client'

export interface StockStrategy {
  stockCode: string
  stockName: string
  sectorName?: string
  score: number
  signals: StrategySignal[]
}

export interface StrategySignal {
  type: 'technical' | 'fundamental' | 'flow' | 'sector'
  name: string
  value: number
  signal: 'buy' | 'hold' | 'sell'
  weight: number
}

/**
 * 技术指标策略
 * - 基于价格动量、成交量等
 */
export async function technicalStrategy(tradeDate: Date) {
  const bars = await prisma.marketDailyBar.findMany({
    where: { tradeDate },
    orderBy: { amount: 'desc' },
    take: 100,
  })

  const signals: StockStrategy[] = []

  for (const bar of bars) {
    const extraMetrics = bar.extraMetrics as { pct_chg?: number } | null
    const pctChange = extraMetrics?.pct_chg || 0

    // 动量评分（涨跌幅）
    const momentumScore = Math.min(100, Math.max(0, 50 + pctChange * 5))

    // 成交量评分（相对于平均）
    const volumeScore = 50 // TODO: 计算量比

    // 综合技术评分
    const totalScore = (momentumScore * 0.6 + volumeScore * 0.4)

    signals.push({
      stockCode: bar.stockCode,
      stockName: bar.stockName,
      sectorName: bar.sectorName,
      score: Number(totalScore.toFixed(2)),
      signals: [
        {
          type: 'technical',
          name: '动量指标',
          value: pctChange,
          signal: pctChange > 3 ? 'buy' : pctChange < -3 ? 'sell' : 'hold',
          weight: 0.6,
        },
        {
          type: 'technical',
          name: '成交量',
          value: volumeScore,
          signal: volumeScore > 60 ? 'buy' : 'hold',
          weight: 0.4,
        },
      ],
    })
  }

  return signals.sort((a, b) => b.score - a.score)
}

/**
 * 资金流向策略
 * - 基于主力资金净流入
 */
export async function fundFlowStrategy(tradeDate: Date) {
  const bars = await prisma.marketDailyBar.findMany({
    where: { tradeDate },
    orderBy: { amount: 'desc' },
    take: 100,
  })

  const signals: StockStrategy[] = []

  for (const bar of bars) {
    const extraMetrics = bar.extraMetrics as { mainNetInflow?: number } | null
    const inflow = extraMetrics?.mainNetInflow || 0

    // 资金流评分
    const flowScore = Math.min(100, Math.max(0, 50 + inflow / 10000000))

    signals.push({
      stockCode: bar.stockCode,
      stockName: bar.stockName,
      sectorName: bar.sectorName,
      score: Number(flowScore.toFixed(2)),
      signals: [
        {
          type: 'flow',
          name: '主力净流入',
          value: inflow,
          signal: inflow > 10000000 ? 'buy' : inflow < -10000000 ? 'sell' : 'hold',
          weight: 1.0,
        },
      ],
    })
  }

  return signals.sort((a, b) => b.score - a.score)
}

/**
 * 板块热度策略
 * - 基于行业板块整体表现
 */
export async function sectorHeatStrategy(tradeDate: Date) {
  const bars = await prisma.marketDailyBar.findMany({
    where: { tradeDate },
  })

  // 按板块分组计算平均涨幅
  const sectorMap = new Map<string, { total: number; count: number; stocks: string[] }>()

  for (const bar of bars) {
    if (!bar.sectorName) continue

    const existing = sectorMap.get(bar.sectorName)
    const extraMetrics = bar.extraMetrics as { pct_chg?: number } | null
    const pctChange = extraMetrics?.pct_chg || 0

    if (existing) {
      existing.total += pctChange
      existing.count++
      existing.stocks.push(bar.stockCode)
    } else {
      sectorMap.set(bar.sectorName, {
        total: pctChange,
        count: 1,
        stocks: [bar.stockCode],
      })
    }
  }

  // 计算板块热度
  const sectorScores: Array<{ sectorName: string; avgChange: number; stockCount: number }> = []

  for (const [sectorName, data] of sectorMap.entries()) {
    const avgChange = data.total / data.count
    sectorScores.push({
      sectorName,
      avgChange,
      stockCount: data.count,
    })
  }

  return sectorScores.sort((a, b) => b.avgChange - a.avgChange)
}

/**
 * 综合策略评分
 * - 加权多个策略结果
 */
export async function compositeStrategy(tradeDate: Date) {
  const [technical, fundFlow, sectorHeat] = await Promise.all([
    technicalStrategy(tradeDate),
    fundFlowStrategy(tradeDate),
    sectorHeatStrategy(tradeDate),
  ])

  // 创建板块热度映射
  const sectorHeatMap = new Map(
    sectorHeat.map(s => [s.sectorName, s.avgChange])
  )

  // 综合评分
  const composite = technical.map(tech => {
    const flow = fundFlow.find(f => f.stockCode === tech.stockCode)
    const sectorScore = tech.sectorName ? (sectorHeatMap.get(tech.sectorName) || 0) : 0

    // 加权计算
    const technicalWeight = 0.5
    const flowWeight = 0.3
    const sectorWeight = 0.2

    const totalScore =
      tech.score * technicalWeight +
      (flow?.score || 50) * flowWeight +
      (sectorScore * 10 + 50) * sectorWeight

    return {
      ...tech,
      score: Number(totalScore.toFixed(2)),
      signals: [
        ...tech.signals,
        ...(flow?.signals || []),
        {
          type: 'sector' as const,
          name: '板块热度',
          value: sectorScore,
          signal: sectorScore > 2 ? 'buy' as const : sectorScore < -2 ? 'sell' as const : 'hold' as const,
          weight: sectorWeight,
        },
      ],
    }
  })

  return composite.sort((a, b) => b.score - a.score)
}

/**
 * 保存候选信号到数据库
 */
export async function saveCandidateSignals(signals: StockStrategy[], strategyCode: string, versionTag: string) {
  const tradeDate = new Date()

  // 创建快照
  const snapshot = await prisma.candidatePoolSnapshot.create({
    data: {
      snapshotDate: tradeDate,
      strategyCode,
      versionTag,
      marketSummary: {
        provider: 'composite_strategy',
        totalCandidates: signals.length,
        avgScore: signals.reduce((sum, s) => sum + s.score, 0) / signals.length,
      },
    },
  })

  // 保存信号
  for (const signal of signals.slice(0, 10)) {
    await prisma.candidateSignal.create({
      data: {
        snapshotId: snapshot.id,
        stockCode: signal.stockCode,
        stockName: signal.stockName,
        sectorName: signal.sectorName,
        signalLevel: signal.score >= 75 ? '重点候选' : signal.score >= 60 ? '扩展观察' : '一般关注',
        score: new Prisma.Decimal(signal.score),
        riskScore: new Prisma.Decimal(100 - signal.score),
        holdingWindow: signal.score >= 75 ? '1-3D' : '2-5D',
        driverSummary: `${signal.stockName} 综合评分 ${signal.score}，${signal.signals.map(s => s.name).join('、')}表现良好。`,
        tags: signal.signals.map(s => s.name),
      },
    })
  }

  return { snapshotId: snapshot.id, count: signals.length }
}
