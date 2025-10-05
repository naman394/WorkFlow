// Core types for Workflow

export interface Contributor {
  id: string
  username: string
  email?: string
  avatarUrl: string
  reliabilityScore: number // 0-100
  totalContributions: number
  completedIssues: number
  abandonedIssues: number
  averageCompletionTime: number // in days
  lastActivityDate: Date
  joinedDate: Date
}

export interface IssueClaim {
  id: string
  issueId: string
  issueNumber: number
  repositoryId: string
  repositoryName: string
  contributorId: string
  contributor: Contributor
  claimedAt: Date
  claimType: 'comment' | 'assignment' | 'self-assigned'
  claimText: string
  status: 'active' | 'stale' | 'completed' | 'abandoned' | 'auto-released'
  lastActivityDate: Date
  progressScore: number // 0-100
  riskScore: number // 0-100 (higher = more likely to abandon)
  predictedCompletionProbability: number // 0-1
  gracePeriodEndsAt: Date
  nudgesSent: number
  lastNudgeDate?: Date
  autoReleaseDate?: Date
}

export interface IssueAnalysis {
  issueId: string
  issueNumber: number
  repositoryId: string
  title: string
  body: string
  labels: string[]
  complexity: 'low' | 'medium' | 'high'
  estimatedEffort: number // in hours
  hasClearRequirements: boolean
  hasTests: boolean
  hasDocumentation: boolean
  difficultyScore: number // 0-100
  appealScore: number // 0-100 (how attractive to contributors)
  claimCount: number
  currentClaim?: IssueClaim
  claimHistory: IssueClaim[]
  lastActivityDate: Date
  createdAt: Date
  updatedAt: Date
}

export interface NudgeTemplate {
  id: string
  name: string
  type: 'friendly_reminder' | 'progress_check' | 'final_warning' | 'community_nudge'
  subject: string
  message: string
  timing: number // days after claim
  escalationLevel: number // 1-5
  successRate: number // 0-1
  usageCount: number
}

export interface Intervention {
  id: string
  issueClaimId: string
  type: 'nudge' | 'auto_release' | 'escalate' | 'community_intervention'
  triggeredAt: Date
  templateId?: string
  message?: string
  success: boolean
  responseTime?: number // in hours
  contributorResponse?: string
  autoReleasedAt?: Date
  escalatedTo?: string // maintainer username
}

export interface RepositoryConfig {
  repositoryId: string
  repositoryName: string
  ownerName: string
  gracePeriodDays: number
  maxNudges: number
  nudgeIntervals: number[] // days between nudges
  autoReleaseEnabled: boolean
  maintainerNotificationEnabled: boolean
  communityNudgingEnabled: boolean
  complexityWeights: {
    low: number
    medium: number
    high: number
  }
  riskThresholds: {
    high: number
    medium: number
    low: number
  }
  enabledFeatures: string[]
  lastSyncDate: Date
  isActive: boolean
}

export interface Analytics {
  totalIssuesAnalyzed: number
  totalClaimsDetected: number
  totalClaimsResolved: number
  totalAutoReleased: number
  averageResolutionTime: number // in days
  successRate: number // 0-1
  contributorReliabilityTrend: number[] // over time
  issueComplexityDistribution: Record<string, number>
  interventionEffectiveness: Record<string, number>
  topContributors: Contributor[]
  problemRepositories: RepositoryConfig[]
}

export interface PredictionModel {
  modelVersion: string
  trainingDate: Date
  accuracy: number
  features: string[]
  weights: Record<string, number>
  thresholds: {
    highRisk: number
    mediumRisk: number
    lowRisk: number
  }
}

export interface GitHubWebhookPayload {
  action: string
  issue?: {
    id: number
    number: number
    title: string
    body: string
    user: {
      login: string
      id: number
      avatar_url: string
    }
    labels: Array<{
      name: string
      color: string
    }>
    created_at: string
    updated_at: string
    closed_at?: string
  }
  comment?: {
    id: number
    body: string
    user: {
      login: string
      id: number
      avatar_url: string
    }
    created_at: string
  }
  repository: {
    id: number
    name: string
    full_name: string
    owner: {
      login: string
      id: number
    }
  }
}
