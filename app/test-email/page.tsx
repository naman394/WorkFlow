'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function TestEmailPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [smtpStatus, setSmtpStatus] = useState<any>(null)
  const [testingSmtp, setTestingSmtp] = useState(false)

  const [formData, setFormData] = useState({
    contributorEmail: 'test@example.com',
    contributorName: 'testuser',
    issueTitle: 'Fix authentication bug',
    issueNumber: 123,
    repositoryName: 'test/repo',
    currentProbability: 25,
    benchmark: 40,
    issueUrl: 'https://github.com/test/repo/issues/123'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to send test email', details: error })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Number') || name.includes('Probability') || name.includes('benchmark') 
        ? parseInt(value) || 0 
        : value
    }))
  }

  const testSmtpConfiguration = async () => {
    setTestingSmtp(true)
    try {
      const response = await fetch('/api/test-smtp')
      const data = await response.json()
      setSmtpStatus(data)
    } catch (error) {
      setSmtpStatus({ error: 'Failed to test SMTP configuration' })
    } finally {
      setTestingSmtp(false)
    }
  }

  const sendTestEmailToSmtp = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testEmail: formData.contributorEmail }),
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to send test email via SMTP' })
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0a0b1e] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-400">Please log in to test the email notification system.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0b1e] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">📧 Email Notification System Test</h1>
          <p className="text-gray-400">
            Test the automatic email notification system for low completion probabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Form */}
          <div className="bg-gray-800/30 rounded-lg border border-white/10 p-6">
            <h2 className="text-xl font-semibold mb-4">Send Test Email</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Contributor Email
                </label>
                <input
                  type="email"
                  name="contributorEmail"
                  value={formData.contributorEmail}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Contributor Name
                </label>
                <input
                  type="text"
                  name="contributorName"
                  value={formData.contributorName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Issue Title
                </label>
                <input
                  type="text"
                  name="issueTitle"
                  value={formData.issueTitle}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Issue Number
                </label>
                <input
                  type="number"
                  name="issueNumber"
                  value={formData.issueNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Repository Name
                </label>
                <input
                  type="text"
                  name="repositoryName"
                  value={formData.repositoryName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Current Probability (%)
                </label>
                <input
                  type="number"
                  name="currentProbability"
                  value={formData.currentProbability}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 bg-gray-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Benchmark (%)
                </label>
                <input
                  type="number"
                  name="benchmark"
                  value={formData.benchmark}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 bg-gray-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Issue URL
                </label>
                <input
                  type="url"
                  name="issueUrl"
                  value={formData.issueUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Test Email'}
              </button>

              <div className="border-t border-white/10 pt-4 mt-4">
                <h3 className="text-lg font-medium mb-3">SMTP Testing</h3>
                
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={testSmtpConfiguration}
                    disabled={testingSmtp}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testingSmtp ? 'Testing...' : 'Test SMTP Configuration'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={sendTestEmailToSmtp}
                    disabled={loading || !smtpStatus?.success}
                    className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending via SMTP...' : 'Send Real Email via SMTP'}
                  </button>
                </div>

                {smtpStatus && (
                  <div className={`mt-3 p-3 rounded-lg border ${
                    smtpStatus.success 
                      ? 'bg-green-500/20 border-green-500/50' 
                      : 'bg-red-500/20 border-red-500/50'
                  }`}>
                    <h4 className={`font-medium mb-1 ${
                      smtpStatus.success ? 'text-green-400' : 'text-red-400'
                    }`}>
                      SMTP Status
                    </h4>
                    <p className="text-sm text-gray-300">
                      {smtpStatus.smtpTest?.message || smtpStatus.error}
                    </p>
                    {smtpStatus.configuration && (
                      <div className="text-xs text-gray-400 mt-2">
                        <p>Host: {smtpStatus.configuration.host}</p>
                        <p>Port: {smtpStatus.configuration.port}</p>
                        <p>User: {smtpStatus.configuration.user}</p>
                        <p>Pass: {smtpStatus.configuration.pass}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Results */}
          <div className="bg-gray-800/30 rounded-lg border border-white/10 p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            
            {!result ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📧</div>
                <p className="text-gray-400">Send a test email to see results here</p>
              </div>
            ) : result.success ? (
              <div className="space-y-4">
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                  <h3 className="text-green-400 font-semibold mb-2">✅ Email Sent Successfully</h3>
                  <div className="text-sm space-y-1">
                    <p><strong>Message ID:</strong> {result.messageId}</p>
                    <p><strong>To:</strong> {result.emailData?.to}</p>
                    <p><strong>Subject:</strong> {result.emailData?.subject}</p>
                    <p><strong>Probability:</strong> {result.emailData?.currentProbability}%</p>
                    <p><strong>Benchmark:</strong> {result.emailData?.benchmark}%</p>
                  </div>
                </div>
                
                <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                  <h3 className="text-blue-400 font-semibold mb-2">📝 Email Preview</h3>
                  <p className="text-sm text-gray-300">
                    The email includes a professional HTML template with:
                  </p>
                  <ul className="text-sm text-gray-300 mt-2 space-y-1">
                    <li>• Color-coded probability indicator</li>
                    <li>• Issue details and repository information</li>
                    <li>• Recommended actions for the contributor</li>
                    <li>• Direct link to the GitHub issue</li>
                    <li>• Responsive design for all devices</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <h3 className="text-red-400 font-semibold mb-2">❌ Email Failed</h3>
                <p className="text-sm text-gray-300">{result.error}</p>
                {result.details && (
                  <p className="text-sm text-gray-400 mt-2">Details: {result.details}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Information Panel */}
        <div className="mt-8 bg-gray-800/30 rounded-lg border border-white/10 p-6">
          <h2 className="text-xl font-semibold mb-4">🔧 System Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-green-400 mb-2">How It Works</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Monitors assigned contributors automatically</li>
                <li>• Calculates completion probability based on:</li>
                <li>  - Historical success rate</li>
                <li>  - Recent activity level</li>
                <li>  - Time since assignment</li>
                <li>• Sends email when probability drops below benchmark</li>
                <li>• Includes actionable recommendations</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-blue-400 mb-2">Configuration</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• <strong>Default Benchmark:</strong> 40%</li>
                <li>• <strong>Monitoring Interval:</strong> Every 60 minutes</li>
                <li>• <strong>Email Service:</strong> Nodemailer with SMTP</li>
                <li>• <strong>Template:</strong> Professional HTML with fallback text</li>
                <li>• <strong>Security:</strong> GitHub OAuth integration</li>
                <li>• <strong>SMTP Support:</strong> Gmail, Outlook, Custom SMTP</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
