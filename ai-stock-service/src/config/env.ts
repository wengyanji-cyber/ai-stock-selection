import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  APP_ENV: z.enum(['dev', 'test', 'prod']).default('dev'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().positive().default(3010),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().min(1).default('mysql://root:password@127.0.0.1:3306/ai_stock'),
  REDIS_URL: z.string().min(1).default('redis://127.0.0.1:6379'),
  
  // Tushare 配置
  TUSHARE_TOKEN: z.string().optional(),
  TUSHARE_API_URL: z.string().default('http://api.tushare.pro'),
  
  // 推送服务配置
  WECHAT_TEMPLATE_ID: z.string().optional(),
  SMS_PROVIDER: z.string().default('tencent'),
  SMS_SECRET_ID: z.string().optional(),
  SMS_SECRET_KEY: z.string().optional(),
  EMAIL_SMTP_HOST: z.string().optional(),
  EMAIL_SMTP_PORT: z.coerce.number().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
})

export const env = envSchema.parse(process.env)