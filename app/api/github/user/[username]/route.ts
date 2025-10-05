// API endpoint to fetch GitHub user details including email
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
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

    const { username } = params

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    console.log(`🔍 Fetching GitHub user details for: ${username}`)

    // Fetch user details from GitHub API
    const userResponse = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Cookie-Licking-Detector/1.0',
      },
    })

    if (!userResponse.ok) {
      if (userResponse.status === 404) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      throw new Error(`GitHub API error: ${userResponse.status}`)
    }

    const userData = await userResponse.json()

    // Try to get user's email from their public profile
    let email = userData.email

    // If no public email, try to get it from the authenticated user's view
    if (!email) {
      try {
        console.log(`📧 No public email found, trying to get email for authenticated user...`)
        
        // This endpoint requires authentication and returns email if available
        const userEmailResponse = await fetch(`https://api.github.com/user`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Cookie-Licking-Detector/1.0',
          },
        })

        if (userEmailResponse.ok) {
          const authenticatedUserData = await userEmailResponse.json()
          // Only return email if it's for the same user we're querying
          if (authenticatedUserData.login === username) {
            email = authenticatedUserData.email
          }
        }
      } catch (error) {
        console.log('Could not fetch email for authenticated user:', error)
      }
    }

    // Try to extract contact information from bio
    let contactInfo = {
      website: null,
      twitter: null,
      company: null,
      location: null,
      bio: null
    }

    if (userData.bio) {
      contactInfo.bio = userData.bio
      
      // Extract website from bio (simple regex patterns)
      const websiteMatch = userData.bio.match(/(https?:\/\/[^\s]+)/i)
      if (websiteMatch) {
        contactInfo.website = websiteMatch[1]
      }
      
      // Extract Twitter handle
      const twitterMatch = userData.bio.match(/@([a-zA-Z0-9_]+)/i)
      if (twitterMatch) {
        contactInfo.twitter = twitterMatch[1]
      }
    }

    // Check for website in user data
    if (userData.blog) {
      contactInfo.website = userData.blog
    }

    // Format the response
    const userInfo = {
      id: userData.id,
      login: userData.login,
      name: userData.name,
      email: email || null,
      avatarUrl: userData.avatar_url,
      htmlUrl: userData.html_url,
      publicRepos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
      createdAt: userData.created_at,
      hasEmail: !!email,
      emailSource: email ? (userData.email ? 'public' : 'authenticated') : 'none',
      contactInfo: {
        website: contactInfo.website,
        twitter: contactInfo.twitter,
        company: userData.company,
        location: userData.location,
        bio: contactInfo.bio,
        hasContactInfo: !!(contactInfo.website || contactInfo.twitter || userData.company || userData.location)
      }
    }

    console.log(`✅ User details fetched for ${username}:`, {
      hasEmail: userInfo.hasEmail,
      emailSource: userInfo.emailSource
    })

    return NextResponse.json({
      success: true,
      user: userInfo
    })

  } catch (error) {
    console.error('GitHub user API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details', details: (error as Error).message },
      { status: 500 }
    )
  }
}
