import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth/next'
import { createClient } from '@supabase/supabase-js'

// Admin supabase client with service role (bypasses RLS for now)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's confirmed matches that haven't been responded to yet
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get matches where this user is either seeker/helper (old) or user1/user2 (mutual)
    const { data: confirmedMatches, error: matchesError } = await adminSupabase
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
          seeker:seeker_id (name, email, background, current_focus),
          helper:helper_id (name, email, background, current_focus),
          user1:user1_id (name, email, background, current_focus),
          user2:user2_id (name, email, background, current_focus)
        )
      `)
      .or(`seeker_id.eq.${user.id},helper_id.eq.${user.id},user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (matchesError) {
      console.error('Error fetching matches:', matchesError)
      return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
    }

    // Transform data for frontend
    const transformedMatches = confirmedMatches?.map(match => {
      // Determine if this is a mutual match or old-style match
      const isMutualMatch = match.user1_id && match.user2_id
      
      if (isMutualMatch) {
        // Handle mutual match
        const isUser1 = match.user1_id === user.id
        const userAccepted = isUser1 ? match.user1_accepted : match.user2_accepted
        const otherAccepted = isUser1 ? match.user2_accepted : match.user1_accepted
        const otherUser = isUser1 
          ? match.potential_match?.user2 
          : match.potential_match?.user1
        
        const userGives = isUser1 ? match.potential_match?.user1_gives : match.potential_match?.user2_gives
        const userGets = isUser1 ? match.potential_match?.user1_gets : match.potential_match?.user2_gets
        const otherGives = isUser1 ? match.potential_match?.user2_gives : match.potential_match?.user1_gives
        const otherGets = isUser1 ? match.potential_match?.user2_gets : match.potential_match?.user1_gets

        let status: 'pending' | 'accepted' | 'completed' = 'pending'
        if (userAccepted && otherAccepted) {
          status = 'completed'  // Both users accepted - this is a network connection
        } else if (userAccepted) {
          status = 'accepted'   // Only current user accepted
        }

        return {
          id: match.id,
          other_user: {
            name: otherUser?.name || 'Unknown',
            email: otherUser?.email || '',
            background: otherUser?.background || '',
            current_focus: otherUser?.current_focus || ''
          },
          request: {
            title: `Mutual Benefit Exchange`,
            help_type: match.potential_match?.match_type || 'mutual_benefit',
            proof: `You give: ${userGives} | You get: ${userGets}`
          },
          rationale: match.potential_match?.rationale || '',
          is_seeker: false, // Neither is seeker in mutual match
          is_mutual: true,
          mutual_score: match.potential_match?.mutual_score,
          you_give: userGives,
          you_get: userGets,
          they_give: otherGives,
          they_get: otherGets,
          status,
          created_at: match.created_at
        }
      } else {
        // Handle old-style match
        const isSeeker = match.seeker_id === user.id
        const userAccepted = isSeeker ? match.seeker_accepted : match.helper_accepted
        const otherAccepted = isSeeker ? match.helper_accepted : match.seeker_accepted
        const otherUser = isSeeker 
          ? match.potential_match?.helper 
          : match.potential_match?.seeker

        let status: 'pending' | 'accepted' | 'completed' = 'pending'
        if (userAccepted && otherAccepted) {
          status = 'completed'  // Both users accepted - this is a network connection
        } else if (userAccepted) {
          status = 'accepted'   // Only current user accepted
        }

        return {
          id: match.id,
          other_user: {
            name: otherUser?.name || 'Unknown',
            email: otherUser?.email || '',
            background: otherUser?.background || '',
            current_focus: otherUser?.current_focus || ''
          },
          request: {
            title: match.potential_match?.help_request?.title || '',
            help_type: match.potential_match?.help_request?.help_type || '',
            proof: match.potential_match?.help_request?.proof || ''
          },
          rationale: match.potential_match?.rationale || '',
          is_seeker: isSeeker,
          is_mutual: false,
          status,
          created_at: match.created_at
        }
      }
    }).filter(match => match.status === 'pending' || match.status === 'accepted' || match.status === 'completed') || []

    return NextResponse.json(transformedMatches)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}