// Simple test endpoint for email notifications (without nodemailer)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SimpleEmailNotificationService } from '@/lib/email-service-simple'

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

    // Initialize simple email service
    let emailService
    try {
      emailService = new SimpleEmailNotificationService()
      console.log('📧 Simple email service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize simple email service:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize simple email service',
        details: (error as Error).message,
        messageId: `init_error_${Date.now()}`
      }, { status: 500 })
    }

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
        message: 'Test email sent successfully (simple service)',
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
        messageId: result.messageId || 'unknown'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Simple test email API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send test email', 
        details: (error as Error).message,
        messageId: `error_${Date.now()}`
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Simple test email endpoint - use POST to send test emails (no nodemailer)',
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
