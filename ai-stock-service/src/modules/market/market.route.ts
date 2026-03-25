import { FastifyInstance } from 'fastify'
import { deleteWatchlistItem, getCandidateList, getMarketOverview, getWatchlistItems, getWebDemoData, upsertWatchlistItem } from './market.service.js'

export async function registerMarketRoutes(app: FastifyInstance) {
  app.get('/api/v1/web/demo-data', async () => ({
    data: await getWebDemoData(),
    meta: { source: 'mysql', version: 'v1' },
  }))

  app.get('/api/v1/market/overview', async () => ({
    data: await getMarketOverview(),
    meta: { source: 'mysql', version: 'v1' },
  }))

  app.get('/api/v1/candidates', async () => ({
    data: await getCandidateList(),
    meta: { source: 'mysql', version: 'v1' },
  }))

  app.get('/api/v1/watchlist', async () => ({
    data: await getWatchlistItems(),
    meta: { source: 'mysql', version: 'v1' },
  }))

  app.post('/api/v1/watchlist', async (request) => {
    const body = request.body as Record<string, unknown>

    return {
      data: await upsertWatchlistItem({
        stockCode: typeof body.stockCode === 'string' ? body.stockCode : '',
        stockName: typeof body.stockName === 'string' ? body.stockName : '',
        sectorName: typeof body.sectorName === 'string' ? body.sectorName : undefined,
        reason: typeof body.reason === 'string' ? body.reason : undefined,
        advice: typeof body.advice === 'string' ? body.advice : undefined,
      }),
      meta: { source: 'mysql', version: 'v1' },
    }
  })

  app.delete('/api/v1/watchlist/:stockCode', async (request) => {
    const params = request.params as { stockCode: string }

    return {
      data: await deleteWatchlistItem(params.stockCode),
      meta: { source: 'mysql', version: 'v1' },
    }
  })
}