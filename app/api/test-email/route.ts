// Test endpoint for email notifications
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { EmailNotificationService } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      contributorEmail, 
      contributorName, 
      issueTitle, 
      issueNumber, 
      repositoryName, 
      currentProbability, 
      benchmark,
      issueUrl 
    } = await request.json()

    // Validate required fields
    if (!contributorEmail || !contributorName || !issueTitle || !issueNumber || !repositoryName) {
      return NextResponse.json({ 
        error: 'Missing required fields: contributorEmail, contributorName, issueTitle, issueNumber, repositoryName' 
      }, { status: 400 })
    }

    // Set defaults
    const finalProbability = currentProbability || 25
    const finalBenchmark = benchmark || 40
    const finalIssueUrl = issueUrl || `https://github.com/test/test/issues/${issueNumber}`

    // Initialize email service
    const emailService = new EmailNotificationService()

    // Send test email
    const result = await emailService.sendLowProbabilityAlert(
      contributorEmail,
      contributorName,
      issueTitle,
      issueNumber,
      repositoryName,
      finalProbability,
      finalBenchmark,
      finalIssueUrl
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId,
        emailData: {
          to: contributorEmail,
          subject: `⚠️ Low Completion Probability Alert - ${repositoryName} #${issueNumber}`,
          currentProbability: finalProbability,
          benchmark: finalBenchmark
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        messageId: result.messageId
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Test email API error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test email endpoint - use POST to send test emails',
    example: {
      method: 'POST',
      body: {
        contributorEmail: 'test@example.com',
        contributorName: 'testuser',
        issueTitle: 'Test Issue',
        issueNumber: 123,
        repositoryName: 'test/repo',
        currentProbability: 25,
        benchmark: 40,
        issueUrl: 'https://github.com/test/repo/issues/123'
      }
    }
  })
}
