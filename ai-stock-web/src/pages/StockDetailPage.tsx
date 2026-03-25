import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ContentPanel from '../components/ContentPanel'
import PageHero from '../components/PageHero'

type StockDetail = {
  stockCode: string
  stockName: string
  sectorName: string
  currentPrice: number
  changeRate: number
  amount: number
  diagnosis: {
    totalScore: number
    biasLabel: string
    trendLabel: string
    riskLabel: string
    summary: string
    observe: string
    support: string
    pressure: string
    stopLoss: string
    action: string
  } | null
  signal: {
    signalLevel: string
    score: number
    riskScore: number
    holdingWindow: string
    driverSummary: string
  } | null
  factors: Record<string, unknown> | null
}

async function fetchStockDetail(stockCode: string) {
  const response = await fetch(`http://106.52.6.176:3010/api/v1/stocks/${stockCode}`)
  const payload = await response.json()
  return payload.data as StockDetail | null
}

function StockDetailPage() {
  const { stockCode } = useParams<{ stockCode: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<StockDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      if (!stockCode) {
        setError('股票代码缺失')
        setLoading(false)
        return
      }

      try {
        const detail = await fetchStockDetail(stockCode)
        if (!detail) {
          setError('未找到该股票信息')
        } else {
          setData(detail)
        }
      } catch {
        setError('加载失败')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [stockCode])

  if (loading) {
    return (
      <div className="page-stack">
        <PageHero eyebrow="个股详情" title="加载中..." />
        <div className="panel-card">正在获取股票数据...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="page-stack">
        <PageHero eyebrow="个股详情" title="加载失败" />
        <div className="panel-card error-card">{error || '未找到数据'}</div>
        <button className="action-button" onClick={() => navigate('/candidates')}>
          返回候选池
        </button>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="个股详情"
        title={`${data.stockName} (${data.stockCode})`}
        description={data.sectorName}
        tags={[
          data.signal?.signalLevel || '观察中',
          data.diagnosis?.trendLabel || '',
          data.diagnosis?.riskLabel || '',
        ].filter(Boolean)}
        metrics={[
          { value: `${data.currentPrice.toFixed(2)}`, label: '当前价' },
          { value: `${(data.changeRate * 100).toFixed(2)}%`, label: '涨跌幅' },
          { value: `${(data.amount / 100000000).toFixed(2)}亿`, label: '成交额' },
          { value: data.diagnosis ? data.diagnosis.totalScore.toFixed(0) : '-', label: '综合评分' },
        ]}
      />

      <section className="content-grid">
        {data.signal && (
          <ContentPanel kicker="信号评级">
            <div className="stack-list">
              <div className="info-card">
                <div className="card-head">
                  <h2>{data.signal.signalLevel}</h2>
                  <span className={`badge ${data.signal.signalLevel.includes('重点') ? 'brand' : 'accent'}`}>
                    {data.signal.signalLevel}
                  </span>
                </div>
                <p>{data.signal.driverSummary}</p>
                <div className="meta-text">
                  评分：{data.signal.score.toFixed(1)} | 风险：{data.signal.riskScore.toFixed(0)} | 持有窗口：{data.signal.holdingWindow}
                </div>
              </div>
            </div>
          </ContentPanel>
        )}

        {data.diagnosis && (
          <ContentPanel kicker="诊断报告">
            <div className="stack-list compact-top-gap">
              <label className="form-field">
                <span>核心结论</span>
                <div className="note-card">{data.diagnosis.summary}</div>
              </label>
              <label className="form-field">
                <span>观察要点</span>
                <div className="note-card">{data.diagnosis.observe}</div>
              </label>
              <label className="form-field">
                <span>支撑位</span>
                <div className="note-card">{data.diagnosis.support || '待补充'}</div>
              </label>
              <label className="form-field">
                <span>压力位</span>
                <div className="note-card">{data.diagnosis.pressure || '待补充'}</div>
              </label>
              <label className="form-field">
                <span>止损策略</span>
                <div className="note-card">{data.diagnosis.stopLoss}</div>
              </label>
              <label className="form-field">
                <span>操作建议</span>
                <div className="note-card primary">{data.diagnosis.action}</div>
              </label>
            </div>
          </ContentPanel>
        )}

        <ContentPanel kicker="风险提示">
          <ul className="bullet-list">
            {data.factors && Array.isArray((data.factors as { risks?: string[] }).risks)
              ? (data.factors as { risks: string[] }).risks.map((risk, i) => <li key={i}>{risk}</li>)
              : [
                  <li key={1}>以上分析基于公开数据，不构成投资建议。</li>,
                  <li key={2}>股市有风险，入市需谨慎。</li>,
                  <li key={3}>请结合自身风险承受能力独立决策。</li>,
                ]}
          </ul>
        </ContentPanel>
      </section>

      <div className="panel-card">
        <button className="action-button" onClick={() => navigate('/candidates')}>
          返回候选池
        </button>
      </div>
    </div>
  )
}

export default StockDetailPage
