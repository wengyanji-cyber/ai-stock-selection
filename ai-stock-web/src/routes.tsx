import type { ReactNode } from 'react'
import AccountPage from './pages/AccountPage'
import CandidatesPage from './pages/CandidatesPage'
import DiagnosisPage from './pages/DiagnosisPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MarketOverviewPage from './pages/MarketOverviewPage'
import PricingPage from './pages/PricingPage'
import RegisterPage from './pages/RegisterPage'
import ReviewPage from './pages/ReviewPage'
import StockDetailPage from './pages/StockDetailPage'
import { SubscriptionPage } from './pages/SubscriptionPage'
import TrialPage from './pages/TrialPage'
import WatchPage from './pages/WatchPage'

export type WebRouteConfig = {
  path: string
  label: string
  nav?: boolean
  element: ReactNode
}

export const webRoutes: WebRouteConfig[] = [
  { path: '/', label: '首页', element: <HomePage /> },
  { path: '/market', label: '市场首页', nav: true, element: <MarketOverviewPage /> },
  { path: '/candidates', label: '候选池', nav: true, element: <CandidatesPage /> },
  { path: '/stocks/:stockCode', label: '个股详情', nav: false, element: <StockDetailPage /> },
  { path: '/diagnosis', label: '个股诊断', nav: true, element: <DiagnosisPage /> },
  { path: '/watch', label: '自选观察', nav: true, element: <WatchPage /> },
  { path: '/review', label: '复盘', nav: true, element: <ReviewPage /> },
  { path: '/trial', label: '试用开通', nav: true, element: <TrialPage /> },
  { path: '/pricing', label: '订阅方案', nav: true, element: <PricingPage /> },
  { path: '/login', label: '登录注册', nav: true, element: <LoginPage /> },
  { path: '/register', label: '正式注册', nav: true, element: <RegisterPage /> },
  { path: '/account', label: '用户中心', nav: true, element: <AccountPage /> },
  { path: '/subscription', label: '订阅管理', nav: true, element: <SubscriptionPage /> },
]