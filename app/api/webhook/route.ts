import { NextRequest, NextResponse } from 'next/server'
import { CookieLickingDetector } from '../../../lib/orchestrator'

// Initialize the detector (in production, this would be a singleton)
let detector: CookieLickingDetector | null = null

function getDetector(): CookieLickingDetector {
  if (!detector) {
    // In production, get this from environment variables
    const githubToken = process.env.GITHUB_TOKEN || ''
    
    // Mock prediction model - in production, load your trained model
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
    
    detector = new CookieLickingDetector(githubToken, mockModel)
  }
  
  return detector
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verify webhook signature (in production)
    const signature = request.headers.get('x-hub-signature-256')
    if (!verifyWebhookSignature(signature, body)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }
    
    // Get the detector and process the webhook
    const detector = getDetector()
    await detector.handleWebhook(body)
    
    console.log(`✅ Processed webhook: ${body.action} for ${body.repository?.full_name}`)
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

function verifyWebhookSignature(signature: string | null, body: any): boolean {
  // In production, implement proper webhook signature verification
  // For now, return true for development
  return true
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
}
