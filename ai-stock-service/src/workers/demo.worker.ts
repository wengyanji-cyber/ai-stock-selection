import { Prisma } from '@prisma/client'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { Job, Worker } from 'bullmq'
import { getWorkerConnectionOptions } from '../lib/queue.js'
import { prisma } from '../lib/prisma.js'
import { demoBoardFallback, demoStockFallback, representativeSinaStocks, type MarketBoardSnapshot, type MarketStockSnapshot } from './market.fixtures.js'

type WorkerPayload = {
  jobRunId: string
  payload: Record<string, unknown>
}

type EastmoneyItem = Record<string, unknown>

type MarketFetchResult = {
  provider: string
  sourceMode: 'live' | 'fallback'
  boards: MarketBoardSnapshot[]
  stocks: MarketStockSnapshot[]
  notes: string[]
}

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

function toFixedNumber(value: number, digits = 2) {
  return Number(value.toFixed(digits))
}

function toPriceDecimal(value: number | null) {
  return value === null ? null : new Prisma.Decimal(value.toFixed(4))
}

function toAmountDecimal(value: number | null) {
  return value === null ? null : new Prisma.Decimal(value.toFixed(2))
}

function buildChecksum(provider: string, tradeDate: Date, sourceMode: 'live' | 'fallback') {
  return `${provider}-${sourceMode}-${tradeDate.toISOString().slice(0, 10)}`
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

async function fetchSinaMarketSnapshot() {
  const symbols = representativeSinaStocks
    .map((item) => item.symbol)
    .filter((item): item is string => Boolean(item))

  const { stdout } = await execFileAsync('curl', [
    '--max-time',
    '12',
    '--retry',
    '2',
    '--retry-delay',
    '1',
    '-H',
    'Referer: https://finance.sina.com.cn/',
    '-H',
    'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    '-sS',
    `https://hq.sinajs.cn/list=${symbols.join(',')}`,
  ], {
    maxBuffer: 1024 * 1024 * 2,
  })

  const symbolMap = new Map(representativeSinaStocks.map((item) => [item.symbol, item]))
  const stocks: MarketStockSnapshot[] = []

  for (const rawLine of stdout.split('\n')) {
    const line = rawLine.trim()
    if (!line) {
      continue
    }

    const matched = line.match(/^var\s+hq_str_(\w+)="(.*)";$/)
    if (!matched) {
      continue
    }

    const symbol = matched[1]
    const seed = symbolMap.get(symbol)
    if (!seed) {
      continue
    }

    const fields = matched[2].split(',')
    const stockName = (fields[0] || seed.stockName).trim()
    const openPrice = asNumber(fields[1])
    const prevClose = asNumber(fields[2])
    const closePrice = asNumber(fields[3])
    const highPrice = asNumber(fields[4])
    const lowPrice = asNumber(fields[5])
    const amount = asNumber(fields[9])
    const changeRate = prevClose && closePrice ? toFixedNumber(((closePrice - prevClose) / prevClose) * 100) : null

    if (!closePrice) {
      continue
    }

    stocks.push({
      ...seed,
      stockName,
      openPrice,
      closePrice,
      highPrice,
      lowPrice,
      amount,
      changeRate,
      mainNetInflow: null,
    })
  }

  if (stocks.length === 0) {
    throw new Error('sina-hq returned no usable stock quotes')
  }

  const groups = new Map<string, MarketBoardSnapshot & { sampleCount: number }>()
  for (const stock of stocks) {
    const current = groups.get(stock.sectorCode) ?? {
      sectorCode: stock.sectorCode,
      sectorName: stock.sectorName,
      latestPrice: 0,
      changeRate: 0,
      mainNetInflow: 0,
      sampleCount: 0,
    }

    current.latestPrice = (current.latestPrice ?? 0) + (stock.closePrice ?? 0)
    current.changeRate = (current.changeRate ?? 0) + (stock.changeRate ?? 0)
    current.mainNetInflow = (current.mainNetInflow ?? 0) + (stock.amount ?? 0)
    current.sampleCount += 1
    groups.set(stock.sectorCode, current)
  }

  const boards = Array.from(groups.values())
    .map((item) => ({
      sectorCode: item.sectorCode,
      sectorName: item.sectorName,
      latestPrice: item.sampleCount > 0 ? toFixedNumber((item.latestPrice ?? 0) / item.sampleCount) : null,
      changeRate: item.sampleCount > 0 ? toFixedNumber((item.changeRate ?? 0) / item.sampleCount) : null,
      mainNetInflow: item.mainNetInflow,
    }))
    .sort((left, right) => (right.changeRate ?? 0) - (left.changeRate ?? 0))

  return { boards, stocks }
}

function buildDemoMarketSnapshot() {
  return {
    boards: demoBoardFallback.map((item) => ({ ...item })),
    stocks: demoStockFallback.map((item) => ({ ...item })),
  }
}

async function resolveMarketSnapshot(): Promise<MarketFetchResult> {
  const notes: string[] = []

  try {
    const [boards, stocks] = await Promise.all([
      fetchEastmoneyList('https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=10&fid=f62&fs=m:90+t:2&fields=f12,f14,f2,f3,f62'),
      fetchEastmoneyList('https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=30&fid=f62&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f12,f14,f2,f3,f6,f62'),
    ])

    if (boards.length > 0 && stocks.length > 0) {
      return {
        provider: 'eastmoney',
        sourceMode: 'live',
        notes,
        boards: boards.map((item) => ({
          sectorCode: String(item.f12 ?? ''),
          sectorName: String(item.f14 ?? ''),
          latestPrice: asNumber(item.f2) === null ? null : Number(((asNumber(item.f2) ?? 0) / 100).toFixed(2)),
          changeRate: toPercent(item.f3),
          mainNetInflow: asNumber(item.f62),
        })),
        stocks: stocks
          .map((item) => ({
            stockCode: String(item.f12 ?? ''),
            stockName: String(item.f14 ?? ''),
            sectorCode: 'UNKNOWN',
            sectorName: '实时样本',
            openPrice: null,
            closePrice: asNumber(item.f2) === null ? null : Number(((asNumber(item.f2) ?? 0) / 100).toFixed(4)),
            highPrice: null,
            lowPrice: null,
            amount: asNumber(item.f6),
            changeRate: toPercent(item.f3),
            mainNetInflow: asNumber(item.f62),
          }))
          .filter((item) => item.stockCode),
      }
    }

    notes.push('eastmoney returned empty payload')
  } catch (error) {
    notes.push(error instanceof Error ? `eastmoney failed: ${error.message}` : 'eastmoney failed')
  }

  try {
    const snapshot = await fetchSinaMarketSnapshot()
    notes.push('fallback to sina-hq representative quotes')

    return {
      provider: 'sina-hq',
      sourceMode: 'live',
      notes,
      boards: snapshot.boards,
      stocks: snapshot.stocks,
    }
  } catch (error) {
    notes.push(error instanceof Error ? `sina-hq failed: ${error.message}` : 'sina-hq failed')
  }

  notes.push('fallback to embedded demo snapshot')
  const snapshot = buildDemoMarketSnapshot()
  return {
    provider: 'demo-fallback',
    sourceMode: 'fallback',
    notes,
    boards: snapshot.boards,
    stocks: snapshot.stocks,
  }
}

async function copyLatestBarsToTradeDate(tradeDate: Date) {
  const latestBar = await prisma.marketDailyBar.findFirst({
    where: {
      tradeDate: {
        lt: tradeDate,
      },
    },
    orderBy: [{ tradeDate: 'desc' }, { id: 'desc' }],
  })

  if (!latestBar) {
    return 0
  }

  const bars = await prisma.marketDailyBar.findMany({
    where: { tradeDate: latestBar.tradeDate },
  })

  for (const bar of bars) {
    const extraMetrics = !bar.extraMetrics || typeof bar.extraMetrics !== 'object' || Array.isArray(bar.extraMetrics)
      ? {}
      : bar.extraMetrics

    await prisma.marketDailyBar.upsert({
      where: {
        tradeDate_stockCode: {
          tradeDate,
          stockCode: bar.stockCode,
        },
      },
      update: {
        stockName: bar.stockName,
        sectorCode: bar.sectorCode,
        sectorName: bar.sectorName,
        openPrice: bar.openPrice,
        closePrice: bar.closePrice,
        highPrice: bar.highPrice,
        lowPrice: bar.lowPrice,
        turnoverRate: bar.turnoverRate,
        volumeRatio: bar.volumeRatio,
        amount: bar.amount,
        extraMetrics: {
          ...(extraMetrics as Record<string, unknown>),
          provider: typeof (extraMetrics as Record<string, unknown>).provider === 'string' ? (extraMetrics as Record<string, unknown>).provider : 'historical-copy',
          sourceMode: 'fallback-latest-bars',
          copiedFromTradeDate: latestBar.tradeDate.toISOString().slice(0, 10),
        } as Prisma.InputJsonValue,
      },
      create: {
        tradeDate,
        stockCode: bar.stockCode,
        stockName: bar.stockName,
        sectorCode: bar.sectorCode,
        sectorName: bar.sectorName,
        openPrice: bar.openPrice,
        closePrice: bar.closePrice,
        highPrice: bar.highPrice,
        lowPrice: bar.lowPrice,
        turnoverRate: bar.turnoverRate,
        volumeRatio: bar.volumeRatio,
        amount: bar.amount,
        extraMetrics: {
          ...(extraMetrics as Record<string, unknown>),
          provider: typeof (extraMetrics as Record<string, unknown>).provider === 'string' ? (extraMetrics as Record<string, unknown>).provider : 'historical-copy',
          sourceMode: 'fallback-latest-bars',
          copiedFromTradeDate: latestBar.tradeDate.toISOString().slice(0, 10),
        } as Prisma.InputJsonValue,
      },
    })
  }

  return bars.length
}

async function runMarketFetch() {
  const tradeDate = getTradeDate()
  const result = await resolveMarketSnapshot()
  const marketTemperature = result.boards.some((item) => (item.changeRate ?? 0) >= 3) ? '中高' : '中性'

  await prisma.sourceSnapshot.upsert({
    where: {
      sourceCode_snapshotDate: {
        sourceCode: 'akshare-hot-sector',
        snapshotDate: tradeDate,
      },
    },
    update: {
      payload: {
        provider: result.provider,
        sourceMode: result.sourceMode,
        fetchedAt: new Date().toISOString(),
        notes: result.notes,
        sectors: result.boards.map((item) => ({
          sectorCode: item.sectorCode,
          sectorName: item.sectorName,
          latestPrice: item.latestPrice,
          changeRate: item.changeRate,
          mainNetInflow: item.mainNetInflow,
        })),
        marketTemperature,
      } as Prisma.InputJsonValue,
      checksum: buildChecksum(result.provider, tradeDate, result.sourceMode),
    },
    create: {
      sourceCode: 'akshare-hot-sector',
      snapshotDate: tradeDate,
      payload: {
        provider: result.provider,
        sourceMode: result.sourceMode,
        fetchedAt: new Date().toISOString(),
        notes: result.notes,
        sectors: result.boards.map((item) => ({
          sectorCode: item.sectorCode,
          sectorName: item.sectorName,
          latestPrice: item.latestPrice,
          changeRate: item.changeRate,
          mainNetInflow: item.mainNetInflow,
        })),
        marketTemperature,
      } as Prisma.InputJsonValue,
      checksum: buildChecksum(result.provider, tradeDate, result.sourceMode),
    },
  })

  for (const item of result.stocks) {
    const stockCode = String(item.stockCode ?? '')
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
        stockName: String(item.stockName ?? stockCode),
        sectorCode: item.sectorCode,
        sectorName: item.sectorName,
        openPrice: toPriceDecimal(item.openPrice),
        closePrice: toPriceDecimal(item.closePrice),
        highPrice: toPriceDecimal(item.highPrice),
        lowPrice: toPriceDecimal(item.lowPrice),
        amount: toAmountDecimal(item.amount),
        extraMetrics: {
          provider: result.provider,
          sourceMode: result.sourceMode,
          changeRate: item.changeRate,
          mainNetInflow: item.mainNetInflow,
          notes: result.notes,
        } as Prisma.InputJsonValue,
      },
      create: {
        tradeDate,
        stockCode,
        stockName: String(item.stockName ?? stockCode),
        sectorCode: item.sectorCode,
        sectorName: item.sectorName,
        openPrice: toPriceDecimal(item.openPrice),
        closePrice: toPriceDecimal(item.closePrice),
        highPrice: toPriceDecimal(item.highPrice),
        lowPrice: toPriceDecimal(item.lowPrice),
        amount: toAmountDecimal(item.amount),
        extraMetrics: {
          provider: result.provider,
          sourceMode: result.sourceMode,
          changeRate: item.changeRate,
          mainNetInflow: item.mainNetInflow,
          notes: result.notes,
        } as Prisma.InputJsonValue,
      },
    })
  }

  return {
    summary: `${result.sourceMode === 'fallback' ? '降级' : '实时'}抓取完成：来源 ${result.provider}，板块 ${result.boards.length} 条，股票 ${result.stocks.length} 条`,
    payload: {
      provider: result.provider,
      sourceMode: result.sourceMode,
      notes: result.notes,
      boardCount: result.boards.length,
      stockCount: result.stocks.length,
      tradeDate: tradeDate.toISOString().slice(0, 10),
      topBoards: result.boards.slice(0, 5).map((item) => ({
        code: item.sectorCode,
        name: item.sectorName,
        changeRate: item.changeRate,
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
  let bars = await prisma.marketDailyBar.findMany({
    where: { tradeDate },
    orderBy: [{ amount: 'desc' }, { id: 'asc' }],
    take: 6,
  })

  if (bars.length === 0) {
    await copyLatestBarsToTradeDate(tradeDate)
    bars = await prisma.marketDailyBar.findMany({
      where: { tradeDate },
      orderBy: [{ amount: 'desc' }, { id: 'asc' }],
      take: 6,
    })
  }

  if (bars.length === 0) {
    const fallback = buildDemoMarketSnapshot()
    for (const item of fallback.stocks) {
      await prisma.marketDailyBar.upsert({
        where: {
          tradeDate_stockCode: {
            tradeDate,
            stockCode: item.stockCode,
          },
        },
        update: {
          stockName: item.stockName,
          sectorCode: item.sectorCode,
          sectorName: item.sectorName,
          openPrice: toPriceDecimal(item.openPrice),
          closePrice: toPriceDecimal(item.closePrice),
          highPrice: toPriceDecimal(item.highPrice),
          lowPrice: toPriceDecimal(item.lowPrice),
          amount: toAmountDecimal(item.amount),
          extraMetrics: {
            provider: 'demo-fallback',
            sourceMode: 'fallback-demo',
            changeRate: item.changeRate,
            mainNetInflow: item.mainNetInflow,
          } as Prisma.InputJsonValue,
        },
        create: {
          tradeDate,
          stockCode: item.stockCode,
          stockName: item.stockName,
          sectorCode: item.sectorCode,
          sectorName: item.sectorName,
          openPrice: toPriceDecimal(item.openPrice),
          closePrice: toPriceDecimal(item.closePrice),
          highPrice: toPriceDecimal(item.highPrice),
          lowPrice: toPriceDecimal(item.lowPrice),
          amount: toAmountDecimal(item.amount),
          extraMetrics: {
            provider: 'demo-fallback',
            sourceMode: 'fallback-demo',
            changeRate: item.changeRate,
            mainNetInflow: item.mainNetInflow,
          } as Prisma.InputJsonValue,
        },
      })
    }

    bars = await prisma.marketDailyBar.findMany({
      where: { tradeDate },
      orderBy: [{ amount: 'desc' }, { id: 'asc' }],
      take: 6,
    })
  }

  if (bars.length === 0) {
    throw new Error('no market bars available for analyze job')
  }

  const firstMetrics = bars[0]?.extraMetrics && typeof bars[0].extraMetrics === 'object' && !Array.isArray(bars[0].extraMetrics)
    ? (bars[0].extraMetrics as Record<string, unknown>)
    : {}
  const provider = typeof firstMetrics.provider === 'string' ? firstMetrics.provider : 'unknown'
  const sourceMode = typeof firstMetrics.sourceMode === 'string' ? firstMetrics.sourceMode : 'live'

  const candidateSnapshot = await prisma.candidatePoolSnapshot.create({
    data: {
      snapshotDate: tradeDate,
      strategyCode: 'hot-sector-short-cycle',
      versionTag: `live-${Date.now()}`,
      marketSummary: {
        provider,
        sourceMode,
        marketSummary: `按${sourceMode === 'live' ? '实时' : '降级'}行情样本筛选出 ${bars.length} 只高关注股票，供短线观察。`,
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
            tags: [sourceMode === 'live' ? '真实行情' : '降级样本', provider, '成交额排序', index < 2 ? '重点候选' : '扩展观察'],
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
          reasons: [`${sourceMode === 'live' ? '实时' : '降级'}行情成交额居前。`, `当前涨跌幅 ${changeRate.toFixed(2)}%。`, '已进入短线观察列表。'],
          risks: ['未接入更细粒度盘口数据。', '当前仍属于公开行情粗筛，不构成交易建议。'],
        } as Prisma.InputJsonValue,
      },
    })
  }

  return {
    summary: `${sourceMode === 'live' ? '实时' : '降级'}分析完成：候选 ${candidateSnapshot.candidateItems.length} 只`,
    payload: {
      provider,
      sourceMode,
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