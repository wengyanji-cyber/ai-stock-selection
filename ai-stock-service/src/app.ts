import cors from '@fastify/cors'
import Fastify from 'fastify'
import { env } from './config/env.js'
import { registerAdminRoutes } from './modules/admin/admin.route.js'
import { registerDataRoutes } from './modules/data/data.route.js'
import { registerHealthRoutes } from './modules/health/health.route.js'
import { registerJobRoutes } from './modules/jobs/jobs.route.js'
import { registerMarketRoutes } from './modules/market/market.route.js'
import { registerMembershipRoutes } from './modules/membership/membership.route.js'
import { registerPaymentRoutes } from './modules/payment/payment.route.js'
import { registerPushRoutes } from './modules/push/push.route.js'

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
  app.register(registerDataRoutes)
  app.register(registerPushRoutes)
  app.register(registerMembershipRoutes)
  app.register(registerPaymentRoutes)

  return app
}