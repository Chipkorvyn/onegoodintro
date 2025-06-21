import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Admin supabase client with service role (bypasses RLS)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id

    // Update match status to confirmed
    const { error: updateError } = await supabase
      .from('potential_matches')
      .update({ 
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      })
      .eq('id', matchId)

    if (updateError) {
      console.error('Error confirming match:', updateError)
      return NextResponse.json({ error: 'Failed to confirm match' }, { status: 500 })
    }

    // Get match details to create notifications
    const { data: match, error: matchError } = await supabase
      .from('potential_matches')
      .select(`
        *,
        seeker:seeker_id (name, email),
        helper:helper_id (name, email),
        user1:user1_id (name, email),
        user2:user2_id (name, email)
      `)
      .eq('id', matchId)
      .single()

    if (matchError) {
      console.error('Error fetching match details:', matchError)
      return NextResponse.json({ error: 'Failed to fetch match details' }, { status: 500 })
    }

    // Determine if this is a mutual match or old-style match
    const isMutualMatch = match.user1_id && match.user2_id
    
    let confirmedMatch
    if (isMutualMatch) {
      // Create confirmed match entry for mutual matching
      const { data: newMatch, error: confirmedError } = await adminSupabase
        .from('confirmed_matches')
        .insert({
          potential_match_id: matchId,
          user1_id: match.user1_id,
          user2_id: match.user2_id
        })
        .select()
        .single()
      
      if (confirmedError) {
        console.error('Error creating mutual confirmed match:', confirmedError)
        return NextResponse.json({ error: 'Failed to create confirmed match' }, { status: 500 })
      }
      confirmedMatch = newMatch
    } else {
      // Create confirmed match entry for old-style matching
      const { data: newMatch, error: confirmedError } = await adminSupabase
        .from('confirmed_matches')
        .insert({
          potential_match_id: matchId,
          seeker_id: match.seeker_id,
          helper_id: match.helper_id,
          request_id: match.request_id
        })
        .select()
        .single()
      
      if (confirmedError) {
        console.error('Error creating old-style confirmed match:', confirmedError)
        return NextResponse.json({ error: 'Failed to create confirmed match' }, { status: 500 })
      }
      confirmedMatch = newMatch
    }

    // Create user notifications (these will be used for emails)
    let notifications = []
    
    if (isMutualMatch) {
      notifications = [
        {
          user_id: match.user1_id,
          type: 'match_confirmed',
          title: 'New Mutual Match Found!',
          message: `You've been matched with ${match.user2?.name} for mutual benefit collaboration.`,
          data: { 
            match_id: confirmedMatch.id, 
            other_user: match.user2?.name,
            match_url: `/matches`
          }
        },
        {
          user_id: match.user2_id,
          type: 'match_confirmed',
          title: 'New Mutual Match Found!',
          message: `You've been matched with ${match.user1?.name} for mutual benefit collaboration.`,
          data: { 
            match_id: confirmedMatch.id, 
            other_user: match.user1?.name,
            match_url: `/matches`
          }
        }
      ]
    } else {
      notifications = [
        {
          user_id: match.seeker_id,
          type: 'match_confirmed',
          title: 'New Match Found!',
          message: `You've been matched with ${match.helper?.name} for your help request.`,
          data: { 
            match_id: confirmedMatch.id, 
            other_user: match.helper?.name,
            match_url: `/matches`
          }
        },
        {
          user_id: match.helper_id,
          type: 'match_confirmed',
          title: 'Someone Needs Your Help!',
          message: `${match.seeker?.name} has been matched with you for assistance.`,
          data: { 
            match_id: confirmedMatch.id, 
            other_user: match.seeker?.name,
            match_url: `/matches`
          }
        }
      ]
    }

    const { error: notificationError } = await adminSupabase
      .from('notifications')
      .insert(notifications)

    if (notificationError) {
      console.error('Error creating notifications:', notificationError)
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}