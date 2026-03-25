import { FastifyInstance } from 'fastify'
import { env } from '../../config/env.js'

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get('/api/health', async () => ({
    ok: true,
    app: 'ai-stock-service',
    env: env.APP_ENV,
    timestamp: new Date().toISOString(),
  }))
}