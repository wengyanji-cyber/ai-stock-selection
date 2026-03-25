import { FastifyInstance } from 'fastify'
import { requireAuthSession } from '../auth/auth.service.js'
import { getMembershipStats, upgradeMembership, MEMBERSHIP_PLANS, type MembershipPlan } from '../../lib/membership.js'

export async function registerMembershipRoutes(app: FastifyInstance) {
  app.get('/api/v1/membership/stats', async (request, reply) => {
    try {
      const session = await requireAuthSession(request)
      const stats = await getMembershipStats(session.profile.userCode)
      
      if (!stats) {
        reply.code(404)
        return { data: null, meta: { source: 'membership', version: 'v1' } }
      }

      return {
        data: stats,
        meta: { source: 'membership', version: 'v1' },
      }
    } catch {
      reply.code(401)
      return { data: null, meta: { source: 'membership', version: 'v1' } }
    }
  })

  app.get('/api/v1/membership/plans', async () => {
    return {
      data: MEMBERSHIP_PLANS,
      meta: { source: 'membership', version: 'v1' },
    }
  })

  app.post('/api/v1/membership/upgrade', async (request, reply) => {
    try {
      const session = await requireAuthSession(request)
      const body = request.body as { plan: MembershipPlan; paymentId?: string }

      if (!['TRIAL', 'OBSERVER', 'STANDARD', 'ADVANCED'].includes(body.plan)) {
        reply.code(400)
        return { data: null, meta: { source: 'membership', version: 'v1' } }
      }

      const result = await upgradeMembership(
        session.user.id,
        body.plan as MembershipPlan,
        body.paymentId,
      )

      return {
        data: result,
        meta: { source: 'membership', version: 'v1' },
      }
    } catch (error) {
      reply.code(500)
      return {
        data: null,
        error: error instanceof Error ? error.message : '升级失败',
        meta: { source: 'membership', version: 'v1' },
      }
    }
  })

  app.get('/api/v1/membership/check', async (request, reply) => {
    try {
      const session = await requireAuthSession(request)
      const query = request.query as { feature: string; value?: string }

      const { checkFeatureLimit } = await import('../../lib/membership.js')
      const result = checkFeatureLimit(
        session.user.membershipPlan as MembershipPlan,
        query.feature as any,
        query.value ? Number(query.value) : undefined,
      )

      return {
        data: result,
        meta: { source: 'membership', version: 'v1' },
      }
    } catch {
      reply.code(401)
      return { data: null, meta: { source: 'membership', version: 'v1' } }
    }
  })
}
