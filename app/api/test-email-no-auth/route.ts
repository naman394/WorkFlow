// Test endpoint for email notifications (no authentication required for testing)
import { NextRequest, NextResponse } from 'next/server'
import { SimpleEmailNotificationService } from '@/lib/email-service-simple'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Test email API called (no auth)')

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

    console.log('📧 Request data:', {
      contributorEmail,
      contributorName,
      issueTitle,
      issueNumber,
      repositoryName,
      currentProbability,
      benchmark,
      issueUrl
    })

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

    console.log('📧 Using values:', {
      finalProbability,
      finalBenchmark,
      finalIssueUrl
    })

    // Initialize simple email service
    let emailService
    try {
      console.log('🔧 Initializing simple email service...')
      emailService = new SimpleEmailNotificationService()
      console.log('✅ Simple email service initialized successfully')
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
    console.log('📧 Sending test email...')
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

    console.log('📧 Email result:', result)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully (no auth)',
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
    console.error('❌ Test email API error:', error)
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
    message: 'Test email endpoint (no auth) - use POST to send test emails',
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
