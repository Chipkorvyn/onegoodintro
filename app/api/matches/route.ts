import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/api-responses'
import { authenticate } from '@/lib/auth-middleware'
import { getAdminSupabase } from '@/lib/db-utils'
import { MatchProcessor } from '@/lib/match-processing'
import { PerformanceUtils } from '@/lib/performance-utils'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if ('error' in auth) {
      return auth
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Max 50 items
    const status = searchParams.get('status') // 'pending', 'accepted', 'completed'

    // Create cache key
    const cacheKey = PerformanceUtils.createCacheKey('user_matches', {
      userId: auth.userId,
      page,
      limit,
      status
    })

    // Try to get from cache first
    const cached = PerformanceUtils.getCached(cacheKey)
    if (cached) {
      return ApiResponse.success(cached)
    }

    const adminSupabase = getAdminSupabase()

    // Build optimized query with pagination
    let baseQuery = adminSupabase
      .from('confirmed_matches')
      .select(`
        id,
        seeker_id,
        helper_id,
        user1_id,
        user2_id,
        seeker_accepted,
        helper_accepted,
        user1_accepted,
        user2_accepted,
        created_at,
        potential_match:potential_match_id (
          rationale,
          match_type,
          mutual_score,
          user1_gives,
          user1_gets,
          user2_gives,
          user2_gets,
          seeker:seeker_id (name, background, current_focus),
          helper:helper_id (name, background, current_focus),
          user1:user1_id (name, background, current_focus),
          user2:user2_id (name, background, current_focus)
        )
      `)
      .or(`seeker_id.eq.${auth.userId},helper_id.eq.${auth.userId},user1_id.eq.${auth.userId},user2_id.eq.${auth.userId}`)

    // Add status filtering if provided
    if (status) {
      // Note: Status filtering would need to be done after transformation due to complex logic
    }

    // Apply pagination
    const query = PerformanceUtils.createPaginatedQuery(baseQuery, {
      page,
      limit,
      orderBy: 'created_at',
      ascending: false
    })

    // Get count for pagination
    const countQuery = adminSupabase
      .from('confirmed_matches')
      .select('id', { count: 'exact', head: true })
      .or(`seeker_id.eq.${auth.userId},helper_id.eq.${auth.userId},user1_id.eq.${auth.userId},user2_id.eq.${auth.userId}`)

    const { data: confirmedMatches, error: matchesError } = await query

    if (matchesError) {
      console.error('Error fetching matches:', matchesError)
      return ApiResponse.internalServerError('Failed to fetch matches')
    }

    // Transform data for frontend
    const rawTransformed = confirmedMatches?.map(match => 
      MatchProcessor.transformMatch(match, auth.userId)
    ) || []
    
    let transformedMatches = MatchProcessor.filterValidMatches(rawTransformed)

    // Apply status filtering after transformation if needed
    if (status && ['pending', 'accepted', 'completed'].includes(status)) {
      transformedMatches = transformedMatches.filter(match => match.status === status)
    }

    const result = {
      matches: transformedMatches,
      pagination: {
        page,
        limit,
        total: confirmedMatches?.length || 0,
        hasMore: (confirmedMatches?.length || 0) === limit
      }
    }

    // Cache the result for 2 minutes
    PerformanceUtils.setCache(cacheKey, result, 2 * 60 * 1000)

    return ApiResponse.success(result)
  } catch (error) {
    console.error('API error:', error)
    return ApiResponse.internalServerError('Internal server error')
  }
}