// Auto-Release Mechanism for Cookie-Licking Detector

import { IssueClaim, RepositoryConfig, Intervention } from './types'

export class AutoReleaseMechanism {
  private githubService: any // GitHubService instance

  constructor(githubService: any) {
    this.githubService = githubService
  }

  async shouldAutoRelease(claim: IssueClaim, config: RepositoryConfig): Promise<boolean> {
    if (!config.autoReleaseEnabled) return false

    const now = new Date()
    const gracePeriodEnded = now > claim.gracePeriodEndsAt
    const maxNudgesReached = claim.nudgesSent >= config.maxNudges
    const isStale = this.isClaimStale(claim)

    // Auto-release conditions:
    // 1. Grace period has ended
    // 2. Max nudges have been sent
    // 3. Claim is considered stale (no progress for extended period)
    // 4. Risk score is very high
    return (gracePeriodEnded || maxNudgesReached || isStale) && claim.riskScore > 70
  }

  private isClaimStale(claim: IssueClaim): boolean {
    const daysSinceLastActivity = (Date.now() - claim.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    const daysSinceClaim = (Date.now() - claim.claimedAt.getTime()) / (1000 * 60 * 60 * 24)
    
    // Consider stale if:
    // - No activity for 10+ days, OR
    // - Claimed 21+ days ago with no progress
    return daysSinceLastActivity > 10 || (daysSinceClaim > 21 && claim.progressScore === 0)
  }

  async autoReleaseClaim(
    claim: IssueClaim, 
    repositoryName: string, 
    ownerName: string,
    config: RepositoryConfig
  ): Promise<Intervention> {
    
    // Create release comment
    const releaseMessage = this.generateReleaseMessage(claim, config)
    
    // Add comment to issue
    await this.githubService.createIssueComment(
      ownerName,
      repositoryName,
      claim.issueNumber,
      releaseMessage
    )

    // Remove assignment if exists
    await this.removeAssignment(ownerName, repositoryName, claim.issueNumber, claim.contributor.username)

    // Add/update labels
    await this.updateLabels(ownerName, repositoryName, claim.issueNumber, [
      'available',
      'help wanted'
    ], ['claimed', 'assigned'])

    // Update claim status
    claim.status = 'auto-released'
    claim.autoReleaseDate = new Date()

    // Create intervention record
    const intervention: Intervention = {
      id: `${claim.id}-auto-release-${Date.now()}`,
      issueClaimId: claim.id,
      type: 'auto_release',
      triggeredAt: new Date(),
      message: releaseMessage,
      success: true,
      autoReleasedAt: new Date(),
    }

    return intervention
  }

  private generateReleaseMessage(claim: IssueClaim, config: RepositoryConfig): string {
    const daysSinceClaim = Math.floor(
      (Date.now() - claim.claimedAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    const templates = [
      `## 🔄 Issue Auto-Released

This issue has been automatically released for new contributors.

**Previous claim:** @${claim.contributor.username} (${daysSinceClaim} days ago)
**Reason:** No progress detected after multiple check-ins

The issue is now available for anyone to work on. Please comment below if you'd like to take it on! 🚀

---
*This action was taken by the Cookie-Licking Detector to maintain active issue management.*`,

      `## ⏰ Issue Available Again

This issue is now available for new contributors to work on.

**Previous claim:** @${claim.contributor.username} claimed this ${daysSinceClaim} days ago
**Status:** No recent activity detected

Feel free to comment if you'd like to work on this issue! 

---
*Auto-released by Cookie-Licking Detector*`,

      `## 🆓 Issue Released

This issue has been released and is available for contributors.

**Previous claim:** @${claim.contributor.username} (${daysSinceClaim} days ago)
**Action:** Auto-released due to inactivity

If you're interested in working on this issue, please comment below!

---
*Managed by Cookie-Licking Detector for better issue flow*`,
    ]

    // Select template based on claim history
    let templateIndex = 0
    if (claim.nudgesSent >= 2) templateIndex = 1
    if (claim.riskScore > 80) templateIndex = 2

    return templates[templateIndex]
  }

  private async removeAssignment(
    ownerName: string, 
    repositoryName: string, 
    issueNumber: number, 
    username: string
  ): Promise<void> {
    try {
      // GitHub API doesn't have a direct "unassign" endpoint
      // We need to get current assignees and remove the specific user
      const issue = await this.githubService.makeRequest(
        `/repos/${ownerName}/${repositoryName}/issues/${issueNumber}`
      )
      
      const currentAssignees = issue.assignees || []
      const remainingAssignees = currentAssignees
        .filter((assignee: any) => assignee.login !== username)
        .map((assignee: any) => assignee.login)

      await this.githubService.makeRequest(
        `/repos/${ownerName}/${repositoryName}/issues/${issueNumber}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignees: remainingAssignees,
          }),
        }
      )
    } catch (error) {
      console.error('Failed to remove assignment:', error)
      // Continue execution - assignment removal is not critical
    }
  }

  private async updateLabels(
    ownerName: string,
    repositoryName: string,
    issueNumber: number,
    labelsToAdd: string[],
    labelsToRemove: string[]
  ): Promise<void> {
    try {
      // Add new labels
      if (labelsToAdd.length > 0) {
        await this.githubService.addIssueLabels(ownerName, repositoryName, issueNumber, labelsToAdd)
      }

      // Remove old labels
      if (labelsToRemove.length > 0) {
        await this.githubService.removeIssueLabels(ownerName, repositoryName, issueNumber, labelsToRemove)
      }
    } catch (error) {
      console.error('Failed to update labels:', error)
      // Continue execution - label updates are not critical
    }
  }

  // Calculate optimal grace period based on issue complexity and contributor reliability
  calculateGracePeriod(claim: IssueClaim, config: RepositoryConfig): number {
    const baseGracePeriod = config.gracePeriodDays
    const contributor = claim.contributor
    
    // Adjust based on contributor reliability
    let gracePeriod = baseGracePeriod
    
    if (contributor.reliabilityScore > 80) {
      gracePeriod *= 1.5 // More time for reliable contributors
    } else if (contributor.reliabilityScore < 40) {
      gracePeriod *= 0.7 // Less time for unreliable contributors
    }

    // Adjust based on issue complexity (more complex = more time)
    // This would need issue analysis data, but for now we'll use a default
    
    return Math.round(gracePeriod)
  }

  // Create auto-release schedule based on repository activity
  createAutoReleaseSchedule(config: RepositoryConfig): Date[] {
    const schedule: Date[] = []
    const now = new Date()
    
    // Daily checks for high-priority issues
    for (let i = 1; i <= 30; i++) {
      const checkDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
      schedule.push(checkDate)
    }
    
    return schedule
  }

  // Generate auto-release report
  generateAutoReleaseReport(interventions: Intervention[], timeRange: { start: Date, end: Date }): any {
    const autoReleaseInterventions = interventions.filter(
      i => i.type === 'auto_release' && 
           i.triggeredAt >= timeRange.start && 
           i.triggeredAt <= timeRange.end
    )

    const totalAutoReleased = autoReleaseInterventions.length
    const successfulReleases = autoReleaseInterventions.filter(i => i.success).length
    
    return {
      totalAutoReleased,
      successfulReleases,
      successRate: totalAutoReleased > 0 ? successfulReleases / totalAutoReleased : 0,
      averageTimeToRelease: this.calculateAverageTimeToRelease(autoReleaseInterventions),
      topReasons: this.calculateTopReasons(autoReleaseInterventions),
      timeRange,
    }
  }

  private calculateAverageTimeToRelease(interventions: Intervention[]): number {
    if (interventions.length === 0) return 0
    
    // This would need claim data to calculate actual time from claim to release
    // For now, return a placeholder
    return 14 // days
  }

  private calculateTopReasons(interventions: Intervention[]): string[] {
    // This would analyze the reasons for auto-release
    // For now, return common reasons
    return [
      'No progress after grace period',
      'No response to nudges',
      'High risk score',
      'Stale claim detected',
    ]
  }
}
