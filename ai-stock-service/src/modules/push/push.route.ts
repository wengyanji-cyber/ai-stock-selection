import { FastifyInstance } from 'fastify'
import { createPushTask, getPushHistory, sendDailyRecommendations, sendRiskWarnings } from './push.service.js'
import { requireRoleSession } from '../auth/auth.service.js'

export async function registerPushRoutes(app: FastifyInstance) {
  app.post('/api/v1/push/send', async (request, reply) => {
    try {
      await requireRoleSession(request, ['ADMIN'])
    } catch {
      reply.code(403)
      return { data: null, meta: { source: 'push', version: 'v1' } }
    }

    const body = request.body as {
      userId?: string
      channel: 'APP' | 'WECHAT' | 'SMS' | 'EMAIL'
      templateCode: string
      data: Record<string, string>
    }

    const result = await createPushTask({
      userId: body.userId ? BigInt(body.userId) : undefined,
      channel: body.channel,
      templateCode: body.templateCode,
      data: body.data,
    })

    return {
      data: result,
      meta: { source: 'push', version: 'v1' },
    }
  })

  app.get('/api/v1/push/history', async (request, reply) => {
    try {
      await requireRoleSession(request, ['ADMIN'])
    } catch {
      reply.code(403)
      return { data: [], meta: { source: 'push', version: 'v1' } }
    }

    const query = request.query as { userId?: string; limit?: string }
    const tasks = await getPushHistory(
      query.userId ? BigInt(query.userId) : undefined,
      query.limit ? Number(query.limit) : 20,
    )

    return {
      data: tasks,
      meta: { source: 'push', version: 'v1' },
    }
  })

  app.post('/api/v1/push/daily-rec', async (request, reply) => {
    try {
      await requireRoleSession(request, ['ADMIN'])
    } catch {
      reply.code(403)
      return { data: null, meta: { source: 'push', version: 'v1' } }
    }

    const result = await sendDailyRecommendations()

    return {
      data: result,
      meta: { source: 'push', version: 'v1' },
    }
  })

  app.post('/api/v1/push/risk-warn', async (request, reply) => {
    try {
      await requireRoleSession(request, ['ADMIN'])
    } catch {
      reply.code(403)
      return { data: null, meta: { source: 'push', version: 'v1' } }
    }

    const body = request.body as { stockCode: string; reason: string }
    const result = await sendRiskWarnings(body.stockCode, body.reason)

    return {
      data: result,
      meta: { source: 'push', version: 'v1' },
    }
  })
}
