import { Prisma } from '@prisma/client'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { Job, Worker } from 'bullmq'
import { getWorkerConnectionOptions } from '../lib/queue.js'
import { prisma } from '../lib/prisma.js'

type WorkerPayload = {
  jobRunId: string
  payload: Record<string, unknown>
}

type EastmoneyItem = Record<string, unknown>

const execFileAsync = promisify(execFile)

function getTradeDate() {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

function asNumber(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function toPrice(value: unknown) {
  const parsed = asNumber(value)
  return parsed === null ? null : (parsed / 100).toFixed(4)
}

function toPercent(value: unknown) {
  const parsed = asNumber(value)
  return parsed === null ? null : Number((parsed / 100).toFixed(2))
}

async function fetchEastmoneyList(url: string) {
  const { stdout } = await execFileAsync('curl', [
    '--max-time',
    '12',
    '--retry',
    '2',
    '--retry-delay',
    '1',
    '-H',
    'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    '-H',
    'Referer: https://quote.eastmoney.com/',
    '-H',
    'Accept: application/json,text/plain,*/*',
    '-sS',
    url,
  ], {
    maxBuffer: 1024 * 1024 * 4,
  })

  const payload = JSON.parse(stdout) as {
    data?: {
      diff?: Record<string, EastmoneyItem> | EastmoneyItem[]
    }
  }

  const diff = payload.data?.diff
  if (!diff) {
    return [] as EastmoneyItem[]
  }

  return Array.isArray(diff) ? diff : Object.values(diff)
}

async function runMarketFetch() {
  const tradeDate = getTradeDate()
  const [boards, stocks] = await Promise.all([
    fetchEastmoneyList('https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=10&fid=f62&fs=m:90+t:2&fields=f12,f14,f2,f3,f62'),
    fetchEastmoneyList('https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=30&fid=f62&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f12,f14,f2,f3,f6,f62'),
  ])

  await prisma.sourceSnapshot.upsert({
    where: {
      sourceCode_snapshotDate: {
        sourceCode: 'akshare-hot-sector',
        snapshotDate: tradeDate,
      },
    },
    update: {
      payload: {
        provider: 'eastmoney',
        fetchedAt: new Date().toISOString(),
        sectors: boards.map((item) => ({
          sectorCode: String(item.f12 ?? ''),
          sectorName: String(item.f14 ?? ''),
          latestPrice: toPrice(item.f2),
          changeRate: toPercent(item.f3),
          mainNetInflow: asNumber(item.f62),
        })),
        marketTemperature: boards.length >= 3 ? '中高' : '中性',
      } as Prisma.InputJsonValue,
      checksum: `eastmoney-${tradeDate.toISOString().slice(0, 10)}`,
    },
    create: {
      sourceCode: 'akshare-hot-sector',
      snapshotDate: tradeDate,
      payload: {
        provider: 'eastmoney',
        fetchedAt: new Date().toISOString(),
        sectors: boards.map((item) => ({
          sectorCode: String(item.f12 ?? ''),
          sectorName: String(item.f14 ?? ''),
          latestPrice: toPrice(item.f2),
          changeRate: toPercent(item.f3),
          mainNetInflow: asNumber(item.f62),
        })),
        marketTemperature: boards.length >= 3 ? '中高' : '中性',
      } as Prisma.InputJsonValue,
      checksum: `eastmoney-${tradeDate.toISOString().slice(0, 10)}`,
    },
  })

  for (const item of stocks) {
    const stockCode = String(item.f12 ?? '')
    if (!stockCode) {
      continue
    }

    await prisma.marketDailyBar.upsert({
      where: {
        tradeDate_stockCode: {
          tradeDate,
          stockCode,
        },
      },
      update: {
        stockName: String(item.f14 ?? stockCode),
        closePrice: toPrice(item.f2),
        amount: asNumber(item.f6) === null ? null : new Prisma.Decimal(asNumber(item.f6) ?? 0),
        extraMetrics: {
          provider: 'eastmoney',
          changeRate: toPercent(item.f3),
          mainNetInflow: asNumber(item.f62),
        } as Prisma.InputJsonValue,
      },
      create: {
        tradeDate,
        stockCode,
        stockName: String(item.f14 ?? stockCode),
        closePrice: toPrice(item.f2),
        amount: asNumber(item.f6) === null ? null : new Prisma.Decimal(asNumber(item.f6) ?? 0),
        extraMetrics: {
          provider: 'eastmoney',
          changeRate: toPercent(item.f3),
          mainNetInflow: asNumber(item.f62),
        } as Prisma.InputJsonValue,
      },
    })
  }

  return {
    summary: `真实抓取完成：板块 ${boards.length} 条，股票 ${stocks.length} 条`,
    payload: {
      provider: 'eastmoney',
      boardCount: boards.length,
      stockCount: stocks.length,
      tradeDate: tradeDate.toISOString().slice(0, 10),
      topBoards: boards.slice(0, 5).map((item) => ({
        code: item.f12,
        name: item.f14,
        changeRate: toPercent(item.f3),
      })),
    },
  }
}

function readChangeRate(extraMetrics: Prisma.JsonValue | null | undefined) {
  if (!extraMetrics || typeof extraMetrics !== 'object' || Array.isArray(extraMetrics)) {
    return 0
  }

  const value = (extraMetrics as Record<string, unknown>).changeRate
  return asNumber(value) ?? 0
}

async function runMarketAnalyze() {
  const tradeDate = getTradeDate()
  const bars = await prisma.marketDailyBar.findMany({
    where: { tradeDate },
    orderBy: [{ amount: 'desc' }, { id: 'asc' }],
    take: 6,
  })

  if (bars.length === 0) {
    throw new Error('no market bars for analyze job')
  }

  const candidateSnapshot = await prisma.candidatePoolSnapshot.create({
    data: {
      snapshotDate: tradeDate,
      strategyCode: 'hot-sector-short-cycle',
      versionTag: `live-${Date.now()}`,
      marketSummary: {
        provider: 'eastmoney',
        marketSummary: `按实时成交额筛选出 ${bars.length} 只高关注股票，供短线观察。`,
        marketTemperature: '中高',
      },
      candidateItems: {
        create: bars.slice(0, 4).map((bar, index) => {
          const changeRate = readChangeRate(bar.extraMetrics)
          const amount = Number(bar.amount ?? 0)
          const score = Math.max(60, Math.min(95, 70 + changeRate * 2 + index * -2 + Math.min(amount / 1000000000, 10)))
          const riskScore = Math.max(15, Math.min(55, Math.abs(changeRate) * 4 + 18))

          return {
            stockCode: bar.stockCode,
            stockName: bar.stockName,
            sectorName: bar.sectorName,
            signalLevel: index < 2 ? '重点候选' : '扩展观察',
            score: new Prisma.Decimal(score.toFixed(2)),
            riskScore: new Prisma.Decimal(riskScore.toFixed(2)),
            holdingWindow: index < 2 ? '1-3D' : '2-5D',
            driverSummary: `${bar.stockName} 当前成交额 ${(amount / 100000000).toFixed(2)} 亿，涨跌幅 ${changeRate.toFixed(2)}%。`,
            tags: ['真实行情', '成交额排序', index < 2 ? '重点候选' : '扩展观察'],
          }
        }),
      },
    },
    include: { candidateItems: true },
  })

  for (const item of candidateSnapshot.candidateItems.slice(0, 4)) {
    const changeRate = item.stockCode ? readChangeRate((await prisma.marketDailyBar.findUnique({
      where: { tradeDate_stockCode: { tradeDate, stockCode: item.stockCode } },
      select: { extraMetrics: true },
    }))?.extraMetrics) : 0

    await prisma.diagnosisSnapshot.create({
      data: {
        stockCode: item.stockCode,
        tradeDate,
        versionTag: candidateSnapshot.versionTag,
        totalScore: item.score,
        biasLabel: item.signalLevel === '重点候选' ? '观察优先' : '次级关注',
        trendLabel: changeRate >= 0 ? '上升趋势' : '震荡偏弱',
        riskLabel: Number(item.riskScore ?? 0) >= 35 ? '高波动' : '中风险',
        summary: {
          name: item.stockName,
          sector: item.sectorName || '未分类',
          summary: item.driverSummary || '基于真实行情自动生成观察结论。',
          observe: '盘中跟踪成交与承接变化',
          support: '待盘后补充',
          pressure: '待盘后补充',
          stopLoss: '若量价明显走弱则停止观察',
          action: item.signalLevel === '重点候选' ? '优先观察，不追高。' : '作为扩展观察。',
        } as Prisma.InputJsonValue,
        factors: {
          reasons: ['真实行情成交额居前。', `当前涨跌幅 ${changeRate.toFixed(2)}%。`, '已进入短线观察列表。'],
          risks: ['未接入更细粒度盘口数据。', '当前仍属于公开行情粗筛，不构成交易建议。'],
        } as Prisma.InputJsonValue,
      },
    })
  }

  return {
    summary: `真实分析完成：候选 ${candidateSnapshot.candidateItems.length} 只`,
    payload: {
      provider: 'eastmoney',
      snapshotId: candidateSnapshot.id.toString(),
      candidateCount: candidateSnapshot.candidateItems.length,
      versionTag: candidateSnapshot.versionTag,
    },
  }
}

async function markStarted(jobRunId: string) {
  await prisma.jobRun.update({
    where: { id: BigInt(jobRunId) },
    data: {
      status: 'RUNNING',
      startedAt: new Date(),
      resultSummary: 'worker 已接单，正在执行',
    },
  })
}

async function markFinished(jobRunId: string, summary: string, payload: Record<string, unknown>) {
  const started = await prisma.jobRun.findUnique({
    where: { id: BigInt(jobRunId) },
    select: { startedAt: true },
  })

  const finishedAt = new Date()
  await prisma.jobRun.update({
    where: { id: BigInt(jobRunId) },
    data: {
      status: 'SUCCESS',
      finishedAt,
      durationMs: started?.startedAt ? finishedAt.getTime() - started.startedAt.getTime() : null,
      resultSummary: summary,
      payload: payload as Prisma.InputJsonValue,
    },
  })
}

async function markFailed(jobRunId: string, error: unknown) {
  await prisma.jobRun.update({
    where: { id: BigInt(jobRunId) },
    data: {
      status: 'FAILED',
      finishedAt: new Date(),
      errorMessage: error instanceof Error ? error.message : 'unknown worker error',
    },
  })
}

async function handleJob(queueName: string, job: Job<WorkerPayload>) {
  const { jobRunId, payload } = job.data
  await markStarted(jobRunId)

  if (queueName === 'market-fetch') {
    const result = await runMarketFetch()
    await markFinished(jobRunId, result.summary, {
      ...payload,
      queueName,
      workerProcessedAt: new Date().toISOString(),
      ...result.payload,
    })
    return
  }

  if (queueName === 'market-analyze') {
    const result = await runMarketAnalyze()
    await markFinished(jobRunId, result.summary, {
      ...payload,
      queueName,
      workerProcessedAt: new Date().toISOString(),
      ...result.payload,
    })
    return
  }

  await new Promise((resolve) => setTimeout(resolve, 400))

  await markFinished(jobRunId, '已完成用户触达任务', {
    ...payload,
    queueName,
    workerProcessedAt: new Date().toISOString(),
  })
}

function buildWorker(queueName: string) {
  return new Worker<WorkerPayload>(
    queueName,
    async (job) => {
      try {
        await handleJob(queueName, job)
      } catch (error) {
        await markFailed(job.data.jobRunId, error)
        throw error
      }
    },
    {
      connection: getWorkerConnectionOptions(),
    },
  )
}

const workers = ['market-fetch', 'market-analyze', 'user-push'].map(buildWorker)

for (const worker of workers) {
  worker.on('completed', (job) => {
    console.log(`[worker] completed ${worker.name} job=${job.id}`)
  })

  worker.on('failed', (job, error) => {
    console.error(`[worker] failed ${worker.name} job=${job?.id ?? 'unknown'} error=${error.message}`)
  })
}

async function shutdown() {
  await Promise.all(workers.map((worker) => worker.close()))
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', () => {
  void shutdown()
})

process.on('SIGTERM', () => {
  void shutdown()
})

console.log('[worker] demo workers started for market-fetch / market-analyze / user-push')