import { FastifyInstance } from 'fastify'
import { requireAuthSession } from '../auth/auth.service.js'
import { prisma } from '../../lib/prisma.js'

/**
 * 运营端套餐配置管理
 * 
 * 功能：
 * - 套餐列表查询
 * - 套餐创建/更新
 * - 套餐启用/禁用
 * - 套餐价格/功能配置
 */

export async function registerAdminMembershipRoutes(app: FastifyInstance) {
  // 获取套餐列表（运营端）
  app.get('/api/v1/admin/membership/plans', async (request, reply) => {
    const session = await requireAuthSession(request).catch(() => null)
    if (!session || (session.user.membershipPlan !== 'ADVANCED' && session.user.userCode !== 'admin_root')) {
      reply.code(403)
      return {
        data: null,
        error: '需要管理员权限',
      }
    }

    try {
      const plans = await prisma.membershipPlan.findMany({
        orderBy: { sortOrder: 'asc' },
      })

      return {
        data: plans,
        meta: { source: 'mysql', version: 'v1' },
      }
    } catch (error: any) {
      console.error('[Admin Membership] List plans error:', error)
      reply.code(500)
      return {
        data: null,
        error: '查询套餐列表失败',
      }
    }
  })

  // 创建套餐
  app.post('/api/v1/admin/membership/plans', async (request, reply) => {
    const session = await requireAuthSession(request).catch(() => null)
    if (!session || (session.user.membershipPlan !== 'ADVANCED' && session.user.userCode !== 'admin_root')) {
      reply.code(403)
      return {
        data: null,
        error: '需要管理员权限',
      }
    }

    const body = request.body as Record<string, unknown>

    try {
      const plan = await prisma.membershipPlan.create({
        data: {
          planCode: typeof body.planCode === 'string' ? body.planCode : '',
          planName: typeof body.planName === 'string' ? body.planName : '',
          price: typeof body.price === 'number' ? body.price : 0,
          period: typeof body.period === 'string' ? body.period : 'month',
          dailyCandidates: typeof body.dailyCandidates === 'number' ? body.dailyCandidates : 0,
          watchlistLimit: typeof body.watchlistLimit === 'number' ? body.watchlistLimit : 0,
          features: body.features as any || {},
          isEnabled: typeof body.isEnabled === 'boolean' ? body.isEnabled : true,
          sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : 0,
        },
      })

      return {
        data: plan,
        meta: { source: 'mysql', version: 'v1' },
      }
    } catch (error: any) {
      console.error('[Admin Membership] Create plan error:', error.message, error.meta)
      reply.code(500)
      return {
        data: null,
        error: `创建套餐失败：${error.message}`,
      }
    }
  })

  // 更新套餐
  app.put('/api/v1/admin/membership/plans/:planCode', async (request, reply) => {
    const session = await requireAuthSession(request).catch(() => null)
    if (!session || (session.user.membershipPlan !== 'ADVANCED' && session.user.userCode !== 'admin_root')) {
      reply.code(403)
      return {
        data: null,
        error: '需要管理员权限',
      }
    }

    const params = request.params as { planCode: string }
    const body = request.body as Record<string, unknown>

    try {
      const plan = await prisma.membershipPlan.update({
        where: { planCode: params.planCode },
        data: {
          planName: typeof body.planName === 'string' ? body.planName : undefined,
          price: typeof body.price === 'number' ? body.price : undefined,
          period: typeof body.period === 'string' ? body.period : undefined,
          dailyCandidates: typeof body.dailyCandidates === 'number' ? body.dailyCandidates : undefined,
          watchlistLimit: typeof body.watchlistLimit === 'number' ? body.watchlistLimit : undefined,
          features: body.features as any,
          isEnabled: typeof body.isEnabled === 'boolean' ? body.isEnabled : undefined,
          sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : undefined,
          updatedAt: new Date(),
        },
      })

      return {
        data: plan,
        meta: { source: 'mysql', version: 'v1' },
      }
    } catch (error: any) {
      console.error('[Admin Membership] Update plan error:', error)
      reply.code(500)
      return {
        data: null,
        error: '更新套餐失败',
      }
    }
  })

  // 删除套餐
  app.delete('/api/v1/admin/membership/plans/:planCode', async (request, reply) => {
    const session = await requireAuthSession(request).catch(() => null)
    if (!session || (session.user.membershipPlan !== 'ADVANCED' && session.user.userCode !== 'admin_root')) {
      reply.code(403)
      return {
        data: null,
        error: '需要管理员权限',
      }
    }

    const params = request.params as { planCode: string }

    try {
      await prisma.membershipPlan.delete({
        where: { planCode: params.planCode },
      })

      return {
        data: { success: true },
        meta: { source: 'mysql', version: 'v1' },
      }
    } catch (error: any) {
      console.error('[Admin Membership] Delete plan error:', error)
      reply.code(500)
      return {
        data: null,
        error: '删除套餐失败',
      }
    }
  })

  // 注意：用户端套餐列表在 membership.route.ts 中提供
}
