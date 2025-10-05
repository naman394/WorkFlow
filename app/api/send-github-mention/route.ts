// API endpoint for sending GitHub mentions as email alternative
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
      contributorUsername,
      issueTitle,
      issueNumber,
      repositoryName,
      issueUrl,
      messageType = 'reminder'
    } = await request.json()

    // Validate required fields
    if (!contributorUsername || !issueTitle || !issueNumber || !repositoryName) {
      return NextResponse.json({ 
        error: 'Missing required fields: contributorUsername, issueTitle, issueNumber, repositoryName' 
      }, { status: 400 })
    }

    console.log('📝 Sending GitHub mention to:', contributorUsername)

    // Parse repository name
    const [owner, repo] = repositoryName.split('/')
    if (!owner || !repo) {
      return NextResponse.json({ error: 'Invalid repository name format' }, { status: 400 })
    }

    // Generate mention message based on type
    let mentionMessage = ''
    switch (messageType) {
      case 'reminder':
        mentionMessage = `Hi @${contributorUsername}! 👋\n\nJust checking in on **${issueTitle}** (#${issueNumber}). How's the progress going? Let me know if you need any help or if there are any blockers!\n\nThanks for contributing! 🙏`
        break
      case 'urgent':
        mentionMessage = `@${contributorUsername} - Quick update needed on **${issueTitle}** (#${issueNumber}).\n\nThis issue has been assigned for a while. Could you please provide an update on the current status? If you're blocked or need help, just let us know!\n\nThanks! 🚀`
        break
      case 'encouragement':
        mentionMessage = `Hey @${contributorUsername}! 💪\n\nHope you're doing great with **${issueTitle}** (#${issueNumber}). You've got this! If you need any assistance or have questions, don't hesitate to reach out.\n\nKeep up the awesome work! 🌟`
        break
      default:
        mentionMessage = `@${contributorUsername} - Quick check-in on **${issueTitle}** (#${issueNumber}). Any updates?`
    }

    // Add footer
    mentionMessage += `\n\n---\n*This message was sent via Cookie-Licking Detector to help maintain issue progress.*`

    // Send comment to the issue
    const commentResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Cookie-Licking-Detector/1.0',
        },
        body: JSON.stringify({
          body: mentionMessage
        }),
      }
    )

    if (!commentResponse.ok) {
      const errorData = await commentResponse.json()
      console.error('GitHub API error:', errorData)
      throw new Error(`GitHub API error: ${commentResponse.status} - ${errorData.message}`)
    }

    const commentData = await commentResponse.json()

    console.log(`✅ GitHub mention sent successfully to @${contributorUsername}`)

    return NextResponse.json({
      success: true,
      message: `GitHub mention sent to @${contributorUsername}`,
      commentUrl: commentData.html_url,
      commentId: commentData.id,
      details: {
        contributorUsername,
        issueNumber,
        repositoryName,
        messageType,
        commentUrl: commentData.html_url
      }
    })

  } catch (error) {
    console.error('GitHub mention API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send GitHub mention', 
        details: (error as Error).message,
        commentId: `error_${Date.now()}`
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'GitHub mention endpoint - use POST to send mentions as email alternative',
    messageTypes: ['reminder', 'urgent', 'encouragement'],
    example: {
      method: 'POST',
      body: {
        contributorUsername: 'username',
        issueTitle: 'Fix authentication bug',
        issueNumber: 123,
        repositoryName: 'owner/repo',
        issueUrl: 'https://github.com/owner/repo/issues/123',
        messageType: 'reminder'
      }
    }
  })
}
