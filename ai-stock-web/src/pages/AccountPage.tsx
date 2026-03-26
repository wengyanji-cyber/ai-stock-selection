import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentUserCode, clearCurrentSession } from '../utils/session'
import { WEB_API_BASE_URL } from '../constants/runtime'

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
  if (!token) return null
  
  try {
const res = await fetch(`${WEB_API_BASE_URL}/api/v1/membership/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    const json = await res.json()
    return json.data as MembershipStats | null
  } catch {
    return null
  }
}

function AccountPage() {
  const navigate = useNavigate()
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

  function handleLogout() {
    clearCurrentSession()
    navigate('/')
    window.location.reload()
  }

  if (!userCode) {
    return (
      <div className="page-stack">
        <section className="panel-card">
          <div className="section-kicker">用户中心</div>
          <h2>当前还没有登录</h2>
          <p>登录后可以查看会员状态、管理订阅、查看账单</p>
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

  const planColors: Record<string, string> = {
    TRIAL: '#ffc107',
    OBSERVER: '#6c757d',
    STANDARD: '#667eea',
    ADVANCED: '#28a745',
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
        <article className="panel-card" style={{ borderLeft: `4px solid ${planColors[stats?.plan || 'TRIAL']}` }}>
          <div className="section-kicker">当前套餐</div>
          <div className="info-card">
            <div className="card-head">
              <h2>
                <span className={`badge ${stats?.isTrial ? 'warn' : 'accent'}`}>
                  {stats?.planName}
                </span>
              </h2>
              {stats?.isTrial && (
                <span className="meta-text">试用中</span>
              )}
            </div>
            <p style={{ fontSize: '16px', margin: '15px 0' }}>
              {stats?.isTrial
                ? `试用期至 ${stats?.expiresAt?.slice(0, 10) || '--'}`
                : `订阅至 ${stats?.expiresAt?.slice(0, 10) || '--'}`}
            </p>
            {stats?.isTrial && stats.trialDaysRemaining <= 3 && (
              <div className="note-card" style={{ background: '#fff3cd', borderLeft: '4px solid #ffc107' }}>
                ⏰ 试用即将到期，还剩 {stats.trialDaysRemaining} 天
              </div>
            )}
            <div className="action-row">
              {stats?.isTrial ? (
                <Link className="primary-button" to="/pricing">
                  💳 升级套餐
                </Link>
              ) : (
                <Link className="secondary-button" to="/account/billing">
                  💳 续费订阅
                </Link>
              )}
              <Link className="secondary-button" to="/pricing">
                查看套餐
              </Link>
            </div>
          </div>
        </article>

        <article className="panel-card">
          <div className="section-kicker">套餐权益使用情况</div>
          <div className="stack-list">
            <div className="info-card">
              <div className="card-head">
                <h4>📊 候选股票</h4>
                <span className="meta-text">{stats?.features.dailyCandidates || 0}/天</span>
              </div>
              <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '8px', marginTop: '10px' }}>
                <div style={{ width: '60%', background: '#667eea', height: '100%', borderRadius: '4px' }} />
              </div>
              <p className="meta-text" style={{ marginTop: '5px' }}>今日已查看 2 只，还剩 {((stats?.features.dailyCandidates || 0) - 2)} 只</p>
            </div>

            <div className="info-card">
              <div className="card-head">
                <h4>📝 自选股票</h4>
                <span className="meta-text">0/{stats?.features.watchlistLimit || 0}</span>
              </div>
              <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '8px', marginTop: '10px' }}>
                <div style={{ width: '0%', background: '#28a745', height: '100%', borderRadius: '4px' }} />
              </div>
              <p className="meta-text" style={{ marginTop: '5px' }}>还可添加 {stats?.features.watchlistLimit || 0} 只</p>
            </div>

            <div className="info-card">
              <div className="card-head">
                <h4>📈 诊断深度</h4>
                <span className={`badge ${stats?.features.diagnosisDepth === 'deep' ? 'accent' : 'brand'}`}>
                  {stats?.features.diagnosisDepth === 'deep' ? '深度' : stats?.features.diagnosisDepth === 'standard' ? '标准' : '基础'}
                </span>
              </div>
              <p className="meta-text">
                {stats?.features.diagnosisDepth === 'deep' 
                  ? '✅ 支持深度诊断报告' 
                  : '⚠️ 升级解锁深度诊断'}
              </p>
            </div>

            <div className="info-card">
              <div className="card-head">
                <h4>🔔 推送通知</h4>
                {stats?.features.pushNotifications ? (
                  <span className="badge accent">✅ 支持</span>
                ) : (
                  <span className="badge">❌ 不支持</span>
                )}
              </div>
              <p className="meta-text">
                {stats?.features.pushNotifications 
                  ? '盘前推荐、风险预警自动推送' 
                  : '升级解锁推送功能'}
              </p>
            </div>
          </div>
        </article>

        <article className="panel-card">
          <div className="section-kicker">账户管理</div>
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
            <button className="secondary-button" type="button" onClick={handleLogout}>
              🚪 退出登录
            </button>
          </div>
        </article>
      </section>

      {stats?.isTrial && (
        <section className="panel-card" style={{ background: `linear-gradient(135deg, ${planColors[stats.plan]}22 0%, ${planColors[stats.plan]}11 100%)`, padding: '30px 20px', border: `2px solid ${planColors[stats.plan]}` }}>
          <h3 style={{ marginBottom: '10px' }}>⏰ 试用即将到期</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            你的试用期还剩 <strong>{stats.trialDaysRemaining} 天</strong>，升级套餐可继续享受完整功能。
          </p>
          <div className="action-row">
            <Link className="primary-button" to="/pricing">
              立即升级 - 解锁完整功能
            </Link>
            <Link className="secondary-button" to="/pricing">
              查看套餐对比
            </Link>
          </div>
        </section>
      )}

      {!stats?.isTrial && stats?.plan !== 'ADVANCED' && (
        <section className="panel-card" style={{ background: 'linear-gradient(135deg, #667eea22 0%, #764ba211 100%)', padding: '30px 20px', border: '2px solid #667eea' }}>
          <h3 style={{ marginBottom: '10px' }}>🚀 升级进阶版</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            无限候选股票、API 接口、专属客服，机构级投研工具
          </p>
          <Link className="primary-button" to="/pricing">
            了解进阶版
          </Link>
        </section>
      )}
    </div>
  )
}

export default AccountPage
