import ContentPanel from '../components/ContentPanel'
import PageHero from '../components/PageHero'
import { useLatestReview } from '../hooks/useLatestReview'

function ReviewPage() {
  const { data, source, error, isLoading } = useLatestReview()

  // 加载中
  if (isLoading) {
    return (
      <div className="page-stack">
        <section className="panel-card">
          <div className="section-kicker">盘后复盘</div>
          <h2>正在加载复盘数据...</h2>
        </section>
      </div>
    )
  }

  // 数据为空（不应该发生，但做安全防护）
  if (!data) {
    return (
      <div className="page-stack">
        <section className="panel-card">
          <div className="section-kicker">盘后复盘</div>
          <h2>暂无复盘数据</h2>
          <p>当前还没有生成复盘报告。</p>
          {error && <div className="note-card error-card">错误：{error}</div>}
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="盘后复盘"
        title="复盘不是流水账，而是总结今天什么有效、明天优先看什么。"
        description={data.summary || '今日暂无复盘摘要'}
        compact
      />
      <section className="content-grid">
        <ContentPanel kicker="候选结果">
          <div className="stack-list">
            {data.candidateReview?.length > 0 ? (
              data.candidateReview.map((item) => (
                <div className="info-card" key={item.name}>
                  <div className="card-head">
                    <h2>{item.name}</h2>
                    <span className={`badge ${item.badge}`}>{item.result}</span>
                  </div>
                  <p>{item.note}</p>
                </div>
              ))
            ) : (
              <div className="note-card">今日暂无候选股票复盘</div>
            )}
          </div>
        </ContentPanel>
        <ContentPanel kicker="风险与明日重点">
          {data.risks?.length > 0 ? (
            <ul className="bullet-list">
              {data.risks.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          ) : (
            <div className="note-card">暂无风险提示</div>
          )}
          <div className="note-card">明日优先方向：{data.nextFocus || '暂无'}</div>
          <div className="note-card">当前数据源：{source === 'api' ? '后端接口' : '本地 mock 回退'}。</div>
          {error ? <div className="note-card error-card">复盘接口异常：{error}</div> : null}
        </ContentPanel>
      </section>
    </div>
  )
}

export default ReviewPage