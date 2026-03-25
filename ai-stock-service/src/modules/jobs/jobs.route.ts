import { FastifyInstance } from 'fastify'
import { getQueueHealth } from '../../lib/queue.js'
import { enqueueDemoJobs, listRecentJobRuns } from './jobs.service.js'

export async function registerJobRoutes(app: FastifyInstance) {
  app.get('/api/v1/jobs/queues', async () => ({
    data: await getQueueHealth(),
  }))

  app.get('/api/v1/jobs/runs', async () => ({
    data: await listRecentJobRuns(),
    meta: { source: 'mysql', version: 'v1' },
  }))

  app.post('/api/v1/jobs/demo-dispatch', async () => ({
    data: await enqueueDemoJobs(),
    meta: { source: 'bullmq', version: 'v1' },
  }))
}