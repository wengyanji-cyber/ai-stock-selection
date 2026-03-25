import { prisma } from '../../lib/prisma.js'

function toPercent(numerator: number, denominator: number) {
  if (denominator === 0) {
    return 0
  }

  return Number(((numerator / denominator) * 100).toFixed(1))
}

export async function getAdminDemoData() {
  const [users, pushTasks, jobRuns, latestSnapshot, latestDiagnoses, modelRules] = await Promise.all([
    prisma.appUser.findMany({ orderBy: { id: 'asc' } }),
    prisma.pushTask.findMany({
      orderBy: [{ createdAt: 'desc' }],
      include: { user: true },
    }),
    prisma.jobRun.findMany({
      orderBy: [{ createdAt: 'desc' }],
      take: 10,
    }),
    prisma.candidatePoolSnapshot.findFirst({
      orderBy: [{ snapshotDate: 'desc' }, { id: 'desc' }],
      include: { candidateItems: true },
    }),
    prisma.diagnosisSnapshot.count(),
    prisma.modelRuleConfig.findMany({
      orderBy: [{ id: 'asc' }],
    }),
  ])

  const newTrials = users.filter((user: (typeof users)[number]) => user.status === 'TRIAL').length
  const renewals = users.filter((user: (typeof users)[number]) => user.membershipPlan === 'STANDARD').length
  const riskConsults = pushTasks.filter((task: (typeof pushTasks)[number]) => task.templateCode.includes('reminder')).length
  const successJobs = jobRuns.filter((job: (typeof jobRuns)[number]) => job.status === 'SUCCESS').length
  const pendingJobs = jobRuns.filter((job: (typeof jobRuns)[number]) => job.status === 'PENDING').length
  const runningJobs = jobRuns.filter((job: (typeof jobRuns)[number]) => job.status === 'RUNNING').length
  const latestUsers = users.slice(0, 3)

  return {
    summary: {
      newUsers: users.length,
      newTrials,
      renewals,
      riskConsults,
    },
    operationCards: [
      {
        title: '用户与试用管理',
        description: `当前累计 ${users.length} 个演示用户，试用用户 ${newTrials} 个。`,
      },
      {
        title: '订阅漏斗',
        description: `当前标准版用户 ${renewals} 个，可继续补订单与订阅记录。`,
      },
      {
        title: '内容运营',
        description: `当前已产生 ${pushTasks.length} 条触达记录，可继续补盘前/午后模板。`,
      },
    ],
    funnel: [
      { label: '访问试用页', value: 100 },
      { label: '完成注册', value: toPercent(users.length, users.length) },
      { label: '体验 3 个核心模块', value: toPercent(pushTasks.length + 1, users.length + 1) },
      { label: '第 7 天回访', value: toPercent(latestUsers.length, users.length) },
      { label: '试用后订阅', value: toPercent(renewals, users.length) },
    ],
    todayActions: [
      `优先处理 ${pendingJobs} 个待执行任务。`,
      `关注 ${riskConsults} 条提醒类触达，避免被误用为直接交易指令。`,
      `候选池当前共 ${latestSnapshot?.candidateItems.length ?? 0} 只股票，继续补充盘中状态变化。`,
    ],
    techCards: [
      {
        title: '数据任务状态',
        description: `成功 ${successJobs} 个，运行中 ${runningJobs} 个，待执行 ${pendingJobs} 个。`,
      },
      {
        title: '模型与规则配置',
        description: `已落地候选池、诊断快照与复盘快照，可继续拆规则表。`,
      },
      {
        title: '系统健康',
        description: '当前 API、MySQL、Redis 已接通，适合继续加 worker。',
      },
    ],
    dataJobs: jobRuns.map((job: (typeof jobRuns)[number]) => ({
      name: job.jobCode,
      status: job.status,
      owner: job.queueName,
      schedule: job.scheduledAt ? job.scheduledAt.toISOString().slice(0, 16).replace('T', ' ') : '未设置',
    })),
    incidents: [
      ...jobRuns.filter((job: (typeof jobRuns)[number]) => job.status !== 'SUCCESS').map((job: (typeof jobRuns)[number]) => ({
        title: `${job.jobCode} 状态异常`,
        severity: job.status === 'FAILED' ? '高' : '中',
        detail: job.errorMessage || job.resultSummary || '任务尚未完成，需继续观察。',
      })),
      ...pushTasks.slice(0, 1).map((task: (typeof pushTasks)[number]) => ({
        title: '触达任务检查',
        severity: '中',
        detail: `${task.templateCode} 已生成，需确认是否符合合规边界。`,
      })),
    ],
    modelRules: modelRules.map((rule: (typeof modelRules)[number]) => ({
      name: rule.name,
      action: rule.action,
      note:
        rule.ruleCode === 'support-pressure-v0.9'
          ? `已覆盖 ${latestDiagnoses} 条诊断快照`
          : rule.note || `用于 ${latestSnapshot?.versionTag ?? 'v1'} 候选池优先级排序`,
    })),
    trialUsers: users.map((user: (typeof users)[number], index: number) => ({
      name: user.nickname || user.userCode,
      phase: user.status === 'TRIAL' ? `试用第 ${index + 3} 天` : '标准版使用中',
      behavior: user.membershipPlan === 'STANDARD' ? '频繁查看诊股页' : '主要浏览候选池与自选观察',
      nextAction: user.status === 'TRIAL' ? '推送午后状态提醒' : '引导复盘页与账户页联动',
    })),
  }
}

export async function getAdminSummary() {
  const [users, pushTasks, candidateCount, diagnosisCount, jobRuns] = await Promise.all([
    prisma.appUser.findMany(),
    prisma.pushTask.findMany(),
    prisma.candidateSignal.count(),
    prisma.diagnosisSnapshot.count(),
    prisma.jobRun.findMany(),
  ])

  const sentTasks = pushTasks.filter((task) => Boolean(task.sentAt)).length

  return {
    tradeDate: new Date().toISOString().slice(0, 10),
    userMetrics: {
      newTrials: users.filter((user) => user.status === 'TRIAL').length,
      activeUsers: users.length,
      paidUsers: users.filter((user) => user.membershipPlan === 'STANDARD').length,
    },
    operationMetrics: {
      pushSuccessRate: pushTasks.length === 0 ? 1 : Number((sentTasks / pushTasks.length).toFixed(3)),
      candidateCount,
      diagnosisCount,
    },
    riskEvents: jobRuns
      .filter((job) => job.status !== 'SUCCESS')
      .map((job) => `${job.jobCode} 当前状态 ${job.status}`)
      .slice(0, 3),
  }
}

export async function getModelRules() {
  const rules = await prisma.modelRuleConfig.findMany({
    orderBy: [{ id: 'asc' }],
  })

  return rules.map((rule) => ({
    ruleCode: rule.ruleCode,
    name: rule.name,
    action: rule.action,
    note: rule.note || '暂无说明',
    scene: rule.scene || '未分类',
    enabled: rule.enabled,
    versionTag: rule.versionTag || 'v1',
  }))
}

export async function updateModelRule(ruleCode: string, input: { enabled?: boolean; action?: string }) {
  const updated = await prisma.modelRuleConfig.update({
    where: { ruleCode },
    data: {
      enabled: input.enabled,
      action: input.action,
    },
  })

  return {
    ruleCode: updated.ruleCode,
    name: updated.name,
    action: updated.action,
    note: updated.note || '暂无说明',
    scene: updated.scene || '未分类',
    enabled: updated.enabled,
    versionTag: updated.versionTag || 'v1',
  }
}