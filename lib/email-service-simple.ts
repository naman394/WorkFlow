// Simple Email Notification Service for testing (without nodemailer)

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

export class SimpleEmailNotificationService {
  private notificationLogs: NotificationLog[] = []

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
      console.log('📧 SIMPLE EMAIL SERVICE - Sending email notification:', {
        to: contributorEmail,
        subject: `⚠️ Low Completion Probability Alert - ${repositoryName} #${issueNumber}`,
        currentProbability,
        benchmark,
        issueNumber,
        repositoryName,
        messageId,
        timestamp: new Date().toISOString()
      })

      // Log the notification
      const log: NotificationLog = {
        id: messageId,
        timestamp: new Date().toISOString(),
        repository: repositoryName,
        issue: `#${issueNumber} - ${issueTitle}`,
        contributor: contributorName,
        contributorEmail,
        previousProbability: 0,
        currentProbability,
        benchmark,
        emailSent: true,
        messageId
      }

      this.notificationLogs.push(log)

      // Simulate email sending (just log to console)
      console.log('📧 Email would be sent to:', contributorEmail)
      console.log('📧 Subject: ⚠️ Low Completion Probability Alert -', repositoryName, '#', issueNumber)
      console.log('📧 Message ID:', messageId)

      return { success: true, messageId }

    } catch (error) {
      const errorMessage = (error as Error).message
      console.error('📧 EMAIL SEND FAILED:', error)

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
        error: errorMessage
      }

      this.notificationLogs.push(errorLog)

      return { success: false, messageId, error: errorMessage }
    }
  }

  getNotificationLogs(): NotificationLog[] {
    return this.notificationLogs
  }

  clearLogs(): void {
    this.notificationLogs = []
  }
}
