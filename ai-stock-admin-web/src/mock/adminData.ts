import type { AdminData } from '../types/admin'

export const adminData: AdminData = {
  summary: {
    newUsers: 78,
    newTrials: 43,
    renewals: 8,
    riskConsults: 2,
  },
  operationCards: [
    {
      title: '用户与试用管理',
      description: '查看新增注册、试用用户分层、回访行为与到期提醒。',
    },
    {
      title: '订阅漏斗',
      description: '查看 trial -> login -> account -> pricing -> conversion 的关键节点。',
    },
    {
      title: '内容运营',
      description: '盘前一句话、候选池摘要、复盘重点和客服话术统一在这里排期。',
    },
  ],
  funnel: [
    { label: '访问试用页', value: 100 },
    { label: '完成注册', value: 61 },
    { label: '体验 3 个核心模块', value: 46 },
    { label: '第 7 天回访', value: 29 },
    { label: '试用后订阅', value: 18.6 },
  ],
  todayActions: [
    '优先补盘前一句话触达与午后状态提醒。',
    '减少高刺激转化话术，强调结构化判断价值。',
    '把 account 页里的观察列表状态变化做得更直观。',
  ],
  techCards: [
    {
      title: '数据任务状态',
      description: '跟踪行情抓取、标签刷新、回测任务和内容生成任务。',
    },
    {
      title: '模型与规则配置',
      description: '管理版本、观察区间规则、热点打分和风控阈值。',
    },
    {
      title: '系统健康',
      description: '查看接口状态、日志告警、任务重跑与发布开关。',
    },
  ],
  dataJobs: [
    { name: '行情快照同步', status: '运行中', owner: 'data-service', schedule: '每 5 分钟' },
    { name: '热点标签刷新', status: '成功', owner: 'tag-worker', schedule: '每日 09:05' },
    { name: '盘后复盘生成', status: '待执行', owner: 'content-job', schedule: '每日 15:20' },
  ],
  incidents: [
    { title: '行情同步延迟', severity: '中', detail: '09:35 出现 2 分钟延迟，已自动恢复。' },
    { title: '高风险咨询提醒', severity: '高', detail: '2 位用户请求直接交易提醒，需要标准话术处理。' },
  ],
  modelRules: [
    { ruleCode: 'hot-sector-score-v1.2', name: '热点强度打分 v1.2', action: '启用', note: '用于候选池优先级排序', scene: '候选池', enabled: true, versionTag: 'v1.2' },
    { ruleCode: 'support-pressure-v0.9', name: '支撑压力位规则 v0.9', action: '灰度', note: '用于个股诊断区间', scene: '个股诊断', enabled: false, versionTag: 'v0.9' },
    { ruleCode: 'risk-copy-block-v1.0', name: '高风险话术拦截', action: '启用', note: '用于客服和运营素材巡检', scene: '合规巡检', enabled: true, versionTag: 'v1.0' },
  ],
  trialUsers: [
    { name: '种子用户 A', phase: '试用第 3 天', behavior: '已看候选池 4 次，未进订阅页', nextAction: '推送午后状态提醒' },
    { name: '种子用户 B', phase: '试用第 9 天', behavior: '频繁使用诊股页', nextAction: '引导查看标准版方案' },
    { name: '种子用户 C', phase: '试用到期前 1 天', behavior: '主要看自选观察', nextAction: '推送续用提醒与观察价值' },
  ],
}