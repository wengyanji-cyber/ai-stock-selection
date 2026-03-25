import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { loginUserAccount } from '../api/demoApi'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ userCode: 'trial_user_a', password: '12345678' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setIsSubmitting(true)
    setError('')

    try {
      await loginUserAccount({
        userCode: form.userCode.trim() || undefined,
        password: form.password,
      })

      const redirect = new URLSearchParams(location.search).get('redirect') || '/account'
      navigate(redirect)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '登录失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-stack two-col-grid">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">登录注册</span>
          <h1>先建立信任，再进入产品和试用流程。</h1>
          <p>注册之后可以保存自选、同步诊股历史、查看试用进度和续用状态。</p>
        </div>
      </section>
      <section className="panel-card form-panel">
        <div className="section-kicker">账号入口</div>
        <div className="stack-list">
          <label className="form-field">
            <span>用户编码</span>
            <input value={form.userCode} onChange={(event) => setForm((current) => ({ ...current, userCode: event.target.value }))} placeholder="例如：trial_user_a" />
          </label>
          <label className="form-field">
            <span>密码</span>
            <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="请输入密码" />
          </label>
          <button className="primary-button" type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? '登录中...' : '登录并进入用户中心'}
          </button>
          <button className="secondary-button" type="button" onClick={() => navigate('/register')} disabled={isSubmitting}>
            去正式注册
          </button>
          {error ? <div className="note-card error-card">登录接口异常：{error}</div> : null}
        </div>
      </section>
    </div>
  )
}

export default LoginPage