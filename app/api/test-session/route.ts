// Test session endpoint
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    console.log('🔍 Testing session...')
    
    const session = await getServerSession(authOptions)
    console.log('📊 Session data:', session)
    
    if (!session) {
      return NextResponse.json({ 
        error: 'No session found',
        session: null,
        authOptions: 'available'
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      session: {
        user: session.user,
        expires: session.expires
      },
      message: 'Session found'
    })

  } catch (error) {
    console.error('Session test error:', error)
    return NextResponse.json(
      { 
        error: 'Session test failed', 
        details: (error as Error).message 
      },
      { status: 500 }
    )
  }
}
