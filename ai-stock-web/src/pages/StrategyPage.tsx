import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentSession } from '../utils/session'

const strategies = [
  {
    id: '1',
    name: '热点轮动策略',
    risk: 'high',
    return: '15-25%',
    period: '1-2周',
    desc: '追踪市场热点板块，捕捉短期轮动机会',
    match: 85,
    reason: '您近期关注科技股，该策略适合捕捉板块轮动',
  },
  {
    id: '2',
    name: '价值低估策略',
    risk: 'medium',
    return: '8-15%',
    period: '1-3月',
    desc: '寻找被市场低估的优质股票，长期持有',
    match: 92,
    reason: '根据您的稳健型偏好，该策略风险收益比最优',
  },
  {
    id: '3',
    name: '防御配置策略',
    risk: 'low',
    return: '3-8%',
    period: '3-6月',
    desc: '配置防御性板块和高分红股票，降低波动',
    match: 78,
    reason: '市场波动较大，适合保守配置',
  },
]

export default function StrategyPage() {
  const navigate = useNavigate()
  const session = getCurrentSession()
  const [userProfile, setUserProfile] = useState({
    riskType: '稳健型',
    membership: 'STANDARD',
    watchCount: 5,
  })

  if (!session) {
    return (
      <div className="page-stack">
        <div className="panel-card">
          <h2>请先登录</h2>
          <button className="primary-button" onClick={() => navigate('/login')}>登录</button>
        </div>
      </div>
    )
  }

  // 根据用户画像排序策略
  const sortedStrategies = [...strategies].sort((a, b) => b.match - a.match)
  const topStrategy = sortedStrategies[0]

  return (
    <div className="page-stack">
      {/* 标题 */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>🎯 为您推荐</h1>
        <p style={{ color: '#6b7280' }}>根据您的投资偏好，智能匹配最优策略</p>
      </div>

      {/* 用户画像卡片 */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px',
        padding: '16px',
        background: '#f3f4f6',
        borderRadius: '12px',
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>风险偏好</div>
          <div style={{ fontWeight: 'bold' }}>{userProfile.riskType}</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>当前套餐</div>
          <div style={{ fontWeight: 'bold' }}>{userProfile.membership}</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>关注股票</div>
          <div style={{ fontWeight: 'bold' }}>{userProfile.watchCount}只</div>
        </div>
      </div>

      {/* 最佳推荐 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '12px',
        }}>
          <span style={{ fontSize: '20px' }}>🏆</span>
          <span style={{ fontWeight: 'bold', fontSize: '18px' }}>最佳匹配</span>
          <span style={{ 
            padding: '4px 12px',
            background: '#22c55e',
            color: 'white',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 'bold',
          }}>
            匹配度 {topStrategy.match}%
          </span>
        </div>

        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          color: 'white',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '24px' }}>{topStrategy.name}</h2>
            <span style={{ 
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '20px',
              fontSize: '12px',
            }}>
              {topStrategy.risk === 'high' ? '🔥 高风险' : topStrategy.risk === 'medium' ? '⚖️ 中风险' : '🛡️ 低风险'}
            </span>
          </div>

          <p style={{ marginBottom: '20px', opacity: 0.9 }}>{topStrategy.desc}</p>

          <div style={{ 
            padding: '12px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '8px',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>推荐理由</div>
            <div>{topStrategy.reason}</div>
          </div>

          <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>预期收益</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>+{topStrategy.return}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>建议持有</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{topStrategy.period}</div>
            </div>
          </div>

          <button 
            style={{
              width: '100%',
              padding: '16px',
              background: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
            onClick={() => alert('已应用策略：' + topStrategy.name)}
          >
            立即应用此策略
          </button>
        </div>
      </div>

      {/* 其他备选 */}
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#6b7280' }}>其他备选策略</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sortedStrategies.slice(1).map((s) => (
            <div 
              key={s.id}
              style={{
                padding: '16px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{s.name}</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>{s.desc}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', color: '#ef4444' }}>+{s.return}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>匹配度{s.match}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
