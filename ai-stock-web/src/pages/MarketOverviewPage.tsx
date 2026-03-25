import ContentPanel from '../components/ContentPanel'
import PageHero from '../components/PageHero'
import { useMarketHome } from '../hooks/useMarketHome'

function MarketOverviewPage() {
  const { data, source, error } = useMarketHome()

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="市场首页"
        title="今天市场看什么？一目了然"
        description={data.marketSummary}
        tags={data.marketTags}
        metrics={[
          { value: data.marketTemperature, label: '市场温度' },
          { value: `${data.sectors.length} 个`, label: '热点板块' },
          { value: `${data.focusCandidateCount} 只`, label: '精选个股' },
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

        <ContentPanel kicker="💡 使用建议">
          <ol className="route-list">
            <li>📊 先看市场温度，了解整体行情冷暖。</li>
            <li>🎯 关注热点板块，找到主线方向。</li>
            <li>🔍 进入候选池和诊股页，深入分析个股。</li>
          </ol>
          <div className="note-card">💡 数据源：{source === 'api' ? '实时行情' : '本地缓存（网络异常时自动切换）'}</div>
          {error ? <div className="note-card error-card">加载市场数据失败，请刷新页面重试。</div> : null}
        </ContentPanel>
      </section>
    </div>
  )
}

export default MarketOverviewPage