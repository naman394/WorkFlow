// API endpoint for assigning/unassigning users to issues
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    const { 
      owner,
      repo,
      issueNumber,
      username,
      action // 'assign' or 'unassign'
    } = await request.json()

    // Validate required fields
    if (!owner || !repo || !issueNumber || !username || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: owner, repo, issueNumber, username, action' 
      }, { status: 400 })
    }

    if (action !== 'assign' && action !== 'unassign') {
      return NextResponse.json({ error: 'Action must be either "assign" or "unassign"' }, { status: 400 })
    }

    console.log(`${action === 'assign' ? '➕' : '➖'} ${action === 'assign' ? 'Assigning' : 'Unassigning'} @${username} ${action === 'assign' ? 'to' : 'from'} ${owner}/${repo}#${issueNumber}`)

    // GitHub API endpoint for assigning/unassigning
    const endpoint = action === 'assign' 
      ? `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/assignees`
      : `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/assignees`

    const response = await fetch(endpoint, {
      method: action === 'assign' ? 'POST' : 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Cookie-Licking-Detector/1.0',
      },
      body: JSON.stringify({
        assignees: [username]
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('GitHub API error:', errorData)
      throw new Error(`GitHub API error: ${response.status} - ${errorData.message}`)
    }

    const data = await response.json()

    console.log(`✅ Successfully ${action === 'assign' ? 'assigned' : 'unassigned'} @${username}`)

    return NextResponse.json({
      success: true,
      message: `Successfully ${action === 'assign' ? 'assigned' : 'unassigned'} @${username}`,
      action,
      username,
      issueNumber,
      assignees: data.assignees || []
    })

  } catch (error) {
    console.error('Assign/Unassign API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to assign/unassign user', 
        details: (error as Error).message
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'GitHub assign/unassign endpoint - use POST to assign or unassign users to issues',
    actions: ['assign', 'unassign'],
    example: {
      method: 'POST',
      body: {
        owner: 'owner',
        repo: 'repo',
        issueNumber: 123,
        username: 'username',
        action: 'assign' // or 'unassign'
      }
    }
  })
}
