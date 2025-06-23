import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get completed matches where both parties have accepted
    // For now, return empty array if tables don't exist yet
    let completedMatches = []
    
    try {
      const { data, error: matchesError } = await supabase
        .from('confirmed_matches')
        .select(`
          id,
          seeker_id,
          helper_id,
          completed_at,
          potential_match:potential_match_id (
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
              help_type
            )
          )
        `)
        .or(`seeker_id.eq.${user.id},helper_id.eq.${user.id}`)
        .eq('seeker_accepted', true)
        .eq('helper_accepted', true)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })

      if (matchesError) {
        // If table doesn't exist yet, just return empty network
        console.log('Confirmed matches table not ready yet, returning empty network')
        completedMatches = []
      } else {
        completedMatches = data || []
      }
    } catch (error) {
      console.log('Network matching not set up yet, returning empty network')
      completedMatches = []
    }

    // Transform data to match NetworkConnection interface
    const networkConnections = completedMatches?.map((match, index) => {
      const isSeeker = match.seeker_id === user.id
      const otherUser = isSeeker 
        ? match.potential_match?.helper 
        : match.potential_match?.seeker
      const helpRequest = match.potential_match?.help_request

      // Generate connection context
      const connectionContext = isSeeker
        ? `${otherUser?.name} helped you with ${helpRequest?.help_type || 'assistance'}`
        : `You helped ${otherUser?.name} with ${helpRequest?.help_type || 'assistance'}`

      // Create avatar from initials
      const nameParts = otherUser?.name?.split(' ') || ['U', 'N']
      const avatar = nameParts.length >= 2 
        ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
        : nameParts[0]?.substring(0, 2).toUpperCase() || 'UN'

      return {
        id: index + 1, // Using index since NetworkConnection expects number
        name: otherUser?.name || 'Unknown User',
        title: 'Helper', // Could be enhanced based on user data
        company: otherUser?.current_focus || 'Professional',
        avatar,
        connectionContext,
        currentStatus: {
          type: Math.random() > 0.5 ? 'looking_for' as const : 'recently_helped' as const,
          text: otherUser?.current_focus || 'Available to connect'
        }
      }
    }) || []

    return NextResponse.json(networkConnections)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}