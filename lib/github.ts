// GitHub API integration for Cookie-Licking Detector

import { IssueClaim, Contributor, IssueAnalysis } from './types'

export class GitHubService {
  private token: string
  private baseUrl = 'https://api.github.com'

  constructor(token: string) {
    this.token = token
  }

  get accessToken(): string {
    return this.token
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Cookie-Licking-Detector/1.0',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getRepositoryIssues(owner: string, repo: string, state: 'open' | 'closed' = 'open') {
    const issues = await this.makeRequest(`/repos/${owner}/${repo}/issues?state=${state}&per_page=100`)
    return issues.filter((issue: any) => !issue.pull_request) // Filter out PRs
  }

  async getIssueComments(owner: string, repo: string, issueNumber: number) {
    return this.makeRequest(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`)
  }

  async getUser(username: string): Promise<Contributor> {
    const user = await this.makeRequest(`/users/${username}`)
    return {
      id: user.id.toString(),
      username: user.login,
      email: user.email,
      avatarUrl: user.avatar_url,
      reliabilityScore: 50, // Will be calculated based on history
      totalContributions: user.public_repos + user.followers,
      completedIssues: 0, // Will be calculated from issue history
      abandonedIssues: 0, // Will be calculated from issue history
      averageCompletionTime: 0, // Will be calculated from issue history
      lastActivityDate: new Date(user.updated_at),
      joinedDate: new Date(user.created_at),
    }
  }

  async getRepository(owner: string, repo: string) {
    return this.makeRequest(`/repos/${owner}/${repo}`)
  }

  async createIssueComment(owner: string, repo: string, issueNumber: number, body: string) {
    return this.makeRequest(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    })
  }

  async addIssueLabels(owner: string, repo: string, issueNumber: number, labels: string[]) {
    return this.makeRequest(`/repos/${owner}/${repo}/issues/${issueNumber}/labels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ labels }),
    })
  }

  async removeIssueLabels(owner: string, repo: string, issueNumber: number, labels: string[]) {
    const promises = labels.map(label => 
      this.makeRequest(`/repos/${owner}/${repo}/issues/${issueNumber}/labels/${encodeURIComponent(label)}`, {
        method: 'DELETE',
      })
    )
    return Promise.all(promises)
  }

  // NEW: Cookie-licking detection methods
  async detectClaims(owner: string, repo: string, issueNumber: number): Promise<IssueClaim[]> {
    const comments = await this.getIssueComments(owner, repo, issueNumber)
    return this.extractClaimsFromComments(comments, issueNumber, `${owner}/${repo}`)
  }

  private extractClaimsFromComments(comments: any[], issueNumber: number, repositoryId: string): IssueClaim[] {
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
          repositoryName: repositoryId.split('/')[1],
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
      /i\s+(don'?t|do not)\s+(have time|want)/i,
      /i\s+(quit|give up)/i
    ]
    
    return abandonmentPatterns.some(pattern => pattern.test(text.toLowerCase()))
  }

  // Calculate contributor reliability score
  async calculateContributorReliability(username: string, repositoryId: string): Promise<number> {
    try {
      // Get user's recent activity
      const user = await this.getUser(username)
      const [owner, repo] = repositoryId.split('/')
      
      // Get recent issues in this repository
      const issues = await this.getRepositoryIssues(owner, repo, 'closed')
      
      let completedIssues = 0
      let abandonedIssues = 0
      let totalResponseTime = 0
      let responseCount = 0
      
      // Analyze user's history in this repository
      for (const issue of issues.slice(0, 50)) { // Check last 50 issues
        const comments = await this.getIssueComments(owner, repo, issue.number)
        const userComments = comments.filter(comment => comment.user.login === username)
        
        if (userComments.length > 0) {
          // Check if user claimed this issue
          const claimComments = userComments.filter(comment => 
            this.extractClaimsFromComments([comment], issue.number, repositoryId).length > 0
          )
          
          if (claimComments.length > 0) {
            // Check if issue was completed (has linked PR or was closed by user)
            const hasLinkedPR = issue.pull_request
            const closedByUser = issue.closed_at && userComments.some(comment => 
              new Date(comment.created_at) > new Date(issue.closed_at!)
            )
            
            if (hasLinkedPR || closedByUser) {
              completedIssues++
            } else {
              abandonedIssues++
            }
            
            // Calculate response time
            const claimTime = new Date(claimComments[0].created_at)
            const lastActivity = new Date(userComments[userComments.length - 1].created_at)
            const responseTime = (lastActivity.getTime() - claimTime.getTime()) / (1000 * 60 * 60 * 24) // days
            
            if (responseTime > 0) {
              totalResponseTime += responseTime
              responseCount++
            }
          }
        }
      }
      
      // Calculate reliability score (0-100)
      const totalClaims = completedIssues + abandonedIssues
      const completionRate = totalClaims > 0 ? completedIssues / totalClaims : 0.5
      const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 7
      
      // Score based on completion rate and response time
      let score = completionRate * 70 // 70% weight on completion rate
      score += Math.max(0, 30 - (avgResponseTime / 7) * 10) // 30% weight on response time
      
      return Math.min(100, Math.max(0, score))
      
    } catch (error) {
      console.error('Error calculating contributor reliability:', error)
      return 50 // Default score
    }
  }
}

// Claim detection patterns
export const CLAIM_PATTERNS = [
  // Direct claims
  /i'?ll?\s+(work\s+on|take|handle|tackle|fix|solve)\s+(this\s+)?issue/i,
  /i'?m\s+(working\s+on|taking|handling|tackling|fixing|solving)\s+(this\s+)?issue/i,
  /let\s+me\s+(work\s+on|take|handle|tackle|fix|solve)\s+(this\s+)?issue/i,
  /i\s+want\s+to\s+(work\s+on|take|handle|tackle|fix|solve)\s+(this\s+)?issue/i,
  
  // Assignment requests
  /please\s+(assign|give)\s+(this\s+)?issue\s+(to\s+)?me/i,
  /can\s+you\s+(assign|give)\s+(this\s+)?issue\s+(to\s+)?me/i,
  /i'?d\s+like\s+to\s+(be\s+)?(assigned|work\s+on)\s+(this\s+)?issue/i,
  /assign\s+(this\s+)?issue\s+(to\s+)?me/i,
  
  // Self-assignments
  /i'?m\s+(claiming|taking)\s+(this\s+)?issue/i,
  /claiming\s+(this\s+)?issue/i,
  /dibs\s+on\s+(this\s+)?issue/i,
  
  // Progress indicators (negative patterns - these suggest actual work)
  /pull\s+request|pr\s+#\d+/i,
  /commit|committed|committing/i,
  /branch|branched|branching/i,
  /fix\s+(is\s+)?ready|fix\s+(is\s+)?done|fix\s+(is\s+)?complete/i,
  /working\s+on\s+(a\s+)?(fix|solution|implementation)/i,
  /implementing|implementation/i,
  /coding|coding\s+(up|on)/i,
  /debugging|debugged/i,
  /testing|tested/i,
]

export const PROGRESS_PATTERNS = [
  /pull\s+request|pr\s+#\d+/i,
  /commit|committed|committing/i,
  /branch|branched|branching/i,
  /fix\s+(is\s+)?ready|fix\s+(is\s+)?done|fix\s+(is\s+)?complete/i,
  /working\s+on\s+(a\s+)?(fix|solution|implementation)/i,
  /implementing|implementation/i,
  /coding|coding\s+(up|on)/i,
  /debugging|debugged/i,
  /testing|tested/i,
  /progress|update|status/i,
]

export function detectClaim(text: string): boolean {
  const cleanText = text.toLowerCase().trim()
  
  // Check for claim patterns
  const hasClaimPattern = CLAIM_PATTERNS.some(pattern => pattern.test(cleanText))
  
  // Check for progress patterns (if present, it's likely not just a claim)
  const hasProgressPattern = PROGRESS_PATTERNS.some(pattern => pattern.test(cleanText))
  
  return hasClaimPattern && !hasProgressPattern
}

export function detectProgress(text: string): boolean {
  const cleanText = text.toLowerCase().trim()
  return PROGRESS_PATTERNS.some(pattern => pattern.test(cleanText))
}

export function extractClaimType(text: string): 'comment' | 'assignment' | 'self-assigned' {
  const cleanText = text.toLowerCase().trim()
  
  if (/assign|please\s+(assign|give)/i.test(cleanText)) {
    return 'assignment'
  }
  
  if (/claiming|dibs|taking/i.test(cleanText)) {
    return 'self-assigned'
  }
  
  return 'comment'
}

export function calculateIssueComplexity(issue: any): 'low' | 'medium' | 'high' {
  const body = issue.body || ''
  const title = issue.title || ''
  const labels = issue.labels || []
  
  let complexityScore = 0
  
  // Length indicators
  if (body.length > 500) complexityScore += 2
  if (body.length > 1000) complexityScore += 3
  
  // Label indicators
  const complexityLabels = labels.map((l: any) => l.name.toLowerCase())
  if (complexityLabels.includes('good first issue') || complexityLabels.includes('beginner')) {
    complexityScore -= 2
  }
  if (complexityLabels.includes('enhancement') || complexityLabels.includes('feature')) {
    complexityScore += 2
  }
  if (complexityLabels.includes('bug')) {
    complexityScore += 1
  }
  
  // Content indicators
  const content = (title + ' ' + body).toLowerCase()
  const complexityKeywords = [
    'architecture', 'refactor', 'performance', 'optimization', 'security',
    'database', 'api', 'integration', 'testing', 'documentation'
  ]
  
  complexityKeywords.forEach(keyword => {
    if (content.includes(keyword)) complexityScore += 1
  })
  
  // Code block indicators
  const codeBlocks = (body.match(/```/g) || []).length
  complexityScore += Math.floor(codeBlocks / 2)
  
  if (complexityScore <= 2) return 'low'
  if (complexityScore <= 5) return 'medium'
  return 'high'
}
