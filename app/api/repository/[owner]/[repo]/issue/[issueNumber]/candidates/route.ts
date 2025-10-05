import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Claim detection patterns
const CLAIM_PATTERNS = [
  /i'?ll?\s+(work\s+on|take|handle|fix)/i,
  /assign\s+(this\s+)?to\s+me/i,
  /i\s+(can|will)\s+(work\s+on|do|fix)/i,
  /let\s+me\s+(work\s+on|take|handle)/i,
  /i\s+(want|would like)\s+to\s+(work\s+on|take)/i,
  /can\s+i\s+(work\s+on|take|handle)/i,
  /i'?m\s+(working\s+on|taking|handling)/i,
  /i\s+got\s+this/i,
  /i\s+volunteer/i,
  /i\s+can\s+help/i,
  /i\s+will\s+help/i,
  /count\s+me\s+in/i,
  /i\s+am\s+interested/i,
]

export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repo: string; issueNumber: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // @ts-ignore
    const accessToken = session.accessToken as string
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 })
    }

    const { owner, repo, issueNumber } = params

    // Fetch issue details
    const issueResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )

    if (!issueResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch issue' }, { status: issueResponse.status })
    }

    const issue = await issueResponse.json()

    // Check if issue is assigned
    if (issue.assignees && issue.assignees.length > 0) {
      // Fetch assigned contributor data
      const assignee = issue.assignees[0]
      const assignedContributor = await analyzeAssignedContributor(
        assignee.login,
        owner,
        repo,
        accessToken,
        issue.updated_at
      )

      return NextResponse.json({
        assignedContributor,
        candidates: [],
      })
    }

    // Fetch issue comments
    const commentsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )

    if (!commentsResponse.ok) {
      return NextResponse.json({ candidates: [], assignedContributor: null })
    }

    const comments = await commentsResponse.json()

    // Analyze candidates
    const candidates = []
    for (const comment of comments) {
      const text = comment.body?.toLowerCase() || ''
      const isClaim = CLAIM_PATTERNS.some(pattern => pattern.test(text))

      if (isClaim) {
        const candidateData = await analyzeCandidate(
          comment.user.login,
          owner,
          repo,
          accessToken,
          comment
        )
        candidates.push(candidateData)
      }
    }

    // Sort by predictive score
    candidates.sort((a, b) => b.predictiveScore - a.predictiveScore)

    return NextResponse.json({
      assignedContributor: null,
      candidates,
    })

  } catch (error) {
    console.error('Candidates fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch candidates', details: (error as Error).message },
      { status: 500 }
    )
  }
}

async function analyzeCandidate(
  username: string,
  owner: string,
  repo: string,
  accessToken: string,
  comment: any
) {
  try {
    // Fetch user's PRs in this repo
    const prsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&creator=${username}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )

    const prs = prsResponse.ok ? await prsResponse.json() : []
    const successfulPRs = prs.filter((pr: any) => pr.merged_at).length
    const totalPRs = prs.length

    // Calculate average completion time
    let totalCompletionTime = 0
    let completedCount = 0
    for (const pr of prs) {
      if (pr.merged_at) {
        const createdAt = new Date(pr.created_at).getTime()
        const mergedAt = new Date(pr.merged_at).getTime()
        const days = Math.floor((mergedAt - createdAt) / (1000 * 60 * 60 * 24))
        totalCompletionTime += days
        completedCount++
      }
    }

    const avgCompletionTime = completedCount > 0 ? Math.round(totalCompletionTime / completedCount) : 7

    // Calculate reliability score
    const reliabilityScore = totalPRs > 0 
      ? Math.round((successfulPRs / totalPRs) * 100)
      : 50 // Default for new contributors

    // Calculate predictive score (weighted)
    let predictiveScore = 50 // Base score

    // Weight by reliability (40%)
    predictiveScore += (reliabilityScore - 50) * 0.4

    // Weight by PR count (20%)
    const prBonus = Math.min(totalPRs * 2, 20)
    predictiveScore += prBonus * 0.2

    // Weight by recency (20%)
    const daysSinceClaim = Math.floor((Date.now() - new Date(comment.created_at).getTime()) / (1000 * 60 * 60 * 24))
    const recencyPenalty = Math.min(daysSinceClaim * 2, 20)
    predictiveScore -= recencyPenalty * 0.2

    // Weight by completion time (20%)
    const speedBonus = avgCompletionTime < 7 ? 10 : avgCompletionTime < 14 ? 5 : 0
    predictiveScore += speedBonus * 0.2

    predictiveScore = Math.max(0, Math.min(100, Math.round(predictiveScore)))

    return {
      username,
      avatarUrl: comment.user.avatar_url,
      claimText: comment.body.substring(0, 150),
      claimedAt: comment.created_at,
      daysSinceClaim,
      predictiveScore,
      reliabilityScore,
      previousContributions: totalPRs,
      successfulPRs,
      abandonedClaims: totalPRs - successfulPRs,
      avgCompletionTime,
      status: daysSinceClaim > 7 ? 'stale' : 'active',
    }
  } catch (error) {
    console.error(`Error analyzing candidate ${username}:`, error)
    return {
      username,
      avatarUrl: comment.user.avatar_url,
      claimText: comment.body.substring(0, 150),
      claimedAt: comment.created_at,
      daysSinceClaim: Math.floor((Date.now() - new Date(comment.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      predictiveScore: 50,
      reliabilityScore: 50,
      previousContributions: 0,
      successfulPRs: 0,
      abandonedClaims: 0,
      avgCompletionTime: 7,
      status: 'active',
    }
  }
}

async function analyzeAssignedContributor(
  username: string,
  owner: string,
  repo: string,
  accessToken: string,
  lastActivityDate: string
) {
  try {
    // Fetch user's PRs
    const prsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&creator=${username}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )

    const prs = prsResponse.ok ? await prsResponse.json() : []
    const openPRs = prs.filter((pr: any) => pr.state === 'open').length
    const successfulPRs = prs.filter((pr: any) => pr.merged_at).length
    const totalPRs = prs.length

    // Calculate success rate
    const successRate = totalPRs > 0 ? Math.round((successfulPRs / totalPRs) * 100) : 50

    // Calculate average completion time
    let totalCompletionTime = 0
    let completedCount = 0
    for (const pr of prs) {
      if (pr.merged_at) {
        const createdAt = new Date(pr.created_at).getTime()
        const mergedAt = new Date(pr.merged_at).getTime()
        const days = Math.floor((mergedAt - createdAt) / (1000 * 60 * 60 * 24))
        totalCompletionTime += days
        completedCount++
      }
    }

    const avgCompletionTime = completedCount > 0 ? Math.round(totalCompletionTime / completedCount) : 7

    // Determine activity level
    const daysSinceActivity = Math.floor((Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
    let activityLevel: 'high' | 'medium' | 'low' | 'none'
    if (daysSinceActivity < 3) activityLevel = 'high'
    else if (daysSinceActivity < 7) activityLevel = 'medium'
    else if (daysSinceActivity < 14) activityLevel = 'low'
    else activityLevel = 'none'

    // Calculate completion probability
    let completionProbability = 70 // Base

    // Adjust by success rate
    completionProbability += (successRate - 50) * 0.3

    // Adjust by activity level
    if (activityLevel === 'high') completionProbability += 20
    else if (activityLevel === 'medium') completionProbability += 10
    else if (activityLevel === 'low') completionProbability -= 10
    else completionProbability -= 30

    // Adjust by open PRs (too many = lower probability)
    if (openPRs > 3) completionProbability -= 15
    else if (openPRs > 1) completionProbability -= 5

    completionProbability = Math.max(0, Math.min(100, Math.round(completionProbability)))

    // Fetch user data
    const userResponse = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    const userData = userResponse.ok ? await userResponse.json() : null

    return {
      username,
      avatarUrl: userData?.avatar_url || '',
      completionProbability,
      estimatedDays: avgCompletionTime,
      currentPRs: openPRs,
      successRate,
      activityLevel,
      lastActivityDate,
    }
  } catch (error) {
    console.error(`Error analyzing assigned contributor ${username}:`, error)
    return {
      username,
      avatarUrl: '',
      completionProbability: 50,
      estimatedDays: 7,
      currentPRs: 0,
      successRate: 50,
      activityLevel: 'medium' as const,
      lastActivityDate,
    }
  }
}
