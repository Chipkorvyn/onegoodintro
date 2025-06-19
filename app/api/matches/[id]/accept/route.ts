import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth/next'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const matchId = params.id

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get the match to determine if user is seeker or helper
    const { data: match, error: matchError } = await supabase
      .from('confirmed_matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Determine which field to update
    const isSeeker = match.seeker_id === user.id
    const isHelper = match.helper_id === user.id

    if (!isSeeker && !isHelper) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update the appropriate acceptance field
    const updateData = isSeeker 
      ? { 
          seeker_accepted: true, 
          seeker_accepted_at: new Date().toISOString() 
        }
      : { 
          helper_accepted: true, 
          helper_accepted_at: new Date().toISOString() 
        }

    const { error: updateError } = await supabase
      .from('confirmed_matches')
      .update(updateData)
      .eq('id', matchId)

    if (updateError) {
      console.error('Error accepting match:', updateError)
      return NextResponse.json({ error: 'Failed to accept match' }, { status: 500 })
    }

    // Check if both parties have now accepted
    const { data: updatedMatch, error: checkError } = await supabase
      .from('confirmed_matches')
      .select('seeker_accepted, helper_accepted')
      .eq('id', matchId)
      .single()

    if (!checkError && updatedMatch?.seeker_accepted && updatedMatch?.helper_accepted) {
      // Both have accepted - mark as completed
      await supabase
        .from('confirmed_matches')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', matchId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}