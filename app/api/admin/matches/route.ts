import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ApiResponse } from '@/lib/api-responses'
import { authenticateAdminWithSession, getAdminSupabase } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const auth = await authenticateAdminWithSession(session, request)
    if ('error' in auth) {
      return auth
    }

    const supabase = getAdminSupabase()
    const { data: matches, error } = await supabase
      .from('potential_matches')
      .select(`
        *,
        user1:user1_id (name, email),
        user2:user2_id (name, email)
      `)
      .not('user1_id', 'is', null)
      .not('user2_id', 'is', null)
      .in('status', ['pending', 'confirmed'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching mutual matches:', error)
      return ApiResponse.success([])
    }

    const transformedMatches = matches?.map(match => ({
      id: match.id,
      user1: {
        name: match.user1?.name || 'Unknown',
        email: match.user1?.email || ''
      },
      user2: {
        name: match.user2?.name || 'Unknown',
        email: match.user2?.email || ''
      },
      match_type: match.match_type,
      mutual_score: match.mutual_score,
      user1_gives: match.user1_gives,
      user1_gets: match.user1_gets,
      user2_gives: match.user2_gives,
      user2_gets: match.user2_gets,
      rationale: match.rationale,
      status: match.status
    })) || []

    return ApiResponse.success(transformedMatches)
  } catch (error) {
    console.error('API error:', error)
    return ApiResponse.internalServerError('Failed to fetch matches')
  }
}