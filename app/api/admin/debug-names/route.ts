import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Check all users in the database
    const { data: allUsers, error } = await supabase
      .from('users')
      .select('id, name, email, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Look for potential duplicates or name variations
    const emailGroups = {}
    const nameVariations = {}

    allUsers?.forEach(user => {
      const emailBase = user.email?.split('@')[0] || 'unknown'
      if (!emailGroups[emailBase]) emailGroups[emailBase] = []
      emailGroups[emailBase].push(user)

      const nameBase = user.name?.split(' ')[0] || 'unknown'
      if (!nameVariations[nameBase]) nameVariations[nameBase] = []
      nameVariations[nameBase].push(user)
    })

    // Find potential issues
    const duplicateEmails = Object.entries(emailGroups).filter(([_, users]) => users.length > 1)
    const nameConflicts = Object.entries(nameVariations).filter(([_, users]) => users.length > 1)

    return NextResponse.json({
      total_users: allUsers?.length || 0,
      all_users: allUsers,
      potential_duplicate_emails: duplicateEmails,
      potential_name_conflicts: nameConflicts,
      message: 'User name analysis complete'
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error.message 
    }, { status: 500 })
  }
}