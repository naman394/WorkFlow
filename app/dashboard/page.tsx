'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Repository {
  id: number
  name: string
  fullName: string
  description: string
  private: boolean
  htmlUrl: string
  language: string
  stars: number
  forks: number
  openIssues: number
  updatedAt: string
  owner: {
    login: string
    avatarUrl: string
  }
}

interface RepositoryDetailData {
  repository: Repository
  contributors: Array<{
    id: number
    login: string
    avatarUrl: string
    contributions: number
    type: string
    htmlUrl: string
  }>
  issues: Array<{
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
    assignees: any[]
    labels: any[]
    htmlUrl: string
  }>
  pullRequests: Array<{
    id: number
    number: number
    title: string
    body: string
    state: string
    createdAt: string
    updatedAt: string
    closedAt: string | null
    mergedAt: string | null
    user: {
      login: string
      avatarUrl: string
    }
    assignees: any[]
    labels: any[]
    htmlUrl: string
    head: any
    base: any
  }>
  commits: Array<{
    sha: string
    message: string
    author: {
      name: string
      email: string
      date: string
    }
    committer: {
      name: string
      email: string
      date: string
    }
    htmlUrl: string
  }>
  analytics: {
    totalContributors: number
    totalIssues: number
    openIssues: number
    closedIssues: number
    totalPullRequests: number
    openPullRequests: number
    closedPullRequests: number
    mergedPullRequests: number
    recentCommits: number
    lastCommitDate: string | null
  }
}

interface DashboardData {
  monitoredRepositories: Repository[]
  repositoryDetails: RepositoryDetailData[]
  totalStats: {
    totalRepositories: number
    totalIssues: number
    totalContributors: number
    totalPullRequests: number
    totalCommits: number
  }
  topContributors: Array<{
    login: string
    avatarUrl: string
    contributions: number
    repositories: string[]
  }>
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    } else if (status === 'authenticated') {
      fetchDashboardData()
    }
  }, [status, selectedTimeRange])

  const handleLogout = async () => {
    // Clear any localStorage data
    localStorage.clear()
    // Clear any sessionStorage data
    sessionStorage.clear()
    // Sign out and redirect
    await signOut({ 
      callbackUrl: '/',
      redirect: true 
    })
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load monitored repositories from localStorage
      const stored = localStorage.getItem('monitoredRepositories')
      if (!stored) {
        setData({
          monitoredRepositories: [],
          repositoryDetails: [],
          totalStats: {
            totalRepositories: 0,
            totalIssues: 0,
            totalContributors: 0,
            totalPullRequests: 0,
            totalCommits: 0
          },
          topContributors: []
        })
        setLoading(false)
        return
      }
      
      const monitoredRepositories: Repository[] = JSON.parse(stored)
      
      // Fetch detailed data for each monitored repository
      const repositoryDetails: RepositoryDetailData[] = []
      const contributorMap = new Map<string, { contributions: number; repositories: string[] }>()
      
      for (const repo of monitoredRepositories) {
        try {
          const response = await fetch(`/api/repository/${repo.owner.login}/${repo.name}`)
          if (response.ok) {
            const detailData = await response.json()
            repositoryDetails.push(detailData)
            
            // Aggregate contributor data
            detailData.contributors.forEach((contributor: any) => {
              const existing = contributorMap.get(contributor.login)
              if (existing) {
                existing.contributions += contributor.contributions
                existing.repositories.push(repo.fullName)
              } else {
                contributorMap.set(contributor.login, {
                  contributions: contributor.contributions,
                  repositories: [repo.fullName]
                })
              }
            })
          }
        } catch (error) {
          console.error(`Error fetching data for ${repo.fullName}:`, error)
        }
      }
      
      // Calculate total stats
      const totalStats = {
        totalRepositories: monitoredRepositories.length,
        totalIssues: repositoryDetails.reduce((sum, repo) => sum + repo.analytics.totalIssues, 0),
        totalContributors: contributorMap.size,
        totalPullRequests: repositoryDetails.reduce((sum, repo) => sum + repo.analytics.totalPullRequests, 0),
        totalCommits: repositoryDetails.reduce((sum, repo) => sum + repo.analytics.recentCommits, 0)
      }
      
      // Create top contributors list
      const topContributors = Array.from(contributorMap.entries())
        .map(([login, data]) => ({
          login,
          avatarUrl: repositoryDetails
            .flatMap(repo => repo.contributors)
            .find(contrib => contrib.login === login)?.avatarUrl || '',
          contributions: data.contributions,
          repositories: data.repositories
        }))
        .sort((a, b) => b.contributions - a.contributions)
        .slice(0, 10)
      
      setData({
        monitoredRepositories,
        repositoryDetails,
        totalStats,
        topContributors
      })
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0a0b1e] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-white">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0a0b1e] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Dashboard Unavailable</h2>
          <p className="text-gray-400 mb-4">Unable to load dashboard data.</p>
          <button 
            onClick={fetchDashboardData}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0b1e] text-white">
      {/* Header */}
      <header className="border-b border-white/5 backdrop-blur-xl bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🍪</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Cookie-Licking Detector</h1>
                  <p className="text-sm text-gray-400">Dashboard</p>
                </div>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/select-repository" className="text-gray-300 hover:text-white transition-colors">
                Repositories
              </Link>
              <Link href="/dashboard" className="text-green-400 hover:text-green-300 transition-colors font-medium">
                Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="bg-gray-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400"
              >
                <option value="1d">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <div className="flex items-center space-x-3">
                <span className="text-gray-400 text-sm">Hi, {session?.user?.name}</span>
                <img 
                  src={session?.user?.image || ''} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full border-2 border-green-400/50"
                />
                <button 
                  onClick={handleLogout}
                  className="border border-red-400/50 text-red-400 px-4 py-2 rounded-lg hover:bg-red-400/10 transition-all text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-lg border border-white/10 p-6">
            <div className="flex items-center">
              <div className="text-2xl">📦</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Monitored Repos</p>
                <p className="text-2xl font-bold text-white">{data.totalStats.totalRepositories}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-lg border border-white/10 p-6">
            <div className="flex items-center">
              <div className="text-2xl">🐛</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Issues</p>
                <p className="text-2xl font-bold text-white">{data.totalStats.totalIssues}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-lg border border-white/10 p-6">
            <div className="flex items-center">
              <div className="text-2xl">👥</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Contributors</p>
                <p className="text-2xl font-bold text-white">{data.totalStats.totalContributors}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-lg border border-white/10 p-6">
            <div className="flex items-center">
              <div className="text-2xl">🔀</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Pull Requests</p>
                <p className="text-2xl font-bold text-white">{data.totalStats.totalPullRequests}</p>
              </div>
            </div>
          </div>
        </div>


        {/* Repository Overview */}
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-lg border border-white/10 p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Repository Overview</h3>
          {data.monitoredRepositories.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-gray-400 mb-4">No repositories being monitored</p>
              <Link 
                href="/select-repository"
                className="inline-block bg-gradient-to-r from-green-400 to-emerald-500 text-gray-900 px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-green-500/50 transition-all"
              >
                Add Repositories to Monitor
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.monitoredRepositories.map((repo) => (
                <Link 
                  key={repo.id} 
                  href={`/repository/${repo.owner.login}/${repo.name}`}
                  className="block bg-gray-700/30 rounded-lg p-4 border border-white/10 hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <img 
                      src={repo.owner.avatarUrl} 
                      alt={repo.owner.login}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{repo.fullName}</h4>
                      <p className="text-xs text-gray-400">{repo.language}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>⭐ {repo.stars}</span>
                    <span>🍴 {repo.forks}</span>
                    <span>🐛 {repo.openIssues}</span>
                  </div>
                  <div className="mt-2 text-xs text-green-400">
                    Click to view details →
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Contributors */}
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-lg border border-white/10">
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Top Contributors</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data.topContributors.slice(0, 5).map((contributor, index) => (
                  <div key={contributor.login} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-sm font-medium text-white">
                        {index + 1}
                      </div>
                      <div className="ml-3">
                        <div className="flex items-center space-x-2">
                          <img 
                            src={contributor.avatarUrl} 
                            alt={contributor.login}
                            className="w-6 h-6 rounded-full"
                          />
                          <p className="text-sm font-medium text-white">@{contributor.login}</p>
                        </div>
                        <p className="text-xs text-gray-400">{contributor.repositories.length} repo{contributor.repositories.length > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {contributor.contributions}
                      </div>
                      <div className="text-xs text-gray-400">contributions</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Interventions */}
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-lg border border-white/10">
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data.repositoryDetails.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📊</div>
                    <p className="text-gray-400">No recent activity</p>
                  </div>
                ) : (
                  data.repositoryDetails.slice(0, 5).map((repoDetail, index) => (
                    <div key={repoDetail.repository.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full mr-3 bg-green-400"></div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {repoDetail.repository.fullName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {repoDetail.analytics.recentCommits} commits • {repoDetail.analytics.openIssues} open issues
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">
                          {repoDetail.analytics.lastCommitDate ? new Date(repoDetail.analytics.lastCommitDate).toLocaleDateString() : 'No commits'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Link 
            href="/select-repository"
            className="bg-gradient-to-r from-green-400 to-emerald-500 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all"
          >
            Manage Repositories
          </Link>
          <button className="border border-white/20 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/5 transition-colors backdrop-blur-xl">
            Export Data
          </button>
          <button className="border border-white/20 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/5 transition-colors backdrop-blur-xl">
            Configure Settings
          </button>
        </div>
      </main>
    </div>
  )
}
