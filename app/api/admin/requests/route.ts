import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/api-responses'
import { authenticateAdmin, getAdminSupabase } from '@/lib/auth-middleware'
import { PerformanceUtils } from '@/lib/performance-utils'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request)
    if ('error' in auth) {
      return auth
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 items
    
    // Create cache key
    const cacheKey = PerformanceUtils.createCacheKey('admin_requests', {
      status: status || 'all',
      page,
      limit
    })

    // Try to get from cache first (shorter cache for admin data)
    const cached = PerformanceUtils.getCached(cacheKey)
    if (cached) {
      return ApiResponse.success(cached)
    }

    const supabase = getAdminSupabase()
    
    // Build base query with essential fields only
    let baseQuery = supabase
      .from('help_requests')
      .select(`
        id,
        title,
        help_type,
        proof,
        status,
        created_at,
        updated_at,
        user_id,
        users!help_requests_user_id_fkey (
          id,
          name,
          email
        )
      `)
    
    if (status && status !== 'all') {
      baseQuery = baseQuery.eq('status', status)
    }
    
    // Apply pagination
    const query = PerformanceUtils.createPaginatedQuery(baseQuery, {
      page,
      limit,
      orderBy: 'created_at',
      ascending: false
    })

    // Get count for pagination
    const countQuery = supabase
      .from('help_requests')
      .select('id', { count: 'exact', head: true })

    if (status && status !== 'all') {
      countQuery.eq('status', status)
    }
    
    const paginatedResult = await PerformanceUtils.getPaginatedResults(
      query,
      countQuery,
      { page, limit }
    )
    
    // Cache the result for 1 minute (admin data changes frequently)
    PerformanceUtils.setCache(cacheKey, paginatedResult, 60 * 1000)
    
    return ApiResponse.success(paginatedResult)
  } catch (error) {
    console.error('API error:', error)
    return ApiResponse.internalServerError('Internal server error')
  }
}