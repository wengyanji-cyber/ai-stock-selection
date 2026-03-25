import { env } from '../config/env.js'

export interface TushareDaily {
  ts_code: string
  trade_date: string
  open: number
  high: number
  low: number
  close: number
  pre_close: number
  change: number
  pct_chg: number
  vol: number
  amount: number
}

export interface TushareStockBasic {
  ts_code: string
  symbol: string
  name: string
  area: string
  industry: string
  market: string
  list_date: string
}

export interface TushareResponse<T> {
  code: number
  msg: string
  data: {
    items: T[]
    fields: string[]
  }
}

async function request<T>(api: string, params: Record<string, unknown>): Promise<T> {
  const response = await fetch(env.TUSHARE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_name: api,
      token: env.TUSHARE_TOKEN,
      params,
    }),
  })

  const result = await response.json() as TushareResponse<T>

  if (result.code !== 0) {
    throw new Error(`Tushare API error: ${result.msg}`)
  }

  return result.data.items as unknown as T
}

export async function fetchStockBasic() {
  return request<TushareStockBasic>('stock_basic', {
    exchange: '',
    list_status: 'L',
    fields: 'ts_code,symbol,name,area,industry,market,list_date',
  })
}

export async function fetchDailyBasic(tradeDate: string, tsCode?: string) {
  return request<TushareDaily>('daily_basic', {
    ts_code: tsCode,
    trade_date: tradeDate,
    fields: 'ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg,vol,amount',
  })
}

export async function fetchDaily(tradeDate: string, tsCode?: string) {
  return request<TushareDaily>('daily', {
    ts_code: tsCode,
    trade_date: tradeDate,
    fields: 'ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg,vol,amount',
  })
}

export function parseTradeDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '')
}

export function formatAmount(amount: number): number {
  return Number((amount / 1000).toFixed(2))
}
