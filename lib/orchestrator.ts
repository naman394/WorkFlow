// Main Orchestrator for Cookie-Licking Detector

import { IssueClaim, IssueAnalysis, RepositoryConfig, Intervention, Analytics } from './types'
import { GitHubService } from './github'
import { IssueAnalysisEngine } from './analysis'
import { IntelligentNudgingSystem } from './nudging'
import { AutoReleaseMechanism } from './auto-release'

export class CookieLickingDetector {
  private githubService: GitHubService
  private analysisEngine: IssueAnalysisEngine
  private nudgingSystem: IntelligentNudgingSystem
  private autoReleaseMechanism: AutoReleaseMechanism
  private repositories: Map<string, RepositoryConfig> = new Map()

  constructor(githubToken: string, predictionModel: any) {
    this.githubService = new GitHubService(githubToken)
    this.analysisEngine = new IssueAnalysisEngine(predictionModel)
    this.nudgingSystem = new IntelligentNudgingSystem(this.githubService)
    this.autoReleaseMechanism = new AutoReleaseMechanism(this.githubService)
  }

  // Main entry point for processing a repository
  async processRepository(
    owner: string, 
    repo: string, 
    config?: Partial<RepositoryConfig>
  ): Promise<Analytics> {
    
    console.log(`🍪 Processing repository: ${owner}/${repo}`)
    
    // Get or create repository configuration
    const repoConfig = await this.getRepositoryConfig(owner, repo, config)
    
    // Fetch issues and comments
    const issues = await this.githubService.getRepositoryIssues(owner, repo, 'open')
    console.log(`📋 Found ${issues.length} open issues`)
    
    // Analyze each issue
    const issueAnalyses: IssueAnalysis[] = []
    const allClaims: IssueClaim[] = []
    const interventions: Intervention[] = []
    
    for (const issue of issues) {
      try {
        const comments = await this.githubService.getIssueComments(owner, repo, issue.number)
        const analysis = await this.analysisEngine.analyzeIssue(issue, comments, repoConfig.repositoryId)
        
        issueAnalyses.push(analysis)
        allClaims.push(...analysis.claimHistory)
        
        // Process active claims
        if (analysis.currentClaim) {
          const claimInterventions = await this.processClaim(
            analysis.currentClaim, 
            analysis, 
            repoConfig, 
            owner, 
            repo
          )
          interventions.push(...claimInterventions)
        }
        
      } catch (error) {
        console.error(`Error processing issue #${issue.number}:`, error)
      }
    }
    
    // Generate analytics
    const analytics = this.generateAnalytics(issueAnalyses, allClaims, interventions)
    
    console.log(`✅ Repository processing complete. Found ${allClaims.length} claims, ${interventions.length} interventions`)
    
    return analytics
  }

  private async processClaim(
    claim: IssueClaim,
    issueAnalysis: IssueAnalysis,
    config: RepositoryConfig,
    owner: string,
    repo: string
  ): Promise<Intervention[]> {
    
    const interventions: Intervention[] = []
    
    // Update claim with latest analysis
    claim.progressScore = this.calculateProgressScore(claim, issueAnalysis)
    claim.riskScore = this.analysisEngine.calculateRiskScore(claim, issueAnalysis)
    claim.predictedCompletionProbability = this.analysisEngine.predictCompletionProbability(claim, issueAnalysis)
    
    // Check if we should send a nudge
    if (await this.nudgingSystem.shouldSendNudge(claim)) {
      try {
        const nudgeIntervention = await this.nudgingSystem.sendNudge(claim, repo, owner)
        interventions.push(nudgeIntervention)
        
        // Update claim with nudge info
        claim.nudgesSent++
        claim.lastNudgeDate = new Date()
        
        console.log(`📤 Sent nudge for claim ${claim.id}`)
        
      } catch (error) {
        console.error(`Failed to send nudge for claim ${claim.id}:`, error)
      }
    }
    
    // Check if we should auto-release
    if (await this.autoReleaseMechanism.shouldAutoRelease(claim, config)) {
      try {
        const releaseIntervention = await this.autoReleaseMechanism.autoReleaseClaim(
          claim, 
          repo, 
          owner, 
          config
        )
        interventions.push(releaseIntervention)
        
        console.log(`🔄 Auto-released claim ${claim.id}`)
        
      } catch (error) {
        console.error(`Failed to auto-release claim ${claim.id}:`, error)
      }
    }
    
    return interventions
  }

  private calculateProgressScore(claim: IssueClaim, issueAnalysis: IssueAnalysis): number {
    // This would analyze recent activity, commits, PRs, etc.
    // For now, return a basic score based on time and activity
    
    const daysSinceClaim = (Date.now() - claim.claimedAt.getTime()) / (1000 * 60 * 60 * 24)
    const daysSinceLastActivity = (Date.now() - claim.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    
    let score = 0
    
    // Time-based scoring
    if (daysSinceClaim > 7 && daysSinceLastActivity < 3) {
      score += 30 // Recent activity after time
    } else if (daysSinceLastActivity < 1) {
      score += 50 // Very recent activity
    }
    
    // Issue complexity bonus
    if (issueAnalysis.complexity === 'high' && daysSinceClaim > 14) {
      score += 20 // Bonus for complex issues with time
    }
    
    return Math.min(100, score)
  }

  private async getRepositoryConfig(
    owner: string, 
    repo: string, 
    config?: Partial<RepositoryConfig>
  ): Promise<RepositoryConfig> {
    
    const repoId = `${owner}/${repo}`
    
    if (this.repositories.has(repoId)) {
      return this.repositories.get(repoId)!
    }
    
    // Create default configuration
    const defaultConfig: RepositoryConfig = {
      repositoryId: repoId,
      repositoryName: repo,
      ownerName: owner,
      gracePeriodDays: 7,
      maxNudges: 3,
      nudgeIntervals: [3, 7, 14], // days between nudges
      autoReleaseEnabled: true,
      maintainerNotificationEnabled: true,
      communityNudgingEnabled: true,
      complexityWeights: {
        low: 1.0,
        medium: 1.5,
        high: 2.0,
      },
      riskThresholds: {
        high: 70,
        medium: 50,
        low: 30,
      },
      enabledFeatures: ['detection', 'nudging', 'auto_release', 'analytics'],
      lastSyncDate: new Date(),
      isActive: true,
      ...config,
    }
    
    this.repositories.set(repoId, defaultConfig)
    return defaultConfig
  }

  private generateAnalytics(
    issueAnalyses: IssueAnalysis[],
    claims: IssueClaim[],
    interventions: Intervention[]
  ): Analytics {
    
    const totalIssuesAnalyzed = issueAnalyses.length
    const totalClaimsDetected = claims.length
    const totalClaimsResolved = claims.filter(c => c.status === 'completed' || c.status === 'auto-released').length
    const totalAutoReleased = interventions.filter(i => i.type === 'auto_release').length
    
    // Calculate success rate
    const successfulInterventions = interventions.filter(i => i.success).length
    const successRate = interventions.length > 0 ? successfulInterventions / interventions.length : 0
    
    // Calculate average resolution time
    const resolvedClaims = claims.filter(c => c.status === 'completed' || c.status === 'auto-released')
    const averageResolutionTime = resolvedClaims.length > 0 
      ? resolvedClaims.reduce((sum, claim) => {
          const endDate = claim.status === 'completed' ? claim.lastActivityDate : claim.autoReleaseDate!
          const days = (endDate.getTime() - claim.claimedAt.getTime()) / (1000 * 60 * 60 * 24)
          return sum + days
        }, 0) / resolvedClaims.length
      : 0
    
    // Get top contributors
    const contributorStats = new Map<string, { contributor: any, completed: number, abandoned: number }>()
    claims.forEach(claim => {
      const username = claim.contributor.username
      if (!contributorStats.has(username)) {
        contributorStats.set(username, {
          contributor: claim.contributor,
          completed: 0,
          abandoned: 0,
        })
      }
      
      const stats = contributorStats.get(username)!
      if (claim.status === 'completed') {
        stats.completed++
      } else if (claim.status === 'abandoned') {
        stats.abandoned++
      }
    })
    
    const topContributors = Array.from(contributorStats.values())
      .sort((a, b) => (b.completed - b.abandoned) - (a.completed - a.abandoned))
      .slice(0, 10)
      .map(stats => stats.contributor)
    
    return {
      totalIssuesAnalyzed,
      totalClaimsDetected,
      totalClaimsResolved,
      totalAutoReleased,
      averageResolutionTime,
      successRate,
      contributorReliabilityTrend: [], // Would be calculated over time
      issueComplexityDistribution: this.calculateComplexityDistribution(issueAnalyses),
      interventionEffectiveness: this.calculateInterventionEffectiveness(interventions),
      topContributors,
      problemRepositories: [], // Would identify repositories with high cookie-licking rates
    }
  }

  private calculateComplexityDistribution(issueAnalyses: IssueAnalysis[]): Record<string, number> {
    const distribution = { low: 0, medium: 0, high: 0 }
    
    issueAnalyses.forEach(analysis => {
      distribution[analysis.complexity]++
    })
    
    return distribution
  }

  private calculateInterventionEffectiveness(interventions: Intervention[]): Record<string, number> {
    const effectiveness: Record<string, { total: number, successful: number }> = {}
    
    interventions.forEach(intervention => {
      if (!effectiveness[intervention.type]) {
        effectiveness[intervention.type] = { total: 0, successful: 0 }
      }
      
      effectiveness[intervention.type].total++
      if (intervention.success) {
        effectiveness[intervention.type].successful++
      }
    })
    
    const result: Record<string, number> = {}
    Object.entries(effectiveness).forEach(([type, stats]) => {
      result[type] = stats.total > 0 ? stats.successful / stats.total : 0
    })
    
    return result
  }

  // Webhook handler for real-time processing
  async handleWebhook(payload: any): Promise<void> {
    console.log('🔔 Received webhook:', payload.action)
    
    // Only process relevant actions
    const relevantActions = ['opened', 'edited', 'closed', 'created', 'assigned', 'unassigned']
    if (!relevantActions.includes(payload.action)) return
    
    const { repository, issue } = payload
    
    if (!repository || !issue) return
    
    const owner = repository.owner.login
    const repo = repository.name
    
    // Process the specific issue
    try {
      const comments = await this.githubService.getIssueComments(owner, repo, issue.number)
      const analysis = await this.analysisEngine.analyzeIssue(issue, comments, `${owner}/${repo}`)
      
      if (analysis.currentClaim) {
        const config = await this.getRepositoryConfig(owner, repo)
        await this.processClaim(analysis.currentClaim, analysis, config, owner, repo)
      }
      
    } catch (error) {
      console.error(`Error processing webhook for issue #${issue.number}:`, error)
    }
  }

  // Schedule periodic processing
  scheduleProcessing(intervalMinutes: number = 60): void {
    console.log(`⏰ Scheduling processing every ${intervalMinutes} minutes`)
    
    setInterval(async () => {
      console.log('🔄 Starting scheduled processing...')
      
      for (const [repoId, config] of this.repositories) {
        if (!config.isActive) continue
        
        try {
          const [owner, repo] = repoId.split('/')
          await this.processRepository(owner, repo, config)
        } catch (error) {
          console.error(`Error in scheduled processing for ${repoId}:`, error)
        }
      }
      
      console.log('✅ Scheduled processing complete')
    }, intervalMinutes * 60 * 1000)
  }
}
