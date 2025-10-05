'use client'

import { useState, useEffect } from 'react'

interface EmailModalProps {
  isOpen: boolean
  onClose: () => void
  contributor: {
    username: string
    avatarUrl: string
  }
  issue: {
    number: number
    title: string
    htmlUrl: string
  }
  repositoryName: string
}

interface GitHubUser {
  id: number
  login: string
  name: string
  email: string | null
  avatarUrl: string
  htmlUrl: string
  hasEmail: boolean
  emailSource: 'public' | 'authenticated' | 'none'
  contactInfo: {
    website: string | null
    twitter: string | null
    company: string | null
    location: string | null
    bio: string | null
    hasContactInfo: boolean
  }
}

export default function EmailModal({ 
  isOpen, 
  onClose, 
  contributor, 
  issue, 
  repositoryName 
}: EmailModalProps) {
  const [userDetails, setUserDetails] = useState<GitHubUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [emailType, setEmailType] = useState<'reminder' | 'urgent' | 'encouragement' | 'custom'>('reminder')
  const [customMessage, setCustomMessage] = useState('')
  const [result, setResult] = useState<any>(null)
  const [sendingMention, setSendingMention] = useState(false)

  // Fetch user details when modal opens
  useEffect(() => {
    if (isOpen && contributor.username) {
      fetchUserDetails()
    }
  }, [isOpen, contributor.username])

  const fetchUserDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/github/user/${contributor.username}`)
      const data = await response.json()
      
      if (data.success) {
        setUserDetails(data.user)
      } else {
        console.error('Failed to fetch user details:', data.error)
        setUserDetails(null)
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
      setUserDetails(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = async () => {
    if (!userDetails?.hasEmail) {
      setResult({ error: 'No email address found for this user' })
      return
    }

    setSending(true)
    setResult(null)

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contributorUsername: contributor.username,
          contributorEmail: userDetails.email,
          issueTitle: issue.title,
          issueNumber: issue.number,
          repositoryName: repositoryName,
          issueUrl: issue.htmlUrl,
          emailType,
          customMessage: customMessage || undefined
        }),
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        // Close modal after successful send
        setTimeout(() => {
          onClose()
          setResult(null)
        }, 2000)
      }
    } catch (error) {
      setResult({ error: 'Failed to send email', details: error })
    } finally {
      setSending(false)
    }
  }

  const handleSendMention = async () => {
    setSendingMention(true)
    setResult(null)

    try {
      const response = await fetch('/api/send-github-mention', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contributorUsername: contributor.username,
          issueTitle: issue.title,
          issueNumber: issue.number,
          repositoryName: repositoryName,
          issueUrl: issue.htmlUrl,
          messageType: emailType
        }),
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        // Close modal after successful send
        setTimeout(() => {
          onClose()
          setResult(null)
        }, 2000)
      }
    } catch (error) {
      setResult({ error: 'Failed to send GitHub mention', details: error })
    } finally {
      setSendingMention(false)
    }
  }

  const getEmailTypeDescription = (type: string) => {
    switch (type) {
      case 'reminder':
        return '📝 Friendly reminder to check progress'
      case 'urgent':
        return '⚠️ Urgent request for update'
      case 'encouragement':
        return '💪 Encouraging message to keep going'
      case 'custom':
        return '✍️ Custom message (add your own text)'
      default:
        return ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg border border-white/10 p-6 max-w-sm w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">📧 Send Email</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-700/30 rounded-lg">
          <img 
            src={contributor.avatarUrl} 
            alt={contributor.username}
            className="w-12 h-12 rounded-full border-2 border-green-400/50"
          />
          <div>
            <p className="text-lg font-semibold text-white">@{contributor.username}</p>
            <p className="text-sm text-gray-400">Issue #{issue.number}</p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto mb-2"></div>
            <p className="text-gray-400">Fetching user details...</p>
          </div>
        )}

        {/* Email Status */}
        {!loading && userDetails && (
          <div className="mb-6">
            {userDetails.hasEmail ? (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                <h3 className="text-green-400 font-semibold mb-2">✅ Email Available</h3>
                <p className="text-sm text-gray-300">
                  Email: <span className="font-mono text-green-400">{userDetails.email}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Source: {userDetails.emailSource} profile
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Simple No Email Message */}
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-center">
                  <h3 className="text-red-400 font-semibold mb-2">❌ No Email Available</h3>
                  <p className="text-sm text-gray-300">
                    @{contributor.username} doesn&apos;t have a public email address.
                  </p>
                </div>

                {/* Simple GitHub Mention Option */}
                <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                  <h4 className="text-blue-400 font-semibold mb-3 text-center">📝 Send GitHub Mention Instead</h4>
                  
                  <div className="space-y-2 mb-4">
                    {[
                      { value: 'reminder', label: 'Friendly Reminder', icon: '📝' },
                      { value: 'urgent', label: 'Urgent Update', icon: '⚠️' },
                      { value: 'encouragement', label: 'Encouragement', icon: '💪' }
                    ].map((type) => (
                      <label key={type.value} className="flex items-center space-x-3 p-2 bg-gray-600/30 rounded-lg cursor-pointer hover:bg-gray-600/50 transition-colors">
                        <input
                          type="radio"
                          name="mentionType"
                          value={type.value}
                          checked={emailType === type.value}
                          onChange={(e) => setEmailType(e.target.value as any)}
                          className="text-blue-500"
                        />
                        <span className="text-xl">{type.icon}</span>
                        <span className="text-white font-medium">{type.label}</span>
                      </label>
                    ))}
                  </div>
                  
                  <button
                    onClick={handleSendMention}
                    disabled={sendingMention}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMention ? 'Sending...' : 'Send GitHub Mention'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Email Type Selection */}
        {!loading && userDetails?.hasEmail && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Email Type
            </label>
            <div className="space-y-2">
              {[
                { value: 'reminder', label: 'Friendly Reminder', icon: '📝' },
                { value: 'urgent', label: 'Urgent Update', icon: '⚠️' },
                { value: 'encouragement', label: 'Encouragement', icon: '💪' },
                { value: 'custom', label: 'Custom Message', icon: '✍️' }
              ].map((type) => (
                <label key={type.value} className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors">
                  <input
                    type="radio"
                    name="emailType"
                    value={type.value}
                    checked={emailType === type.value}
                    onChange={(e) => setEmailType(e.target.value as any)}
                    className="text-green-500"
                  />
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <p className="text-white font-medium">{type.label}</p>
                    <p className="text-xs text-gray-400">{getEmailTypeDescription(type.value)}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Custom Message */}
        {!loading && userDetails?.hasEmail && emailType === 'custom' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom Message
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add your personal message here..."
              className="w-full px-3 py-2 bg-gray-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400 resize-none"
              rows={3}
            />
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`mb-6 p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-500/20 border-green-500/50' 
              : 'bg-red-500/20 border-red-500/50'
          }`}>
            <h3 className={`font-semibold mb-2 ${
              result.success ? 'text-green-400' : 'text-red-400'
            }`}>
              {result.success ? '✅ Email Sent!' : '❌ Failed to Send'}
            </h3>
            <p className="text-sm text-gray-300">
              {result.message || result.error}
            </p>
            {result.messageId && (
              <p className="text-xs text-gray-400 mt-1">
                Message ID: {result.messageId}
              </p>
            )}
          </div>
        )}


        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-colors"
          >
            Cancel
          </button>
          {!loading && userDetails?.hasEmail && (
            <button
              onClick={handleSendEmail}
              disabled={sending || (emailType === 'custom' && !customMessage.trim())}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send Email'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
