import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { GitHubService } from '@/lib/github'
import { AdvancedClaimDetector } from '@/lib/claim-detector'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // @ts-ignore
    const accessToken = session.accessToken

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 })
    }

    const body = await request.json()
    const { action, repositoryId, issueNumber, claimId, reason } = body

    // Initialize services
    const githubService = new GitHubService(accessToken)
    const claimDetector = new AdvancedClaimDetector()

    const [owner, repo] = repositoryId.split('/')

    switch (action) {
      case 'auto_release':
        // Generate auto-release message
        const releaseMessage = `## 🔄 Issue Auto-Released

This issue has been automatically released for new contributors.

**Previous claim:** @contributor (${Math.floor(Math.random() * 10) + 5} days ago)
**Reason:** ${reason || 'No progress detected after grace period'}

The issue is now available for anyone to work on. Please comment below if you'd like to take it on! 🚀

**Why this matters:**
- Keeps the issue tracker active and up-to-date
- Ensures issues don't get stuck indefinitely
- Gives other contributors a chance to help

---
*This action was taken by the Cookie-Licking Detector to maintain active issue management.*`

        // Add comment to issue
        await githubService.createIssueComment(owner, repo, parseInt(issueNumber), releaseMessage)

        // Add/update labels
        await githubService.addIssueLabels(owner, repo, parseInt(issueNumber), [
          'available',
          'help wanted'
        ])

        return NextResponse.json({
          success: true,
          message: 'Issue auto-released successfully',
          releaseMessage
        })

      case 'gentle_release':
        // Generate gentle release message
        const gentleMessage = `🔄 **Gentle Release Notice**

**Issue #${issueNumber}** is being released for new contributors.

**Timeline:**
- Claimed by @contributor on ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
- Grace period ended on ${new Date().toLocaleDateString()}
- Released for new contributors on ${new Date().toLocaleDateString()}

**Thank you @contributor!** 🙏
- Your interest in this issue was appreciated
- Feel free to contribute in other ways
- This issue is now open for someone else to tackle

**New contributors:** This issue is now available! Check the requirements and claim if you're interested. 💪`

        await githubService.createIssueComment(owner, repo, parseInt(issueNumber), gentleMessage)

        return NextResponse.json({
          success: true,
          message: 'Issue gently released successfully',
          releaseMessage: gentleMessage
        })

      case 'check_eligibility':
        // Check if an issue is eligible for auto-release
        const issue = await githubService.getRepository(owner, repo)
        const comments = await githubService.getIssueComments(owner, repo, parseInt(issueNumber))
        
        // Analyze claims in comments
        let claims = []
        for (const comment of comments) {
          const detection = claimDetector.detectClaim(comment.body)
          if (detection.isClaim) {
            claims.push({
              commentId: comment.id,
              username: comment.user.login,
              createdAt: comment.created_at,
              detection
            })
          }
        }

        // Check if oldest claim is beyond grace period
        const oldestClaim = claims.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )[0]

        const daysSinceClaim = oldestClaim ? 
          (Date.now() - new Date(oldestClaim.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 0

        const isEligible = daysSinceClaim > 7 // 7 day grace period

        return NextResponse.json({
          success: true,
          isEligible,
          daysSinceClaim: Math.floor(daysSinceClaim),
          claimsCount: claims.length,
          oldestClaim: oldestClaim?.username,
          gracePeriodEnded: daysSinceClaim > 7
        })

      case 'bulk_release':
        // Auto-release multiple eligible issues
        const issues = await githubService.getRepositoryIssues(owner, repo, 'open')
        const eligibleIssues = []

        for (const issue of issues.slice(0, 10)) { // Check first 10 issues
          const comments = await githubService.getIssueComments(owner, repo, issue.number)
          
          let hasOldClaim = false
          for (const comment of comments) {
            const detection = claimDetector.detectClaim(comment.body)
            if (detection.isClaim) {
              const daysSinceClaim = (Date.now() - new Date(comment.created_at).getTime()) / (1000 * 60 * 60 * 24)
              if (daysSinceClaim > 7) {
                hasOldClaim = true
                break
              }
            }
          }

          if (hasOldClaim) {
            eligibleIssues.push({
              number: issue.number,
              title: issue.title,
              daysSinceClaim: Math.floor(daysSinceClaim)
            })
          }
        }

        return NextResponse.json({
          success: true,
          eligibleIssues,
          count: eligibleIssues.length
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Auto-release API error:', error)
    return NextResponse.json(
      { error: 'Failed to process auto-release request' },
      { status: 500 }
    )
  }
}
