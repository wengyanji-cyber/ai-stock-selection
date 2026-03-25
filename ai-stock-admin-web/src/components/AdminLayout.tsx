import type { PropsWithChildren } from 'react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { logoutAdminSession } from '../api/adminApi'
import { ADMIN_APP_NAME, ADMIN_DATA_MODE } from '../constants/runtime'
import { adminRoutes } from '../routes'
import { getAdminSession } from '../utils/session'

function AdminLayout({ children }: PropsWithChildren) {
  const operationsRoutes = adminRoutes.filter((route) => route.section === 'operations')
  const techRoutes = adminRoutes.filter((route) => route.section === 'tech')
  const location = useLocation()
  const currentRoute = adminRoutes.find((route) => route.path === location.pathname)
  const session = getAdminSession()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  return (
    <div className="admin-frame">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-title">{ADMIN_APP_NAME}</div>
          <div className="brand-subtitle">ai-stock-admin-web · 全新独立项目</div>
        </div>
        <div className="menu-section">
          <div className="menu-title">运营管理端</div>
          {operationsRoutes.map((route) => (
            <NavLink key={route.path} to={route.path} className={({ isActive }) => (isActive ? 'side-link active' : 'side-link')}>
              {route.label}
            </NavLink>
          ))}
        </div>
        <div className="menu-section">
          <div className="menu-title">技术管理端</div>
          {techRoutes.map((route) => (
            <NavLink key={route.path} to={route.path} className={({ isActive }) => (isActive ? 'side-link active' : 'side-link')}>
              {route.label}
            </NavLink>
          ))}
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="menu-title">当前模块</div>
            <div className="topbar-title">{currentRoute?.label ?? '管理后台'}</div>
          </div>
          <div className="topbar-meta">
            <span className="soft-chip">{ADMIN_DATA_MODE} 数据模式</span>
            <span className="soft-chip">{session?.profile.nickname || '未登录'}</span>
            {session ? (
              <button
                className="action-button"
                type="button"
                disabled={isLoggingOut}
                onClick={() => {
                  setIsLoggingOut(true)
                  void logoutAdminSession().finally(() => {
                    window.location.href = '/login'
                  })
                }}
              >
                {isLoggingOut ? '退出中...' : '退出登录'}
              </button>
            ) : null}
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}

export default AdminLayout