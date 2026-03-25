import { useComplianceSummary } from '../hooks/useComplianceSummary'

function CompliancePage() {
  const { data, isLoading, source, error, refresh } = useComplianceSummary()

  return (
    <div className="page-stack">
      <section className="panel-card">
        <div className="section-kicker">合规巡检</div>
        <h2>把高风险表述挡在后台，而不是等用户投诉后再补救。</h2>
        <div className="action-toolbar">
          <button className="action-button" type="button" onClick={() => void refresh()} disabled={isLoading}>
            {isLoading ? '刷新中...' : '刷新巡检结果'}
          </button>
        </div>
        {error ? <div className="note-card error-card">合规接口异常：{error}</div> : null}
        <div className="stack-list">
          {(data?.inspections || []).map((item) => (
            <div className="info-card" key={item.title}>
              <div className="card-head">
                <strong>{item.title}</strong>
                <span className="soft-chip">{item.status}</span>
              </div>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
        <div className="note-card">禁用词：{(data?.blockedTerms || []).join('、') || '暂无'}</div>
        <div className="note-card">当前告警：{(data?.alerts || []).join('；') || '暂无异常告警'}</div>
        <div className="note-card">当前数据源：{source === 'api' ? '后端接口' : '本地 mock 回退'}。</div>
      </section>
    </div>
  )
}

export default CompliancePage