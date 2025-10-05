// Intelligent Nudging System for Workflow

import { IssueClaim, NudgeTemplate, Intervention } from './types'

export class IntelligentNudgingSystem {
  private templates: NudgeTemplate[]
  private githubService: any // GitHubService instance

  constructor(githubService: any) {
    this.githubService = githubService
    this.templates = this.initializeTemplates()
  }

  private initializeTemplates(): NudgeTemplate[] {
    return [
      {
        id: 'friendly_reminder_1',
        name: 'Friendly First Reminder',
        type: 'friendly_reminder',
        subject: 'Just checking in on your issue progress! 😊',
        message: `Hi @{username}! 👋

I noticed you mentioned you'd work on #{issueNumber} a few days ago. Just wanted to check in and see how it's going!

If you're still working on it, that's awesome! If you've run into any challenges or need help, feel free to reach out to the maintainers.

If you're no longer able to work on this issue, no worries at all - just let us know so we can free it up for others.

Thanks for contributing to {repoName}! 🚀`,
        timing: 3, // days after claim
        escalationLevel: 1,
        successRate: 0.65,
        usageCount: 0,
      },
      {
        id: 'progress_check_1',
        name: 'Progress Check',
        type: 'progress_check',
        subject: 'How is #{issueNumber} coming along?',
        message: `Hey @{username}! 👋

Hope you're doing well! I'm checking in on #{issueNumber} that you claimed. 

Are you still working on this? If so, we'd love to hear about your progress! Even a quick update helps the community know what's happening.

If you've run into any blockers or need help, don't hesitate to ask in the issue comments or reach out to maintainers.

If you're no longer able to work on this, that's totally fine - just give us a heads up so we can make it available for others.

Thanks! 🙏`,
        timing: 7, // days after claim
        escalationLevel: 2,
        successRate: 0.55,
        usageCount: 0,
      },
      {
        id: 'final_warning_1',
        name: 'Final Warning',
        type: 'final_warning',
        subject: 'Final check: Still working on #{issueNumber}?',
        message: `Hi @{username},

This is a final check-in regarding #{issueNumber} that you claimed. We haven't seen any updates or progress in a while.

If you're still actively working on this issue, please let us know with a quick update in the comments.

If you're no longer able to work on this issue, please let us know so we can:
- Remove the assignment
- Make it available for other contributors
- Keep our issue tracker clean and up-to-date

If we don't hear back within 48 hours, we'll assume you're no longer working on this and will make it available for others.

Thanks for understanding! 🤝`,
        timing: 14, // days after claim
        escalationLevel: 3,
        successRate: 0.45,
        usageCount: 0,
      },
      {
        id: 'community_nudge_1',
        name: 'Community Nudge',
        type: 'community_nudge',
        subject: 'Community check-in on #{issueNumber}',
        message: `Hello @{username} and the {repoName} community! 👥

We're doing a quick community check-in on #{issueNumber} that was claimed by @{username}.

@{username}, if you're still working on this, we'd love to hear about your progress! Even a small update helps the community stay informed.

Community members: If anyone has experience with this type of issue or can offer guidance, feel free to chime in!

This helps us maintain an active, collaborative environment where everyone can contribute effectively.

Thanks everyone! 🌟`,
        timing: 10, // days after claim
        escalationLevel: 2,
        successRate: 0.70,
        usageCount: 0,
      },
    ]
  }

  async shouldSendNudge(claim: IssueClaim): Promise<boolean> {
    const daysSinceClaim = (Date.now() - claim.claimedAt.getTime()) / (1000 * 60 * 60 * 24)
    const daysSinceLastNudge = claim.lastNudgeDate 
      ? (Date.now() - claim.lastNudgeDate.getTime()) / (1000 * 60 * 60 * 24)
      : Infinity

    // Don't send if we've exceeded max nudges
    if (claim.nudgesSent >= 3) return false

    // Don't send if we sent a nudge recently (less than 3 days ago)
    if (daysSinceLastNudge < 3) return false

    // Check if it's time for the next nudge based on escalation
    const nextNudgeTemplate = this.getNextNudgeTemplate(claim)
    if (!nextNudgeTemplate) return false

    return daysSinceClaim >= nextNudgeTemplate.timing
  }

  private getNextNudgeTemplate(claim: IssueClaim): NudgeTemplate | null {
    const escalationLevel = claim.nudgesSent + 1
    
    // Get templates for this escalation level, sorted by success rate
    const availableTemplates = this.templates
      .filter(t => t.escalationLevel === escalationLevel)
      .sort((a, b) => b.successRate - a.successRate)

    return availableTemplates[0] || null
  }

  async sendNudge(claim: IssueClaim, repositoryName: string, ownerName: string): Promise<Intervention> {
    const template = this.getNextNudgeTemplate(claim)
    if (!template) {
      throw new Error('No nudge template available for this escalation level')
    }

    // Personalize the message
    const personalizedMessage = this.personalizeMessage(template.message, {
      username: claim.contributor.username,
      issueNumber: claim.issueNumber.toString(),
      repoName: repositoryName,
    })

    const personalizedSubject = this.personalizeMessage(template.subject, {
      username: claim.contributor.username,
      issueNumber: claim.issueNumber.toString(),
      repoName: repositoryName,
    })

    // Send the comment
    await this.githubService.createIssueComment(
      ownerName,
      repositoryName,
      claim.issueNumber,
      personalizedMessage
    )

    // Update template usage
    template.usageCount++

    // Create intervention record
    const intervention: Intervention = {
      id: `${claim.id}-nudge-${Date.now()}`,
      issueClaimId: claim.id,
      type: 'nudge',
      triggeredAt: new Date(),
      templateId: template.id,
      message: personalizedMessage,
      success: false, // Will be updated based on response
      contributorResponse: undefined,
    }

    return intervention
  }

  private personalizeMessage(message: string, variables: Record<string, string>): string {
    let personalizedMessage = message
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`
      personalizedMessage = personalizedMessage.replace(new RegExp(placeholder, 'g'), value)
    })

    return personalizedMessage
  }

  // Analyze response to nudge and determine if it was successful
  analyzeNudgeResponse(intervention: Intervention, comments: any[]): boolean {
    const nudgeTime = intervention.triggeredAt.getTime()
    
    // Look for responses after the nudge
    const responses = comments.filter(comment => 
      new Date(comment.created_at).getTime() > nudgeTime &&
      comment.user.login === intervention.contributorResponse
    )

    if (responses.length === 0) return false

    const latestResponse = responses[responses.length - 1]
    const responseText = latestResponse.body.toLowerCase()

    // Positive response indicators
    const positiveIndicators = [
      'still working',
      'almost done',
      'making progress',
      'will finish',
      'committing',
      'pull request',
      'pr ready',
      'working on it',
      'yes, still',
      'yes still',
    ]

    // Negative response indicators
    const negativeIndicators = [
      'can\'t work',
      'cannot work',
      'unable to',
      'no longer',
      'passing',
      'someone else',
      'not working',
      'stopping',
      'giving up',
      'abandoning',
    ]

    const hasPositive = positiveIndicators.some(indicator => responseText.includes(indicator))
    const hasNegative = negativeIndicators.some(indicator => responseText.includes(indicator))

    return hasPositive && !hasNegative
  }

  // Get optimal nudge timing based on contributor behavior
  getOptimalNudgeTiming(contributor: any): number[] {
    const baseTimings = [3, 7, 14] // Default timings in days
    
    // Adjust based on contributor reliability
    if (contributor.reliabilityScore > 80) {
      return [7, 14, 21] // More patient with reliable contributors
    } else if (contributor.reliabilityScore < 40) {
      return [2, 5, 10] // More aggressive with unreliable contributors
    }
    
    return baseTimings
  }

  // Generate community-driven nudge (alternative to bot messages)
  generateCommunityNudge(claim: IssueClaim, repositoryName: string): string {
    const communityMessages = [
      `Hey @{username}! 👋 The community is wondering about the progress on #{issueNumber}. Any updates you can share?`,
      `@{username}, how's it going with #{issueNumber}? We'd love to hear about your progress! 🚀`,
      `Quick check-in: @{username}, are you still working on #{issueNumber}? The community is curious! 😊`,
      `@{username}, hope #{issueNumber} is going well! Feel free to share any progress or challenges you're facing.`,
    ]

    const randomMessage = communityMessages[Math.floor(Math.random() * communityMessages.length)]
    return this.personalizeMessage(randomMessage, {
      username: claim.contributor.username,
      issueNumber: claim.issueNumber.toString(),
      repoName: repositoryName,
    })
  }

  // Create escalation strategy based on claim risk
  createEscalationStrategy(claim: IssueClaim): string[] {
    const riskScore = claim.riskScore
    const strategies: string[] = []

    if (riskScore > 70) {
      strategies.push('immediate_escalation')
      strategies.push('maintainer_notification')
      strategies.push('auto_release_candidate')
    } else if (riskScore > 50) {
      strategies.push('accelerated_nudging')
      strategies.push('community_intervention')
    } else {
      strategies.push('standard_nudging')
      strategies.push('patience_approach')
    }

    return strategies
  }
}
