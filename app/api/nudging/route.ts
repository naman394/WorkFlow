import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
    const { action, repositoryId, issueNumber, claimId, strategy } = body

    // Initialize services
    const githubService = new GitHubService(accessToken)
    const claimDetector = new AdvancedClaimDetector()

    const [owner, repo] = repositoryId.split('/')

    switch (action) {
      case 'send_nudge':
        // Generate smart nudge message
        const claim = {
          id: claimId,
          issueNumber: parseInt(issueNumber),
          contributor: {
            username: 'contributor', // This would be fetched from stored claim data
            reliabilityScore: 50
          },
          claimedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          progressScore: 0,
          nudgesSent: 1
        } as any

        const nudgeMessage = claimDetector.generateSmartNudge(claim, strategy || 'friendly')

        // Send nudge as comment
        await githubService.createIssueComment(owner, repo, parseInt(issueNumber), nudgeMessage)

        return NextResponse.json({
          success: true,
          message: 'Nudge sent successfully',
          strategy,
          nudgeMessage
        })

      case 'analyze_claim':
        // Analyze a specific claim
        const comments = await githubService.getIssueComments(owner, repo, parseInt(issueNumber))
        
        let analysisResults = []
        for (const comment of comments) {
          const detection = claimDetector.detectClaim(comment.body)
          if (detection.isClaim) {
            analysisResults.push({
              commentId: comment.id,
              text: comment.body,
              detection,
              timestamp: comment.created_at
            })
          }
        }

        return NextResponse.json({
          success: true,
          analysis: analysisResults,
          totalClaims: analysisResults.length
        })

      case 'calculate_risk':
        // Calculate risk score for a claim
        const riskScore = claimDetector.calculateClaimRiskScore({
          id: claimId,
          issueNumber: parseInt(issueNumber),
          contributor: {
            username: 'contributor',
            reliabilityScore: 50
          },
          claimedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          progressScore: 0,
          nudgesSent: 0
        } as any)

        return NextResponse.json({
          success: true,
          riskScore,
          riskLevel: riskScore > 70 ? 'high' : riskScore > 50 ? 'medium' : 'low'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Nudging API error:', error)
    return NextResponse.json(
      { error: 'Failed to process nudging request' },
      { status: 500 }
    )
  }
}
