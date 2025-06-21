import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Try different possible table names
    let helpRequests, error1, error2

    // Try 'help_requests' with all columns to see what exists
    const result1 = await supabase
      .from('help_requests')
      .select('*')
      .limit(1)
    helpRequests = result1.data
    error1 = result1.error

    // Try 'help_request' (singular)
    const result2 = await supabase
      .from('help_request')
      .select('id, title, status, user_id')
      .limit(3)
    error2 = result2.error

    // Check users  
    const { data: users } = await supabase
      .from('users')
      .select('id, name, current_focus')
      .not('current_focus', 'is', null)
      .limit(3)

    return NextResponse.json({
      helpRequests: helpRequests || [],
      helpRequestsError: error1?.message || null,
      helpRequestSingularError: error2?.message || null,
      users: users || [],
      message: 'Debug data loaded - checking table names'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Debug failed', details: error }, { status: 500 })
  }
}