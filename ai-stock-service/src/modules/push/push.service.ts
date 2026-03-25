import { prisma } from '../../lib/prisma.js'
import { sendPush, notifyDailyRecommendation, notifyRiskWarning } from '../../lib/push.js'

export async function createPushTask(input: {
  userId?: bigint
  channel: 'APP' | 'WECHAT' | 'SMS' | 'EMAIL'
  templateCode: string
  data: Record<string, string>
}) {
  const task = await prisma.pushTask.create({
    data: {
      userId: input.userId,
      channel: input.channel,
      templateCode: input.templateCode,
      payload: input.data,
    },
  })

  try {
    const result = await sendPush({
      userId: input.userId || BigInt(0),
      channel: input.channel,
      templateCode: input.templateCode,
      data: input.data,
    })

    await prisma.pushTask.update({
      where: { id: task.id },
      data: {
        sentAt: new Date(),
        payload: { ...input.data, ...result },
      },
    })

    return { sent: true, taskId: task.id }
  } catch (error) {
    await prisma.pushTask.update({
      where: { id: task.id },
      data: {
        payload: { ...input.data, error: error instanceof Error ? error.message : 'unknown' },
      },
    })

    return { sent: false, error }
  }
}

export async function sendDailyRecommendations() {
  const candidates = await prisma.candidateSignal.findMany({
    where: { signalLevel: '重点候选' },
    take: 3,
  })

  const trialUsers = await prisma.appUser.findMany({
    where: { status: 'TRIAL' },
  })

  let sent = 0
  for (const user of trialUsers) {
    for (const candidate of candidates) {
      await notifyDailyRecommendation(
        user.id,
        'WECHAT',
        candidate.stockName,
        candidate.stockCode,
      )
      sent++
    }
  }

  return { sent }
}

export async function sendRiskWarnings(stockCode: string, reason: string) {
  const watchlistUsers = await prisma.watchlistItem.findMany({
    where: { stockCode },
    include: { user: true },
  })

  let sent = 0
  for (const item of watchlistUsers) {
    if (item.user) {
      await notifyRiskWarning(
        item.user.id,
        'WECHAT',
        item.stockName,
        reason,
      )
      sent++
    }
  }

  return { sent }
}

export async function getPushHistory(userId?: bigint, limit = 20) {
  const tasks = await prisma.pushTask.findMany({
    where: userId ? { userId } : {},
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return tasks
}
