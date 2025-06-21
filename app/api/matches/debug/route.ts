import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Admin supabase client with service role (bypasses RLS)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Bypass auth for debugging - check for chip.alexandru@gmail.com
    const userEmail = 'chip.alexandru@gmail.com'
    
    // Get user
    const { data: user, error: userError } = await adminSupabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single()

    if (userError) {
      return NextResponse.json({ error: `User error: ${userError.message}` })
    }

    // Get confirmed matches for this user
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

    return NextResponse.json({
      userEmail,
      userId: user.id,
      confirmedMatches: confirmedMatches || [],
      matchesError: matchesError?.message || null,
      message: 'Debug: User matches query'
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error.message 
    }, { status: 500 })
  }
}