// Advanced Claim Detection Engine for Cookie-Licking Detector

import { IssueClaim, Contributor } from './types'

export interface ClaimDetectionResult {
  isClaim: boolean
  confidence: number
  claimType: 'comment' | 'assignment' | 'self-assigned'
  riskFactors: string[]
  suggestedAction: 'monitor' | 'nudge' | 'auto_release' | 'escalate'
}

export class AdvancedClaimDetector {
  private claimPatterns = [
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
  ]

  private progressPatterns = [
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

  private abandonmentPatterns = [
    /sorry,?\s+(i\s+)?(can'?t|cannot)\s+(work\s+on|continue|finish)/i,
    /i\s+(can'?t|cannot)\s+(work\s+on|continue|finish)/i,
    /unable\s+to\s+(work\s+on|continue|finish)/i,
    /no\s+longer\s+(working\s+on|interested)/i,
    /passing\s+(on|this)/i,
    /someone\s+else\s+can\s+(take|handle)/i,
    /i\s+(don'?t|do not)\s+(have time|want)/i,
    /i\s+(quit|give up)/i,
    /not\s+(interested|available)/i,
    /too\s+busy/i,
  ]

  private lowConfidencePatterns = [
    /maybe|might|probably|perhaps/i,
    /i\s+(think|guess|suppose)/i,
    /not\s+sure|unsure/i,
    /if\s+i\s+(have|find)\s+time/i,
    /when\s+i\s+(get|have)\s+(time|chance)/i,
  ]

  private highConfidencePatterns = [
    /definitely|absolutely|certainly|surely/i,
    /i\s+(will|can|am going to)/i,
    /count\s+me\s+in/i,
    /i'm\s+on\s+it/i,
    /let's\s+do\s+this/i,
    /i\s+got\s+this/i,
  ]

  detectClaim(text: string, contributor?: Contributor): ClaimDetectionResult {
    const cleanText = text.toLowerCase().trim()
    const riskFactors: string[] = []
    let confidence = 0.5
    let claimType: 'comment' | 'assignment' | 'self-assigned' = 'comment'

    // Check for claim patterns
    const hasClaimPattern = this.claimPatterns.some(pattern => pattern.test(cleanText))
    
    // Check for progress patterns (if present, it's likely not just a claim)
    const hasProgressPattern = this.progressPatterns.some(pattern => pattern.test(cleanText))
    
    // Check for abandonment patterns
    const hasAbandonmentPattern = this.abandonmentPatterns.some(pattern => pattern.test(cleanText))

    if (!hasClaimPattern || hasProgressPattern || hasAbandonmentPattern) {
      return {
        isClaim: false,
        confidence: 0,
        claimType: 'comment',
        riskFactors: [],
        suggestedAction: 'monitor'
      }
    }

    // Determine claim type
    if (/assign|please\s+(assign|give)/i.test(cleanText)) {
      claimType = 'assignment'
    } else if (/claiming|dibs|taking/i.test(cleanText)) {
      claimType = 'self-assigned'
    }

    // Calculate confidence based on linguistic patterns
    const hasLowConfidence = this.lowConfidencePatterns.some(pattern => pattern.test(cleanText))
    const hasHighConfidence = this.highConfidencePatterns.some(pattern => pattern.test(cleanText))

    if (hasHighConfidence) {
      confidence += 0.3
    } else if (hasLowConfidence) {
      confidence -= 0.2
      riskFactors.push('Uncertain language detected')
    }

    // Adjust confidence based on contributor reliability
    if (contributor) {
      if (contributor.reliabilityScore > 80) {
        confidence += 0.2
      } else if (contributor.reliabilityScore < 40) {
        confidence -= 0.3
        riskFactors.push('Low contributor reliability score')
      }
    }

    // Additional risk factors
    if (cleanText.length < 20) {
      riskFactors.push('Very short claim message')
      confidence -= 0.1
    }

    if (cleanText.includes('newbie') || cleanText.includes('beginner') || cleanText.includes('first time')) {
      riskFactors.push('New contributor')
      confidence -= 0.1
    }

    // Determine suggested action
    let suggestedAction: 'monitor' | 'nudge' | 'auto_release' | 'escalate' = 'monitor'
    
    if (confidence < 0.3) {
      suggestedAction = 'auto_release'
    } else if (confidence < 0.5) {
      suggestedAction = 'nudge'
    } else if (riskFactors.length > 2) {
      suggestedAction = 'escalate'
    }

    return {
      isClaim: true,
      confidence: Math.max(0, Math.min(1, confidence)),
      claimType,
      riskFactors,
      suggestedAction
    }
  }

  detectProgress(text: string): boolean {
    return this.progressPatterns.some(pattern => pattern.test(text.toLowerCase()))
  }

  detectAbandonment(text: string): boolean {
    return this.abandonmentPatterns.some(pattern => pattern.test(text.toLowerCase()))
  }

  // Calculate risk score for a claim
  calculateClaimRiskScore(claim: IssueClaim): number {
    let riskScore = 0

    // Time-based risk
    const daysSinceClaim = (Date.now() - claim.claimedAt.getTime()) / (1000 * 60 * 60 * 24)
    riskScore += Math.min(40, daysSinceClaim * 5) // Max 40 points for time

    // Contributor reliability risk
    riskScore += (100 - claim.contributor.reliabilityScore) * 0.3

    // Progress risk (no progress = higher risk)
    riskScore += (100 - claim.progressScore) * 0.2

    // Previous abandonment risk
    if (claim.contributor.abandonedIssues > 0) {
      const abandonmentRate = claim.contributor.abandonedIssues / 
        (claim.contributor.completedIssues + claim.contributor.abandonedIssues)
      riskScore += abandonmentRate * 25
    }

    // Nudges sent risk
    riskScore += claim.nudgesSent * 5

    return Math.min(100, Math.max(0, riskScore))
  }

  // Generate smart nudge message based on claim context
  generateSmartNudge(claim: IssueClaim, strategy: 'friendly' | 'community' | 'challenge' | 'escalate'): string {
    const daysSinceClaim = Math.floor((Date.now() - claim.claimedAt.getTime()) / (1000 * 60 * 60 * 24))
    const contributor = claim.contributor.username
    const issueNumber = claim.issueNumber

    const templates = {
      friendly: `Hey @${contributor}! 👋 

Just checking in on issue #${issueNumber} that you claimed ${daysSinceClaim} days ago. 

How's it going? Any progress updates you can share? If you're still working on it, that's awesome! If you've run into any challenges or need help, feel free to reach out to the maintainers.

If you're no longer able to work on this issue, no worries at all - just let us know so we can free it up for others.

Thanks for contributing! 🚀`,

      community: `🌟 **Community Spotlight**: Issue #${issueNumber} needs attention!

**${contributor}** claimed this ${daysSinceClaim} days ago, but we haven't seen progress. This could be a great opportunity for someone else to contribute!

**Interested in helping?** Comment below or create a PR! 👇

*This helps us maintain an active, collaborative environment where everyone can contribute effectively.*`,

      challenge: `🎯 **Challenge Mode Activated!**

Issue #${issueNumber} is now open for community challenge!

**Current Status:** @${contributor} claimed this ${daysSinceClaim} days ago but hasn't made progress.

**The Challenge:** Implement the solution for this issue!
**Reward:** Community recognition and contributor badge! 🏆

**Ready to take on the challenge?** 
- First to submit a working solution wins!
- Show your skills to the community
- Help unblock this important issue

**Join the challenge:** Comment "I accept the challenge!" below`,

      escalate: `⚠️ **Issue Escalation Notice**

Issue #${issueNumber} has been escalated due to inactivity.

**Previous claim:** @${contributor} (${daysSinceClaim} days ago)
**Status:** No progress detected after multiple check-ins

This issue is now being prioritized and will be assigned to an experienced contributor or handled by the maintainer team.

**New contributors:** This issue is available for immediate assignment to qualified contributors.`
    }

    return templates[strategy]
  }
}
