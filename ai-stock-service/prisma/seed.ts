import { PrismaClient, PushChannel } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.pushTask.deleteMany()
  await prisma.watchlistItem.deleteMany()
  await prisma.modelRuleConfig.deleteMany()
  await prisma.jobRun.deleteMany()
  await prisma.reviewSnapshot.deleteMany()
  await prisma.diagnosisSnapshot.deleteMany()
  await prisma.candidateSignal.deleteMany()
  await prisma.candidatePoolSnapshot.deleteMany()
  await prisma.marketDailyBar.deleteMany()
  await prisma.sourceSnapshot.deleteMany()
  await prisma.appUser.deleteMany()

  await prisma.sourceSnapshot.createMany({
    data: [
      {
        sourceCode: 'akshare-hot-sector',
        snapshotDate: new Date('2026-03-24'),
        payload: {
          sectors: ['AI算力链', '机器人'],
          marketTemperature: '中高',
        },
        checksum: 'demo-source-20260324',
      },
      {
        sourceCode: 'eastmoney-candidates',
        snapshotDate: new Date('2026-03-24'),
        payload: {
          candidateCount: 4,
          strategyCode: 'hot-sector-short-cycle',
        },
        checksum: 'demo-candidates-20260324',
      },
    ],
  })

  await prisma.marketDailyBar.createMany({
    data: [
      {
        tradeDate: new Date('2026-03-24'),
        stockCode: '300001',
        stockName: '示例科技',
        sectorCode: 'AI_COMPUTE',
        sectorName: 'AI算力链',
        openPrice: '18.72',
        closePrice: '19.08',
        highPrice: '19.22',
        lowPrice: '18.60',
        turnoverRate: '8.4300',
        volumeRatio: '1.6200',
        amount: '486000000.00',
        extraMetrics: {
          changeRate: 4.21,
          amplitude: 3.31,
        },
      },
      {
        tradeDate: new Date('2026-03-24'),
        stockCode: '300002',
        stockName: '示例智能',
        sectorCode: 'ROBOTICS',
        sectorName: '机器人',
        openPrice: '26.58',
        closePrice: '26.96',
        highPrice: '27.15',
        lowPrice: '26.40',
        turnoverRate: '9.1200',
        volumeRatio: '1.4300',
        amount: '532000000.00',
        extraMetrics: {
          changeRate: 2.84,
          amplitude: 2.82,
        },
      },
      {
        tradeDate: new Date('2026-03-24'),
        stockCode: '600003',
        stockName: '示例云算',
        sectorCode: 'AI_COMPUTE',
        sectorName: 'AI算力链',
        openPrice: '12.08',
        closePrice: '12.36',
        highPrice: '12.48',
        lowPrice: '12.02',
        turnoverRate: '5.2400',
        volumeRatio: '1.1800',
        amount: '215000000.00',
        extraMetrics: {
          changeRate: 2.49,
          amplitude: 3.81,
        },
      },
      {
        tradeDate: new Date('2026-03-24'),
        stockCode: '688004',
        stockName: '示例芯算',
        sectorCode: 'AI_COMPUTE',
        sectorName: 'AI算力链',
        openPrice: '45.10',
        closePrice: '46.12',
        highPrice: '46.58',
        lowPrice: '44.96',
        turnoverRate: '10.5600',
        volumeRatio: '1.8500',
        amount: '398000000.00',
        extraMetrics: {
          changeRate: 3.85,
          amplitude: 3.60,
        },
      },
    ],
  })

  const candidatePoolSnapshot = await prisma.candidatePoolSnapshot.create({
    data: {
      snapshotDate: new Date('2026-03-24'),
      strategyCode: 'hot-sector-short-cycle',
      versionTag: 'v1',
      marketSummary: {
        marketSummary: '市场短线情绪仍偏活跃，今天重点关注 AI 算力链和机器人方向。',
        marketTemperature: '中高',
      },
      candidateItems: {
        create: [
          {
            stockCode: '300001',
            stockName: '示例科技',
            sectorName: 'AI算力链',
            signalLevel: '重点候选',
            score: '87.50',
            riskScore: '28.30',
            holdingWindow: '1-3D',
            driverSummary: '短线结构偏强，可关注回踩支撑后的承接表现。',
            tags: ['板块升温', '量价共振', '高辨识度'],
          },
          {
            stockCode: '300002',
            stockName: '示例智能',
            sectorName: '机器人',
            signalLevel: '重点候选',
            score: '81.40',
            riskScore: '35.10',
            holdingWindow: '1-3D',
            driverSummary: '更适合等回踩确认，不建议远离观察区间追高。',
            tags: ['题材持续', '板块分化', '等待确认'],
          },
          {
            stockCode: '600003',
            stockName: '示例云算',
            sectorName: 'AI算力链',
            signalLevel: '扩展观察',
            score: '76.20',
            riskScore: '22.40',
            holdingWindow: '2-5D',
            driverSummary: '属于板块补涨逻辑，机会有但优先级低于核心票。',
            tags: ['补涨', '中位股', '次级关注'],
          },
          {
            stockCode: '688004',
            stockName: '示例芯算',
            sectorName: 'AI算力链',
            signalLevel: '扩展观察',
            score: '74.80',
            riskScore: '39.60',
            holdingWindow: '1-2D',
            driverSummary: '波动弹性较强，更适合强势行情下的小仓位观察。',
            tags: ['高波动', '强势行情', '小仓位'],
          },
        ],
      },
    },
  })

  await prisma.diagnosisSnapshot.createMany({
    data: [
      {
        stockCode: '300001',
        tradeDate: new Date('2026-03-24'),
        versionTag: 'v1',
        totalScore: '87.50',
        biasLabel: '观察优先',
        trendLabel: '上升趋势',
        riskLabel: '高波动',
        summary: {
          name: '示例科技',
          sector: 'AI算力链',
          summary: '当前仍处于短线强势区间，但位置偏高，更适合等待回踩确认而非直接追高。',
          observe: '18.60 - 19.10',
          support: '18.42',
          pressure: '20.15',
          stopLoss: '17.98',
          action: '当前更适合观察，不适合在远离支撑位时追高参与。',
        },
        factors: {
          reasons: ['板块热度仍处于高位。', '个股量价结构未明显走坏。', '但短期涨幅偏大，继续上攻需要新的承接。'],
          risks: ['若板块午后分歧扩大，易出现冲高回落。', '如果成交量突然失衡，强势结构可能被打断。'],
        },
      },
      {
        stockCode: '300002',
        tradeDate: new Date('2026-03-24'),
        versionTag: 'v1',
        totalScore: '81.40',
        biasLabel: '等待确认',
        trendLabel: '震荡偏强',
        riskLabel: '中高风险',
        summary: {
          name: '示例智能',
          sector: '机器人',
          summary: '仍有延续可能，但强度不如昨日，更适合等量能确认而非先手追高。',
          observe: '26.40 - 27.10',
          support: '26.12',
          pressure: '28.20',
          stopLoss: '25.68',
          action: '优先等回踩确认，只有重新放量转强时才考虑提高关注度。',
        },
        factors: {
          reasons: ['板块仍在热点范围内。', '个股没有明显破坏结构。', '但午后量能没有继续扩张。'],
          risks: ['若机器人板块继续分歧，个股承接会变弱。', '当前位置不适合脱离观察区间追涨。'],
        },
      },
      {
        stockCode: '600003',
        tradeDate: new Date('2026-03-24'),
        versionTag: 'v1',
        totalScore: '76.20',
        biasLabel: '次级关注',
        trendLabel: '横盘待选',
        riskLabel: '中风险',
        summary: {
          name: '示例云算',
          sector: 'AI算力链',
          summary: '更偏补涨观察逻辑，适合放在次级关注而不是主看名单。',
          observe: '12.10 - 12.45',
          support: '11.96',
          pressure: '12.88',
          stopLoss: '11.72',
          action: '适合作为扩展观察，不建议取代核心候选。',
        },
        factors: {
          reasons: ['板块联动仍在。', '个股处于可观察位置。'],
          risks: ['补涨逻辑兑现节奏较慢。', '辨识度偏弱，容易被市场忽略。'],
        },
      },
    ],
  })

  await prisma.reviewSnapshot.create({
    data: {
      reviewDate: new Date('2026-03-24'),
      strategyCode: 'hot-sector-short-cycle',
      candidateCount: 4,
      hitCount: 2,
      winRate: '0.5000',
      excessReturn: '0.0210',
      maxDrawdown: '0.0130',
      detailPayload: {
        summary: '今日 AI 算力链维持强势，机器人方向午后分歧扩大。',
        nextFocus: '明日优先看资金是否继续围绕 AI 算力链集中。',
        candidateReview: [
          { name: '示例科技', result: '继续强势', note: '板块共振下保持强势结构。' },
          { name: '示例智能', result: '转弱预警', note: '午后量能不足，冲高回落明显。' },
          { name: '示例云算', result: '观察中', note: '补涨逻辑仍在，但辨识度不足。' },
        ],
      },
    },
  })

  await prisma.appUser.createMany({
    data: [
      {
        userCode: 'trial_user_a',
        mobile: '13800000001',
        nickname: '种子用户A',
        membershipPlan: 'TRIAL',
        status: 'TRIAL',
        lastLoginAt: new Date('2026-03-24T09:28:00+08:00'),
      },
      {
        userCode: 'trial_user_b',
        mobile: '13800000002',
        nickname: '种子用户B',
        membershipPlan: 'STANDARD',
        status: 'ACTIVE',
        lastLoginAt: new Date('2026-03-24T10:16:00+08:00'),
      },
      {
        userCode: 'trial_user_c',
        mobile: '13800000003',
        nickname: '种子用户C',
        membershipPlan: 'TRIAL',
        status: 'TRIAL',
        lastLoginAt: new Date('2026-03-24T13:45:00+08:00'),
      },
    ],
  })

  const users = await prisma.appUser.findMany({
    orderBy: { id: 'asc' },
  })

  await prisma.pushTask.createMany({
    data: [
      {
        userId: users[0]?.id,
        channel: PushChannel.APP,
        templateCode: 'midday-status-reminder',
        businessKey: 'watch-300001-20260324',
        payload: {
          stockCode: '300001',
          title: '午后状态提醒',
          content: '示例科技仍在观察区间内，建议关注承接是否继续增强。',
        },
        sentAt: new Date('2026-03-24T13:10:00+08:00'),
      },
      {
        userId: users[2]?.id,
        channel: PushChannel.WECHAT,
        templateCode: 'renewal-reminder',
        businessKey: 'renewal-trial-user-c',
        payload: {
          title: '试用即将到期',
          content: '你关注的自选观察功能可继续在标准版使用。',
        },
      },
    ],
  })

  await prisma.watchlistItem.createMany({
    data: [
      {
        userId: users[0]?.id,
        stockCode: '300001',
        stockName: '示例科技',
        sectorName: 'AI算力链',
        status: '继续观察',
        statusKey: 'watching',
        reason: '趋势仍在，但短线位置不低。',
        advice: '适合等待回踩观察区间后的承接反馈。',
        sortOrder: 1,
      },
      {
        userId: users[0]?.id,
        stockCode: '300002',
        stockName: '示例智能',
        sectorName: '机器人',
        status: '转弱预警',
        statusKey: 'warning',
        reason: '板块仍有热度，但个股量能未继续放大。',
        advice: '若重新站稳关键位并放量，可继续观察，否则应降低预期。',
        sortOrder: 2,
      },
      {
        userId: users[0]?.id,
        stockCode: '600003',
        stockName: '示例云算',
        sectorName: 'AI算力链',
        status: '结构转强',
        statusKey: 'stronger',
        reason: '板块活跃下重新站回短线关键位。',
        advice: '如果次日继续放量，可从扩展观察升级为重点关注。',
        sortOrder: 3,
      },
    ],
  })

  await prisma.modelRuleConfig.createMany({
    data: [
      {
        ruleCode: 'hot-sector-score-v1.2',
        name: '热点强度打分 v1.2',
        action: '启用',
        note: '用于候选池优先级排序',
        scene: 'candidate-ranking',
        versionTag: 'v1.2',
        enabled: true,
      },
      {
        ruleCode: 'support-pressure-v0.9',
        name: '支撑压力位规则 v0.9',
        action: '灰度',
        note: '用于个股诊断区间',
        scene: 'diagnosis-range',
        versionTag: 'v0.9',
        enabled: true,
      },
      {
        ruleCode: 'risk-copy-block-v1.0',
        name: '高风险话术拦截',
        action: '启用',
        note: '用于客服和运营素材巡检',
        scene: 'compliance-copy',
        versionTag: 'v1.0',
        enabled: true,
      },
    ],
  })

  await prisma.jobRun.createMany({
    data: [
      {
        jobCode: 'market-snapshot-sync',
        queueName: 'market-fetch',
        status: 'SUCCESS',
        scheduledAt: new Date('2026-03-24T09:30:00+08:00'),
        startedAt: new Date('2026-03-24T09:30:01+08:00'),
        finishedAt: new Date('2026-03-24T09:30:26+08:00'),
        durationMs: 25000,
        traceId: 'trace-market-sync-20260324-0930',
        resultSummary: '同步 4 条核心演示股票快照',
        payload: { itemCount: 4, source: 'demo' },
      },
      {
        jobCode: 'hot-sector-score-refresh',
        queueName: 'market-analyze',
        status: 'SUCCESS',
        scheduledAt: new Date('2026-03-24T09:35:00+08:00'),
        startedAt: new Date('2026-03-24T09:35:03+08:00'),
        finishedAt: new Date('2026-03-24T09:35:18+08:00'),
        durationMs: 15000,
        traceId: 'trace-sector-score-20260324-0935',
        resultSummary: '更新 AI 算力链与机器人热点分值',
        payload: { sectors: ['AI算力链', '机器人'] },
      },
      {
        jobCode: 'after-close-review-generate',
        queueName: 'user-push',
        status: 'PENDING',
        scheduledAt: new Date('2026-03-24T15:20:00+08:00'),
        traceId: 'trace-review-20260324-1520',
        resultSummary: '等待收盘后生成复盘摘要',
        payload: { reviewDate: '2026-03-24' },
      },
    ],
  })

  console.log(
    JSON.stringify(
      {
        ok: true,
        candidateSnapshotId: candidatePoolSnapshot.id.toString(),
        seededUsers: users.length,
        seededWatchlistItems: 3,
        seededModelRules: 3,
      },
      null,
      2,
    ),
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })