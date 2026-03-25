export type Summary = {
  newUsers: number
  newTrials: number
  renewals: number
  riskConsults: number
}

export type DashboardCard = {
  title: string
  description: string
}

export type FunnelItem = {
  label: string
  value: number
}

export type DataJob = {
  name: string
  status: string
  owner: string
  schedule: string
}

export type JobRunItem = {
  id: string
  jobCode: string
  queueName: string
  status: string
  scheduledAt: string | null
  startedAt: string | null
  finishedAt: string | null
  durationMs: number | null
  traceId: string | null
  resultSummary: string | null
  errorMessage: string | null
}

export type Incident = {
  title: string
  severity: string
  detail: string
}

export type ModelRule = {
  ruleCode: string
  name: string
  action: string
  note: string
  scene?: string
  enabled?: boolean
  versionTag?: string
}

export type AdminUser = {
  userCode: string
  name: string
  phase: string
  behavior: string
  nextAction: string
  watchlistCount: number
  membershipPlan: string
  lastLoginAt: string | null
  latestPushTemplate: string | null
}

export type ComplianceInspection = {
  title: string
  status: string
  detail: string
}

export type ComplianceSummary = {
  blockedTerms: string[]
  inspections: ComplianceInspection[]
  alerts: string[]
}

export type QueueMetric = {
  name: string
  waiting: number | null
  active: number | null
  completed: number | null
  failed: number | null
  delayed: number | null
}

export type QueueHealth = {
  status: string
  reason?: string
  queues: QueueMetric[]
}

export type TrialUser = {
  name: string
  phase: string
  behavior: string
  nextAction: string
}

export type AdminData = {
  summary: Summary
  operationCards: DashboardCard[]
  funnel: FunnelItem[]
  todayActions: string[]
  techCards: DashboardCard[]
  dataJobs: DataJob[]
  incidents: Incident[]
  modelRules: ModelRule[]
  trialUsers: TrialUser[]
}