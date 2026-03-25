import type { FastifyReply, FastifyRequest } from 'fastify'
import { FastifyInstance } from 'fastify'
import { requireRoleSession } from '../auth/auth.service.js'
import {
  createModelRule,
  deleteAdminUser,
  deleteModelRule,
  getAdminDemoData,
  getAdminSummary,
  getAdminUsers,
  getComplianceSummary,
  getModelRules,
  resetAdminUserPassword,
  updateAdminUser,
  updateModelRule,
} from './admin.service.js'

export async function registerAdminRoutes(app: FastifyInstance) {
  async function ensureAdmin(request: FastifyRequest, reply: FastifyReply) {
    try {
      return await requireRoleSession(request, ['ADMIN'])
    } catch (error) {
      reply.code(error instanceof Error && error.message === 'FORBIDDEN' ? 403 : 401)
      return null
    }
  }

  app.get('/api/v1/admin/demo-data', async (request, reply) => {
    const session = await ensureAdmin(request, reply)
    if (!session) {
      return { data: null, meta: { source: 'mysql', version: 'v1' } }
    }

    return {
      data: await getAdminDemoData(),
      meta: { source: 'mysql', version: 'v1' },
    }
  })

  app.get('/api/v1/admin/summary', async (request, reply) => {
    const session = await ensureAdmin(request, reply)
    if (!session) {
      return { data: null, meta: { source: 'mysql', version: 'v1' } }
    }

    return {
      data: await getAdminSummary(),
      meta: { source: 'mysql', version: 'v1' },
    }
  })

  app.get('/api/v1/admin/model-rules', async (request, reply) => {
    const session = await ensureAdmin(request, reply)
    if (!session) {
      return { data: [], meta: { source: 'mysql', version: 'v1' } }
    }

    return {
      data: await getModelRules(),
      meta: { source: 'mysql', version: 'v1' },
    }
  })

  app.get('/api/v1/admin/users', async (request, reply) => {
    const session = await ensureAdmin(request, reply)
    if (!session) {
      return { data: [], meta: { source: 'mysql', version: 'v1' } }
    }

    return {
      data: await getAdminUsers(),
      meta: { source: 'mysql', version: 'v1' },
    }
  })

  app.patch('/api/v1/admin/users/:userCode', async (request, reply) => {
    const session = await ensureAdmin(request, reply)
    if (!session) {
      return { data: null, meta: { source: 'mysql', version: 'v1' } }
    }

    const params = request.params as { userCode: string }
    const body = request.body as Record<string, unknown>

    return {
      data: await updateAdminUser(params.userCode, {
        nickname: typeof body.nickname === 'string' ? body.nickname : undefined,
        membershipPlan: typeof body.membershipPlan === 'string' ? body.membershipPlan : undefined,
        status: typeof body.status === 'string' ? body.status : undefined,
      }),
      meta: { source: 'mysql', version: 'v1' },
    }
  })

  app.delete('/api/v1/admin/users/:userCode', async (request, reply) => {
    const session = await ensureAdmin(request, reply)
    if (!session) {
      return { data: { removed: false }, meta: { source: 'mysql', version: 'v1' } }
    }

    const params = request.params as { userCode: string }

    return {
      data: await deleteAdminUser(params.userCode),
      meta: { source: 'mysql', version: 'v1' },
    }
  })

  app.post('/api/v1/admin/users/:userCode/reset-password', async (request, reply) => {
    const session = await ensureAdmin(request, reply)
    if (!session) {
      return { data: null, meta: { source: 'mysql', version: 'v1' } }
    }

    const params = request.params as { userCode: string }
    const body = request.body as Record<string, unknown>

    try {
      return {
        data: await resetAdminUserPassword(params.userCode, {
          newPassword: typeof body.newPassword === 'string' ? body.newPassword : '',
        }),
        meta: { source: 'mysql', version: 'v1' },
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_PASSWORD') {
        reply.code(400)
      } else if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
        reply.code(404)
      } else {
        reply.code(500)
      }

      return { data: null, meta: { source: 'mysql', version: 'v1' } }
    }
  })

  app.get('/api/v1/admin/compliance', async (request, reply) => {
    const session = await ensureAdmin(request, reply)
    if (!session) {
      return { data: null, meta: { source: 'mysql', version: 'v1' } }
    }

    return {
      data: await getComplianceSummary(),
      meta: { source: 'mysql', version: 'v1' },
    }
  })

  app.post('/api/v1/admin/model-rules', async (request, reply) => {
    const session = await ensureAdmin(request, reply)
    if (!session) {
      return { data: null, meta: { source: 'mysql', version: 'v1' } }
    }

    const body = request.body as Record<string, unknown>

    return {
      data: await createModelRule({
        ruleCode: typeof body.ruleCode === 'string' ? body.ruleCode : '',
        name: typeof body.name === 'string' ? body.name : '',
        action: typeof body.action === 'string' ? body.action : undefined,
        note: typeof body.note === 'string' ? body.note : undefined,
        scene: typeof body.scene === 'string' ? body.scene : undefined,
        versionTag: typeof body.versionTag === 'string' ? body.versionTag : undefined,
        enabled: typeof body.enabled === 'boolean' ? body.enabled : undefined,
      }),
      meta: { source: 'mysql', version: 'v1' },
    }
  })

  app.patch('/api/v1/admin/model-rules/:ruleCode', async (request, reply) => {
    const session = await ensureAdmin(request, reply)
    if (!session) {
      return { data: null, meta: { source: 'mysql', version: 'v1' } }
    }

    const params = request.params as { ruleCode: string }
    const body = request.body as Record<string, unknown>

    return {
      data: await updateModelRule(params.ruleCode, {
        ruleCode: typeof body.ruleCode === 'string' ? body.ruleCode : undefined,
        name: typeof body.name === 'string' ? body.name : undefined,
        enabled: typeof body.enabled === 'boolean' ? body.enabled : undefined,
        action: typeof body.action === 'string' ? body.action : undefined,
        note: typeof body.note === 'string' ? body.note : undefined,
        scene: typeof body.scene === 'string' ? body.scene : undefined,
        versionTag: typeof body.versionTag === 'string' ? body.versionTag : undefined,
      }),
      meta: { source: 'mysql', version: 'v1' },
    }
  })

  app.delete('/api/v1/admin/model-rules/:ruleCode', async (request, reply) => {
    const session = await ensureAdmin(request, reply)
    if (!session) {
      return { data: { removed: false }, meta: { source: 'mysql', version: 'v1' } }
    }

    const params = request.params as { ruleCode: string }

    return {
      data: await deleteModelRule(params.ruleCode),
      meta: { source: 'mysql', version: 'v1' },
    }
  })
}