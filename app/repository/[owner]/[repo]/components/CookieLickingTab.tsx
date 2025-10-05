interface CookieLickingData {
  totalClaims: number
  activeClaims: number
  staleClaims: number
  autoReleasedClaims: number
  detectionAccuracy: number
  contributorStats: Array<{
    username: string
    avatarUrl: string
    totalClaims: number
    completedClaims: number
    abandonedClaims: number
    reliabilityScore: number
    currentActiveClaims: number
  }>
  recentClaims: Array<{
    id: string
    issueNumber: number
    contributor: {
      username: string
      avatarUrl: string
    }
    claimedAt: string
    status: 'active' | 'completed' | 'abandoned' | 'auto-released'
    progressScore: number
    riskScore: number
    claimText: string
  }>
}

interface CookieLickingTabProps {
  cookieLicking: CookieLickingData
}

export function CookieLickingTab({ cookieLicking }: CookieLickingTabProps) {
  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 70) return 'text-red-400'
    if (riskScore >= 50) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400'
      case 'completed': return 'bg-blue-500/20 text-blue-400'
      case 'abandoned': return 'bg-red-500/20 text-red-400'
      case 'auto-released': return 'bg-orange-500/20 text-orange-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center">
              <span className="mr-3">🍪</span>
              Real Issue Claims Analysis
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Analysis of actual issue comments to identify who claimed to work on issues and track their progress.
            </p>
          </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-lg border border-white/10 p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">{cookieLicking.totalClaims}</div>
            <div className="text-sm text-gray-400">Total Claims Found</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-lg border border-white/10 p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">{cookieLicking.activeClaims}</div>
            <div className="text-sm text-gray-400">Active Claims</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-lg border border-white/10 p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-400 mb-2">{cookieLicking.staleClaims}</div>
            <div className="text-sm text-gray-400">Stale Claims</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-lg border border-white/10 p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {Math.round(cookieLicking.detectionAccuracy * 100)}%
            </div>
            <div className="text-sm text-gray-400">Detection Accuracy</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contributor Stats */}
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-lg border border-white/10 p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <span className="mr-2">👥</span>
            Contributor Reliability Scores
          </h3>

          {cookieLicking.contributorStats.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-gray-400">No contributor claims found</p>
              <p className="text-sm text-gray-500 mt-2">
                No contributors have made claims in issue comments yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cookieLicking.contributorStats.map((contributor, index) => {
                const completionRate = contributor.totalClaims > 0 
                  ? (contributor.completedClaims / contributor.totalClaims) * 100 
                  : 0

                return (
                  <div key={index} className="bg-gray-700/50 rounded-lg p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={contributor.avatarUrl} 
                          alt={contributor.username}
                          className="w-10 h-10 rounded-full border-2 border-green-400/50"
                        />
                        <div>
                          <h4 className="font-semibold text-white">@{contributor.username}</h4>
                          <p className="text-sm text-gray-400">
                            {contributor.totalClaims} total claims
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getRiskColor(100 - contributor.reliabilityScore)}`}>
                          {contributor.reliabilityScore}%
                        </div>
                        <div className="text-xs text-gray-400">Reliability</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-green-400 font-semibold">{contributor.completedClaims}</div>
                        <div className="text-xs text-gray-400">Completed</div>
                      </div>
                      <div>
                        <div className="text-red-400 font-semibold">{contributor.abandonedClaims}</div>
                        <div className="text-xs text-gray-400">Abandoned</div>
                      </div>
                      <div>
                        <div className="text-yellow-400 font-semibold">{contributor.currentActiveClaims}</div>
                        <div className="text-xs text-gray-400">Active</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Completion Rate</span>
                        <span>{Math.round(completionRate)}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-green-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Claims */}
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-lg border border-white/10 p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <span className="mr-2">🕐</span>
            Actual Issue Claims Found
          </h3>

          {cookieLicking.recentClaims.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-gray-400 mb-2">No claims found in issue comments</p>
              <p className="text-sm text-gray-500">
                This means no one has commented with phrases like &quot;I&apos;ll work on this&quot; or &quot;assign this to me&quot; on your repository&apos;s issues.
              </p>
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-300">
                  <strong>Note:</strong> Check the browser console (F12) to see detailed debug information about what issues were analyzed.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {cookieLicking.recentClaims.map((claim) => (
                <div key={claim.id} className="bg-gray-700/50 rounded-lg p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={claim.contributor.avatarUrl} 
                        alt={claim.contributor.username}
                        className="w-8 h-8 rounded-full border-2 border-green-400/50"
                      />
                      <div>
                        <h4 className="font-semibold text-white">
                          Issue #{claim.issueNumber}
                        </h4>
                        <p className="text-sm text-gray-400">
                          @{claim.contributor.username}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                      {claim.status.replace('-', ' ')}
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                    &quot;{claim.claimText}&quot;
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div>
                        <span className="text-gray-400">Progress:</span>
                        <span className="ml-1 text-white font-medium">{claim.progressScore}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Risk:</span>
                        <span className={`ml-1 font-medium ${getRiskColor(claim.riskScore)}`}>
                          {claim.riskScore}%
                        </span>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      {new Date(claim.claimedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Auto-Release Stats */}
      {cookieLicking.autoReleasedClaims > 0 && (
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl rounded-lg border border-white/10 p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">🔄</span>
            Auto-Release Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{cookieLicking.autoReleasedClaims}</div>
              <div className="text-sm text-gray-400">Issues Auto-Released</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {Math.round((cookieLicking.activeClaims / cookieLicking.totalClaims) * 100)}%
              </div>
              <div className="text-sm text-gray-400">Active Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {Math.round(cookieLicking.detectionAccuracy * 100)}%
              </div>
              <div className="text-sm text-gray-400">Detection Accuracy</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
