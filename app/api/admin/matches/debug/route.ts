import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Check what's in potential_matches table
    const { data: potentialMatches, error } = await supabase
      .from('potential_matches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      potentialMatches: potentialMatches || [],
      error: error?.message || null,
      message: 'Debug: potential_matches table contents'
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error 
    }, { status: 500 })
  }
}