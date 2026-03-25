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
      setError(submitError instanceof Error ? submitError.message : '开通试用失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">试用开通</span>
          <h1>先给用户 14 天结构化体验，再决定他会不会留下。</h1>
          <p>试用页的目标不是刺激转化，而是把每天能获得什么、如何形成使用习惯、产品边界是什么讲清楚。</p>
        </div>
        <div className="metric-grid">
          <div className="metric-card"><strong>14 天</strong><span>试用周期</span></div>
          <div className="metric-card"><strong>4 个</strong><span>核心模块</span></div>
          <div className="metric-card"><strong>0 承诺</strong><span>不承诺收益</span></div>
        </div>
      </section>
      <section className="content-grid">
        <article className="panel-card">
          <div className="section-kicker">试用期间的价值</div>
          <ol className="route-list">
            <li>每日盘前一句话。</li>
            <li>完整候选池与重点候选。</li>
            <li>个股诊断与风险失效条件。</li>
            <li>自选观察与盘后复盘。</li>
          </ol>
        </article>
        <article className="panel-card">
          <div className="section-kicker">试用目标</div>
          <div className="note-card">让用户形成固定查看习惯，而不是一次性把所有价值都喊出来。</div>
          <div className="stack-list">
            <label className="form-field">
              <span>昵称</span>
              <input value={form.nickname} onChange={(event) => setForm((current) => ({ ...current, nickname: event.target.value }))} placeholder="例如：短线观察员" />
            </label>
            <label className="form-field">
              <span>手机号</span>
              <input value={form.mobile} onChange={(event) => setForm((current) => ({ ...current, mobile: event.target.value }))} placeholder="可选，用于后续提醒" />
            </label>
            <button className="primary-button" type="button" onClick={() => void handleTrialStart()} disabled={isSubmitting}>
              {isSubmitting ? '开通中...' : '立即开通 14 天试用'}
            </button>
            {error ? <div className="note-card error-card">试用接口异常：{error}</div> : null}
          </div>
        </article>
      </section>
    </div>
  )
}

export default TrialPage