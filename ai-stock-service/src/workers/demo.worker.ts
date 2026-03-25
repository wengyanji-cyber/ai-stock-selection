import { Prisma } from '@prisma/client'
import { Job, Worker } from 'bullmq'
import { getWorkerConnectionOptions } from '../lib/queue.js'
import { prisma } from '../lib/prisma.js'

type WorkerPayload = {
  jobRunId: string
  payload: Record<string, unknown>
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

  await new Promise((resolve) => setTimeout(resolve, 400))

  const summary =
    queueName === 'market-fetch'
      ? '已完成市场快照同步'
      : queueName === 'market-analyze'
        ? '已完成热点分析刷新'
        : '已完成用户触达任务'

  await markFinished(jobRunId, summary, {
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