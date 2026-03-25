import { env } from '../config/env.js'

export interface PushMessage {
  userId: bigint
  channel: 'APP' | 'WECHAT' | 'SMS' | 'EMAIL'
  templateCode: string
  data: Record<string, string>
}

export async function sendWechatTemplate(userId: bigint, templateId: string, data: Record<string, string>) {
  if (!env.WECHAT_TEMPLATE_ID) {
    console.log('[Push] 微信推送跳过（未配置）')
    return { sent: false, reason: 'not_configured' }
  }

  // TODO: 接入微信公众号 API
  console.log(`[Push] 发送微信模板消息：userId=${userId}, template=${templateId}`)
  
  return { sent: true, messageId: `wx_${Date.now()}` }
}

export async function sendSMS(mobile: string, content: string) {
  if (!env.SMS_SECRET_ID || !env.SMS_SECRET_KEY) {
    console.log('[Push] 短信推送跳过（未配置）')
    return { sent: false, reason: 'not_configured' }
  }

  // TODO: 接入腾讯云短信 API
  console.log(`[Push] 发送短信：${mobile}, 内容：${content}`)
  
  return { sent: true, messageId: `sms_${Date.now()}` }
}

export async function sendEmail(email: string, subject: string, html: string) {
  if (!env.EMAIL_USER || !env.EMAIL_PASSWORD) {
    console.log('[Push] 邮件推送跳过（未配置）')
    return { sent: false, reason: 'not_configured' }
  }

  // TODO: 接入 SMTP 邮件服务
  console.log(`[Push] 发送邮件：${email}, 主题：${subject}`)
  
  return { sent: true, messageId: `email_${Date.now()}` }
}

export async function sendPush(message: PushMessage) {
  switch (message.channel) {
    case 'WECHAT':
      return sendWechatTemplate(message.userId, message.templateCode, message.data)
    case 'SMS':
      return sendSMS(message.data.mobile || '', message.data.content || '')
    case 'EMAIL':
      return sendEmail(message.data.email || '', message.data.subject || '', message.data.html || '')
    case 'APP':
    default:
      console.log('[Push] APP 内推送', message.data)
      return { sent: true, messageId: `app_${Date.now()}` }
  }
}

export async function notifyDailyRecommendation(userId: bigint, channel: 'APP' | 'WECHAT' | 'SMS' | 'EMAIL', stockName: string, stockCode: string) {
  return sendPush({
    userId,
    channel,
    templateCode: 'daily_rec',
    data: {
      stockName,
      stockCode,
      time: new Date().toLocaleString('zh-CN'),
    },
  })
}

export async function notifyRiskWarning(userId: bigint, channel: 'APP' | 'WECHAT' | 'SMS' | 'EMAIL', stockName: string, reason: string) {
  return sendPush({
    userId,
    channel,
    templateCode: 'risk_warn',
    data: {
      stockName,
      reason,
      time: new Date().toLocaleString('zh-CN'),
    },
  })
}
