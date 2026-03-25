import cors from '@fastify/cors'
import Fastify from 'fastify'
import { env } from './config/env.js'
import { registerAdminRoutes } from './modules/admin/admin.route.js'
import { registerHealthRoutes } from './modules/health/health.route.js'
import { registerJobRoutes } from './modules/jobs/jobs.route.js'
import { registerMarketRoutes } from './modules/market/market.route.js'

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
    },
  })

  app.register(cors, {
    origin: true,
  })

  app.register(registerHealthRoutes)
  app.register(registerMarketRoutes)
  app.register(registerAdminRoutes)
  app.register(registerJobRoutes)

  return app
}