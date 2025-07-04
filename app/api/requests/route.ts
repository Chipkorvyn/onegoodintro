import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { authenticateWithSession } from '@/lib/auth-middleware'

function createSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const authResult = await authenticateWithSession(session, request)
    if ('error' in authResult) {
      return authResult
    }

    const supabase = createSupabaseServerClient()
    const { title, proof, help_type, timeline, website, media } = await request.json()

    // Validate required fields
    if (!title?.trim() || !proof?.trim() || !help_type?.trim() || !timeline) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Try creating with website and media fields first
    let { data, error } = await supabase
      .from('help_requests')
      .insert([{
        user_id: authResult.userEmail,
        challenge: title.trim(),
        reason: proof.trim(),
        help_type: help_type.trim(),
        timeline,
        status: 'active',
        status_text: 'Looking for match',
        views: 0,
        match_count: 0,
        website: website?.trim() || null,
        media: media?.trim() || null
      }])
      .select()
      .single()

    // If that fails because columns don't exist, try without website/media
    if (error && error.message?.includes('column') && (error.message?.includes('website') || error.message?.includes('media'))) {
      console.log('⚠️ Website/media columns do not exist, trying basic insert')
      
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('help_requests')
        .insert([{
          user_id: authResult.userEmail,
          challenge: title.trim(),
          reason: proof.trim(),
          help_type: help_type.trim(),
          timeline,
          status: 'active',
          status_text: 'Looking for match',
          views: 0,
          match_count: 0
        }])
        .select()
        .single()
      
      data = fallbackData
      error = fallbackError
    }

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
    const session = await getServerSession(authOptions)
    const authResult = await authenticateWithSession(session, request)
    if ('error' in authResult) {
      return authResult
    }

    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('help_requests')
      .select('*')
      .eq('user_id', authResult.userEmail)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    console.log('🔍 Retrieved help requests:', data?.length, 'records')
    if (data && data.length > 0) {
      console.log('🔍 Sample request structure:', Object.keys(data[0]))
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const authResult = await authenticateWithSession(session, request)
    if ('error' in authResult) {
      return authResult
    }

    const supabase = createSupabaseServerClient()
    const body = await request.json()
    console.log('🔍 PUT request body:', body)
    
    const { id, title, proof, help_type, timeline, website, media } = body

    // Validate required fields
    if (!id || !title?.trim() || !proof?.trim() || !help_type?.trim() || !timeline) {
      console.log('❌ Validation failed:', { id, title, proof, help_type, timeline })
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    console.log('🔍 Updating request with ID:', id, 'for user:', authResult.userEmail)

    // Try updating with website and media fields first
    let { data, error } = await supabase
      .from('help_requests')
      .update({
        challenge: title.trim(),
        reason: proof.trim(),
        help_type: help_type.trim(),
        timeline,
        website: website?.trim() || null,
        media: media?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', authResult.userEmail)
      .select()
      .single()

    // If that fails because columns don't exist, try without website/media
    if (error && error.message?.includes('column') && (error.message?.includes('website') || error.message?.includes('media'))) {
      console.log('⚠️ Website/media columns do not exist, trying basic update')
      
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('help_requests')
        .update({
          challenge: title.trim(),
          reason: proof.trim(),
          help_type: help_type.trim(),
          timeline,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', authResult.userEmail)
        .select()
        .single()
      
      data = fallbackData
      error = fallbackError
    }

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
    }
    
    console.log('✅ Update successful:', data)

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const authResult = await authenticateWithSession(session, request)
    if ('error' in authResult) {
      return authResult
    }

    const supabase = createSupabaseServerClient()
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('help_requests')
      .delete()
      .eq('id', id)
      .eq('user_id', authResult.userEmail) // Ensure user can only delete their own requests

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Request deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}