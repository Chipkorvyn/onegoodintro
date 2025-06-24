import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createClient } from '@supabase/supabase-js'

// Admin supabase client with service role (bypasses RLS for admin operations)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const connectionId = params.connectionId

    // Verify user is part of this connection
    const { data: connection, error: connectionError } = await adminSupabase
      .from('confirmed_matches')
      .select('user1_id, user2_id, seeker_id, helper_id')
      .eq('id', connectionId)
      .single()

    if (connectionError || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    // Check if user is part of this connection
    const userEmail = session.user.email
    const isUserInConnection = 
      connection.user1_id === userEmail ||
      connection.user2_id === userEmail ||
      connection.seeker_id === userEmail ||
      connection.helper_id === userEmail

    if (!isUserInConnection) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch messages for this connection
    const { data: messages, error: messagesError } = await adminSupabase
      .from('messages')
      .select(`
        id,
        sender_id,
        message_text,
        created_at,
        sender:sender_id (name, email)
      `)
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    return NextResponse.json(messages || [])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const connectionId = params.connectionId
    const { message_text } = await request.json()

    if (!message_text || message_text.trim().length === 0) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 })
    }

    if (message_text.length > 1000) {
      return NextResponse.json({ error: 'Message too long (max 1000 characters)' }, { status: 400 })
    }

    // Verify user is part of this connection
    const { data: connection, error: connectionError } = await adminSupabase
      .from('confirmed_matches')
      .select('user1_id, user2_id, seeker_id, helper_id')
      .eq('id', connectionId)
      .single()

    if (connectionError || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    // Check if user is part of this connection
    const userEmail = session.user.email
    const isUserInConnection = 
      connection.user1_id === userEmail ||
      connection.user2_id === userEmail ||
      connection.seeker_id === userEmail ||
      connection.helper_id === userEmail

    if (!isUserInConnection) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Insert the new message
    const { data: newMessage, error: insertError } = await adminSupabase
      .from('messages')
      .insert({
        connection_id: connectionId,
        sender_id: userEmail,
        message_text: message_text.trim()
      })
      .select(`
        id,
        sender_id,
        message_text,
        created_at,
        sender:sender_id (name, email)
      `)
      .single()

    if (insertError) {
      console.error('Error sending message:', insertError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json(newMessage)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}