import { Link } from 'react-router-dom'
import { useState } from 'react'
import { changeUserPassword, logoutCurrentSession } from '../api/demoApi'
import { useUserProfile } from '../hooks/useUserProfile'
import { getCurrentUserCode } from '../utils/session'

function AccountPage() {
  const userCode = getCurrentUserCode()
  const { profile, isLoading, source, error, refresh } = useUserProfile(userCode)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordState, setPasswordState] = useState<{ isSubmitting: boolean; error: string; success: string }>({
    isSubmitting: false,
    error: '',
    success: '',
  })

  async function handleChangePassword() {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordState({ isSubmitting: false, error: '请完整填写当前密码和新密码', success: '' })
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordState({ isSubmitting: false, error: '新密码至少 8 位', success: '' })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordState({ isSubmitting: false, error: '两次输入的新密码不一致', success: '' })
      return
    }

    setPasswordState({ isSubmitting: true, error: '', success: '' })

    try {
      await changeUserPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordState({ isSubmitting: false, error: '', success: '密码已更新，当前设备会话已自动续新。' })
    } catch (submitError) {
      setPasswordState({
        isSubmitting: false,
        error: submitError instanceof Error ? submitError.message : '修改密码失败',
        success: '',
      })
    }
  }

  if (!userCode) {
    return (
      <div className="page-stack">
        <section className="panel-card">
          <div className="section-kicker">用户中心</div>
          <h2>当前还没有登录用户。</h2>
          <p>先登录已有试用用户，或者直接开通一个新的 14 天试用账号。</p>
          <div className="action-row">
            <Link className="primary-button" to="/login">
              去登录
            </Link>
            <Link className="secondary-button" to="/trial">
              去开通试用
            </Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">用户中心</span>
          <h1>把每天回来打开的理由，做成清晰的个人视图。</h1>
          <p>用户中心聚焦试用进度、观察列表、最近诊股和下一步动作，是留存页，不是纯资料页。</p>
        </div>
        <div className="metric-grid">
          <div className="metric-card"><strong>{profile?.trialDaysRemaining ?? '--'} 天</strong><span>试用剩余</span></div>
          <div className="metric-card"><strong>{profile?.watchlistCount ?? '--'} 只</strong><span>观察股票</span></div>
          <div className="metric-card"><strong>{profile?.diagnosisCount ?? '--'} 次</strong><span>当前诊股快照</span></div>
        </div>
      </section>
      <div className="action-row">
        <button className="secondary-button" type="button" onClick={() => void refresh()} disabled={isLoading}>
          {isLoading ? '刷新中...' : '刷新用户中心'}
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            void logoutCurrentSession().finally(() => {
              window.location.href = '/login'
            })
          }}
        >
          退出当前账号
        </button>
      </div>
      <div className="note-card">当前用户：{profile?.nickname || userCode}，数据源：{source === 'api' ? '后端接口' : '本地 mock 回退'}。</div>
      {error ? <div className="note-card error-card">用户资料接口异常：{error}</div> : null}
      <section className="content-grid">
        <article className="panel-card">
          <div className="section-kicker">下一步动作</div>
          <ul className="bullet-list">
            {(profile?.nextActions || []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="panel-card">
          <div className="section-kicker">最近活动</div>
          <div className="note-card">
            {profile?.recentActivities.length ? profile.recentActivities.join('；') : '最近 7 天最常使用的模块是个股诊断，其次是候选池。'}
          </div>
          <div className="note-card">最近登录时间：{profile?.lastLoginAt ? profile.lastLoginAt.replace('T', ' ').slice(0, 19) : '未记录'}</div>
        </article>
      </section>
      <section className="panel-card">
        <div className="section-kicker">账号安全</div>
        <div className="stack-list compact-top-gap">
          <label className="form-field">
            <span>当前密码</span>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
              placeholder="请输入当前密码"
            />
          </label>
          <label className="form-field">
            <span>新密码</span>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
              placeholder="至少 8 位"
            />
          </label>
          <label className="form-field">
            <span>确认新密码</span>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
              placeholder="再次输入新密码"
            />
          </label>
          <div className="action-row">
            <button className="primary-button" type="button" onClick={() => void handleChangePassword()} disabled={passwordState.isSubmitting}>
              {passwordState.isSubmitting ? '提交中...' : '更新登录密码'}
            </button>
          </div>
          {passwordState.error ? <div className="note-card error-card">{passwordState.error}</div> : null}
          {passwordState.success ? <div className="note-card">{passwordState.success}</div> : null}
        </div>
      </section>
    </div>
  )
}

export default AccountPage