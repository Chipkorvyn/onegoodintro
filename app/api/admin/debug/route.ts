import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Check help requests
    const { data: helpRequests } = await supabase
      .from('help_requests')
      .select('id, title, status, user_id')
      .eq('status', 'active')
      .limit(3)

    // Check users  
    const { data: users } = await supabase
      .from('users')
      .select('id, name, current_focus')
      .not('current_focus', 'is', null)
      .limit(3)

    return NextResponse.json({
      helpRequests: helpRequests || [],
      users: users || [],
      message: 'Debug data loaded successfully'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Debug failed', details: error }, { status: 500 })
  }
}