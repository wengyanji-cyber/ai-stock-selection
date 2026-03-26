import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { loginUserAccount } from '../api/demoApi'
import { getCurrentSession } from '../utils/session'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = getCurrentSession()
  const [form, setForm] = useState({ userCode: 'demo_user', password: 'demo123456' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 如果已登录，提示用户
  if (session) {
    return (
      <div className="page-stack">
        <section className="panel-card">
          <div className="section-kicker">已登录</div>
          <h2>您已登录为 {session.profile.userCode}</h2>
          <p>如需切换账号，请先退出登录。</p>
          <div className="action-row">
            <button className="primary-button" onClick={() => navigate('/account')}>
              前往用户中心
            </button>
            <button className="secondary-button" onClick={() => navigate('/')}>
              返回首页
            </button>
          </div>
        </section>
      </div>
    )
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    setError('')

    try {
      await loginUserAccount({
        userCode: form.userCode.trim() || undefined,
        password: form.password,
      })

      const redirect = new URLSearchParams(location.search).get('redirect') || '/account'
      // 触发存储事件，同步导航栏状态
      window.dispatchEvent(new Event('storage'))
      navigate(redirect)
    } catch (submitError) {
      if (submitError instanceof Error) {
        if (submitError.message.includes('401')) {
          setError('账号或密码错误，请检查后重试。')
        } else if (submitError.message.includes('404')) {
          setError('账号不存在，请先注册或试用登录。')
        } else {
          setError(submitError.message)
        }
      } else {
        setError('登录失败，请稍后重试。')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-stack two-col-grid">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">登录注册</span>
          <h1>欢迎回来！</h1>
          <p>登录后可以保存自选股票、同步诊股历史、查看试用进度和续用状态。</p>
        </div>
      </section>
      <section className="panel-card form-panel">
        <div className="section-kicker">账号入口</div>
        <div className="stack-list">
          <label className="form-field">
            <span>用户编码</span>
            <input value={form.userCode} onChange={(event) => setForm((current) => ({ ...current, userCode: event.target.value }))} placeholder="请输入用户编码" />
          </label>
          <label className="form-field">
            <span>密码</span>
            <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="请输入密码" />
          </label>
          <button className="primary-button" type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? '登录中...' : '登录'}
          </button>
          <div className="action-row">
            <button className="secondary-button" type="button" onClick={() => navigate('/register')} disabled={isSubmitting}>
              注册新账号
            </button>
          </div>
          {error ? <div className="note-card error-card">{error}</div> : null}
          <div className="note-card">
            <strong>💡 提示：</strong>演示账号 <code>demo_user</code> / <code>demo123456</code>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LoginPage