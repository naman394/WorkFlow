// Issue Analysis Engine for Cookie-Licking Detector

import { IssueClaim, Contributor, IssueAnalysis, PredictionModel } from './types'
import { detectClaim, detectProgress, extractClaimType, calculateIssueComplexity } from './github'

export class IssueAnalysisEngine {
  private model: PredictionModel

  constructor(model: PredictionModel) {
    this.model = model
  }

  async analyzeIssue(issue: any, comments: any[], repositoryId: string): Promise<IssueAnalysis> {
    const complexity = calculateIssueComplexity(issue)
    const difficultyScore = this.calculateDifficultyScore(issue, complexity)
    const appealScore = this.calculateAppealScore(issue, complexity)
    
    // Analyze claim history
    const claims = this.extractClaims(comments, issue.number, repositoryId)
    
    return {
      issueId: issue.id.toString(),
      issueNumber: issue.number,
      repositoryId,
      title: issue.title,
      body: issue.body,
      labels: issue.labels.map((l: any) => l.name),
      complexity,
      estimatedEffort: this.estimateEffort(issue, complexity),
      hasClearRequirements: this.hasClearRequirements(issue),
      hasTests: this.hasTests(issue),
      hasDocumentation: this.hasDocumentation(issue),
      difficultyScore,
      appealScore,
      claimCount: claims.length,
      currentClaim: claims.find(c => c.status === 'active'),
      claimHistory: claims,
      lastActivityDate: new Date(issue.updated_at),
      createdAt: new Date(issue.created_at),
      updatedAt: new Date(issue.updated_at),
    }
  }

  private extractClaims(comments: any[], issueNumber: number, repositoryId: string): IssueClaim[] {
    const claims: IssueClaim[] = []
    let currentClaim: IssueClaim | null = null

    for (const comment of comments) {
      const text = comment.body
      const isClaim = detectClaim(text)
      const hasProgress = detectProgress(text)
      
      if (isClaim && !hasProgress && !currentClaim) {
        // New claim detected
        currentClaim = {
          id: `${repositoryId}-${issueNumber}-${comment.id}`,
          issueId: issueNumber.toString(),
          issueNumber,
          repositoryId,
          contributorId: comment.user.id.toString(),
          contributor: {
            id: comment.user.id.toString(),
            username: comment.user.login,
            avatarUrl: comment.user.avatar_url,
            reliabilityScore: 50, // Default, will be calculated
            totalContributions: 0,
            completedIssues: 0,
            abandonedIssues: 0,
            averageCompletionTime: 0,
            lastActivityDate: new Date(),
            joinedDate: new Date(),
          },
          claimedAt: new Date(comment.created_at),
          claimType: extractClaimType(text),
          claimText: text,
          status: 'active',
          lastActivityDate: new Date(comment.created_at),
          progressScore: 0,
          riskScore: 0,
          predictedCompletionProbability: 0.5,
          gracePeriodEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
          nudgesSent: 0,
        }
        
        claims.push(currentClaim)
      } else if (currentClaim && hasProgress) {
        // Progress detected - update current claim
        currentClaim.progressScore = Math.min(100, currentClaim.progressScore + 20)
        currentClaim.lastActivityDate = new Date(comment.created_at)
        currentClaim.status = 'active'
      } else if (currentClaim && this.isAbandonmentSignal(text)) {
        // Abandonment detected
        currentClaim.status = 'abandoned'
        currentClaim = null
      }
    }

    return claims
  }

  private isAbandonmentSignal(text: string): boolean {
    const abandonmentPatterns = [
      /sorry,?\s+(i\s+)?(can'?t|cannot)\s+(work\s+on|continue|finish)/i,
      /i\s+(can'?t|cannot)\s+(work\s+on|continue|finish)/i,
      /unable\s+to\s+(work\s+on|continue|finish)/i,
      /no\s+longer\s+(working\s+on|interested)/i,
      /passing\s+(on|this)/i,
      /someone\s+else\s+can\s+(take|handle)/i,
    ]
    
    return abandonmentPatterns.some(pattern => pattern.test(text.toLowerCase()))
  }

  private calculateDifficultyScore(issue: any, complexity: 'low' | 'medium' | 'high'): number {
    let score = 0
    
    // Base complexity score
    switch (complexity) {
      case 'low': score = 20; break
      case 'medium': score = 50; break
      case 'high': score = 80; break
    }
    
    // Adjust based on issue characteristics
    const body = issue.body || ''
    const title = issue.title || ''
    
    // Technical complexity indicators
    const technicalKeywords = ['api', 'database', 'security', 'performance', 'optimization']
    technicalKeywords.forEach(keyword => {
      if ((title + body).toLowerCase().includes(keyword)) {
        score += 10
      }
    })
    
    // Code complexity indicators
    const codeBlocks = (body.match(/```/g) || []).length
    score += Math.min(20, codeBlocks * 5)
    
    // Documentation quality
    if (body.length < 100) score += 15 // Poor documentation increases difficulty
    
    return Math.min(100, score)
  }

  private calculateAppealScore(issue: any, complexity: 'low' | 'medium' | 'high'): number {
    let score = 50 // Base score
    
    const labels = issue.labels.map((l: any) => l.name.toLowerCase())
    const body = issue.body || ''
    const title = issue.title || ''
    
    // Positive appeal indicators
    if (labels.includes('good first issue')) score += 30
    if (labels.includes('beginner')) score += 25
    if (labels.includes('help wanted')) score += 20
    if (labels.includes('documentation')) score += 15
    if (labels.includes('bug')) score += 10
    
    // Negative appeal indicators
    if (labels.includes('needs discussion')) score -= 20
    if (labels.includes('blocked')) score -= 25
    if (labels.includes('wontfix')) score -= 30
    
    // Content appeal
    if (body.includes('TODO') || body.includes('FIXME')) score += 10
    if (body.includes('easy') || body.includes('simple')) score += 15
    if (body.includes('quick') || body.includes('small')) score += 10
    
    // Complexity adjustment
    switch (complexity) {
      case 'low': score += 20; break
      case 'medium': score += 5; break
      case 'high': score -= 10; break
    }
    
    return Math.max(0, Math.min(100, score))
  }

  private estimateEffort(issue: any, complexity: 'low' | 'medium' | 'high'): number {
    const baseEffort = {
      low: 2,    // 2 hours
      medium: 8, // 8 hours
      high: 24,  // 24 hours
    }[complexity]
    
    // Adjust based on issue characteristics
    const body = issue.body || ''
    let multiplier = 1
    
    if (body.length > 1000) multiplier += 0.5
    if (body.includes('```')) multiplier += 0.3
    if (body.includes('test') || body.includes('testing')) multiplier += 0.2
    
    return Math.round(baseEffort * multiplier)
  }

  private hasClearRequirements(issue: any): boolean {
    const body = issue.body || ''
    const title = issue.title || ''
    
    const clearRequirementIndicators = [
      'steps to reproduce',
      'expected behavior',
      'actual behavior',
      'requirements',
      'acceptance criteria',
      'todo',
      'checklist',
    ]
    
    const content = (title + ' ' + body).toLowerCase()
    return clearRequirementIndicators.some(indicator => 
      content.includes(indicator)
    )
  }

  private hasTests(issue: any): boolean {
    const body = issue.body || ''
    const labels = issue.labels.map((l: any) => l.name.toLowerCase())
    
    return labels.includes('tests') || 
           labels.includes('testing') ||
           body.toLowerCase().includes('test') ||
           body.toLowerCase().includes('spec')
  }

  private hasDocumentation(issue: any): boolean {
    const labels = issue.labels.map((l: any) => l.name.toLowerCase())
    
    return labels.includes('documentation') || 
           labels.includes('docs') ||
           labels.includes('readme')
  }

  // Predict completion probability based on contributor and issue characteristics
  predictCompletionProbability(claim: IssueClaim, issueAnalysis: IssueAnalysis): number {
    const contributor = claim.contributor
    const issue = issueAnalysis
    
    // Base probability from contributor reliability
    let probability = contributor.reliabilityScore / 100
    
    // Adjust based on issue complexity vs contributor experience
    const experienceScore = Math.min(100, contributor.totalContributions / 10)
    const complexityPenalty = {
      low: 0,
      medium: -0.1,
      high: -0.2,
    }[issue.complexity]
    
    probability += (experienceScore / 100) * 0.3 + complexityPenalty
    
    // Adjust based on issue appeal
    const appealBonus = (issue.appealScore / 100) * 0.1
    probability += appealBonus
    
    // Adjust based on time since claim
    const daysSinceClaim = (Date.now() - claim.claimedAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceClaim > 7) {
      probability -= 0.2 // Significant penalty for old claims
    } else if (daysSinceClaim > 3) {
      probability -= 0.1 // Small penalty for older claims
    }
    
    // Adjust based on previous nudges
    if (claim.nudgesSent > 2) {
      probability -= 0.15 // Penalty for multiple nudges
    }
    
    return Math.max(0, Math.min(1, probability))
  }

  // Calculate risk score for a claim
  calculateRiskScore(claim: IssueClaim, issueAnalysis: IssueAnalysis): number {
    let riskScore = 0
    
    // Time-based risk
    const daysSinceClaim = (Date.now() - claim.claimedAt.getTime()) / (1000 * 60 * 60 * 24)
    riskScore += Math.min(40, daysSinceClaim * 5) // Max 40 points for time
    
    // Contributor reliability risk
    riskScore += (100 - claim.contributor.reliabilityScore) * 0.3
    
    // Issue complexity risk
    const complexityRisk = {
      low: 0,
      medium: 15,
      high: 30,
    }[issueAnalysis.complexity]
    riskScore += complexityRisk
    
    // Progress risk (no progress = higher risk)
    riskScore += (100 - claim.progressScore) * 0.2
    
    // Previous abandonment risk
    if (claim.contributor.abandonedIssues > 0) {
      const abandonmentRate = claim.contributor.abandonedIssues / 
        (claim.contributor.completedIssues + claim.contributor.abandonedIssues)
      riskScore += abandonmentRate * 25
    }
    
    return Math.min(100, Math.max(0, riskScore))
  }
}
