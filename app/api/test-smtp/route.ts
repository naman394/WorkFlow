// Test SMTP configuration endpoint
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { EmailNotificationService } from '@/lib/email-service'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const emailService = new EmailNotificationService()
    const testResult = await emailService.testEmailConfiguration()

    return NextResponse.json({
      success: true,
      smtpTest: testResult,
      configuration: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || '587',
        user: process.env.SMTP_USER ? 'configured' : 'not configured',
        pass: process.env.SMTP_PASS ? 'configured' : 'not configured'
      }
    })

  } catch (error) {
    console.error('SMTP test error:', error)
    return NextResponse.json(
      { error: 'Failed to test SMTP configuration', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { testEmail } = await request.json()

    if (!testEmail) {
      return NextResponse.json({ error: 'testEmail is required' }, { status: 400 })
    }

    const emailService = new EmailNotificationService()
    
    // Send a simple test email
    const result = await emailService.sendLowProbabilityAlert(
      testEmail,
      'Test User',
      'Test Issue for SMTP Configuration',
      999,
      'test/repo',
      25,
      40,
      'https://github.com/test/repo/issues/999'
    )

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Test email sent successfully' : 'Failed to send test email',
      messageId: result.messageId,
      error: result.error
    })

  } catch (error) {
    console.error('SMTP test email error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email', details: (error as Error).message },
      { status: 500 }
    )
  }
}
