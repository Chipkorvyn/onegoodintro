import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const matchId = params.id
    console.log('🔍 Accept API Debug: Match ID received:', matchId)

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      console.log('❌ User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('✅ User found:', user.id)

    // Get the match to determine if user is seeker or helper
    const { data: match, error: matchError } = await adminSupabase
      .from('confirmed_matches')
      .select('*')
      .eq('id', matchId)
      .single()

    console.log('🔍 Match query result:', { match, matchError })

    if (matchError || !match) {
      console.log('❌ Match not found in database:', matchError)
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Determine if this is a mutual match or old-style match
    const isMutualMatch = match.user1_id && match.user2_id
    let updateData: any
    
    if (isMutualMatch) {
      // Handle mutual match
      const isUser1 = match.user1_id === user.id
      const isUser2 = match.user2_id === user.id
      
      if (!isUser1 && !isUser2) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
      
      // Update the appropriate acceptance field for mutual match
      updateData = isUser1 
        ? { 
            user1_accepted: true, 
            user1_accepted_at: new Date().toISOString() 
          }
        : { 
            user2_accepted: true, 
            user2_accepted_at: new Date().toISOString() 
          }
    } else {
      // Handle old-style match
      const isSeeker = match.seeker_id === user.id
      const isHelper = match.helper_id === user.id

      if (!isSeeker && !isHelper) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      // Update the appropriate acceptance field for old-style match
      updateData = isSeeker 
        ? { 
            seeker_accepted: true, 
            seeker_accepted_at: new Date().toISOString() 
          }
        : { 
            helper_accepted: true, 
            helper_accepted_at: new Date().toISOString() 
          }
    }

    const { error: updateError } = await adminSupabase
      .from('confirmed_matches')
      .update(updateData)
      .eq('id', matchId)

    if (updateError) {
      console.error('Error accepting match:', updateError)
      return NextResponse.json({ error: 'Failed to accept match' }, { status: 500 })
    }

    // Check if both parties have now accepted
    const { data: updatedMatch, error: checkError } = await adminSupabase
      .from('confirmed_matches')
      .select('seeker_accepted, helper_accepted, user1_accepted, user2_accepted')
      .eq('id', matchId)
      .single()

    if (!checkError && updatedMatch) {
      const bothAccepted = isMutualMatch 
        ? (updatedMatch.user1_accepted && updatedMatch.user2_accepted)
        : (updatedMatch.seeker_accepted && updatedMatch.helper_accepted)
        
      if (bothAccepted) {
        // Both have accepted - mark as completed
        await adminSupabase
          .from('confirmed_matches')
          .update({ completed_at: new Date().toISOString() })
          .eq('id', matchId)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}