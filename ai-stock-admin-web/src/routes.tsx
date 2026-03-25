import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import CompliancePage from './pages/CompliancePage'
import DataJobsPage from './pages/DataJobsPage'
import LoginPage from './pages/LoginPage'
import ModelRulesPage from './pages/ModelRulesPage'
import OperationsDashboardPage from './pages/OperationsDashboardPage'
import TechDashboardPage from './pages/TechDashboardPage'
import UserGrowthPage from './pages/UserGrowthPage'

export type AdminRouteConfig = {
  path: string
  label: string
  section?: 'operations' | 'tech'
  element: ReactNode
}

export const adminRoutes: AdminRouteConfig[] = [
  { path: '/', label: '首页', element: <Navigate to="/operations" replace /> },
  { path: '/login', label: '登录', element: <LoginPage /> },
  { path: '/operations', label: '运营总览', section: 'operations', element: <OperationsDashboardPage /> },
  { path: '/operations/users', label: '用户与增长', section: 'operations', element: <UserGrowthPage /> },
  { path: '/operations/compliance', label: '合规巡检', section: 'operations', element: <CompliancePage /> },
  { path: '/tech', label: '技术总览', section: 'tech', element: <TechDashboardPage /> },
  { path: '/tech/jobs', label: '数据任务', section: 'tech', element: <DataJobsPage /> },
  { path: '/tech/rules', label: '模型与规则', section: 'tech', element: <ModelRulesPage /> },
]