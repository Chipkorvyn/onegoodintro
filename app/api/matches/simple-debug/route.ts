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
    const userEmail = 'chip.alexandru@gmail.com'
    
    // Get user ID
    const { data: user } = await adminSupabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single()

    // Test 1: Check with admin client
    const { data: adminMatches, error: adminError } = await adminSupabase
      .from('confirmed_matches')
      .select('*')
      .or(`seeker_id.eq.${user.id},helper_id.eq.${user.id},user1_id.eq.${user.id},user2_id.eq.${user.id}`)

    // Test 2: Check with regular client  
    const { data: regularMatches, error: regularError } = await supabase
      .from('confirmed_matches')
      .select('*')
      .or(`seeker_id.eq.${user.id},helper_id.eq.${user.id},user1_id.eq.${user.id},user2_id.eq.${user.id}`)

    return NextResponse.json({
      userEmail,
      userId: user.id,
      adminMatches: adminMatches?.length || 0,
      adminError: adminError?.message || null,
      regularMatches: regularMatches?.length || 0,
      regularError: regularError?.message || null,
      message: 'Compare admin vs regular client access'
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error.message 
    }, { status: 500 })
  }
}