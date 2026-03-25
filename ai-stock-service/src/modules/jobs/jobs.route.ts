import type { FastifyReply, FastifyRequest } from 'fastify'
import { FastifyInstance } from 'fastify'
import { requireRoleSession } from '../auth/auth.service.js'
import { getQueueHealth } from '../../lib/queue.js'
import { enqueueDemoJobs, listRecentJobRuns } from './jobs.service.js'

export async function registerJobRoutes(app: FastifyInstance) {
  async function ensureAdmin(request: FastifyRequest, reply: FastifyReply) {
    try {
      return await requireRoleSession(request, ['ADMIN'])
    } catch (error) {
      reply.code(error instanceof Error && error.message === 'FORBIDDEN' ? 403 : 401)
      return null
    }
  }

  app.get('/api/v1/jobs/queues', async (request, reply) => {
    const session = await ensureAdmin(request, reply)
    if (!session) {
      return {
        data: null,
        meta: { source: 'bullmq', version: 'v1' },
      }
    }

    return {
      data: await getQueueHealth(),
      meta: { source: 'bullmq', version: 'v1' },
    }
  })

  app.get('/api/v1/jobs/runs', async (request, reply) => {
    const session = await ensureAdmin(request, reply)
    if (!session) {
      return {
        data: [],
        meta: { source: 'mysql', version: 'v1' },
      }
    }

    return {
      data: await listRecentJobRuns(),
      meta: { source: 'mysql', version: 'v1' },
    }
  })

  app.post('/api/v1/jobs/demo-dispatch', async (request, reply) => {
    const session = await ensureAdmin(request, reply)
    if (!session) {
      return {
        data: [],
        meta: { source: 'bullmq', version: 'v1' },
      }
    }

    return {
      data: await enqueueDemoJobs(),
      meta: { source: 'bullmq', version: 'v1' },
    }
  })
}