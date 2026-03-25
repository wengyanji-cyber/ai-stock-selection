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

    const [fetchWaiting, analyzeWaiting, pushWaiting] = await Promise.all([
      fetchQueue.getWaitingCount(),
      analyzeQueue.getWaitingCount(),
      pushQueue.getWaitingCount(),
    ])

    return {
      status: 'ready',
      fetchQueue: { waiting: fetchWaiting },
      analyzeQueue: { waiting: analyzeWaiting },
      pushQueue: { waiting: pushWaiting },
    }
  } catch (error) {
    return {
      status: 'degraded',
      reason: error instanceof Error ? error.message : 'Redis unavailable',
      fetchQueue: { waiting: null },
      analyzeQueue: { waiting: null },
      pushQueue: { waiting: null },
    }
  }
}