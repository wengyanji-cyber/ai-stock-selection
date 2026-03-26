import { useEffect, useState, type PropsWithChildren } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { WEB_APP_NAME } from '../constants/runtime'
import { webRoutes } from '../routes'
import { getCurrentSession, clearCurrentSession } from '../utils/session'

function WebLayout({ children }: PropsWithChildren) {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userCode, setUserCode] = useState('')

  useEffect(() => {
    checkLoginStatus()
    
    // 监听存储变化，实现多标签同步和单标签登录状态更新
    const handleStorageChange = () => checkLoginStatus()
    window.addEventListener('storage', handleStorageChange)
    
    // 使用定时器轮询检查登录状态（响应同标签页的登录/登出）
    const interval = setInterval(checkLoginStatus, 1000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  function checkLoginStatus() {
    const session = getCurrentSession()
    setIsLoggedIn(!!session)
    setUserCode(session?.profile.userCode || '')
  }

  function handleLogout() {
    clearCurrentSession()
    setIsLoggedIn(false)
    setUserCode('')
    navigate('/')
    // 触发存储事件，同步其他标签
    window.dispatchEvent(new Event('storage'))
  }

  // 根据登录状态过滤导航项
  const navItems = webRoutes.filter((route) => {
    if (!route.nav) return false
    
    // 未登录时隐藏需要登录的功能
    if (!isLoggedIn) {
      const hiddenWhenLoggedOut = ['/account', '/watch', '/subscription', '/candidates', '/diagnosis', '/review', '/strategy']
      if (hiddenWhenLoggedOut.includes(route.path)) {
        return false
      }
    }
    
    // 已登录时隐藏登录/注册和营销页面
    if (isLoggedIn) {
      const hiddenWhenLoggedIn = ['/login', '/register', '/pricing', '/trial']
      if (hiddenWhenLoggedIn.includes(route.path)) {
        return false
      }
    }
    
    return true
  })

  return (
    <div className="web-shell">
      <header className="web-header">
        <div>
          <div className="brand-title">{WEB_APP_NAME}</div>
          <div className="brand-subtitle">ai-stock-web · 用户端独立项目</div>
        </div>
        <nav className="web-nav">
          {navItems.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) => (isActive ? 'nav-chip active' : 'nav-chip')}
            >
              {route.label}
            </NavLink>
          ))}
          
          {/* 登录状态显示 */}
          {isLoggedIn ? (
            <div className="user-status">
              <span className="user-code">{userCode}</span>
              <button 
                className="nav-chip logout-btn" 
                onClick={handleLogout}
                type="button"
              >
                退出登录
              </button>
            </div>
          ) : null}
        </nav>
      </header>
      {children}
    </div>
  )
}

export default WebLayout
