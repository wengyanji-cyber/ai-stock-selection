import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentUserCode } from '../utils/session'

type MembershipStats = {
  plan: string
  planName: string
  isTrial: boolean
  trialDaysRemaining: number
  expiresAt: string
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

async function fetchMembershipStats() {
  const token = localStorage.getItem('auth_token')
  const res = await fetch('http://106.52.6.176:3010/api/v1/membership/stats', {
    headers: {
      'Authorization': `Bearer ${token || ''}`,
    },
  })
  const json = await res.json()
  return json.data as MembershipStats | null
}

function AccountPage() {
  const userCode = getCurrentUserCode()
  const [stats, setStats] = useState<MembershipStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userCode) {
      setLoading(false)
      return
    }

    fetchMembershipStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [userCode])

  if (!userCode) {
    return (
      <div className="page-stack">
        <section className="panel-card">
          <div className="section-kicker">用户中心</div>
          <h2>当前还没有登录</h2>
          <p>先登录或开通试用账号</p>
          <div className="action-row">
            <Link className="primary-button" to="/login">去登录</Link>
            <Link className="secondary-button" to="/trial">开通试用</Link>
          </div>
        </section>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page-stack">
        <section className="panel-card">
          <div className="section-kicker">用户中心</div>
          <p>⏳ 加载中...</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">用户中心</span>
          <h1>{stats?.planName || '用户中心'}</h1>
          <p>管理你的订阅和账户设置</p>
        </div>
        <div className="metric-grid">
          <div className="metric-card">
            <strong>{stats?.trialDaysRemaining ?? '--'}</strong>
            <span>试用剩余天数</span>
          </div>
          <div className="metric-card">
            <strong>{stats?.features.dailyCandidates ?? '--'}</strong>
            <span>每日候选额度</span>
          </div>
          <div className="metric-card">
            <strong>{stats?.features.watchlistLimit ?? '--'}</strong>
            <span>自选股上限</span>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <article className="panel-card">
          <div className="section-kicker">当前套餐</div>
          <div className="info-card">
            <div className="card-head">
              <h2>{stats?.planName}</h2>
              {stats?.isTrial && (
                <span className="badge brand">试用中</span>
              )}
            </div>
            <p>
              {stats?.isTrial
                ? `试用期至 ${stats?.expiresAt?.slice(0, 10) || '--'}`
                : `订阅至 ${stats?.expiresAt?.slice(0, 10) || '--'}`}
            </p>
            <div className="action-row">
              {stats?.isTrial && (
                <Link className="primary-button" to="/pricing">
                  升级套餐
                </Link>
              )}
              <Link className="secondary-button" to="/pricing">
                查看套餐
              </Link>
            </div>
          </div>
        </article>

        <article className="panel-card">
          <div className="section-kicker">套餐权益</div>
          <ul className="bullet-list">
            <li>
              📊 候选股票：{stats?.features.dailyCandidates || 0}只/天
              {stats && stats.features.dailyCandidates < 10 && (
                <span className="meta-text">（升级后可增加）</span>
              )}
            </li>
            <li>
              📝 自选数量：{stats?.features.watchlistLimit || 0}只
            </li>
            <li>
              📈 诊断深度：{stats?.features.diagnosisDepth === 'deep' ? '深度' : stats?.features.diagnosisDepth === 'standard' ? '标准' : '基础'}
            </li>
            <li>
              🔔 推送通知：{stats?.features.pushNotifications ? '✅ 支持' : '❌ 不支持'}
            </li>
            <li>
              💾 数据导出：{stats?.features.dataExport ? '✅ 支持' : '❌ 不支持'}
            </li>
            <li>
              🧪 策略回测：{stats?.features.strategyBacktest ? '✅ 支持' : '❌ 不支持'}
            </li>
            <li>
              🎧 客服支持：{stats?.features.customerSupport === 'dedicated' ? '专属客服' : stats?.features.customerSupport === 'priority' ? '优先支持' : stats?.features.customerSupport === 'email' ? '邮件支持' : '无'}
            </li>
          </ul>
        </article>

        <article className="panel-card">
          <div className="section-kicker">账户设置</div>
          <div className="stack-list">
            <Link className="action-button" to="/account/profile">
              👤 个人资料
            </Link>
            <Link className="action-button" to="/account/security">
              🔐 账户安全
            </Link>
            <Link className="action-button" to="/account/billing">
              💳 账单管理
            </Link>
            <button className="secondary-button" type="button">
              🚪 退出登录
            </button>
          </div>
        </article>
      </section>

      {stats?.isTrial && (
        <section className="panel-card" style={{ background: '#fff3cd', padding: '20px', borderLeft: '4px solid #ffc107' }}>
          <h4>⏰ 试用即将到期</h4>
          <p>你的试用期还剩 {stats.trialDaysRemaining} 天，升级套餐可继续享受完整功能。</p>
          <Link className="primary-button" to="/pricing">
            立即升级
          </Link>
        </section>
      )}
    </div>
  )
}

export default AccountPage
