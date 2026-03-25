export type BadgeTone = 'brand' | 'accent' | 'warn'

export type Sector = {
  name: string
  status: string
  reason: string
  risk: string
  badge: BadgeTone
}

export type Candidate = {
  code: string
  name: string
  sector: string
  level: string
  riskLevel: string
  summary: string
  reasons: string[]
  observe: string
  support: string
  pressure: string
  stopLoss: string
  invalid: string
  risks: string[]
  style: BadgeTone
}

export type Diagnosis = {
  name: string
  code: string
  sector: string
  summary: string
  trend: string
  strength: string
  observe: string
  support: string
  pressure: string
  stopLoss: string
  reasons: string[]
  risks: string[]
  action: string
}

export type WatchItem = {
  name: string
  code: string
  sector: string
  status: string
  statusKey: 'warning' | 'watching' | 'stronger'
  reason: string
  advice: string
  badge: BadgeTone
}

export type UserProfile = {
  userCode: string
  nickname: string
  membershipPlan: string
  status: string
  trialDaysRemaining: number
  watchlistCount: number
  diagnosisCount: number
  recentPushCount: number
  lastLoginAt: string | null
  nextActions: string[]
  recentActivities: string[]
}

export type AuthSession = {
  profile: UserProfile
  accessToken: string
  expiresAt: string
}

export type ReviewItem = {
  name: string
  result: string
  note: string
  badge: BadgeTone
}

export type MarketHome = {
  marketSummary: string
  marketTemperature: string
  marketTags: string[]
  sectors: Sector[]
  focusCandidateCount: number
}

export type ReviewSummary = {
  summary: string
  candidateReview: ReviewItem[]
  risks: string[]
  nextFocus: string
}

export type DemoData = {
  marketSummary: string
  marketTemperature: string
  marketTags: string[]
  sectors: Sector[]
  candidates: Candidate[]
  diagnoses: Record<string, Diagnosis>
  watchlist: WatchItem[]
  review: ReviewSummary
}