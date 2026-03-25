import AlipaySdk from 'alipay-sdk'
import AlipayFormData from 'alipay-sdk/lib/alipay-form'

/**
 * 支付宝支付服务
 * 
 * 使用 alipay-sdk 实现真实支付宝支付
 * 文档：https://github.com/alipay/alipay-sdk-nodejs-all
 */

// 支付宝配置
const alipayConfig = {
  appId: process.env.ALIPAY_APPID || '2021000000000000',
  privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
  gateway: 'https://openapi.alipay.com/gateway.do',
}

/**
 * 创建支付宝支付订单（手机网站支付）
 */
export async function createAlipayOrder(
  orderNo: string,
  amount: number,
  subject: string
) {
  const alipaySdk = new AlipaySdk({
    appId: alipayConfig.appId,
    privateKey: alipayConfig.privateKey,
    alipayPublicKey: alipayConfig.alipayPublicKey,
    gateway: alipayConfig.gateway,
  })

  const formData = new AlipayFormData()
  formData.setMethod('get')
  formData.addField('notifyUrl', process.env.ALIPAY_NOTIFY_URL)
  formData.addField('returnUrl', process.env.ALIPAY_RETURN_URL)
  formData.addField('bizContent', {
    outTradeNo: orderNo,
    productCode: 'QUICK_WAP_WAY',
    totalAmount: amount.toFixed(2),
    subject,
  })

  // 生成支付 URL
  const payUrl = await alipaySdk.exec(
    'alipay.trade.wap.pay',
    {},
    { formData }
  )

  return {
    payUrl,
    orderNo,
    amount,
  }
}

/**
 * 查询支付宝订单状态
 */
export async function queryAlipayOrder(orderNo: string) {
  const alipaySdk = new AlipaySdk({
    appId: alipayConfig.appId,
    privateKey: alipayConfig.privateKey,
    alipayPublicKey: alipayConfig.alipayPublicKey,
    gateway: alipayConfig.gateway,
  })

  const result = await alipaySdk.exec('alipay.trade.query', {
    bizContent: {
      outTradeNo: orderNo,
    },
  })

  return result
}

/**
 * 处理支付宝回调
 */
export async function handleAlipayNotify(params: Record<string, any>) {
  const alipaySdk = new AlipaySdk({
    appId: alipayConfig.appId,
    privateKey: alipayConfig.privateKey,
    alipayPublicKey: alipayConfig.alipayPublicKey,
    gateway: alipayConfig.gateway,
  })

  const result = alipaySdk.checkNotifySign(params)
  
  if (!result) {
    return { success: false }
  }

  return {
    success: true,
    data: params,
  }
}
