import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ContentPanel from '../components/ContentPanel'
import PageHero from '../components/PageHero'

type TrendPrediction = {
  stockCode: string
  stockName: string
  currentPrice: number
  trend1d: 'up' | 'down' | 'neutral'
  trend3d: 'up' | 'down' | 'neutral'
  trend5d: 'up' | 'down' | 'neutral'
  confidence: number
  supportLevel: number
  resistanceLevel: number
  targetPrice: number
  stopLoss: number
}

const mockPredictions: TrendPrediction[] = [
  {
    stockCode: '600519',
    stockName: '贵州茅台',
    currentPrice: 1789.50,
    trend1d: 'up',
    trend3d: 'up',
    trend5d: 'neutral',
    confidence: 85,
    supportLevel: 1750,
    resistanceLevel: 1850,
    targetPrice: 1850,
    stopLoss: 1720,
  },
  {
    stockCode: '000858',
    stockName: '五 粮 液',
    currentPrice: 156.80,
    trend1d: 'up',
    trend3d: 'neutral',
    trend5d: 'down',
    confidence: 72,
    supportLevel: 150,
    resistanceLevel: 165,
    targetPrice: 165,
    stopLoss: 148,
  },
  {
    stockCode: '300750',
    stockName: '宁德时代',
    currentPrice: 198.60,
    trend1d: 'neutral',
    trend3d: 'up',
    trend5d: 'up',
    confidence: 78,
    supportLevel: 190,
    resistanceLevel: 210,
    targetPrice: 210,
    stopLoss: 185,
  },
  {
    stockCode: '601318',
    stockName: '中国平安',
    currentPrice: 45.20,
    trend1d: 'down',
    trend3d: 'neutral',
    trend5d: 'neutral',
    confidence: 65,
    supportLevel: 43,
    resistanceLevel: 48,
    targetPrice: 48,
    stopLoss: 42,
  },
]

function TrendPage() {
  const [predictions, setPredictions] = useState<TrendPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStock, setSelectedStock] = useState<string>('')

  useEffect(() => {
    // 模拟加载数据
    setTimeout(() => {
      setPredictions(mockPredictions)
      setLoading(false)
    }, 500)
  }, [])

  function getTrendIcon(trend: 'up' | 'down' | 'neutral') {
    switch (trend) {
      case 'up': return '▲'
      case 'down': return '▼'
      default: return '➜'
    }
  }

  function getTrendColor(trend: 'up' | 'down' | 'neutral') {
    switch (trend) {
      case 'up': return '#ef4444'
      case 'down': return '#22c55e'
      default: return '#6b7280'
    }
  }

  function getConfidenceLevel(confidence: number) {
    if (confidence >= 80) return { level: '高', color: '#22c55e' }
    if (confidence >= 60) return { level: '中', color: '#f59e0b' }
    return { level: '低', color: '#ef4444' }
  }

  const selectedData = predictions.find(p => p.stockCode === selectedStock)

  if (loading) {
    return (
      <div className="page-stack">
        <section className="panel-card">
          <div className="section-kicker">趋势预测</div>
          <p>⏳ 正在加载预测数据...</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="趋势预测"
        title="基于技术指标与历史形态，预测股票短期走势。"
        description="结合 MACD、RSI、均线等多维度指标，通过历史相似形态匹配，提供 1 日/3 日/5 日趋势预测。"
        compact
      />

      <section className="content-grid">
        <ContentPanel kicker="预测列表">
          <div className="stack-list">
            {predictions.map((item) => (
              <div 
                key={item.stockCode} 
                className={`info-card ${selectedStock === item.stockCode ? 'selected' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedStock(item.stockCode)}
              >
                <div className="card-head">
                  <div>
                    <h2>{item.stockName}</h2>
                    <p className="meta-text">{item.stockCode} · ¥{item.currentPrice.toFixed(2)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: getTrendColor(item.trend1d), fontSize: '20px', fontWeight: 'bold' }}>
                      {getTrendIcon(item.trend1d)} 1 日
                    </div>
                    <div style={{ color: getTrendColor(item.trend3d), fontSize: '14px' }}>
                      {getTrendIcon(item.trend3d)} 3 日
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <span className="badge brand">置信度 {item.confidence}%</span>
                  <span className="badge">支撑 ¥{item.supportLevel}</span>
                  <span className="badge">压力 ¥{item.resistanceLevel}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="note-card">
            💡 点击股票查看详细信息，预测数据仅供参考，不构成投资建议。
          </div>
        </ContentPanel>

        {selectedData && (
          <ContentPanel kicker="详细预测">
            <div className="info-card">
              <div className="card-head">
                <h2>{selectedData.stockName} ({selectedData.stockCode})</h2>
                <span className="badge brand">置信度 {selectedData.confidence}%</span>
              </div>
              
              <div style={{ margin: '20px 0' }}>
                <h3 style={{ marginBottom: '12px' }}>📊 趋势预测</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', color: getTrendColor(selectedData.trend1d), fontWeight: 'bold' }}>
                      {getTrendIcon(selectedData.trend1d)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>1 日趋势</div>
                  </div>
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', color: getTrendColor(selectedData.trend3d), fontWeight: 'bold' }}>
                      {getTrendIcon(selectedData.trend3d)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>3 日趋势</div>
                  </div>
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', color: getTrendColor(selectedData.trend5d), fontWeight: 'bold' }}>
                      {getTrendIcon(selectedData.trend5d)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>5 日趋势</div>
                  </div>
                </div>
              </div>

              <div style={{ margin: '20px 0' }}>
                <h3 style={{ marginBottom: '12px' }}>🎯 目标价位</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div style={{ padding: '12px', background: '#dcfce7', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#166534' }}>目标价</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#15803d' }}>¥{selectedData.targetPrice}</div>
                  </div>
                  <div style={{ padding: '12px', background: '#fee2e2', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#991b1b' }}>止损价</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#b91c1c' }}>¥{selectedData.stopLoss}</div>
                  </div>
                </div>
              </div>

              <div style={{ margin: '20px 0' }}>
                <h3 style={{ marginBottom: '12px' }}>📈 关键价位</h3>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div>
                    <span className="meta-text">支撑位</span>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>¥{selectedData.supportLevel}</div>
                  </div>
                  <div>
                    <span className="meta-text">压力位</span>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>¥{selectedData.resistanceLevel}</div>
                  </div>
                  <div>
                    <span className="meta-text">当前价</span>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>¥{selectedData.currentPrice}</div>
                  </div>
                </div>
              </div>

              <div className="note-card primary">
                💡 基于技术指标（MACD、RSI、均线）与历史相似形态匹配，置信度{getConfidenceLevel(selectedData.confidence).level}。
              </div>
            </div>
          </ContentPanel>
        )}
      </section>

      <section className="panel-card">
        <div className="section-kicker">使用说明</div>
        <ul className="bullet-list">
          <li><strong>趋势预测</strong>：基于技术指标和历史形态的短期走势预测，仅供参考。</li>
          <li><strong>置信度</strong>：表示预测的可靠程度，建议关注置信度 70% 以上的预测。</li>
          <li><strong>支撑位/压力位</strong>：关键技术价位，可作为参考进行仓位管理。</li>
          <li><strong>风险提示</strong>：股市有风险，预测不构成投资建议，请独立判断。</li>
        </ul>
      </section>
    </div>
  )
}

export default TrendPage
