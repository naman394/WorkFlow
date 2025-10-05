// API endpoint for manual monitoring trigger
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CookieLickingDetector } from '@/lib/orchestrator'

// Global detector instance (in production, you'd want to manage this better)
let detector: CookieLickingDetector | null = null

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // @ts-ignore
    const accessToken = session.accessToken

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 })
    }

    const { action, benchmark } = await request.json()

    // Initialize detector if not already done
    if (!detector) {
      detector = new CookieLickingDetector(accessToken, null, benchmark)
    }

    switch (action) {
      case 'monitor':
        console.log('🔍 Manual monitoring triggered')
        await detector.monitorAssignedContributors()
        
        return NextResponse.json({
          success: true,
          message: 'Monitoring completed successfully',
          timestamp: new Date().toISOString()
        })

      case 'set_benchmark':
        if (benchmark === undefined || benchmark < 0 || benchmark > 100) {
          return NextResponse.json({ 
            error: 'Benchmark must be between 0 and 100' 
          }, { status: 400 })
        }

        detector.setProbabilityBenchmark(benchmark)
        
        return NextResponse.json({
          success: true,
          message: `Benchmark set to ${benchmark}%`,
          benchmark: detector.getProbabilityBenchmark()
        })

      case 'get_benchmark':
        return NextResponse.json({
          success: true,
          benchmark: detector.getProbabilityBenchmark()
        })

      case 'get_logs':
        const logs = detector.getNotificationLogs()
        return NextResponse.json({
          success: true,
          logs,
          count: logs.length
        })

      case 'clear_logs':
        detector.clearNotificationLogs()
        return NextResponse.json({
          success: true,
          message: 'Notification logs cleared'
        })

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Use: monitor, set_benchmark, get_benchmark, get_logs, clear_logs' 
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Monitor API error:', error)
    return NextResponse.json(
      { error: 'Failed to process monitoring request', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!detector) {
      return NextResponse.json({
        success: true,
        message: 'Detector not initialized',
        benchmark: 40,
        logs: []
      })
    }

    return NextResponse.json({
      success: true,
      benchmark: detector.getProbabilityBenchmark(),
      logs: detector.getNotificationLogs(),
      status: 'active'
    })

  } catch (error) {
    console.error('Monitor API GET error:', error)
    return NextResponse.json(
      { error: 'Failed to get monitoring status', details: (error as Error).message },
      { status: 500 }
    )
  }
}
