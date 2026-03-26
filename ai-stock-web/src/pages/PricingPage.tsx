import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ContentPanel from '../components/ContentPanel'
import { WEB_API_BASE_URL } from '../constants/runtime'

type MembershipPlan = {
  plan: string
  name: string
  price: number
  period: string
  features: {
    dailyCandidates: number
    watchlistLimit: number
    diagnosisDepth: string
    pushNotifications: boolean
    dataExport: boolean
    strategyBacktest: boolean
    apiAccess: boolean
    customerSupport: string
  }
}

async function fetchPlans() {
const res = await fetch(`${WEB_API_BASE_URL}/api/v1/membership/plans`)
  const json = await res.json()
  return json.data as MembershipPlan[]
}

function PricingPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page-stack">
        <section className="panel-card">
          <div className="section-kicker">订阅方案</div>
          <p>⏳ 加载中...</p>
        </section>
      </div>
    )
  }

  const renderFeature = (feature: boolean | number | string) => {
    if (typeof feature === 'boolean') {
      return feature ? '✅' : '❌'
    }
    if (typeof feature === 'number') {
      return feature >= 999 ? '无限' : feature.toString()
    }
    return feature
  }

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">订阅方案</span>
          <h1>灵活选择，满足不同投资需求</h1>
          <p>所有套餐均包含 14 天试用期，不满意随时取消</p>
        </div>
      </section>

      <section className="content-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {plans.map((plan) => (
          <article
            key={plan.plan}
            className="panel-card"
            style={{
              border: plan.plan === 'STANDARD' ? '2px solid #667eea' : '1px solid #ddd',
              position: 'relative',
            }}
          >
            {plan.plan === 'STANDARD' && (
              <div
                style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '20px',
                  background: '#667eea',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              >
                推荐
              </div>
            )}

            <div className="section-kicker">{plan.name}</div>
            <h2 style={{ fontSize: '36px', color: '#667eea', margin: '20px 0' }}>
              ¥{plan.price}
              <span style={{ fontSize: '16px', color: '#666' }}> / {plan.period === 'day' ? '天' : '月'}</span>
            </h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              {plan.plan === 'TRIAL' && '14 天完整体验'}
              {plan.plan === 'OBSERVER' && '适合新手观察学习'}
              {plan.plan === 'STANDARD' && '专业投资者首选'}
              {plan.plan === 'ADVANCED' && '机构级投研工具'}
            </p>

            <ul className="bullet-list" style={{ marginBottom: '30px', textAlign: 'left' }}>
              <li>
                📊 候选股票：{renderFeature(plan.features.dailyCandidates)}只/天
              </li>
              <li>
                📝 自选数量：{renderFeature(plan.features.watchlistLimit)}只
              </li>
              <li>
                📈 诊断深度：{plan.features.diagnosisDepth === 'basic' ? '基础' : plan.features.diagnosisDepth === 'standard' ? '标准' : '深度'}
              </li>
              <li>
                🔔 推送通知：{renderFeature(plan.features.pushNotifications)}
              </li>
              <li>
                💾 数据导出：{renderFeature(plan.features.dataExport)}
              </li>
              <li>
                🧪 策略回测：{renderFeature(plan.features.strategyBacktest)}
              </li>
              {plan.plan === 'ADVANCED' && (
                <li>
                  🔌 API 接口：{renderFeature(plan.features.apiAccess)}
                </li>
              )}
              <li>
                🎧 客服支持：{plan.features.customerSupport === 'none' ? '无' : plan.features.customerSupport === 'email' ? '邮件' : plan.features.customerSupport === 'priority' ? '优先' : '专属'}
              </li>
            </ul>

            <Link
              className={plan.plan === 'STANDARD' ? 'primary-button' : 'secondary-button'}
              to={plan.plan === 'TRIAL' ? '/trial' : '/account'}
              style={{ width: '100%', textAlign: 'center' }}
            >
              {plan.plan === 'TRIAL' ? '立即试用' : '立即订阅'}
            </Link>
          </article>
        ))}
      </section>

      <section className="panel-card" style={{ background: '#f8f9fa', padding: '30px 20px' }}>
        <h3 style={{ marginBottom: '20px' }}>💡 常见问题</h3>
        <div className="stack-list">
          <div className="info-card">
            <h4>试用期多久？</h4>
            <p>所有新用户均可享受 14 天完整功能试用，无需绑定支付方式。</p>
          </div>
          <div className="info-card">
            <h4>如何取消订阅？</h4>
            <p>随时可在用户中心取消订阅，取消后立即生效，剩余天数按比例退款。</p>
          </div>
          <div className="info-card">
            <h4>支持退款吗？</h4>
            <p>订阅 7 天内不满意可全额退款，无需理由。</p>
          </div>
        </div>
      </section>

      <section className="panel-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h3>💰 企业定制</h3>
        <p style={{ color: '#666', marginBottom: '20px' }}>需要私有化部署或定制策略？</p>
        <Link className="secondary-button" to="/contact">
          联系销售
        </Link>
      </section>
    </div>
  )
}

export default PricingPage
