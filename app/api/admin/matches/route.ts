import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get potential matches (unmatched help requests with potential helpers)
    // Return empty array if tables don't exist yet
    let potentialMatches = []
    
    try {
      const { data, error } = await supabase
        .from('potential_matches')
        .select(`
          *,
          seeker:seeker_id (
            name,
            email,
            background,
            current_focus
          ),
          helper:helper_id (
            name,
            email,
            background,
            current_focus
          ),
          help_request:request_id (
            title,
            help_type,
            proof
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.log('Potential matches table not ready yet, returning empty matches')
        potentialMatches = []
      } else {
        potentialMatches = data || []
      }
    } catch (error) {
      console.log('Matching system not set up yet, returning empty matches')
      potentialMatches = []
    }
    
    // Transform data to match frontend expectations
    const transformedMatches = potentialMatches?.map(match => ({
      id: match.id,
      seeker: {
        name: match.seeker?.name || 'Unknown',
        email: match.seeker?.email || '',
        background: match.seeker?.background || '',
        request_title: match.help_request?.title || '',
        help_type: match.help_request?.help_type || ''
      },
      helper: {
        name: match.helper?.name || 'Unknown',
        email: match.helper?.email || '',
        background: match.helper?.background || '',
        current_focus: match.helper?.current_focus || ''
      },
      rationale: match.rationale || ''
    })) || []
    
    return NextResponse.json(transformedMatches)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}