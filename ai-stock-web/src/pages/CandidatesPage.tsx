import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCandidates } from '../hooks/useCandidates'

function CandidatesPage() {
  const navigate = useNavigate()
  const { items, source, error } = useCandidates()
  const [sectorFilter, setSectorFilter] = useState('全部板块')
  const [levelFilter, setLevelFilter] = useState('全部层级')

  const sectorOptions = useMemo(
    () => ['全部板块', ...new Set(items.map((candidate) => candidate.sector))],
    [items],
  )

  const levelOptions = useMemo(
    () => ['全部层级', ...new Set(items.map((candidate) => candidate.level))],
    [items],
  )

  const filteredCandidates = useMemo(
    () =>
      items.filter((candidate) => {
        const sectorMatched = sectorFilter === '全部板块' || candidate.sector === sectorFilter
        const levelMatched = levelFilter === '全部层级' || candidate.level === levelFilter
        return sectorMatched && levelMatched
      }),
    [items, levelFilter, sectorFilter],
  )

  return (
    <div className="page-stack">
      <section className="hero-panel slim-hero">
        <div className="hero-copy">
          <span className="eyebrow">候选池</span>
          <h1>精选少量高质量候选，拒绝信息过载</h1>
          <p>通过板块热度和优先级筛选，帮你快速找到值得关注的股票，再做深入分析。</p>
        </div>
      </section>
      <section className="panel-card filter-panel">
        <div className="section-kicker">筛选器</div>
        <div className="filter-grid">
          <label className="form-field">
            <span>按板块筛选</span>
            <select value={sectorFilter} onChange={(event) => setSectorFilter(event.target.value)}>
              {sectorOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>按层级筛选</span>
            <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
              {levelOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <div className="data-card compact-stat">
            <strong>{filteredCandidates.length}</strong>
            <span>当前候选数</span>
          </div>
        </div>
        <div className="note-card">💡 {source === 'api' ? '实时行情' : '本地缓存'}</div>
        {error ? <div className="note-card error-card">加载候选池失败，请刷新页面重试。</div> : null}
      </section>
      <section className="stack-list">
        {filteredCandidates.map((candidate) => (
          <article className="panel-card" key={candidate.code}>
            <div className="card-head">
              <div>
                <h2>
                  {candidate.name} <span className="tiny-code">{candidate.code}</span>
                </h2>
                <p>{candidate.summary}</p>
              </div>
              <div className="badge-group">
                <span className={`badge ${candidate.style}`}>{candidate.level}</span>
                <span className="soft-chip">{candidate.riskLevel}</span>
              </div>
            </div>
            <div className="data-grid">
              <div className="data-card"><strong>观察区间</strong><span>{candidate.observe}</span></div>
              <div className="data-card"><strong>支撑位</strong><span>{candidate.support}</span></div>
              <div className="data-card"><strong>压力位</strong><span>{candidate.pressure}</span></div>
              <div className="data-card"><strong>止损位</strong><span>{candidate.stopLoss}</span></div>
            </div>
            <ul className="bullet-list">
              {candidate.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <div className="note-card">失效条件：{candidate.invalid}</div>
            <div className="action-row">
              <button className="secondary-button" type="button" onClick={() => navigate(`/stocks/${candidate.code}`)}>
                查看个股详情
              </button>
              <button className="action-button primary" type="button" onClick={() => navigate(`/diagnosis?code=${candidate.code}`)}>
                查看诊股详情
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

export default CandidatesPage