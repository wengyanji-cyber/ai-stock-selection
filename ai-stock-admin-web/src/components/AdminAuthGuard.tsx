import { useEffect, useState, type PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { refreshAdminSession } from '../api/adminApi'
import { getAdminSession } from '../utils/session'

function AdminAuthGuard({ children }: PropsWithChildren) {
  const session = getAdminSession()
  const location = useLocation()
  const [status, setStatus] = useState<'checking' | 'ready' | 'unauthorized'>(session ? 'checking' : 'unauthorized')

  useEffect(() => {
    if (!session || session.profile.roleCode !== 'ADMIN') {
      setStatus('unauthorized')
      return
    }

    let active = true
    setStatus('checking')

    void refreshAdminSession()
      .then((nextSession) => {
        if (active) {
          setStatus(nextSession.profile.roleCode === 'ADMIN' ? 'ready' : 'unauthorized')
        }
      })
      .catch(() => {
        if (active) {
          setStatus('unauthorized')
        }
      })

    return () => {
      active = false
    }
  }, [location.pathname, session?.accessToken, session?.profile.roleCode])

  if (status === 'checking') {
    return (
      <div className="page-stack">
        <section className="panel-card">
          <div className="section-kicker">后台鉴权</div>
          <h2>正在校验管理员会话。</h2>
          <p>如果权限已失效，会自动退回后台登录页。</p>
        </section>
      </div>
    )
  }

  if (!session || session.profile.roleCode !== 'ADMIN' || status === 'unauthorized') {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

export default AdminAuthGuard