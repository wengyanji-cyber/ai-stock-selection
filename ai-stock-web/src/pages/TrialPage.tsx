import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginTrialUser } from '../api/demoApi'
import { saveCurrentSession } from '../utils/session'

function TrialPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nickname: '', mobile: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleTrialStart() {
    setIsSubmitting(true)
    setError('')

    try {
      const result = await loginTrialUser({
        nickname: form.nickname.trim() || undefined,
        mobile: form.mobile.trim() || undefined,
      })
      saveCurrentSession(result.data)
      navigate('/account')
    } catch (submitError) {
      if (submitError instanceof Error) {
        if (submitError.message.includes('500')) {
          setError('开通失败，请稍后重试。')
        } else {
          setError(submitError.message)
        }
      } else {
        setError('开通试用失败，请检查网络连接。')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">试用开通</span>
          <h1>开启你的 14 天深度试用</h1>
          <p>无需付费，完整体验所有核心功能。每天盘前获取选股建议，盘中跟踪，盘后复盘。</p>
        </div>
        <div className="metric-grid">
          <div className="metric-card"><strong>14 天</strong><span>完整功能体验</span></div>
          <div className="metric-card"><strong>4 大</strong><span>核心模块</span></div>
          <div className="metric-card"><strong>0 风险</strong><span>不承诺收益</span></div>
        </div>
      </section>
      <section className="content-grid">
        <article className="panel-card">
          <div className="section-kicker">你能获得什么</div>
          <ol className="route-list">
            <li>📊 每日盘前选股建议，一句话讲清楚看什么。</li>
            <li>🎯 完整候选池，包含重点候选和扩展观察。</li>
            <li>📈 个股深度诊断，明确支撑位、压力位和止损策略。</li>
            <li>📝 自选观察列表，盘后复盘跟踪表现。</li>
          </ol>
        </article>
        <article className="panel-card">
          <div className="section-kicker">开始试用</div>
          <div className="note-card">💡 填写昵称即可，手机号选填（用于后续重要通知）。</div>
          <div className="stack-list">
            <label className="form-field">
              <span>昵称</span>
              <input value={form.nickname} onChange={(event) => setForm((current) => ({ ...current, nickname: event.target.value }))} placeholder="怎么称呼你，如 短线观察员" />
            </label>
            <label className="form-field">
              <span>手机号</span>
              <input value={form.mobile} onChange={(event) => setForm((current) => ({ ...current, mobile: event.target.value }))} placeholder="选填，用于接收重要通知" />
            </label>
            <button className="primary-button" type="button" onClick={() => void handleTrialStart()} disabled={isSubmitting}>
              {isSubmitting ? '开通中...' : '立即开通试用'}
            </button>
            {error ? <div className="note-card error-card">{error}</div> : null}
            <div className="note-card">
              <strong>💡 提示：</strong>开通试用即代表同意《用户服务协议》，14 天内可免费使用所有功能。
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}

export default TrialPage