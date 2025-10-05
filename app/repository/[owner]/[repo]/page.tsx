'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import EmailModal from './components/EmailModal'

interface Issue {
  id: number
  number: number
  title: string
  body: string
  state: string
  createdAt: string
  updatedAt: string
  closedAt: string | null
  user: {
    login: string
    avatarUrl: string
  }
  assignees: Array<{
    login: string
    avatar_url: string
  }>
  labels: Array<{
    name: string
    color: string
  }>
  htmlUrl: string
}

interface Candidate {
  username: string
  avatarUrl: string
  claimText: string
  claimedAt: string
  daysSinceClaim: number
  predictiveScore: number
  reliabilityScore: number
  previousContributions: number
  successfulPRs: number
  abandonedClaims: number
  avgCompletionTime: number
  status: 'active' | 'stale' | 'completed'
}

interface AssignedContributor {
  username: string
  avatarUrl: string
  completionProbability: number
  estimatedDays: number
  currentPRs: number
  successRate: number
  activityLevel: 'high' | 'medium' | 'low' | 'none'
  lastActivityDate: string
}

interface RepositoryData {
  repository: {
    id: number
    name: string
    fullName: string
    description?: string
    htmlUrl: string
    language?: string
    stars?: number
    forks?: number
    openIssues?: number
    owner: {
      login: string
      avatarUrl: string
    }
  }
  issues: Issue[]
}

export default function RepositoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [repoData, setRepoData] = useState<RepositoryData | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [assignedContributor, setAssignedContributor] = useState<AssignedContributor | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [assigningUser, setAssigningUser] = useState<string | null>(null)

  const owner = params?.owner as string
  const repo = params?.repo as string

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && owner && repo) {
      fetchRepositoryData()
    }
  }, [status, owner, repo])

  const fetchRepositoryData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/repository/${owner}/${repo}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch repository data')
      }

      const data = await response.json()
      setRepoData(data)
      
      // Auto-select the first issue if available
      if (data.issues && data.issues.length > 0) {
        setSelectedIssue(data.issues[0])
        fetchIssueCandidates(data.issues[0].number)
      }
    } catch (error) {
      console.error('Error fetching repository:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchIssueCandidates = async (issueNumber: number) => {
    try {
      setLoadingDetails(true)
      const response = await fetch(`/api/repository/${owner}/${repo}/issue/${issueNumber}/candidates`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch candidates')
      }

      const data = await response.json()
      setCandidates(data.candidates || [])
      setAssignedContributor(data.assignedContributor || null)
    } catch (error) {
      console.error('Error fetching candidates:', error)
      setCandidates([])
      setAssignedContributor(null)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue)
    fetchIssueCandidates(issue.number)
  }

  const handleLogout = async () => {
    localStorage.clear()
    sessionStorage.clear()
    await signOut({ redirect: true, callbackUrl: '/' })
  }

  const handleAssignUser = async (username: string, action: 'assign' | 'unassign') => {
    if (!selectedIssue) return
    
    setAssigningUser(username)
    try {
      const response = await fetch('/api/github/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner,
          repo,
          issueNumber: selectedIssue.number,
          username,
          action
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the issue details
        await fetchIssueCandidates(selectedIssue.number)
        
        // Optionally refresh the repository data to update issue list
        const repoResponse = await fetch(`/api/repository/${owner}/${repo}`)
        const repoData = await repoResponse.json()
        if (repoData.success) {
          setRepoData(repoData)
        }
      } else {
        alert(`Failed to ${action} user: ${data.error}`)
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error)
      alert(`Failed to ${action} user`)
    } finally {
      setAssigningUser(null)
    }
  }

  const getActivityColor = (activityLevel: string) => {
    switch (activityLevel) {
      case 'high': return 'bg-green-500/20 border-green-500/50 text-green-400'
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
      case 'low': return 'bg-orange-500/20 border-orange-500/50 text-orange-400'
      case 'none': return 'bg-red-500/20 border-red-500/50 text-red-400'
      default: return 'bg-gray-500/20 border-gray-500/50 text-gray-400'
    }
  }

  const getIssueStatusColor = (issue: Issue) => {
    if (issue.state === 'closed') return 'bg-purple-500/20 border-purple-500/50'
    if (issue.assignees.length > 0) {
      // Check activity level based on last update
      const daysSinceUpdate = Math.floor((Date.now() - new Date(issue.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceUpdate < 3) return 'bg-green-500/20 border-green-500/50' // High activity
      if (daysSinceUpdate < 7) return 'bg-yellow-500/20 border-yellow-500/50' // Medium activity
      if (daysSinceUpdate < 14) return 'bg-orange-500/20 border-orange-500/50' // Low activity
      return 'bg-red-500/20 border-red-500/50' // Stale
    }
    return 'bg-blue-500/20 border-blue-500/50' // Unassigned
  }

  const getIssueStatusLabel = (issue: Issue) => {
    if (issue.state === 'closed') return '✓ Closed'
    if (issue.assignees.length > 0) {
      const daysSinceUpdate = Math.floor((Date.now() - new Date(issue.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceUpdate < 3) return '🟢 Active'
      if (daysSinceUpdate < 7) return '🟡 Moderate'
      if (daysSinceUpdate < 14) return '🟠 Slow'
      return '🔴 Stale'
    }
    return '🆕 Unassigned'
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0b1e] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!repoData) {
    return (
      <div className="min-h-screen bg-[#0a0b1e] flex items-center justify-center">
        <div className="text-white text-xl">Repository not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0b1e] text-white">
      {/* Header */}
      <header className="border-b border-white/5 backdrop-blur-xl bg-gray-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-2xl">🍪</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{repoData.repository.fullName}</h1>
                <p className="text-xs text-gray-400">Workflow</p>
              </div>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/select-repository" className="text-gray-300 hover:text-white transition-colors">
                Repositories
              </Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img 
                  src={session?.user?.image || ''} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full border-2 border-green-400/50"
                />
                <span className="text-sm text-gray-400">{session?.user?.name}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="border border-red-400/50 text-red-400 px-4 py-2 rounded-lg hover:bg-red-400/10 transition-all text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 h-[calc(100vh-120px)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Left: Issues List */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Issues ({repoData.issues.length})</h2>
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-400">Unassigned</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-400">Active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-400">Moderate</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-gray-400">Slow</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-400">Stale</span>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-6 py-2">
              {repoData.issues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => handleIssueClick(issue)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-white/10 hover:-translate-y-1 mx-1 ${
                    getIssueStatusColor(issue)
                  } ${selectedIssue?.id === issue.id ? 'border-white shadow-lg shadow-white/20 scale-[1.01]' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-gray-400 text-sm">#{issue.number}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-700/50">
                          {getIssueStatusLabel(issue)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-white mb-2">{issue.title}</h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center space-x-2">
                      <img src={issue.user.avatarUrl} alt={issue.user.login} className="w-5 h-5 rounded-full" />
                      <span>@{issue.user.login}</span>
                    </div>
                    <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>

                  {issue.assignees.length > 0 && (
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-xs text-gray-400">Assigned to:</span>
                      {issue.assignees.map((assignee) => (
                        <div key={assignee.login} className="flex items-center space-x-1">
                          <img src={assignee.avatar_url} alt={assignee.login} className="w-5 h-5 rounded-full" />
                          <span className="text-xs text-white">@{assignee.login}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Issue Details & Candidates */}
          <div className="flex flex-col h-full">
            {!selectedIssue ? (
              <div className="flex-1 flex items-center justify-center bg-gray-800/30 rounded-lg border border-white/10 p-8">
                <div className="text-center">
                  <div className="text-6xl mb-4">👈</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Select an Issue</h3>
                  <p className="text-gray-400">Click on any issue to see potential candidates and completion predictions</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-4 overflow-y-auto">
                {/* Issue Details */}
                <div className="bg-gray-800/30 rounded-lg border border-white/10 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">#{selectedIssue.number} {selectedIssue.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>Opened by @{selectedIssue.user.login}</span>
                        <span>•</span>
                        <span>{new Date(selectedIssue.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <a 
                      href={selectedIssue.htmlUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 text-sm"
                    >
                      View on GitHub →
                    </a>
                  </div>
                  {selectedIssue.body && (
                    <p className="text-gray-300 text-sm line-clamp-3">{selectedIssue.body}</p>
                  )}
                </div>

                {loadingDetails ? (
                  <div className="bg-gray-800/30 rounded-lg border border-white/10 p-8 text-center">
                    <div className="text-gray-400">Loading candidates...</div>
                  </div>
                ) : assignedContributor ? (
                  /* Assigned Contributor - Show Completion Prediction */
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border-2 border-green-500/30 p-6">
                    <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <span className="mr-2">👤</span>
                      Assigned Contributor
                    </h4>
                    
                    <div className="flex items-center space-x-4 mb-6">
                      <img 
                        src={assignedContributor.avatarUrl} 
                        alt={assignedContributor.username}
                        className="w-16 h-16 rounded-full border-2 border-green-400"
                      />
                      <div>
                        <h5 className="text-lg font-semibold text-white">@{assignedContributor.username}</h5>
                        <p className="text-sm text-gray-400">Last active: {new Date(assignedContributor.lastActivityDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Completion Probability */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">Completion Probability</span>
                          <span className="text-2xl font-bold text-white">{assignedContributor.completionProbability}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all ${
                              assignedContributor.completionProbability > 70 ? 'bg-green-500' :
                              assignedContributor.completionProbability > 40 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${assignedContributor.completionProbability}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Activity Level */}
                      <div className={`p-4 rounded-lg border-2 ${getActivityColor(assignedContributor.activityLevel)}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Activity Level</span>
                          <span className="uppercase text-xs font-bold">{assignedContributor.activityLevel}</span>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-700/30 rounded-lg p-4">
                          <div className="text-2xl font-bold text-white">{assignedContributor.estimatedDays}</div>
                          <div className="text-xs text-gray-400">Est. Days to Complete</div>
                        </div>
                        <div className="bg-gray-700/30 rounded-lg p-4">
                          <div className="text-2xl font-bold text-white">{assignedContributor.currentPRs}</div>
                          <div className="text-xs text-gray-400">Current Open PRs</div>
                        </div>
                        <div className="bg-gray-700/30 rounded-lg p-4">
                          <div className="text-2xl font-bold text-white">{assignedContributor.successRate}%</div>
                          <div className="text-xs text-gray-400">Historical Success Rate</div>
                        </div>
                        <div className="bg-gray-700/30 rounded-lg p-4">
                          <div className="text-2xl font-bold text-white">
                            {Math.floor((Date.now() - new Date(assignedContributor.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))}d
                          </div>
                          <div className="text-xs text-gray-400">Days Since Last Activity</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
                        <button
                          onClick={() => setEmailModalOpen(true)}
                          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
                        >
                          <span>📧</span>
                          <span>Send Email to @{assignedContributor.username}</span>
                        </button>
                        
                        <button
                          onClick={() => handleAssignUser(assignedContributor.username, 'unassign')}
                          disabled={assigningUser === assignedContributor.username}
                          className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span>❌</span>
                          <span>{assigningUser === assignedContributor.username ? 'Unassigning...' : `Unassign @${assignedContributor.username}`}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : candidates.length > 0 ? (
                  /* Unassigned - Show Candidates */
                  <div className="bg-gray-800/30 rounded-lg border border-white/10 p-6">
                    <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <span className="mr-2">🎯</span>
                      Potential Candidates ({candidates.length})
                    </h4>
                    
                    <div className="space-y-3">
                      {candidates.map((candidate, index) => (
                        <div 
                          key={candidate.username}
                          className="bg-gray-700/30 rounded-lg border border-white/10 p-4 hover:bg-gray-700/50 transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <img 
                                  src={candidate.avatarUrl} 
                                  alt={candidate.username}
                                  className="w-12 h-12 rounded-full border-2 border-green-400/50"
                                />
                                <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                  #{index + 1}
                                </div>
                              </div>
                              <div>
                                <h5 className="font-semibold text-white">@{candidate.username}</h5>
                                <p className="text-xs text-gray-400">{candidate.daysSinceClaim} days ago</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-400">{candidate.predictiveScore}</div>
                              <div className="text-xs text-gray-400">Score</div>
                            </div>
                          </div>

                          <div className="mb-3 p-3 bg-gray-800/50 rounded-lg">
                            <p className="text-sm text-gray-300 italic">&quot;{candidate.claimText}&quot;</p>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-gray-800/50 rounded p-2 text-center">
                              <div className="font-bold text-white">{candidate.reliabilityScore}%</div>
                              <div className="text-gray-400">Reliability</div>
                            </div>
                            <div className="bg-gray-800/50 rounded p-2 text-center">
                              <div className="font-bold text-white">{candidate.successfulPRs}</div>
                              <div className="text-gray-400">Successful PRs</div>
                            </div>
                            <div className="bg-gray-800/50 rounded p-2 text-center">
                              <div className="font-bold text-white">{candidate.avgCompletionTime}d</div>
                              <div className="text-gray-400">Avg. Time</div>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-400">Completion Probability</span>
                              <span className="font-bold text-white">{candidate.predictiveScore}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  candidate.predictiveScore > 70 ? 'bg-green-500' :
                                  candidate.predictiveScore > 40 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${candidate.predictiveScore}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Assign Button */}
                          <button
                            onClick={() => handleAssignUser(candidate.username, 'assign')}
                            disabled={assigningUser === candidate.username}
                            className="w-full mt-3 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span>✅</span>
                            <span>{assigningUser === candidate.username ? 'Assigning...' : `Assign @${candidate.username}`}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800/30 rounded-lg border border-white/10 p-8 text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <h4 className="text-lg font-semibold text-white mb-2">No Candidates Found</h4>
                    <p className="text-sm text-gray-400">No one has commented on this issue yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Email Modal */}
      {emailModalOpen && assignedContributor && selectedIssue && (
        <EmailModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          contributor={{
            username: assignedContributor.username,
            avatarUrl: assignedContributor.avatarUrl
          }}
          issue={{
            number: selectedIssue.number,
            title: selectedIssue.title,
            htmlUrl: selectedIssue.htmlUrl
          }}
          repositoryName={repoData?.repository?.fullName || `${owner}/${repo}`}
        />
      )}
    </div>
  )
}