import { FastifyInstance } from 'fastify'
import { requireAuthSession } from '../auth/auth.service.js'
import { prisma } from '../../lib/prisma.js'
import { MEMBERSHIP_PLANS } from '../../lib/membership.js'

/**
 * 支付模块 - 微信支付集成
 * 
 * 功能：
 * - 创建支付订单
 * - 查询支付状态
 * - 支付回调处理
 * - 订单管理
 */

export async function registerPaymentRoutes(app: FastifyInstance) {
  // 创建支付订单
  app.post('/api/v1/payment/create', async (request, reply) => {
    const session = await requireAuthSession(request).catch(() => null)
    if (!session) {
      reply.code(401)
      return {
        data: null,
        error: '请先登录',
      }
    }

    const body = request.body as Record<string, unknown>
    const planCode = typeof body.planCode === 'string' ? body.planCode : ''
    const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod : 'wechat'

    // 验证套餐
    const plan = MEMBERSHIP_PLANS.find(p => p.plan === planCode)
    if (!plan) {
      reply.code(400)
      return {
        data: null,
        error: '无效的套餐类型',
      }
    }

    const userId = Number(session.user.id)
    const orderNo = generateOrderNo()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 分钟后过期

    try {
      // 创建订单
      const order = await prisma.paymentOrder.create({
        data: {
          orderNo,
          userId,
          userCode: session.user.userCode,
          planCode,
          planName: plan.name,
          amount: plan.price,
          paymentMethod,
          status: 'PENDING',
          expiresAt,
        },
      })

      // TODO: 调用微信支付 API 生成支付参数
      const payParams = await createWechatPayParams(orderNo, plan.price)

      return {
        data: {
          orderNo: order.orderNo,
          amount: order.amount,
          planName: order.planName,
          expiresAt: order.expiresAt,
          payParams, // 微信支付参数
        },
        meta: { source: 'mysql', version: 'v1' },
      }
    } catch (error: any) {
      console.error('[Payment] Create order error:', error)
      reply.code(500)
      return {
        data: null,
        error: '创建订单失败',
      }
    }
  })

  // 查询订单状态
  app.get('/api/v1/payment/order/:orderNo', async (request, reply) => {
    const session = await requireAuthSession(request).catch(() => null)
    if (!session) {
      reply.code(401)
      return {
        data: null,
        error: '请先登录',
      }
    }

    const params = request.params as { orderNo: string }

    try {
      const order = await prisma.paymentOrder.findUnique({
        where: { orderNo: params.orderNo },
      })

      if (!order) {
        reply.code(404)
        return {
          data: null,
          error: '订单不存在',
        }
      }

      // 验证订单归属
      if (order.userCode !== session.user.userCode) {
        reply.code(403)
        return {
          data: null,
          error: '无权访问此订单',
        }
      }

      return {
        data: {
          orderNo: order.orderNo,
          amount: order.amount,
          planName: order.planName,
          status: order.status,
          paidAt: order.paidAt,
          createdAt: order.createdAt,
        },
        meta: { source: 'mysql', version: 'v1' },
      }
    } catch (error: any) {
      console.error('[Payment] Query order error:', error)
      reply.code(500)
      return {
        data: null,
        error: '查询订单失败',
      }
    }
  })

  // 微信支付回调
  app.post('/api/v1/payment/wechat/notify', async (request, reply) => {
    try {
      const body = request.body as Record<string, unknown>
      console.log('[Payment] Wechat notify:', JSON.stringify(body))

      // TODO: 验证微信支付签名
      // TODO: 处理支付成功逻辑

      // 示例：更新订单状态
      const orderNo = typeof body.out_trade_no === 'string' ? body.out_trade_no : ''
      console.log('[Payment] Processing order:', orderNo)
      if (orderNo) {
        const order = await prisma.paymentOrder.findUnique({ where: { orderNo } })
        console.log('[Payment] Order found:', order ? 'yes' : 'no')
        if (order) {
          await prisma.paymentOrder.update({
            where: { orderNo },
            data: {
              status: 'PAID',
              paidAt: new Date(),
              transactionId: typeof body.transaction_id === 'string' ? body.transaction_id : null,
            },
          })

          // 更新用户会员套餐
          console.log('[Payment] Upgrading membership:', order.userCode, order.planCode)
          await upgradeUserMembership(order.userCode, order.planCode)
        }
      }

      reply.code(200)
      return {
        code: 'SUCCESS',
        message: 'OK',
      }
    } catch (error: any) {
      console.error('[Payment] Wechat notify error:', error)
      reply.code(500)
      return {
        code: 'FAIL',
        message: error.message,
      }
    }
  })

  // 用户订单列表
  app.get('/api/v1/payment/orders', async (request, reply) => {
    const session = await requireAuthSession(request).catch(() => null)
    if (!session) {
      reply.code(401)
      return {
        data: [],
        error: '请先登录',
      }
    }

    try {
      const orders = await prisma.paymentOrder.findMany({
        where: { userCode: session.user.userCode },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })

      return {
        data: orders.map(o => ({
          orderNo: o.orderNo,
          amount: o.amount,
          planName: o.planName,
          status: o.status,
          paidAt: o.paidAt,
          createdAt: o.createdAt,
        })),
        meta: { source: 'mysql', version: 'v1' },
      }
    } catch (error: any) {
      console.error('[Payment] List orders error:', error)
      reply.code(500)
      return {
        data: [],
        error: '查询订单列表失败',
      }
    }
  })

  // 运营端订单列表
  app.get('/api/v1/admin/payment/orders', async (request, reply) => {
    const session = await requireAuthSession(request).catch(() => null)
    if (!session || (session.user.membershipPlan !== 'ADVANCED' && session.user.userCode !== 'admin_root')) {
      reply.code(403)
      return {
        data: [],
        error: '需要管理员权限',
      }
    }

    try {
      const orders = await prisma.paymentOrder.findMany({
        where: { userCode: session.user.userCode },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })

      return {
        data: orders.map(o => ({
          orderNo: o.orderNo,
          amount: o.amount,
          planName: o.planName,
          status: o.status,
          paidAt: o.paidAt,
          createdAt: o.createdAt,
        })),
        meta: { source: 'mysql', version: 'v1' },
      }
    } catch (error: any) {
      console.error('[Payment] List orders error:', error)
      reply.code(500)
      return {
        data: [],
        error: '查询订单列表失败',
      }
    }
  })
}

/**
 * 生成订单号
 * 格式：PAY + YYYYMMDDHHmmss + 6 位随机数
 */
function generateOrderNo(): string {
  const now = new Date()
  const timestamp = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14)
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `PAY${timestamp}${random}`
}

/**
 * 创建微信支付参数（模拟）
 * TODO: 接入真实微信支付 API
 */
async function createWechatPayParams(orderNo: string, amount: number) {
  // 模拟返回
  return {
    appId: 'wx1234567890',
    timeStamp: Math.floor(Date.now() / 1000).toString(),
    nonceStr: Math.random().toString(36).slice(2, 16),
    package: `prepay_id=${orderNo}`,
    signType: 'RSA',
    paySign: 'mock_signature',
  }
}

/**
 * 升级用户会员套餐
 */
async function upgradeUserMembership(userCode: string, planCode: string) {
  await prisma.appUser.update({
    where: { userCode },
    data: { membershipPlan: planCode as any },
  })
  console.log('[Payment] User membership upgraded:', userCode, '->', planCode)
}
