import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // In production, you'd want to check if user is admin
    // For now, we'll allow any authenticated user to see admin view
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    let query = supabase
      .from('help_requests')
      .select(`
        *,
        users!help_requests_user_id_fkey (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
    
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}