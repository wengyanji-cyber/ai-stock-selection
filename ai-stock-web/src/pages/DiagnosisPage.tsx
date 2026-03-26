import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDiagnoses } from '../hooks/useDiagnoses'

// 评分圆环
function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 36
  const c = 2 * Math.PI * r
  const o = c - (score / 100) * c
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto' }}>
        <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          fontSize: '20px', fontWeight: 'bold', color }}>{score}</div>
      </div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: 4 }}>{label}</div>
    </div>
  )
}

// 评级
function getRating(s: number) {
  if (s >= 90) return { l: 'S', c: '#8b5cf6', a: '强烈买入' }
  if (s >= 80) return { l: 'A', c: '#22c55e', a: '买入' }
  if (s >= 70) return { l: 'B', c: '#3b82f6', a: '持有' }
  if (s >= 60) return { l: 'C', c: '#f59e0b', a: '观望' }
  return { l: 'D', c: '#ef4444', a: '回避' }
}

// 模拟数据
const mock: Record<string, any> = {
  '300750': { score: 85, tech: 88, fund: 75, cap: 90, sent: 82, trend: 'up', str: '强', sup: [185, 180], press: [200, 210], sl: 175, tgt: 220 },
}

// mock股票列表
const mockStocks = [
  { code: '300750', name: '宁德时代', sector: '新能源', summary: '全球领先动力电池制造商' },
  { code: '000001', name: '平安银行', sector: '银行', summary: '全国性股份制商业银行' },
  { code: '000858', name: '五粮液', sector: '白酒', summary: '高端白酒龙头企业' },
  { code: '002594', name: '比亚迪', sector: '汽车', summary: '新能源汽车领军企业' },
]

export default function DiagnosisPage() {
  const [sp, setSp] = useSearchParams()
  const [kw, setKw] = useState('')
  const [code, setCode] = useState(sp.get('code') || '300750')

  // 过滤股票列表
  const list = useMemo(() => {
    if (!kw) return mockStocks
    return mockStocks.filter(s => 
      s.name.includes(kw) || s.code.includes(kw) || s.sector.includes(kw)
    )
  }, [kw])

  const sel = useMemo(() => list.find(i => i.code === code) || mockStocks[0], [list, code])
  const d = useMemo(() => {
    if (!sel) return null
    return mock[sel.code] || { score: 70, tech: 72, fund: 68, cap: 70, sent: 70, trend: 'neutral', str: '中', sup: [50], press: [60], sl: 45, tgt: 70 }
  }, [sel])

  if (!sel || !d) return <div className="page-stack"><div className="panel-card"><p>暂无数据</p></div></div>

  const r = getRating(d.score)

  return (
    <div className="page-stack">
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>AI个股诊断</h1>
        <p style={{ color: '#6b7280' }}>多维度智能分析</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* 左侧 */}
        <div className="panel-card">
          <div className="section-kicker">股票列表</div>
          <input value={kw} onChange={e => setKw(e.target.value)} placeholder="搜索"
            style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            {list.map(i => (
              <button key={i.code} onClick={() => { setCode(i.code); setSp({ code: i.code }) }}
                style={{ width: '100%', padding: 12, marginBottom: 8, textAlign: 'left',
                  border: sel.code === i.code ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  borderRadius: 8, background: sel.code === i.code ? '#eff6ff' : 'white', cursor: 'pointer' }}>
                <div style={{ fontWeight: 'bold' }}>{i.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{i.code}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 右侧 */}
        <div className="panel-card">
          {/* 头部 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0 }}>{sel.name} <span style={{ fontSize: 14, color: '#6b7280' }}>{sel.code}</span></h2>
              <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>{sel.summary}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: r.c,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                fontSize: 28, fontWeight: 'bold', margin: '0 auto 4px' }}>{r.l}</div>
              <div style={{ fontSize: 12, color: r.c, fontWeight: 'bold' }}>{r.a}</div>
            </div>
          </div>

          {/* 综合评分 */}
          <div style={{ textAlign: 'center', padding: 20, background: '#f9fafb', borderRadius: 12, marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: '#6b7280' }}>综合评分</div>
            <div style={{ fontSize: 48, fontWeight: 'bold', color: r.c }}>{d.score}</div>
          </div>

          {/* 维度 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            <ScoreRing score={d.tech} label="技术面" color="#3b82f6" />
            <ScoreRing score={d.fund} label="基本面" color="#22c55e" />
            <ScoreRing score={d.cap} label="资金面" color="#f59e0b" />
            <ScoreRing score={d.sent} label="情绪面" color="#8b5cf6" />
          </div>

          {/* 趋势 */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, padding: 12, background: '#f3f4f6', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>趋势</div>
              <div style={{ fontWeight: 'bold', color: d.trend === 'up' ? '#ef4444' : '#22c55e' }}>
                {d.trend === 'up' ? '上涨' : d.trend === 'down' ? '下跌' : '震荡'}
              </div>
            </div>
            <div style={{ flex: 1, padding: 12, background: '#f3f4f6', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>强度</div>
              <div style={{ fontWeight: 'bold' }}>{d.str}</div>
            </div>
          </div>

          {/* 技术位 */}
          <div className="section-kicker">关键技术位</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 12 }}>
            <div style={{ padding: 12, background: '#fef2f2', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>支撑位</div>
              <div style={{ fontWeight: 'bold', color: '#ef4444' }}>{d.sup.join(' / ')}</div>
            </div>
            <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>压力位</div>
              <div style={{ fontWeight: 'bold', color: '#22c55e' }}>{d.press.join(' / ')}</div>
            </div>
            <div style={{ padding: 12, background: '#fef3c7', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>止损位</div>
              <div style={{ fontWeight: 'bold', color: '#f59e0b' }}>{d.sl}</div>
            </div>
            <div style={{ padding: 12, background: '#eff6ff', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>目标价</div>
              <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>{d.tgt}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
