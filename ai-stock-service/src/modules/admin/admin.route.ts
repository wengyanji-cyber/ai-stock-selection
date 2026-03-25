import { FastifyInstance } from 'fastify'
import { getAdminDemoData, getAdminSummary, getModelRules, updateModelRule } from './admin.service.js'

export async function registerAdminRoutes(app: FastifyInstance) {
  app.get('/api/v1/admin/demo-data', async () => ({
    data: await getAdminDemoData(),
    meta: { source: 'mysql', version: 'v1' },
  }))

  app.get('/api/v1/admin/summary', async () => ({
    data: await getAdminSummary(),
    meta: { source: 'mysql', version: 'v1' },
  }))

  app.get('/api/v1/admin/model-rules', async () => ({
    data: await getModelRules(),
    meta: { source: 'mysql', version: 'v1' },
  }))

  app.patch('/api/v1/admin/model-rules/:ruleCode', async (request) => {
    const params = request.params as { ruleCode: string }
    const body = request.body as Record<string, unknown>

    return {
      data: await updateModelRule(params.ruleCode, {
        enabled: typeof body.enabled === 'boolean' ? body.enabled : undefined,
        action: typeof body.action === 'string' ? body.action : undefined,
      }),
      meta: { source: 'mysql', version: 'v1' },
    }
  })
}