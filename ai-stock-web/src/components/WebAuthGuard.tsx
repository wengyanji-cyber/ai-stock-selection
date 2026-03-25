import { useEffect, useState, type PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { refreshCurrentSession } from '../api/demoApi'
import { getCurrentSession } from '../utils/session'

function WebAuthGuard({ children }: PropsWithChildren) {
  const session = getCurrentSession()
  const location = useLocation()
  const [status, setStatus] = useState<'checking' | 'ready' | 'unauthorized'>(session ? 'checking' : 'unauthorized')

  useEffect(() => {
    if (!session) {
      setStatus('unauthorized')
      return
    }

    let active = true
    setStatus('checking')

    void refreshCurrentSession()
      .then(() => {
        if (active) {
          setStatus('ready')
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
  }, [location.pathname, session?.accessToken])

  if (status === 'checking') {
    return (
      <div className="page-stack">
        <section className="panel-card">
          <div className="section-kicker">会话校验</div>
          <h2>正在确认登录状态。</h2>
          <p>若当前会话失效，将自动返回登录页。</p>
        </section>
      </div>
    )
  }

  if (!session || status === 'unauthorized') {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

export default WebAuthGuard