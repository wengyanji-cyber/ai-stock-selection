import { FastifyInstance } from 'fastify'
import { syncAllStocks, syncDailyData, getStockList } from './data.service.js'

export async function registerDataRoutes(app: FastifyInstance) {
  app.post('/api/v1/data/sync-stocks', async () => {
    const result = await syncAllStocks()
    return {
      data: result,
      meta: { source: 'tushare', version: 'v1' },
    }
  })

  app.post('/api/v1/data/sync-daily', async (request) => {
    const body = request.body as { tradeDate?: string }
    const result = await syncDailyData(body.tradeDate)
    return {
      data: result,
      meta: { source: 'tushare', version: 'v1' },
    }
  })

  app.get('/api/v1/data/stocks', async () => {
    const stocks = await getStockList()
    return {
      data: stocks,
      meta: { source: 'tushare', version: 'v1' },
    }
  })
}
