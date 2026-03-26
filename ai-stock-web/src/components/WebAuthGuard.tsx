import { useEffect, useState, type PropsWithChildren } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { refreshCurrentSession } from '../api/demoApi'
import { getCurrentSession } from '../utils/session'

function WebAuthGuard({ children }: PropsWithChildren) {
  const navigate = useNavigate()
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
    return (
      <div className="page-stack">
        <section className="panel-card">
          <div className="section-kicker">需要登录</div>
          <h2>请先登录</h2>
          <p>该功能需要登录后才能使用。</p>
          <div className="action-row">
            <button 
              className="primary-button" 
              onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)}
            >
              立即登录
            </button>
            <button 
              className="secondary-button" 
              onClick={() => navigate('/trial')}
            >
              试用体验
            </button>
          </div>
        </section>
      </div>
    )
  }

  return <>{children}</>
}

export default WebAuthGuard