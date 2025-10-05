import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'
    
    // Mock data - in production, this would fetch from your database
    const mockData = {
      totalIssues: 156,
      activeClaims: 23,
      resolvedClaims: 89,
      autoReleased: 12,
      successRate: 0.87,
      topContributors: [
        {
          username: 'alice-dev',
          reliabilityScore: 95,
          completedIssues: 12
        },
        {
          username: 'bob-contributor',
          reliabilityScore: 88,
          completedIssues: 8
        },
        {
          username: 'charlie-coder',
          reliabilityScore: 82,
          completedIssues: 6
        },
        {
          username: 'diana-maintainer',
          reliabilityScore: 91,
          completedIssues: 15
        },
        {
          username: 'eve-helper',
          reliabilityScore: 76,
          completedIssues: 4
        }
      ],
      recentInterventions: [
        {
          id: 'int-001',
          type: 'nudge',
          issueNumber: 234,
          contributor: 'john-doe',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          success: true
        },
        {
          id: 'int-002',
          type: 'auto_release',
          issueNumber: 198,
          contributor: 'jane-smith',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
          success: true
        },
        {
          id: 'int-003',
          type: 'nudge',
          issueNumber: 187,
          contributor: 'mike-wilson',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          success: false
        },
        {
          id: 'int-004',
          type: 'auto_release',
          issueNumber: 156,
          contributor: 'sarah-jones',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          success: true
        },
        {
          id: 'int-005',
          type: 'nudge',
          issueNumber: 143,
          contributor: 'tom-brown',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          success: true
        }
      ]
    }

    // Adjust data based on time range
    const timeRangeMultiplier = {
      '1d': 0.1,
      '7d': 1,
      '30d': 4,
      '90d': 12
    }[range] || 1

    const adjustedData = {
      ...mockData,
      totalIssues: Math.round(mockData.totalIssues * timeRangeMultiplier),
      activeClaims: Math.round(mockData.activeClaims * timeRangeMultiplier),
      resolvedClaims: Math.round(mockData.resolvedClaims * timeRangeMultiplier),
      autoReleased: Math.round(mockData.autoReleased * timeRangeMultiplier),
    }

    return NextResponse.json(adjustedData)
    
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
