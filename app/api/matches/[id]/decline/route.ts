import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

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

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify user is part of this match
    const { data: match, error: matchError } = await supabase
      .from('confirmed_matches')
      .select('seeker_id, helper_id')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const isSeeker = match.seeker_id === user.id
    const isHelper = match.helper_id === user.id

    if (!isSeeker && !isHelper) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the confirmed match (this removes it from their matches list)
    const { error: deleteError } = await supabase
      .from('confirmed_matches')
      .delete()
      .eq('id', matchId)

    if (deleteError) {
      console.error('Error declining match:', deleteError)
      return NextResponse.json({ error: 'Failed to decline match' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}