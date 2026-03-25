import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { loginAdminAccount } from '../api/adminApi'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ userCode: 'admin_root', password: 'admin123456' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setIsSubmitting(true)
    setError('')

    try {
      const session = await loginAdminAccount(form)
      if (session.profile.roleCode !== 'ADMIN') {
        throw new Error('当前账号不是管理员')
      }

      const redirect = new URLSearchParams(location.search).get('redirect') || '/operations'
      navigate(redirect)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '登录失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="panel-card">
        <div className="section-kicker">管理端登录</div>
        <h2>进入运营与技术后台前，先通过管理员鉴权。</h2>
        <div className="stack-list compact-top-gap">
          <label className="form-field">
            <span>管理员账号</span>
            <input value={form.userCode} onChange={(event) => setForm((current) => ({ ...current, userCode: event.target.value }))} />
          </label>
          <label className="form-field">
            <span>密码</span>
            <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          </label>
          <button className="action-button primary" type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? '登录中...' : '登录后台'}
          </button>
          {error ? <div className="note-card error-card">登录异常：{error}</div> : null}
        </div>
      </section>
    </div>
  )
}

export default LoginPage