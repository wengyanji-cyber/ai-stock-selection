import ContentPanel from '../components/ContentPanel'
import PageHero from '../components/PageHero'
import { useMarketHome } from '../hooks/useMarketHome'

function MarketOverviewPage() {
  const { data, source, error } = useMarketHome()

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="市场首页"
        title="把热点、候选、点位和风险，压缩成用户能直接使用的首页。"
        description={data.marketSummary}
        tags={data.marketTags}
        metrics={[
          { value: data.marketTemperature, label: '市场温度' },
          { value: `${data.sectors.length} 个`, label: '重点板块' },
          { value: `${data.focusCandidateCount} 只`, label: '重点候选' },
        ]}
      />

      <section className="content-grid">
        <ContentPanel kicker="板块概览">
          <div className="stack-list">
            {data.sectors.map((sector) => (
              <div className="info-card" key={sector.name}>
                <div className="card-head">
                  <h2>{sector.name}</h2>
                  <span className={`badge ${sector.badge}`}>{sector.status}</span>
                </div>
                <p>{sector.reason}</p>
                <p className="meta-text">风险：{sector.risk}</p>
              </div>
            ))}
          </div>
        </ContentPanel>

        <ContentPanel kicker="首页信息结构">
          <ol className="route-list">
            <li>先告诉用户今天市场看什么，不先丢一堆复杂数据。</li>
            <li>重点板块只保留 2 到 3 个，控制信息负荷。</li>
            <li>下一步自然引导用户进入候选池和诊股页。</li>
          </ol>
          <div className="note-card">当前数据源：{source === 'api' ? '后端接口' : '本地 mock 回退'}。</div>
          {error ? <div className="note-card error-card">市场首页接口异常：{error}</div> : null}
        </ContentPanel>
      </section>
    </div>
  )
}

export default MarketOverviewPage