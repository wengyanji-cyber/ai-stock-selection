import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import { env } from '../config/env.js'

const redisUrl = new URL(env.REDIS_URL)

const connectionOptions = {
  host: redisUrl.hostname,
  port: Number.parseInt(redisUrl.port || '6379', 10),
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
}

const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
})

function createQueues() {
  return {
    fetchQueue: new Queue('market-fetch', { connection: connectionOptions }),
    analyzeQueue: new Queue('market-analyze', { connection: connectionOptions }),
    pushQueue: new Queue('user-push', { connection: connectionOptions }),
  }
}

export function getQueueFactories() {
  return createQueues()
}

export function getWorkerConnectionOptions() {
  return connectionOptions
}

export async function getQueueHealth() {
  try {
    if (connection.status === 'wait') {
      await connection.connect()
    }

    const { fetchQueue, analyzeQueue, pushQueue } = createQueues()

    const [fetchCounts, analyzeCounts, pushCounts] = await Promise.all([
      Promise.all([
        fetchQueue.getWaitingCount(),
        fetchQueue.getActiveCount(),
        fetchQueue.getCompletedCount(),
        fetchQueue.getFailedCount(),
        fetchQueue.getDelayedCount(),
      ]),
      Promise.all([
        analyzeQueue.getWaitingCount(),
        analyzeQueue.getActiveCount(),
        analyzeQueue.getCompletedCount(),
        analyzeQueue.getFailedCount(),
        analyzeQueue.getDelayedCount(),
      ]),
      Promise.all([
        pushQueue.getWaitingCount(),
        pushQueue.getActiveCount(),
        pushQueue.getCompletedCount(),
        pushQueue.getFailedCount(),
        pushQueue.getDelayedCount(),
      ]),
    ])

    return {
      status: 'ready',
      queues: [
        {
          name: 'market-fetch',
          waiting: fetchCounts[0],
          active: fetchCounts[1],
          completed: fetchCounts[2],
          failed: fetchCounts[3],
          delayed: fetchCounts[4],
        },
        {
          name: 'market-analyze',
          waiting: analyzeCounts[0],
          active: analyzeCounts[1],
          completed: analyzeCounts[2],
          failed: analyzeCounts[3],
          delayed: analyzeCounts[4],
        },
        {
          name: 'user-push',
          waiting: pushCounts[0],
          active: pushCounts[1],
          completed: pushCounts[2],
          failed: pushCounts[3],
          delayed: pushCounts[4],
        },
      ],
    }
  } catch (error) {
    return {
      status: 'degraded',
      reason: error instanceof Error ? error.message : 'Redis unavailable',
      queues: [
        { name: 'market-fetch', waiting: null, active: null, completed: null, failed: null, delayed: null },
        { name: 'market-analyze', waiting: null, active: null, completed: null, failed: null, delayed: null },
        { name: 'user-push', waiting: null, active: null, completed: null, failed: null, delayed: null },
      ],
    }
  }
}