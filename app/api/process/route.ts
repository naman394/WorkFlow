import { NextRequest, NextResponse } from 'next/server'
import { CookieLickingDetector } from '../../../lib/orchestrator'

export async function POST(request: NextRequest) {
  try {
    const { owner, repo, config } = await request.json()
    
    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Owner and repository are required' },
        { status: 400 }
      )
    }
    
    // Initialize detector (in production, use proper singleton pattern)
    const githubToken = process.env.GITHUB_TOKEN || ''
    
    // Mock prediction model
    const mockModel = {
      modelVersion: '1.0.0',
      trainingDate: new Date(),
      accuracy: 0.85,
      features: ['contributor_reliability', 'issue_complexity', 'time_since_claim'],
      weights: {
        contributor_reliability: 0.4,
        issue_complexity: 0.3,
        time_since_claim: 0.3,
      },
      thresholds: {
        highRisk: 0.7,
        mediumRisk: 0.5,
        lowRisk: 0.3,
      },
    }
    
    const detector = new CookieLickingDetector(githubToken, mockModel)
    
    // Process the repository
    const analytics = await detector.processRepository(owner, repo, config)
    
    return NextResponse.json({
      success: true,
      analytics,
      message: `Successfully processed ${owner}/${repo}`
    })
    
  } catch (error) {
    console.error('Repository processing error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process repository',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Workflow API',
    version: '1.0.0',
    endpoints: {
      'POST /api/process': 'Process a repository for cookie-licking detection',
      'POST /api/webhook': 'GitHub webhook endpoint',
      'GET /api/dashboard': 'Dashboard data endpoint'
    }
  })
}
