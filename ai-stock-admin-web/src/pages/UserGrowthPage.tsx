import AdminPanel from '../components/AdminPanel'
import DataTable from '../components/DataTable'
import { useAdminUsers } from '../hooks/useAdminUsers'

function UserGrowthPage() {
  const { items, isLoading, isSaving, source, error, refresh, updateUser, removeUser, resetPassword } = useAdminUsers()

  return (
    <div className="page-stack">
      <AdminPanel kicker="用户与增长" title="把 trial、login、pricing、account 串成可观测漏斗。">
        <ul className="bullet-list">
          <li>访问试用页到注册，再到体验 3 个模块、第 7 天回访，最后进入试用后订阅。</li>
          <li>重点盯前三天是否建立日常打开习惯，而不是只看进站量。</li>
          <li>后续这里接埋点漏斗、用户标签和分群运营。</li>
        </ul>
      </AdminPanel>
      <AdminPanel kicker="重点跟进用户">
        <div className="action-toolbar">
          <button className="action-button" type="button" onClick={() => void refresh()} disabled={isLoading}>
            {isLoading ? '刷新中...' : '刷新用户列表'}
          </button>
        </div>
        {error ? <div className="note-card error-card">用户列表接口异常：{error}</div> : null}
        <DataTable
          headers={['用户', '阶段', '行为特征', '下一步动作']}
          rows={items.map((user) => [
            <div>
              <strong>{user.name}</strong>
              <div className="subtle-meta">{user.userCode}</div>
            </div>,
            user.phase,
            `${user.behavior} / 自选 ${user.watchlistCount} 只`,
            <div className="stack-list">
              <span>{user.nextAction}{user.latestPushTemplate ? ` / 最近触达：${user.latestPushTemplate}` : ''}</span>
              <div className="action-toolbar">
                <button
                  className="action-button"
                  type="button"
                  onClick={() => void updateUser({ userCode: user.userCode, membershipPlan: user.membershipPlan === 'STANDARD' ? 'TRIAL' : 'STANDARD', status: user.membershipPlan === 'STANDARD' ? 'TRIAL' : 'ACTIVE', nickname: user.name })}
                  disabled={isSaving}
                >
                  {user.membershipPlan === 'STANDARD' ? '降回试用' : '升级标准版'}
                </button>
                <button
                  className="action-button"
                  type="button"
                  onClick={() => {
                    const nextPassword = window.prompt(`为 ${user.userCode} 设置新密码（至少 8 位）`, 'reset12345')
                    if (!nextPassword) {
                      return
                    }

                    void resetPassword(user.userCode, nextPassword)
                  }}
                  disabled={isSaving}
                >
                  重置密码
                </button>
                {user.userCode.startsWith('trial_') && user.watchlistCount === 0 ? (
                  <button className="action-button" type="button" onClick={() => void removeUser(user.userCode)} disabled={isSaving}>
                    删除试用用户
                  </button>
                ) : null}
              </div>
            </div>,
          ])}
          rowClassName="growth-row"
        />
        <div className="note-card">当前数据源：{source === 'api' ? '后端接口' : '本地 mock 回退'}。管理员可直接为用户重置密码，旧登录会话会同步失效。</div>
      </AdminPanel>
    </div>
  )
}

export default UserGrowthPage