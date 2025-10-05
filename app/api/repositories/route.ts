import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
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

    // Fetch user's repositories from GitHub
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch repositories')
    }

    const repos = await response.json()

    // Filter and format repositories
    const formattedRepos = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      htmlUrl: repo.html_url,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      updatedAt: repo.updated_at,
      owner: {
        login: repo.owner.login,
        avatarUrl: repo.owner.avatar_url,
      },
    }))

    return NextResponse.json({
      repositories: formattedRepos,
      total: formattedRepos.length
    })

  } catch (error) {
    console.error('Repository fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    )
  }
}

