'use client'

import { useEffect, useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

export default function SelectRepository() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRepos, setSelectedRepos] = useState<number[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'stars' | 'updated'>('updated')
  const [monitoredRepos, setMonitoredRepos] = useState<Repository[]>([])
  const [monitoring, setMonitoring] = useState<{ [key: number]: boolean }>({})

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    } else if (status === 'authenticated') {
      fetchRepositories()
      loadMonitoredRepositories()
    }
  }, [status])

  const loadMonitoredRepositories = () => {
    try {
      const stored = localStorage.getItem('monitoredRepositories')
      if (stored) {
        const repos = JSON.parse(stored)
        setMonitoredRepos(repos)
        
        // Create monitoring state map
        const monitoringState: { [key: number]: boolean } = {}
        repos.forEach((repo: Repository) => {
          monitoringState[repo.id] = true
        })
        setMonitoring(monitoringState)
      }
    } catch (error) {
      console.error('Error loading monitored repositories:', error)
    }
  }

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

  const fetchRepositories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/repositories')
      const data = await response.json()
      
      if (response.ok) {
        setRepositories(data.repositories)
      } else {
        console.error('Failed to fetch repositories')
      }
    } catch (error) {
      console.error('Error fetching repositories:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleRepoSelection = (repoId: number) => {
    setSelectedRepos(prev =>
      prev.includes(repoId)
        ? prev.filter(id => id !== repoId)
        : [...prev, repoId]
    )
  }

  const handleMonitorRepository = async (repoId: number) => {
    const selectedRepo = repositories.find(repo => repo.id === repoId)
    if (!selectedRepo) return
    
    const isCurrentlyMonitored = monitoring[repoId]
    
    if (isCurrentlyMonitored) {
      // Remove from monitoring
      const updatedMonitored = monitoredRepos.filter(repo => repo.id !== repoId)
      setMonitoredRepos(updatedMonitored)
      setMonitoring(prev => ({ ...prev, [repoId]: false }))
      localStorage.setItem('monitoredRepositories', JSON.stringify(updatedMonitored))
    } else {
      // Add to monitoring
      const updatedMonitored = [...monitoredRepos, selectedRepo]
      setMonitoredRepos(updatedMonitored)
      setMonitoring(prev => ({ ...prev, [repoId]: true }))
      localStorage.setItem('monitoredRepositories', JSON.stringify(updatedMonitored))
    }
  }

  const filteredAndSortedRepos = repositories
    .filter(repo =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'stars':
          return b.stars - a.stars
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })

  const handleSortChange = (newSortBy: 'name' | 'stars' | 'updated') => {
    setSortBy(newSortBy)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0a0b1e] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-white">Loading your repositories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0b1e] text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl animate-pulse"
          style={{
            top: '10%',
            left: '20%',
            animation: 'float 20s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-3xl animate-pulse"
          style={{
            top: '50%',
            right: '10%',
            animation: 'float 25s ease-in-out infinite reverse'
          }}
        />
        
        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, #4ade80 1px, transparent 1px),
              linear-gradient(to bottom, #4ade80 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }} />
        </div>
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/5 backdrop-blur-xl bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-2xl">🍪</span>
              </div>
              <div>
                <span className="text-xl font-bold text-white">Cookie-Licking Detector</span>
                <p className="text-xs text-gray-400">Repository Selection</p>
              </div>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/select-repository" className="text-green-400 hover:text-green-300 transition-colors font-medium">
                Repositories
              </Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gray-800/50 rounded-xl px-4 py-2 border border-white/10">
                <img 
                  src={session?.user?.image || ''} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full border-2 border-green-400/50"
                />
                <div>
                  <p className="text-sm font-medium text-white">{session?.user?.name}</p>
                  <p className="text-xs text-gray-400">GitHub User</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="border border-red-400/50 text-red-400 px-4 py-2 rounded-xl hover:bg-red-400/10 transition-all text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
            Choose Your Repositories
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Select the repositories you want to monitor for cookie-licking issues and boost contributor engagement
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stats Cards */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📦</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{repositories.length}</p>
                    <p className="text-sm text-gray-400">Total Repositories</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{monitoredRepos.length}</p>
                    <p className="text-sm text-gray-400">Monitored</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{repositories.filter(r => r.private).length}</p>
                    <p className="text-sm text-gray-400">Private Repos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Sort By</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => handleSortChange('name')}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    sortBy === 'name' 
                      ? 'bg-green-500/20 border border-green-500/30' 
                      : 'bg-gray-700/50 hover:bg-gray-700/70'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">🔤</span>
                    <span className="text-sm text-gray-300">Alphabetical</span>
                  </div>
                </button>
                <button 
                  onClick={() => handleSortChange('stars')}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    sortBy === 'stars' 
                      ? 'bg-green-500/20 border border-green-500/30' 
                      : 'bg-gray-700/50 hover:bg-gray-700/70'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">⭐</span>
                    <span className="text-sm text-gray-300">Most Starred</span>
                  </div>
                </button>
                <button 
                  onClick={() => handleSortChange('updated')}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    sortBy === 'updated' 
                      ? 'bg-green-500/20 border border-green-500/30' 
                      : 'bg-gray-700/50 hover:bg-gray-700/70'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">🆕</span>
                    <span className="text-sm text-gray-300">Recently Updated</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Info Card */}
            {monitoredRepos.length > 0 ? (
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6 backdrop-blur-xl">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2">
                    {monitoredRepos.length} Repository{monitoredRepos.length > 1 ? 'ies' : ''} Being Monitored
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    View your dashboard to see real-time analytics and insights
                  </p>
                  <Link 
                    href="/dashboard"
                    className="inline-block bg-gradient-to-r from-green-400 to-emerald-500 text-gray-900 px-4 py-2 rounded-lg font-medium text-sm hover:shadow-lg hover:shadow-green-500/50 transition-all"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 backdrop-blur-xl">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">ℹ️</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2">
                    Click "Start Monitoring" to track repositories
                  </h3>
                  <p className="text-xs text-gray-400">
                    Monitor repositories for cookie-licking issues and contributor engagement
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Search & Repository List */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search repositories by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800/50 border border-white/10 rounded-xl pl-12 pr-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all backdrop-blur-xl"
                />
              </div>
            </div>

            {/* Repository List */}
            <div className="space-y-4">
          {filteredAndSortedRepos.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-2xl border border-white/5 backdrop-blur-xl">
              <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No repositories found</h3>
              <p className="text-gray-400">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredAndSortedRepos.map((repo, index) => (
                <div
                  key={repo.id}
                  className="group bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-green-400 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-green-500/20"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <img 
                          src={repo.owner.avatarUrl} 
                          alt={repo.owner.login}
                          className="w-12 h-12 rounded-xl border-2 border-white/10"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">
                              {repo.fullName}
                            </h3>
                            {repo.private && (
                              <span className="inline-flex items-center px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-lg border border-yellow-500/30">
                                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
                                Private
                              </span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-gray-400 text-sm leading-relaxed">{repo.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6 text-sm">
                          {repo.language && (
                            <div className="flex items-center space-x-2 bg-gray-700/50 rounded-lg px-3 py-1">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <span className="text-gray-300 font-medium">{repo.language}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2 text-gray-400">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>{repo.stars}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-400">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>{repo.forks}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>{repo.openIssues} issues</span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          Updated {new Date(repo.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex flex-col items-end space-y-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMonitorRepository(repo.id)
                        }}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                          monitoring[repo.id]
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                            : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                        }`}
                      >
                        {monitoring[repo.id] ? 'Stop Monitoring' : 'Start Monitoring'}
                      </button>
                      {monitoring[repo.id] && (
                        <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                          Monitored
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6 mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-lg">🍪</span>
            </div>
            <span className="text-lg font-semibold text-white">Cookie-Licking Detector</span>
          </div>
          <p className="text-gray-400 text-sm">
            Transform your open source project with AI-powered issue management
          </p>
        </div>
      </footer>
    </div>
  )
}

