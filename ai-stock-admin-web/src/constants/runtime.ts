type AdminDataMode = 'mock' | 'hybrid'

export const ADMIN_APP_NAME = 'AI 选股管理后台'
export const ADMIN_DATA_MODE: AdminDataMode = 'hybrid'
export const ADMIN_API_BASE_URL = import.meta.env.VITE_AI_STOCK_API_BASE_URL || ''
