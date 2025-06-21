import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Admin supabase client with service role (bypasses RLS)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { matchId } = await request.json()
    
    console.log('🔍 Debug confirm for match ID:', matchId)

    // Get match details
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
      return NextResponse.json({
        step: 'fetch_match',
        error: matchError.message,
        matchId
      })
    }

    // Check if mutual match
    const isMutualMatch = match.user1_id && match.user2_id
    
    // Check confirmed_matches table structure
    const { data: tableInfo, error: tableError } = await adminSupabase
      .from('confirmed_matches')
      .select('*')
      .limit(1)

    if (tableError) {
      return NextResponse.json({
        step: 'table_check',
        error: tableError.message,
        hint: 'confirmed_matches table might not exist or have permission issues'
      })
    }

    // Try the actual insert to see what fails
    let insertData
    if (isMutualMatch) {
      insertData = {
        potential_match_id: matchId,
        user1_id: match.user1_id,
        user2_id: match.user2_id
      }
    } else {
      insertData = {
        potential_match_id: matchId,
        seeker_id: match.seeker_id,
        helper_id: match.helper_id,
        request_id: match.request_id
      }
    }

    const { data: insertResult, error: insertError } = await adminSupabase
      .from('confirmed_matches')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({
        step: 'insert_confirmed_match',
        error: insertError.message,
        insertData,
        isMutualMatch,
        hint: 'This is the actual error causing the confirm to fail'
      })
    }

    return NextResponse.json({
      step: 'success',
      message: 'Debug confirm succeeded',
      insertResult,
      isMutualMatch
    })

  } catch (error) {
    return NextResponse.json({
      step: 'general_error',
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}