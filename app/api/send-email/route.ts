// API endpoint for sending direct emails to assigned persons
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { EmailNotificationService } from '@/lib/email-service'

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

    const { 
      contributorUsername,
      contributorEmail,
      issueTitle,
      issueNumber,
      repositoryName,
      issueUrl,
      customMessage,
      emailType = 'reminder'
    } = await request.json()

    // Validate required fields
    if (!contributorUsername || !contributorEmail || !issueTitle || !issueNumber || !repositoryName) {
      return NextResponse.json({ 
        error: 'Missing required fields: contributorUsername, contributorEmail, issueTitle, issueNumber, repositoryName' 
      }, { status: 400 })
    }

    console.log('📧 Sending direct email to assigned person:', {
      contributorUsername,
      contributorEmail,
      issueNumber,
      repositoryName,
      emailType
    })

    // Initialize email service
    let emailService
    try {
      emailService = new EmailNotificationService()
      console.log('✅ Email service initialized for direct email')
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize email service',
        details: (error as Error).message,
        messageId: `init_error_${Date.now()}`
      }, { status: 500 })
    }

    // Determine email content based on type
    let subject, probability, benchmark
    
    switch (emailType) {
      case 'reminder':
        subject = `📝 Friendly Reminder - ${repositoryName} #${issueNumber}`
        probability = 60 // Assume moderate probability for reminders
        benchmark = 40
        break
      case 'urgent':
        subject = `⚠️ Urgent Update Needed - ${repositoryName} #${issueNumber}`
        probability = 25 // Assume low probability for urgent emails
        benchmark = 40
        break
      case 'encouragement':
        subject = `💪 Keep Going! - ${repositoryName} #${issueNumber}`
        probability = 70 // Assume good probability for encouragement
        benchmark = 40
        break
      default:
        subject = `📧 Update Request - ${repositoryName} #${issueNumber}`
        probability = 50
        benchmark = 40
    }

    // Add custom message if provided
    if (customMessage) {
      subject += ' - Personal Note'
    }

    // Send email
    const result = await emailService.sendLowProbabilityAlert(
      contributorEmail,
      contributorUsername,
      issueTitle,
      issueNumber,
      repositoryName,
      probability,
      benchmark,
      issueUrl || `https://github.com/${repositoryName}/issues/${issueNumber}`
    )

    if (result.success) {
      console.log(`✅ Direct email sent successfully to @${contributorUsername}`)
      
      return NextResponse.json({
        success: true,
        message: `Email sent successfully to @${contributorUsername}`,
        messageId: result.messageId,
        emailDetails: {
          to: contributorEmail,
          subject,
          contributorUsername,
          issueNumber,
          repositoryName,
          emailType,
          hasCustomMessage: !!customMessage
        }
      })
    } else {
      console.error(`❌ Failed to send direct email to @${contributorUsername}:`, result.error)
      
      return NextResponse.json({
        success: false,
        error: `Failed to send email to @${contributorUsername}`,
        details: result.error,
        messageId: result.messageId || 'unknown'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Direct email API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send direct email', 
        details: (error as Error).message,
        messageId: `error_${Date.now()}`
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Direct email endpoint - use POST to send emails to assigned persons',
    emailTypes: ['reminder', 'urgent', 'encouragement', 'custom'],
    example: {
      method: 'POST',
      body: {
        contributorUsername: 'username',
        contributorEmail: 'user@example.com',
        issueTitle: 'Fix authentication bug',
        issueNumber: 123,
        repositoryName: 'owner/repo',
        issueUrl: 'https://github.com/owner/repo/issues/123',
        emailType: 'reminder',
        customMessage: 'Optional custom message'
      }
    }
  })
}
