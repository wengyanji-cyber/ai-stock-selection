import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/modules/auth/password.service.js'

const prisma = new PrismaClient()

/**
 * 创建 4 个测试会员账号
 * 用于测试不同套餐的权限控制
 */
async function createTestAccounts() {
  const accounts = [
    {
      userCode: 'trial_user',
      nickname: '试用用户',
      mobile: '13800000001',
      password: 'test123456',
      membershipPlan: 'TRIAL',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 天后
    },
    {
      userCode: 'observer_user',
      nickname: '观察用户',
      mobile: '13800000002',
      password: 'test123456',
      membershipPlan: 'OBSERVER',
      subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 天后
    },
    {
      userCode: 'standard_user',
      nickname: '标准用户',
      mobile: '13800000003',
      password: 'test123456',
      membershipPlan: 'STANDARD',
      subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      userCode: 'advanced_user',
      nickname: '进阶用户',
      mobile: '13800000004',
      password: 'test123456',
      membershipPlan: 'ADVANCED',
      subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  ]

  console.log('📝 开始创建测试账号...')

  for (const account of accounts) {
    try {
      // 检查是否已存在
      const existing = await prisma.user.findUnique({
        where: { userCode: account.userCode },
      })

      if (existing) {
        console.log(`⏭️  账号 ${account.userCode} 已存在，跳过`)
        continue
      }

      // 创建用户
      const user = await prisma.user.create({
        data: {
          userCode: account.userCode,
          nickname: account.nickname,
          mobile: account.mobile,
          passwordHash: await hashPassword(account.password),
          membershipPlan: account.membershipPlan,
          trialEndsAt: account.trialEndsAt,
          subscriptionEndsAt: account.subscriptionEndsAt,
        },
      })

      console.log(`✅ 创建成功：${account.userCode} (${account.membershipPlan})`)
    } catch (error) {
      console.error(`❌ 创建失败：${account.userCode}`, error)
    }
  }

  console.log('✅ 测试账号创建完成')
  console.log('')
  console.log('📋 账号列表：')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('试用用户：trial_user / test123456')
  console.log('观察用户：observer_user / test123456')
  console.log('标准用户：standard_user / test123456')
  console.log('进阶用户：advanced_user / test123456')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  await prisma.$disconnect()
}

createTestAccounts().catch(console.error)
