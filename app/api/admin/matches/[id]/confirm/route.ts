import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
        seeker:seeker_id (
          name,
          email
        ),
        helper:helper_id (
          name,
          email
        )
      `)
      .eq('id', matchId)
      .single()

    if (matchError) {
      console.error('Error fetching match details:', matchError)
      return NextResponse.json({ error: 'Failed to fetch match details' }, { status: 500 })
    }

    // Create confirmed match entry for user interaction
    const { data: confirmedMatch, error: confirmedError } = await supabase
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
      console.error('Error creating confirmed match:', confirmedError)
      return NextResponse.json({ error: 'Failed to create confirmed match' }, { status: 500 })
    }

    // Create user notifications (these will be used for emails)
    const notifications = [
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

    const { error: notificationError } = await supabase
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