type WebDataMode = 'mock' | 'hybrid'

export const WEB_APP_NAME = 'AI短线投研助手'
export const WEB_DATA_MODE: WebDataMode = 'hybrid'
export const WEB_API_BASE_URL = import.meta.env.VITE_AI_STOCK_API_BASE_URL || ''