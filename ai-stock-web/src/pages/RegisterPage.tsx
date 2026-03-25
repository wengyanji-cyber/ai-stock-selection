import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { registerUserAccount } from '../api/demoApi'

function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ userCode: '', nickname: '', mobile: '', password: '12345678' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setIsSubmitting(true)
    setError('')

    try {
      await registerUserAccount(form)
      const redirect = new URLSearchParams(location.search).get('redirect') || '/account'
      navigate(redirect)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '注册失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-stack two-col-grid">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">正式注册</span>
          <h1>从试用体验进入正式账号体系。</h1>
          <p>注册后可以长期保存观察、自选、诊股历史，并为后续订阅与触达打基础。</p>
        </div>
      </section>
      <section className="panel-card form-panel">
        <div className="section-kicker">注册账号</div>
        <div className="stack-list">
          <label className="form-field">
            <span>用户编码</span>
            <input value={form.userCode} onChange={(event) => setForm((current) => ({ ...current, userCode: event.target.value }))} placeholder="例如：alpha_user_01" />
          </label>
          <label className="form-field">
            <span>昵称</span>
            <input value={form.nickname} onChange={(event) => setForm((current) => ({ ...current, nickname: event.target.value }))} placeholder="例如：短线研究员" />
          </label>
          <label className="form-field">
            <span>手机号</span>
            <input value={form.mobile} onChange={(event) => setForm((current) => ({ ...current, mobile: event.target.value }))} />
          </label>
          <label className="form-field">
            <span>密码</span>
            <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          </label>
          <button className="primary-button" type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? '注册中...' : '注册并登录'}
          </button>
          <button className="secondary-button" type="button" onClick={() => navigate('/login')} disabled={isSubmitting}>
            已有账号，去登录
          </button>
          {error ? <div className="note-card error-card">注册接口异常：{error}</div> : null}
        </div>
      </section>
    </div>
  )
}

export default RegisterPage