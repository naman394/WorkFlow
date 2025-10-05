// Main Orchestrator for Cookie-Licking Detector

import { IssueClaim, IssueAnalysis, RepositoryConfig, Intervention, Analytics } from './types'
import { GitHubService } from './github'
import { IssueAnalysisEngine } from './analysis'
import { IntelligentNudgingSystem } from './nudging'
import { AutoReleaseMechanism } from './auto-release'
import { EmailNotificationService, NotificationLog } from './email-service'

export class CookieLickingDetector {
  private githubService: GitHubService
  private analysisEngine: IssueAnalysisEngine
  private nudgingSystem: IntelligentNudgingSystem
  private autoReleaseMechanism: AutoReleaseMechanism
  private emailService: EmailNotificationService
  private repositories: Map<string, RepositoryConfig> = new Map()
  private probabilityBenchmark: number = 40 // Default benchmark threshold

  constructor(githubToken: string, predictionModel: any, benchmark?: number) {
    this.githubService = new GitHubService(githubToken)
    this.analysisEngine = new IssueAnalysisEngine(predictionModel)
    this.nudgingSystem = new IntelligentNudgingSystem(this.githubService)
    this.autoReleaseMechanism = new AutoReleaseMechanism(this.githubService)
    this.emailService = new EmailNotificationService()
    if (benchmark !== undefined) {
      this.probabilityBenchmark = benchmark
    }
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

  // Set probability benchmark threshold
  setProbabilityBenchmark(benchmark: number): void {
    if (benchmark < 0 || benchmark > 100) {
      throw new Error('Benchmark must be between 0 and 100')
    }
    this.probabilityBenchmark = benchmark
    console.log(`📊 Probability benchmark set to ${benchmark}%`)
  }

  // Get current benchmark
  getProbabilityBenchmark(): number {
    return this.probabilityBenchmark
  }

  // Monitor assigned contributors and send email alerts
  async monitorAssignedContributors(): Promise<void> {
    console.log('🔍 Starting assigned contributor monitoring...')
    
    for (const [repoId, config] of this.repositories) {
      if (!config.isActive) continue
      
      try {
        const [owner, repo] = repoId.split('/')
        await this.monitorRepositoryAssignedContributors(owner, repo)
      } catch (error) {
        console.error(`Error monitoring assigned contributors for ${repoId}:`, error)
      }
    }
    
    console.log('✅ Assigned contributor monitoring complete')
  }

  // Monitor assigned contributors for a specific repository
  private async monitorRepositoryAssignedContributors(owner: string, repo: string): Promise<void> {
    try {
      // Get all issues with assignees
      const issues = await this.githubService.getRepositoryIssues(owner, repo, 'open')
      const assignedIssues = issues.filter((issue: any) => issue.assignees && issue.assignees.length > 0)
      
      console.log(`📋 Found ${assignedIssues.length} assigned issues in ${owner}/${repo}`)
      
      for (const issue of assignedIssues) {
        for (const assignee of issue.assignees) {
          await this.checkAndNotifyAssignedContributor(
            owner, 
            repo, 
            issue, 
            assignee.login, 
            assignee.avatar_url
          )
        }
      }
      
    } catch (error) {
      console.error(`Error monitoring assigned contributors for ${owner}/${repo}:`, error)
    }
  }

  // Check assigned contributor's completion probability and send email if below benchmark
  private async checkAndNotifyAssignedContributor(
    owner: string, 
    repo: string, 
    issue: any, 
    contributorUsername: string,
    contributorAvatarUrl: string
  ): Promise<void> {
    try {
      // Calculate completion probability for the assigned contributor
      const completionProbability = await this.calculateCompletionProbability(
        contributorUsername, 
        owner, 
        repo, 
        issue
      )
      
      console.log(`📊 Completion probability for @${contributorUsername} on ${owner}/${repo}#${issue.number}: ${completionProbability}%`)
      
      // Check if probability is below benchmark
      if (completionProbability < this.probabilityBenchmark) {
        console.log(`⚠️ Low probability detected for @${contributorUsername}: ${completionProbability}% < ${this.probabilityBenchmark}%`)
        
        // Get contributor's email (this would need to be implemented in GitHub service)
        const contributorEmail = await this.getContributorEmail(contributorUsername)
        
        if (contributorEmail) {
          // Send email notification
          const issueUrl = issue.html_url || `https://github.com/${owner}/${repo}/issues/${issue.number}`
          
          const result = await this.emailService.sendLowProbabilityAlert(
            contributorEmail,
            contributorUsername,
            issue.title,
            issue.number,
            `${owner}/${repo}`,
            completionProbability,
            this.probabilityBenchmark,
            issueUrl
          )
          
          if (result.success) {
            console.log(`📧 Email notification sent to @${contributorUsername} (${contributorEmail}) for ${owner}/${repo}#${issue.number}`)
          } else {
            console.error(`📧 Failed to send email to @${contributorUsername}: ${result.error}`)
          }
        } else {
          console.log(`📧 No email found for @${contributorUsername}, skipping notification`)
        }
      }
      
    } catch (error) {
      console.error(`Error checking assigned contributor @${contributorUsername} for ${owner}/${repo}#${issue.number}:`, error)
    }
  }

  // Calculate completion probability for an assigned contributor
  private async calculateCompletionProbability(
    contributorUsername: string, 
    owner: string, 
    repo: string, 
    issue: any
  ): Promise<number> {
    try {
      // Get contributor's PR history
      const prsResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&creator=${contributorUsername}`,
        {
          headers: {
            'Authorization': `Bearer ${this.githubService.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      )

      const prs = prsResponse.ok ? await prsResponse.json() : []
      const totalPRs = prs.length
      const successfulPRs = prs.filter((pr: any) => pr.merged_at).length
      const successRate = totalPRs > 0 ? (successfulPRs / totalPRs) * 100 : 50

      // Calculate time-based factors
      const daysSinceAssignment = issue.assignees ? 
        Math.floor((Date.now() - new Date(issue.updated_at).getTime()) / (1000 * 60 * 60 * 24)) : 0
      
      // Calculate activity level based on recent commits/PRs
      const recentActivity = await this.getRecentActivity(contributorUsername, owner, repo)
      
      // Calculate base probability from success rate
      let probability = successRate
      
      // Adjust based on time since assignment (penalty for long delays)
      if (daysSinceAssignment > 7) {
        probability -= Math.min(30, (daysSinceAssignment - 7) * 5)
      }
      
      // Adjust based on recent activity
      probability += recentActivity * 10
      
      // Ensure probability is between 0 and 100
      return Math.max(0, Math.min(100, Math.round(probability)))
      
    } catch (error) {
      console.error(`Error calculating completion probability for @${contributorUsername}:`, error)
      return 50 // Default neutral probability
    }
  }

  // Get recent activity score for a contributor
  private async getRecentActivity(contributorUsername: string, owner: string, repo: string): Promise<number> {
    try {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      // Check recent commits
      const commitsResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?author=${contributorUsername}&since=${weekAgo.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.githubService.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      )
      
      const commits = commitsResponse.ok ? await commitsResponse.json() : []
      
      // Check recent PRs
      const prsResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls?creator=${contributorUsername}&state=all&sort=updated&direction=desc`,
        {
          headers: {
            'Authorization': `Bearer ${this.githubService.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      )
      
      const prs = prsResponse.ok ? await prsResponse.json() : []
      const recentPRs = prs.filter((pr: any) => new Date(pr.updated_at) > weekAgo)
      
      // Calculate activity score (0-3)
      let activityScore = 0
      if (commits.length > 0) activityScore += 1
      if (recentPRs.length > 0) activityScore += 1
      if (commits.length > 3 || recentPRs.length > 1) activityScore += 1
      
      return activityScore
      
    } catch (error) {
      console.error(`Error getting recent activity for @${contributorUsername}:`, error)
      return 1 // Default moderate activity
    }
  }

  // Get contributor email (placeholder - would need GitHub API integration)
  private async getContributorEmail(contributorUsername: string): Promise<string | null> {
    try {
      // In a real implementation, you would:
      // 1. Check if the user has a public email
      // 2. Use GitHub API to get user details
      // 3. Handle privacy settings
      
      // For now, we'll use a placeholder that simulates finding emails
      // In production, you'd implement proper GitHub API calls
      console.log(`🔍 Looking up email for @${contributorUsername}...`)
      
      // Simulate email lookup (replace with actual GitHub API call)
      const userResponse = await fetch(`https://api.github.com/users/${contributorUsername}`, {
        headers: {
          'Authorization': `Bearer ${this.githubService.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      })
      
      if (userResponse.ok) {
        const user = await userResponse.json()
        return user.email || `${contributorUsername}@users.noreply.github.com`
      }
      
      return `${contributorUsername}@users.noreply.github.com`
      
    } catch (error) {
      console.error(`Error getting email for @${contributorUsername}:`, error)
      return null
    }
  }

  // Get notification logs
  getNotificationLogs(): NotificationLog[] {
    return this.emailService.getNotificationLogs()
  }

  // Get notification logs for a specific repository
  getNotificationLogsByRepository(repositoryName: string): NotificationLog[] {
    return this.emailService.getNotificationLogsByRepository(repositoryName)
  }

  // Clear notification logs
  clearNotificationLogs(): void {
    this.emailService.clearLogs()
  }

  // Schedule automatic monitoring
  scheduleMonitoring(intervalMinutes: number = 60): void {
    console.log(`⏰ Scheduling automatic monitoring every ${intervalMinutes} minutes`)
    
    setInterval(async () => {
      console.log('🔍 Starting automatic monitoring...')
      await this.monitorAssignedContributors()
    }, intervalMinutes * 60 * 1000)
  }
}
