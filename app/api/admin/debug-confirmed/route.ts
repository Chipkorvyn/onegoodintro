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
    // Check what's in confirmed_matches table with admin client
    const { data: confirmedMatches, error } = await adminSupabase
      .from('confirmed_matches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      confirmedMatches: confirmedMatches || [],
      error: error?.message || null,
      message: 'Debug: confirmed_matches table contents'
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error.message 
    }, { status: 500 })
  }
}