import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const marketIndices = [
  { name: '上证指数', price: 3052.34, change: 25.68, changePct: 0.85, amount: 3256 },
  { name: '深证成指', price: 9876.54, change: 120.35, changePct: 1.23, amount: 4125 },
  { name: '创业板指', price: 1987.65, change: -8.92, changePct: -0.45, amount: 1856 },
  { name: '科创50', price: 876.54, change: 18.45, changePct: 2.15, amount: 892 },
]

const hotSectors = [
  { name: '半导体', change: 5.32, leader: '中芯国际' },
  { name: '新能源', change: 3.87, leader: '宁德时代' },
  { name: '医药生物', change: 2.15, leader: '药明康德' },
  { name: '银行', change: -0.52, leader: '招商银行' },
  { name: '白酒', change: -1.25, leader: '贵州茅台' },
]

export default function MarketOverviewPage() {
  const [loading, setLoading] = useState(true)
  useEffect(() => { setTimeout(() => setLoading(false), 500) }, [])

  if (loading) {
    return (
      <div className="page-stack">
        <div className="panel-card"><p>加载中...</p></div>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>今日市场一览</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>2026年3月26日</p>
      </div>

      {/* 大盘指数 */}
      <section className="panel-card" style={{ marginBottom: '16px' }}>
        <div className="section-kicker">大盘指数</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '12px' }}>
          {marketIndices.map((idx) => (
            <div key={idx.name} style={{
              padding: '16px',
              background: idx.change >= 0 ? '#fef2f2' : '#f0fdf4',
              borderRadius: '12px',
              border: `1px solid ${idx.change >= 0 ? '#fecaca' : '#bbf7d0'}`,
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>{idx.name}</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{idx.price.toFixed(2)}</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <span style={{ color: idx.change >= 0 ? '#ef4444' : '#22c55e', fontWeight: 'bold' }}>
                  {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)}
                </span>
                <span style={{
                  padding: '2px 8px', borderRadius: '4px', fontSize: '12px',
                  background: idx.change >= 0 ? '#ef4444' : '#22c55e', color: 'white',
                }}>
                  {idx.change >= 0 ? '+' : ''}{idx.changePct}%
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>成交额 {idx.amount}亿</div>
            </div>
          ))}
        </div>
      </section>

      {/* 市场概况 */}
      <section className="panel-card" style={{ marginBottom: '16px' }}>
        <div className="section-kicker">市场概况</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '12px' }}>
          <div style={{ textAlign: 'center', padding: '16px', background: '#f3f4f6', borderRadius: '12px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>涨跌比</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>1.8:1</div>
            <div style={{ fontSize: '12px', color: '#22c55e' }}>涨多跌少</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: '#f3f4f6', borderRadius: '12px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>涨停/跌停</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
              <span style={{ color: '#ef4444' }}>45</span>
              <span style={{ color: '#6b7280', margin: '0 4px' }}>/</span>
              <span style={{ color: '#22c55e' }}>8</span>
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: '#f3f4f6', borderRadius: '12px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>主力净流入</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>+125亿</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>北向 +25亿</div>
          </div>
        </div>
      </section>

      {/* 板块热度 */}
      <section className="panel-card">
        <div className="section-kicker">板块热度</div>
        <div style={{ marginTop: '12px' }}>
          {hotSectors.map((sector, i) => (
            <div key={sector.name} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0',
              borderBottom: i < hotSectors.length - 1 ? '1px solid #e5e7eb' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#9ca3af', width: '20px' }}>{i + 1}</span>
                <span style={{ fontWeight: 'bold' }}>{sector.name}</span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{sector.leader}</span>
              </div>
              <div style={{ color: sector.change >= 0 ? '#ef4444' : '#22c55e', fontWeight: 'bold' }}>
                {sector.change >= 0 ? '+' : ''}{sector.change}%
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
