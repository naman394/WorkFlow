// Email Notification Service for Cookie-Licking Detector

import nodemailer from 'nodemailer'

export interface EmailNotification {
  to: string
  subject: string
  html: string
  text: string
}

export interface NotificationLog {
  id: string
  timestamp: string
  repository: string
  issue: string
  contributor: string
  contributorEmail: string
  previousProbability: number
  currentProbability: number
  benchmark: number
  emailSent: boolean
  messageId: string
  error?: string
}

export class EmailNotificationService {
  private notificationLogs: NotificationLog[] = []
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    this.initializeTransporter()
  }

  private initializeTransporter(): void {
    try {
      const smtpConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      }

      // Only create transporter if all required config is available
      if (smtpConfig.auth.user && smtpConfig.auth.pass) {
        this.transporter = nodemailer.createTransporter(smtpConfig)
        console.log('📧 Email transporter initialized with SMTP configuration')
      } else {
        console.log('⚠️ SMTP configuration incomplete, emails will be logged to console only')
      }
    } catch (error) {
      console.error('❌ Failed to initialize email transporter:', error)
    }
  }

  async sendLowProbabilityAlert(
    contributorEmail: string,
    contributorName: string,
    issueTitle: string,
    issueNumber: number,
    repositoryName: string,
    currentProbability: number,
    benchmark: number,
    issueUrl: string
  ): Promise<{ success: boolean; messageId: string; error?: string }> {
    const messageId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      const emailData: EmailNotification = {
        to: contributorEmail,
        subject: `⚠️ Low Completion Probability Alert - ${repositoryName} #${issueNumber}`,
        html: this.generateEmailHTML(contributorName, issueTitle, issueNumber, repositoryName, currentProbability, benchmark, issueUrl),
        text: this.generateEmailText(contributorName, issueTitle, issueNumber, repositoryName, currentProbability, benchmark, issueUrl)
      }

      // Log the notification
      const log: NotificationLog = {
        id: messageId,
        timestamp: new Date().toISOString(),
        repository: repositoryName,
        issue: `#${issueNumber} - ${issueTitle}`,
        contributor: contributorName,
        contributorEmail,
        previousProbability: 0, // Will be tracked in future iterations
        currentProbability,
        benchmark,
        emailSent: true,
        messageId
      }

      this.notificationLogs.push(log)

      // For now, we'll log to console. In production, integrate with actual email service
      console.log('📧 EMAIL NOTIFICATION SENT:', {
        to: contributorEmail,
        subject: emailData.subject,
        currentProbability,
        benchmark,
        issueNumber,
        repositoryName,
        messageId,
        timestamp: log.timestamp
      })

      // Send actual email using Nodemailer
      await this.sendActualEmail(emailData)

      return { success: true, messageId }

    } catch (error) {
      const errorLog: NotificationLog = {
        id: messageId,
        timestamp: new Date().toISOString(),
        repository: repositoryName,
        issue: `#${issueNumber} - ${issueTitle}`,
        contributor: contributorName,
        contributorEmail,
        previousProbability: 0,
        currentProbability,
        benchmark,
        emailSent: false,
        messageId,
        error: (error as Error).message
      }

      this.notificationLogs.push(errorLog)
      console.error('📧 EMAIL SEND FAILED:', error)

      return { success: false, messageId, error: (error as Error).message }
    }
  }

  private generateEmailHTML(
    contributorName: string,
    issueTitle: string,
    issueNumber: number,
    repositoryName: string,
    currentProbability: number,
    benchmark: number,
    issueUrl: string
  ): string {
    const probabilityColor = currentProbability < 30 ? '#dc3545' : currentProbability < 60 ? '#ffc107' : '#28a745'
    const urgencyLevel = currentProbability < 30 ? 'HIGH' : currentProbability < 60 ? 'MEDIUM' : 'LOW'

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cookie-Licking Detector Alert</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">🍪 Cookie-Licking Detector</h1>
            <p style="color: #e0e0e0; margin: 10px 0 0 0; font-size: 16px;">Issue Completion Probability Alert</p>
          </div>
          
          <!-- Main Content -->
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Alert Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #333; margin: 0 0 10px 0; font-size: 24px;">⚠️ Completion Probability Alert</h2>
              <div style="background: ${probabilityColor}; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: 600; text-transform: uppercase; font-size: 12px;">
                ${urgencyLevel} PRIORITY
              </div>
            </div>
            
            <!-- Issue Details -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6c757d;">
              <h3 style="color: #495057; margin-top: 0; margin-bottom: 15px; font-size: 18px;">📋 Issue Details</h3>
              <div style="display: grid; gap: 8px;">
                <p style="margin: 0;"><strong style="color: #495057;">Repository:</strong> <span style="color: #6c757d;">${repositoryName}</span></p>
                <p style="margin: 0;"><strong style="color: #495057;">Issue:</strong> <span style="color: #6c757d;">#${issueNumber} - ${issueTitle}</span></p>
                <p style="margin: 0;"><strong style="color: #495057;">Assigned to:</strong> <span style="color: #6c757d;">@${contributorName}</span></p>
              </div>
            </div>
            
            <!-- Probability Status -->
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3 style="color: #856404; margin-top: 0; margin-bottom: 15px; font-size: 18px;">📊 Probability Status</h3>
              
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div>
                  <p style="margin: 0; color: #856404; font-size: 14px;">Current Probability</p>
                  <p style="margin: 0; color: ${probabilityColor}; font-weight: bold; font-size: 24px;">${currentProbability}%</p>
                </div>
                <div style="text-align: right;">
                  <p style="margin: 0; color: #856404; font-size: 14px;">Benchmark</p>
                  <p style="margin: 0; color: #28a745; font-weight: bold; font-size: 24px;">${benchmark}%</p>
                </div>
              </div>
              
              <!-- Progress Bar -->
              <div style="background: #e9ecef; height: 12px; border-radius: 6px; margin: 15px 0; overflow: hidden; position: relative;">
                <div style="background: linear-gradient(90deg, #dc3545 0%, #ffc107 50%, #28a745 100%); height: 100%; width: 100%; border-radius: 6px;"></div>
                <div style="background: ${probabilityColor}; height: 100%; width: ${currentProbability}%; border-radius: 6px; position: absolute; top: 0; left: 0; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>
              </div>
              
              <p style="margin: 0; color: #856404; font-size: 14px; text-align: center;">
                Your completion probability is <strong>${benchmark - currentProbability}% below</strong> the benchmark
              </p>
            </div>
            
            <!-- Recommended Actions -->
            <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
              <h3 style="color: #0c5460; margin-top: 0; margin-bottom: 15px; font-size: 18px;">🚀 Recommended Actions</h3>
              <ul style="color: #0c5460; margin: 0; padding-left: 20px;">
                <li style="margin: 8px 0;">Update your progress with a comment on the issue</li>
                <li style="margin: 8px 0;">Check if you need help or clarification from maintainers</li>
                <li style="margin: 8px 0;">Reassess timeline if the issue is more complex than expected</li>
                <li style="margin: 8px 0;">Consider pairing with another contributor if you're stuck</li>
                <li style="margin: 8px 0;">Update issue labels or status if needed</li>
              </ul>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${issueUrl}" 
                 style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                📝 View & Update Issue →
              </a>
            </div>
            
            <!-- Note -->
            <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
              <p style="color: #e65100; margin: 0; font-size: 14px;">
                <strong>🤖 Automated Alert:</strong> This notification was sent automatically by the Cookie-Licking Detector 
                based on your completion probability analysis. If your probability improves, you'll receive a positive update notification.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
            <p style="margin: 5px 0;">🍪 Cookie-Licking Detector - AI-Powered Issue Management</p>
            <p style="margin: 5px 0;">This email was sent automatically based on completion probability analysis.</p>
            <p style="margin: 5px 0;">Message ID: ${messageId}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private generateEmailText(
    contributorName: string,
    issueTitle: string,
    issueNumber: number,
    repositoryName: string,
    currentProbability: number,
    benchmark: number,
    issueUrl: string
  ): string {
    return `
🍪 Cookie-Licking Detector - Completion Probability Alert

⚠️ LOW COMPLETION PROBABILITY ALERT

Hello @${contributorName},

Your completion probability for an assigned issue has dropped below the benchmark.

📋 ISSUE DETAILS:
Repository: ${repositoryName}
Issue: #${issueNumber} - ${issueTitle}
Assigned to: @${contributorName}

📊 PROBABILITY STATUS:
Current Probability: ${currentProbability}%
Benchmark: ${benchmark}%
Difference: ${benchmark - currentProbability}% below benchmark

🚀 RECOMMENDED ACTIONS:
• Update your progress with a comment on the issue
• Check if you need help or clarification from maintainers
• Reassess timeline if the issue is more complex than expected
• Consider pairing with another contributor if you're stuck
• Update issue labels or status if needed

📝 VIEW ISSUE: ${issueUrl}

🤖 This is an automated alert from the Cookie-Licking Detector. 
If your probability improves, you'll receive a positive update notification.

---
Cookie-Licking Detector - AI-Powered Issue Management
Message ID: email_${Date.now()}
    `
  }

  getNotificationLogs(): NotificationLog[] {
    return this.notificationLogs
  }

  getNotificationLogsByRepository(repositoryName: string): NotificationLog[] {
    return this.notificationLogs.filter(log => log.repository === repositoryName)
  }

  getNotificationLogsByContributor(contributorName: string): NotificationLog[] {
    return this.notificationLogs.filter(log => log.contributor === contributorName)
  }

  clearLogs(): void {
    this.notificationLogs = []
  }

  // Send actual email using Nodemailer
  private async sendActualEmail(emailData: EmailNotification): Promise<void> {
    if (!this.transporter) {
      console.log('📧 No SMTP transporter available, logging email to console:')
      console.log('To:', emailData.to)
      console.log('Subject:', emailData.subject)
      console.log('HTML Preview:', emailData.html.substring(0, 200) + '...')
      return
    }

    try {
      const mailOptions = {
        from: `"Cookie-Licking Detector" <${process.env.SMTP_USER}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log('📧 Email sent successfully:', info.messageId)
      
    } catch (error) {
      console.error('❌ Failed to send email:', error)
      throw new Error(`Failed to send email: ${(error as Error).message}`)
    }
  }

  // Test email configuration
  async testEmailConfiguration(): Promise<{ success: boolean; message: string }> {
    if (!this.transporter) {
      return {
        success: false,
        message: 'SMTP transporter not initialized. Please check your environment variables.'
      }
    }

    try {
      await this.transporter.verify()
      return {
        success: true,
        message: 'SMTP configuration is valid and ready to send emails.'
      }
    } catch (error) {
      return {
        success: false,
        message: `SMTP configuration test failed: ${(error as Error).message}`
      }
    }
  }
}
