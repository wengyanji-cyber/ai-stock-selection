import { prisma } from '../../lib/prisma.js'
import * as tushare from '../../lib/tushare.js'

export async function syncAllStocks() {
  console.log('[Tushare] 开始同步股票列表...')
  
  const result = await tushare.fetchStockBasic()
  const stocks = Array.isArray(result) ? result : []
  
  let created = 0
  let updated = 0

  for (const stock of stocks) {
    const existing = await prisma.marketDailyBar.findFirst({
      where: { stockCode: stock.ts_code },
    })

    if (existing) {
      await prisma.marketDailyBar.update({
        where: { id: existing.id },
        data: {
          stockName: stock.name,
          sectorName: stock.industry,
        },
      })
      updated++
    } else {
      await prisma.marketDailyBar.create({
        data: {
          tradeDate: new Date(),
          stockCode: stock.ts_code,
          stockName: stock.name,
          sectorName: stock.industry,
        },
      })
      created++
    }
  }

  console.log(`[Tushare] 同步完成：新增 ${created} 只，更新 ${updated} 只`)
  return { created, updated }
}

export async function syncDailyData(tradeDate?: string) {
  const date = tradeDate || tushare.parseTradeDate(new Date())
  console.log(`[Tushare] 开始同步 ${date} 行情数据...`)

  try {
    const result = await tushare.fetchDaily(date)
    const dailyData = Array.isArray(result) ? result : []
    
    let count = 0
    for (const item of dailyData) {
      await prisma.marketDailyBar.upsert({
        where: {
          tradeDate_stockCode: {
            tradeDate: new Date(`${item.trade_date.slice(0, 4)}-${item.trade_date.slice(4, 6)}-${item.trade_date.slice(6, 8)}`),
            stockCode: item.ts_code,
          },
        },
        update: {
          stockName: item.ts_code,
          openPrice: item.open ? (item.open / 100).toFixed(4) : null,
          highPrice: item.high ? (item.high / 100).toFixed(4) : null,
          lowPrice: item.low ? (item.low / 100).toFixed(4) : null,
          closePrice: item.close ? (item.close / 100).toFixed(4) : null,
          amount: item.amount ? tushare.formatAmount(item.amount) : null,
          extraMetrics: {
            pct_chg: item.pct_chg,
            vol: item.vol,
            provider: 'tushare',
          },
        },
        create: {
          tradeDate: new Date(`${item.trade_date.slice(0, 4)}-${item.trade_date.slice(4, 6)}-${item.trade_date.slice(6, 8)}`),
          stockCode: item.ts_code,
          stockName: item.ts_code,
          openPrice: item.open ? (item.open / 100).toFixed(4) : null,
          highPrice: item.high ? (item.high / 100).toFixed(4) : null,
          lowPrice: item.low ? (item.low / 100).toFixed(4) : null,
          closePrice: item.close ? (item.close / 100).toFixed(4) : null,
          amount: item.amount ? tushare.formatAmount(item.amount) : null,
          extraMetrics: {
            pct_chg: item.pct_chg,
            vol: item.vol,
            provider: 'tushare',
          },
        },
      })
      count++
    }

    console.log(`[Tushare] 同步完成：${count} 条记录`)
    return { count, tradeDate: date }
  } catch (error) {
    console.error('[Tushare] 同步失败:', error)
    throw error
  }
}

export async function getStockList() {
  const stocks = await prisma.marketDailyBar.findMany({
    select: {
      stockCode: true,
      stockName: true,
      sectorName: true,
    },
    distinct: ['stockCode'],
    orderBy: { stockCode: 'asc' },
  })

  return stocks
}
