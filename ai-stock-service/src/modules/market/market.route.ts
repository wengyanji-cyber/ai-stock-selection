import { FastifyInstance } from 'fastify'
import { changeCurrentUserPassword, loginUserAccount, refreshAuthSession, registerUserAccount, requireAuthSession, revokeAuthSession } from '../auth/auth.service.js'
import {
  deleteWatchlistItem,
  getCandidateDetails,
  getCandidateList,
  getDiagnosisList,
  getLatestReview,
  getMarketHome,
  getMarketOverview,
  getStockDetail,
  getUserProfile,
  getWatchlistItems,
  getWebDemoData,
  loginTrialUser,
  updateWatchlistItem,
  upsertWatchlistItem,
} from './market.service.js'

export async function registerMarketRoutes(app: FastifyInstance) {
  app.get('/api/v1/web/demo-data', async () => ({
    data: await getWebDemoData(),
    meta: { source: 'mysql', version: 'v1' },
  }))

  app.get('/api/v1/market/overview', async () => ({
    data: await getMarketOverview(),
    meta: { source: 'mysql', version: 'v1' },
  }))

  app.get('/api/v1/market/home', async () => ({
    data: await getMarketHome(),
    meta: { source: 'mysql', version: 'v1' },
  }))

  app.get('/api/v1/candidates', async (request, reply) => {
    const { requireAuthSession } = await import('../auth/auth.service.js')
    const { checkCandidateLimit } = await import('../../lib/middleware.js')
    
    console.log('[Candidates] Getting session...')
    
    // 获取 session
    const session = await requireAuthSession(request).catch((e) => {
      console.log('[Candidates] requireAuthSession error:', e.message)
      return null
    })
    
    console.log('[Candidates] Session:', session ? 'found' : 'not found')
    
    // 未登录返回提示
    if (!session) {
      console.log('[Candidates] No session, returning login prompt')
      return {
        data: [],
        error: '请先登录',
        upgradeHint: '登录后即可体验',
        meta: { source: 'mysql', version: 'v1' },
      }
    }
    
    // 检查候选数量限制 - 直接传 session.user
    const limitCheck = await checkCandidateLimit(request as any, 0, session)
    
    if (!limitCheck.allowed) {
      return {
        data: [],
        error: limitCheck.message,
        upgradeHint: limitCheck.upgradeHint,
        meta: { source: 'mysql', version: 'v1' },
      }
    }

    return {
      data: await getCandidateList(),
      meta: { source: 'mysql', version: 'v1' },
    }
  })

  app.get('/api/v1/candidates/detail', async () => ({
    data: await getCandidateDetails(),
    meta: { source: 'mysql', version: 'v1' },
  }))

  app.get('/api/v1/stocks/:stockCode', async (request) => {
    const params = request.params as { stockCode: string }

    const detail = await getStockDetail(params.stockCode)
    if (!detail) {
      return {
        data: null,
        meta: { source: 'mysql', version: 'v1' },
      }
    }

    return {
      data: detail,
      meta: { source: 'mysql', version: 'v1' },
    }
  })

  app.get('/api/v1/diagnoses', async (request) => {
    const query = request.query as Record<string, unknown>

    return {
      data: await getDiagnosisList(typeof query.keyword === 'string' ? query.keyword : undefined),
      meta: { source: 'mysql', version: 'v1' },
    }
  })

  app.get('/api/v1/reviews/latest', async () => ({
    data: await getLatestReview(),
    meta: { source: 'mysql', version: 'v1' },
  }))

  app.post('/api/v1/auth/trial-login', async (request) => {
    const body = request.body as Record<string, unknown>

    return {
      data: await loginTrialUser({
        userCode: typeof body.userCode === 'string' ? body.userCode : undefined,
        nickname: typeof body.nickname === 'string' ? body.nickname : undefined,
        mobile: typeof body.mobile === 'string' ? body.mobile : undefined,
      }),
      meta: { source: 'mysql', version: 'v1' },
    }
  })

  app.post('/api/v1/auth/register', async (request, reply) => {
    const body = request.body as Record<string, unknown>

    try {
      return {
        data: await registerUserAccount({
          userCode: typeof body.userCode === 'string' ? body.userCode : undefined,
          mobile: typeof body.mobile === 'string' ? body.mobile : undefined,
          nickname: typeof body.nickname === 'string' ? body.nickname : undefined,
          password: typeof body.password === 'string' ? body.password : '',
          roleCode: typeof body.roleCode === 'string' ? body.roleCode : undefined,
        }),
        meta: { source: 'mysql', version: 'v1' },
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'ACCOUNT_EXISTS') {
        reply.code(409)
      } else if (error instanceof Error && error.message === 'INVALID_PASSWORD') {
        reply.code(400)
      } else {
        reply.code(500)
      }

      return {
        data: null,
        meta: { source: 'mysql', version: 'v1' },
      }
    }
  })

  app.post('/api/v1/auth/login', async (request, reply) => {
    const body = request.body as Record<string, unknown>

    try {
      return {
        data: await loginUserAccount({
          userCode: typeof body.userCode === 'string' ? body.userCode : undefined,
          mobile: typeof body.mobile === 'string' ? body.mobile : undefined,
          password: typeof body.password === 'string' ? body.password : '',
        }),
        meta: { source: 'mysql', version: 'v1' },
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
        reply.code(401)
      }

      return {
        data: null,
        meta: { source: 'mysql', version: 'v1' },
      }
    }
  })

  app.post('/api/v1/auth/logout', async (request, reply) => {
    const result = await revokeAuthSession(request)
    if (!result.removed) {
      reply.code(401)
    }

    return {
      data: result,
      meta: { source: 'mysql', version: 'v1' },
    }
  })

  app.post('/api/v1/auth/refresh', async (request, reply) => {
    try {
      return {
        data: await refreshAuthSession(request),
        meta: { source: 'mysql', version: 'v1' },
      }
    } catch {
      reply.code(401)
      return {
        data: null,
        meta: { source: 'mysql', version: 'v1' },
      }
    }
  })

  app.post('/api/v1/users/password', async (request, reply) => {
    const body = request.body as Record<string, unknown>

    try {
      return {
        data: await changeCurrentUserPassword(request, {
          currentPassword: typeof body.currentPassword === 'string' ? body.currentPassword : '',
          newPassword: typeof body.newPassword === 'string' ? body.newPassword : '',
        }),
        meta: { source: 'mysql', version: 'v1' },
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
        reply.code(401)
      } else if (error instanceof Error && error.message === 'INVALID_PASSWORD') {
        reply.code(400)
      } else if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        reply.code(401)
      } else {
        reply.code(500)
      }

      return {
        data: null,
        meta: { source: 'mysql', version: 'v1' },
      }
    }
  })

  app.get('/api/v1/users/profile', async (request, reply) => {
    const session = await requireAuthSession(request).catch(() => null)
    if (!session) {
      reply.code(401)
      return {
        data: null,
        meta: { source: 'mysql', version: 'v1' },
      }
    }

    return {
      data: await getUserProfile(session.userId),
      meta: { source: 'mysql', version: 'v1' },
    }
  })

  app.get('/api/v1/watchlist', async (request, reply) => {
    const session = await requireAuthSession(request).catch(() => null)
    if (!session) {
      reply.code(401)
      return {
        data: [],
        meta: { source: 'mysql', version: 'v1' },
      }
    }

    return {
      data: await getWatchlistItems(session.userId),
      meta: { source: 'mysql', version: 'v1' },
    }
  })

  app.post('/api/v1/watchlist', async (request, reply) => {
    const session = await requireAuthSession(request).catch(() => null)
    if (!session) {
      reply.code(401)
      return {
        data: null,
        error: '请先登录',
        meta: { source: 'mysql', version: 'v1' },
      }
    }

    const userId = Number(session.user.id)
    console.log('[Watchlist] User ID:', userId, 'session:', typeof session.user)
    // 检查自选数量限制
    const currentWatchlist = await getWatchlistItems(userId)
    const { enforceWatchlistLimit } = await import('../../lib/middleware.js')
    const limitEnforced = await enforceWatchlistLimit(request as any, reply, currentWatchlist.length, session)
    
    if (!limitEnforced) {
      return // 中间件已返回错误响应
    }

    const body = request.body as Record<string, unknown>

    return {
      data: await upsertWatchlistItem({
        userId: userId,
        stockCode: typeof body.stockCode === 'string' ? body.stockCode : '',
        stockName: typeof body.stockName === 'string' ? body.stockName : '',
        sectorName: typeof body.sectorName === 'string' ? body.sectorName : undefined,
        reason: typeof body.reason === 'string' ? body.reason : undefined,
        advice: typeof body.advice === 'string' ? body.advice : undefined,
        status: typeof body.status === 'string' ? body.status : undefined,
        statusKey: typeof body.statusKey === 'string' ? body.statusKey : undefined,
      }),
      meta: { source: 'mysql', version: 'v1' },
    }
  })

  app.patch('/api/v1/watchlist/:stockCode', async (request, reply) => {
    const session = await requireAuthSession(request).catch(() => null)
    if (!session) {
      reply.code(401)
      return {
        data: null,
        meta: { source: 'mysql', version: 'v1' },
      }
    }

    const params = request.params as { stockCode: string }
    const body = request.body as Record<string, unknown>

    return {
      data: await updateWatchlistItem({
        userId: session.userId,
        stockCode: params.stockCode,
        status: typeof body.status === 'string' ? body.status : undefined,
        statusKey: typeof body.statusKey === 'string' ? body.statusKey : undefined,
        reason: typeof body.reason === 'string' ? body.reason : undefined,
        advice: typeof body.advice === 'string' ? body.advice : undefined,
        sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : undefined,
      }),
      meta: { source: 'mysql', version: 'v1' },
    }
  })

  app.delete('/api/v1/watchlist/:stockCode', async (request, reply) => {
    const session = await requireAuthSession(request).catch(() => null)
    if (!session) {
      reply.code(401)
      return {
        data: { removed: false },
        meta: { source: 'mysql', version: 'v1' },
      }
    }

    const params = request.params as { stockCode: string }

    return {
      data: await deleteWatchlistItem(params.stockCode, session.userId),
      meta: { source: 'mysql', version: 'v1' },
    }
  })
}