import { Link } from 'react-router-dom'
import ContentPanel from '../components/ContentPanel'
import PageHero from '../components/PageHero'

function HomePage() {
  return (
    <div className="page-stack">
      <PageHero
        eyebrow="AI 选股助手"
        title="智能投研，让投资更简单"
        description="基于多维度策略分析，精选高质量候选股票，提供完整的诊断报告和风险提示。不承诺收益，只提供专业的分析工具。"
        compact
      />

      <section className="hero-panel" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '60px 20px', borderRadius: '12px', marginBottom: '30px' }}>
        <div className="hero-copy">
          <h1 style={{ fontSize: '36px', marginBottom: '20px' }}>你的智能投研助手</h1>
          <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '30px' }}>
            基于实时行情、技术指标、资金流向、板块热度的多维度分析系统
          </p>
          <div className="action-row" style={{ justifyContent: 'center' }}>
            <Link className="primary-button" to="/trial" style={{ background: 'white', color: '#667eea', padding: '15px 40px', fontSize: '16px' }}>
              🚀 免费试用 14 天
            </Link>
            <Link className="secondary-button" to="/login" style={{ background: 'transparent', color: 'white', border: '2px solid white', padding: '15px 40px', fontSize: '16px' }}>
              已有账号？登录
            </Link>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <ContentPanel kicker="🎯 核心功能">
          <div className="stack-list">
            <div className="info-card">
              <div className="card-head">
                <h2>📊 智能选股</h2>
                <span className="badge brand">核心功能</span>
              </div>
              <p>基于技术面、资金面、板块热度的多维度策略评分，精选高质量候选股票。</p>
              <ul className="bullet-list">
                <li>✅ 技术指标策略（动量、成交量）</li>
                <li>✅ 资金流向策略（主力净流入）</li>
                <li>✅ 板块热度策略（行业涨幅）</li>
                <li>✅ 综合评分系统（加权多策略）</li>
              </ul>
            </div>
          </div>
        </ContentPanel>

        <ContentPanel kicker="📈 个股诊断">
          <div className="stack-list">
            <div className="info-card">
              <div className="card-head">
                <h2>深度分析</h2>
                <span className="badge accent">专业工具</span>
              </div>
              <p>每只股票都提供完整的分析逻辑，包括支撑位、压力位、止损策略和操作建议。</p>
              <ul className="bullet-list">
                <li>✅ 核心结论（一句话总结）</li>
                <li>✅ 观察要点（关键指标）</li>
                <li>✅ 支撑位 / 压力位</li>
                <li>✅ 止损策略和操作建议</li>
              </ul>
            </div>
          </div>
        </ContentPanel>

        <ContentPanel kicker="🔔 实时推送">
          <div className="stack-list">
            <div className="info-card">
              <div className="card-head">
                <h2>及时触达</h2>
                <span className="badge warn">多渠道通知</span>
              </div>
              <p>盘前推荐、风险预警、重要公告，通过微信、短信、邮件及时通知。</p>
              <ul className="bullet-list">
                <li>✅ 每日盘前选股建议</li>
                <li>✅ 自选股风险预警</li>
                <li>✅ 重要公告提醒</li>
                <li>✅ 支持微信 / 短信 / 邮件</li>
              </ul>
            </div>
          </div>
        </ContentPanel>

        <ContentPanel kicker="📝 自选观察">
          <div className="stack-list">
            <div className="info-card">
              <div className="card-head">
                <h2>跟踪管理</h2>
                <span className="badge accent">个性化管理</span>
              </div>
              <p>建立个人观察列表，跟踪关注的股票，记录投资逻辑和复盘总结。</p>
              <ul className="bullet-list">
                <li>✅ 自定义观察列表</li>
                <li>✅ 投资逻辑记录</li>
                <li>✅ 盘后复盘跟踪</li>
                <li>✅ 状态管理（观察 / 预警 / 转强）</li>
              </ul>
            </div>
          </div>
        </ContentPanel>
      </section>

      <section className="panel-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h2 style={{ marginBottom: '20px' }}>💰 订阅方案</h2>
        <p style={{ marginBottom: '30px', color: '#666' }}>灵活选择，满足不同投资需求</p>
        <div className="content-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div className="info-card" style={{ border: '2px solid #667eea', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-12px', right: '20px', background: '#667eea', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '12px' }}>
              推荐
            </div>
            <h3 style={{ color: '#667eea' }}>🆓 试用版</h3>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#667eea', margin: '20px 0' }}>0 元</div>
            <p style={{ color: '#666', marginBottom: '20px' }}>14 天完整体验</p>
            <ul className="bullet-list" style={{ textAlign: 'left', marginBottom: '20px' }}>
              <li>✅ 每日 3 只候选股票</li>
              <li>✅ 完整诊断报告</li>
              <li>✅ 基础自选功能</li>
              <li>✅ 盘后复盘</li>
            </ul>
            <Link className="primary-button" to="/trial" style={{ width: '100%' }}>立即试用</Link>
          </div>

          <div className="info-card">
            <h3 style={{ color: '#333' }}>📊 观察版</h3>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#333', margin: '20px 0' }}>¥99<span style={{ fontSize: '16px', color: '#666' }}> / 月</span></div>
            <p style={{ color: '#666', marginBottom: '20px' }}>适合新手观察学习</p>
            <ul className="bullet-list" style={{ textAlign: 'left', marginBottom: '20px' }}>
              <li>✅ 每日 5 只候选股票</li>
              <li>✅ 完整诊断报告</li>
              <li>✅ 无限自选数量</li>
              <li>✅ 基础数据导出</li>
            </ul>
            <Link className="secondary-button" to="/pricing" style={{ width: '100%' }}>了解详情</Link>
          </div>

          <div className="info-card">
            <h3 style={{ color: '#333' }}>📈 标准版</h3>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#333', margin: '20px 0' }}>¥299<span style={{ fontSize: '16px', color: '#666' }}> / 月</span></div>
            <p style={{ color: '#666', marginBottom: '20px' }}>专业投资者首选</p>
            <ul className="bullet-list" style={{ textAlign: 'left', marginBottom: '20px' }}>
              <li>✅ 每日 10 只候选股票</li>
              <li>✅ 深度诊断报告</li>
              <li>✅ 实时推送通知</li>
              <li>✅ 策略回测功能</li>
              <li>✅ 优先客服支持</li>
            </ul>
            <Link className="secondary-button" to="/pricing" style={{ width: '100%' }}>了解详情</Link>
          </div>

          <div className="info-card">
            <h3 style={{ color: '#333' }}>🚀 进阶版</h3>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#333', margin: '20px 0' }}>¥999<span style={{ fontSize: '16px', color: '#666' }}> / 月</span></div>
            <p style={{ color: '#666', marginBottom: '20px' }}>机构级投研工具</p>
            <ul className="bullet-list" style={{ textAlign: 'left', marginBottom: '20px' }}>
              <li>✅ 无限候选股票</li>
              <li>✅ 定制策略开发</li>
              <li>✅ API 数据接口</li>
              <li>✅ 专属投顾服务</li>
              <li>✅ 线下交流活动</li>
            </ul>
            <Link className="secondary-button" to="/pricing" style={{ width: '100%' }}>了解详情</Link>
          </div>
        </div>
      </section>

      <section className="panel-card" style={{ background: '#f8f9fa', padding: '40px 20px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>⚠️ 风险提示</h2>
        <div className="note-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <p>⚠️ 本产品提供的所有分析、诊断、推荐仅供参考，不构成任何投资建议。</p>
          <p>⚠️ 股市有风险，投资需谨慎。请结合自身风险承受能力独立决策。</p>
          <p>⚠️ 过往表现不代表未来收益，不承诺任何投资收益。</p>
        </div>
      </section>

      <section style={{ textAlign: 'center', padding: '40px 20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', color: 'white' }}>
        <h2 style={{ marginBottom: '20px' }}>准备好开始了吗？</h2>
        <p style={{ marginBottom: '30px', fontSize: '18px', opacity: 0.9 }}>立即开通 14 天免费试用，体验专业投研工具</p>
        <Link className="primary-button" to="/trial" style={{ background: 'white', color: '#667eea', padding: '15px 40px', fontSize: '16px' }}>
          🎁 免费试用 14 天
        </Link>
      </section>
    </div>
  )
}

export default HomePage
