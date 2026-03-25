import { JobRunStatus } from '@prisma/client'
import { cleanupFailedQueueJobs, getQueueFactories } from '../../lib/queue.js'
import { prisma } from '../../lib/prisma.js'

const demoJobs = [
  {
    queueName: 'market-fetch',
    jobCode: 'market-snapshot-sync',
    payload: { sourceCode: 'akshare-hot-sector' },
  },
  {
    queueName: 'market-analyze',
    jobCode: 'hot-sector-score-refresh',
    payload: { strategyCode: 'hot-sector-short-cycle' },
  },
  {
    queueName: 'user-push',
    jobCode: 'after-close-review-generate',
    payload: { reviewDate: new Date().toISOString().slice(0, 10) },
  },
] as const

export async function listRecentJobRuns() {
  const rows = await prisma.jobRun.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 20,
  })

  return rows.map((row) => ({
    id: row.id.toString(),
    jobCode: row.jobCode,
    queueName: row.queueName,
    status: row.status,
    scheduledAt: row.scheduledAt?.toISOString() || null,
    startedAt: row.startedAt?.toISOString() || null,
    finishedAt: row.finishedAt?.toISOString() || null,
    durationMs: row.durationMs,
    traceId: row.traceId,
    resultSummary: row.resultSummary,
    errorMessage: row.errorMessage,
  }))
}

export async function enqueueDemoJobs() {
  const { fetchQueue, analyzeQueue, pushQueue } = getQueueFactories()

  const created = [] as Array<{ queueName: string; jobCode: string; jobRunId: string }>
  for (const item of demoJobs) {
    const jobRun = await prisma.jobRun.create({
      data: {
        jobCode: item.jobCode,
        queueName: item.queueName,
        status: JobRunStatus.PENDING,
        scheduledAt: new Date(),
        traceId: `trace-${item.jobCode}-${Date.now()}`,
        resultSummary: '已加入队列，等待 worker 执行',
        payload: item.payload,
      },
    })

    const queue = item.queueName === 'market-fetch' ? fetchQueue : item.queueName === 'market-analyze' ? analyzeQueue : pushQueue

    await queue.add(item.jobCode, {
      jobRunId: jobRun.id.toString(),
      payload: item.payload,
    })

    created.push({
      queueName: item.queueName,
      jobCode: item.jobCode,
      jobRunId: jobRun.id.toString(),
    })
  }

  return created
}

export async function cleanupFailedJobs() {
  const queueResult = await cleanupFailedQueueJobs()
  const deleted = await prisma.jobRun.deleteMany({
    where: { status: JobRunStatus.FAILED },
  })

  return {
    removedJobRuns: deleted.count,
    queues: queueResult.queues,
  }
}