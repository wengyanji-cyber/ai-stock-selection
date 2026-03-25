import type { PropsWithChildren } from 'react'
import { NavLink } from 'react-router-dom'
import { WEB_APP_NAME } from '../constants/runtime'
import { webRoutes } from '../routes'

function WebLayout({ children }: PropsWithChildren) {
  return (
    <div className="web-shell">
      <header className="web-header">
        <div>
          <div className="brand-title">{WEB_APP_NAME}</div>
          <div className="brand-subtitle">ai-stock-web · 用户端独立项目</div>
        </div>
        <nav className="web-nav">
          {webRoutes
            .filter((route) => route.nav)
            .map((route) => (
              <NavLink
                key={route.path}
                to={route.path}
                className={({ isActive }) => (isActive ? 'nav-chip active' : 'nav-chip')}
              >
                {route.label}
              </NavLink>
            ))}
        </nav>
      </header>
      {children}
    </div>
  )
}

export default WebLayout