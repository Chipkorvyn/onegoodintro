import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
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
      console.log('Error fetching mutual matches:', error)
      return NextResponse.json([])
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

    return NextResponse.json(transformedMatches)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}