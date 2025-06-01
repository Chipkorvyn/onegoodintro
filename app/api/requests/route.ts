import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { challenge, reason, help_type, timeline } = await request.json()

    // Validate required fields
    if (!challenge?.trim() || !reason?.trim() || !help_type?.trim() || !timeline) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('help_requests')
      .insert([{
        user_id: session.user.email,
        challenge: challenge.trim(),
        reason: reason.trim(),
        help_type: help_type.trim(),
        timeline,
        status: 'active',
        status_text: 'Looking for match'
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('help_requests')
      .select('*')
      .eq('user_id', session.user.email)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}