import { Prisma } from '@prisma/client'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { Job, Worker } from 'bullmq'
import { getWorkerConnectionOptions } from '../lib/queue.js'
import { prisma } from '../lib/prisma.js'
import * as tushare from '../lib/tushare.js'
import { compositeStrategy, saveCandidateSignals } from '../lib/strategy.js'

type WorkerPayload = {
  jobRunId: string
  payload: Record<string, unknown>
}

const execFileAsync = promisify(execFile)

function getTradeDate() {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

async function runMarketFetch() {
  const tradeDate = getTradeDate()
  const dateStr = tushare.parseTradeDate(tradeDate)

  console.log('[Worker] 开始抓取行情数据...', dateStr)

  try {
    // 从 Tushare 抓取数据
    const dailyData = await tushare.fetchDaily(dateStr)
    const stocks = Array.isArray(dailyData) ? dailyData : []

    console.log(`[Worker] 获取到 ${stocks.length} 条数据`)

    // 保存到数据库
    for (const item of stocks) {
      const tradeDateObj = new Date(`${item.trade_date.slice(0, 4)}-${item.trade_date.slice(4, 6)}-${item.trade_date.slice(6, 8)}`)
      
      await prisma.marketDailyBar.upsert({
        where: {
          tradeDate_stockCode: {
            tradeDate: tradeDateObj,
            stockCode: item.ts_code,
          },
        },
        update: {
          stockName: item.ts_code,
          closePrice: item.close ? (item.close / 100).toFixed(4) : null,
          amount: item.amount ? tushare.formatAmount(item.amount) : null,
          extraMetrics: {
            provider: 'tushare',
            pct_chg: item.pct_chg,
            vol: item.vol,
          } as Prisma.InputJsonValue,
        },
        create: {
          tradeDate: tradeDateObj,
          stockCode: item.ts_code,
          stockName: item.ts_code,
          closePrice: item.close ? (item.close / 100).toFixed(4) : null,
          amount: item.amount ? tushare.formatAmount(item.amount) : null,
          extraMetrics: {
            provider: 'tushare',
            pct_chg: item.pct_chg,
            vol: item.vol,
          } as Prisma.InputJsonValue,
        },
      })
    }

    return {
      summary: `Tushare 数据抓取完成：${stocks.length} 条`,
      payload: {
        provider: 'tushare',
        stockCount: stocks.length,
        tradeDate: dateStr,
      },
    }
  } catch (error) {
    console.error('[Worker] 数据抓取失败:', error)
    throw error
  }
}

async function runMarketAnalyze() {
  const tradeDate = getTradeDate()

  console.log('[Worker] 开始执行策略分析...')

  try {
    // 运行综合策略
    const signals = await compositeStrategy(tradeDate)

    console.log(`[Worker] 策略分析完成：${signals.length} 只股票`)

    // 保存候选信号
    const result = await saveCandidateSignals(
      signals,
      'composite-v1',
      `live-${Date.now()}`,
    )

    return {
      summary: `策略分析完成：候选 ${result.count} 只`,
      payload: {
        strategy: 'composite',
        snapshotId: result.snapshotId,
        candidateCount: result.count,
        topStocks: signals.slice(0, 5).map(s => ({
          code: s.stockCode,
          name: s.stockName,
          score: s.score,
        })),
      },
    }
  } catch (error) {
    console.error('[Worker] 策略分析失败:', error)
    throw error
  }
}

async function runUserPush() {
  console.log('[Worker] 执行用户推送任务...')

  // TODO: 实现推送逻辑
  return {
    summary: '推送任务完成',
    payload: { sent: 0 },
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

  if (queueName === 'user-push') {
    const result = await runUserPush()
    await markFinished(jobRunId, result.summary, {
      ...payload,
      queueName,
      workerProcessedAt: new Date().toISOString(),
      ...result.payload,
    })
    return
  }

  await markFinished(jobRunId, '未知任务类型', payload)
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

console.log('[worker] enhanced workers started for market-fetch / market-analyze / user-push')
