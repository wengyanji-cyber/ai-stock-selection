import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { registerUserAccount } from '../api/demoApi'
import AgreementModal from '../components/AgreementModal'

function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ userCode: '', nickname: '', mobile: '', password: '12345678' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAgreement, setShowAgreement] = useState(false)
  const [agreed, setAgreed] = useState(false)

  async function handleSubmit() {
    setIsSubmitting(true)
    setError('')

    // 简单验证
    if (!form.userCode?.trim()) {
      setError('请填写用户编码，建议使用英文或数字组合。')
      setIsSubmitting(false)
      return
    }

    if (!form.password || form.password.length < 6) {
      setError('密码长度至少 6 位，请重新设置。')
      setIsSubmitting(false)
      return
    }

    // 检查是否已同意协议
    if (!agreed) {
      setShowAgreement(true)
      setIsSubmitting(false)
      return
    }

    try {
      await registerUserAccount(form)
      const redirect = new URLSearchParams(location.search).get('redirect') || '/account'
      navigate(redirect)
    } catch (submitError) {
      if (submitError instanceof Error) {
        if (submitError.message.includes('409')) {
          setError('该账号已被注册，请换一个试试。')
        } else if (submitError.message.includes('400')) {
          setError('密码格式不符合要求，请使用字母 + 数字组合。')
        } else {
          setError(submitError.message)
        }
      } else {
        setError('注册失败，请稍后重试。')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-stack two-col-grid">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">正式注册</span>
          <h1>创建你的专属账号</h1>
          <p>注册后可以长期保存观察列表、诊股历史，并跟踪试用进度和续用状态。</p>
        </div>
      </section>
      <section className="panel-card form-panel">
        <div className="section-kicker">填写信息</div>
        <div className="stack-list">
          <label className="form-field">
            <span>用户编码 *</span>
            <input value={form.userCode} onChange={(event) => setForm((current) => ({ ...current, userCode: event.target.value }))} placeholder="建议使用英文或数字，如 alpha_user_01" />
          </label>
          <label className="form-field">
            <span>昵称</span>
            <input value={form.nickname} onChange={(event) => setForm((current) => ({ ...current, nickname: event.target.value }))} placeholder="怎么称呼你，如 短线研究员" />
          </label>
          <label className="form-field">
            <span>手机号</span>
            <input value={form.mobile} onChange={(event) => setForm((current) => ({ ...current, mobile: event.target.value }))} placeholder="选填，用于接收重要通知" />
          </label>
          <label className="form-field">
            <span>密码 *</span>
            <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="至少 6 位，建议字母 + 数字组合" />
          </label>
          <button className="primary-button" type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? '注册中...' : '注册并登录'}
          </button>
          <button className="secondary-button" type="button" onClick={() => navigate('/login')} disabled={isSubmitting}>
            已有账号？去登录
          </button>
          {error ? <div className="note-card error-card">{error}</div> : null}
          <div className="note-card">
            <strong>🔒 安全提示：</strong>注册前需阅读并同意相关协议
          </div>
        </div>
      </section>

      <AgreementModal
        isOpen={showAgreement}
        onClose={() => {
          setShowAgreement(false)
          setIsSubmitting(false)
          setError('请先阅读并同意相关协议')
        }}
        onAgree={() => {
          setAgreed(true)
          setShowAgreement(false)
          // 继续提父
          handleSubmit()
        }}
        type="registration"
      />
    </div>
  )
}

export default RegisterPage