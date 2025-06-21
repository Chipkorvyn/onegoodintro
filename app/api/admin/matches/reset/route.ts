import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin supabase client with service role (bypasses RLS)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('🧹 Starting complete reset...')

    // Step 1: Delete all messages for these users
    console.log('🗑️ Deleting messages...')
    const { error: deleteMessagesError } = await adminSupabase
      .from('messages')
      .delete()
      .or('sender_id.eq.chip.alexandru@gmail.com,sender_id.eq.chip.alexandru@eclipsai.com')

    if (deleteMessagesError) {
      console.error('Error deleting messages:', deleteMessagesError)
    } else {
      console.log('✅ Messages deleted')
    }

    // Step 2: Delete all confirmed matches for these users
    console.log('🗑️ Deleting confirmed matches...')
    const { error: deleteConfirmedError } = await adminSupabase
      .from('confirmed_matches')
      .delete()
      .or('user1_id.eq.chip.alexandru@gmail.com,user2_id.eq.chip.alexandru@gmail.com,seeker_id.eq.chip.alexandru@gmail.com,helper_id.eq.chip.alexandru@gmail.com,user1_id.eq.chip.alexandru@eclipsai.com,user2_id.eq.chip.alexandru@eclipsai.com,seeker_id.eq.chip.alexandru@eclipsai.com,helper_id.eq.chip.alexandru@eclipsai.com')

    if (deleteConfirmedError) {
      console.error('Error deleting confirmed matches:', deleteConfirmedError)
    } else {
      console.log('✅ Confirmed matches deleted')
    }

    // Step 3: Delete all potential matches for these users
    console.log('🗑️ Deleting potential matches...')
    const { error: deletePotentialError } = await adminSupabase
      .from('potential_matches')
      .delete()
      .or('user1_id.eq.chip.alexandru@gmail.com,user2_id.eq.chip.alexandru@gmail.com,seeker_id.eq.chip.alexandru@gmail.com,helper_id.eq.chip.alexandru@gmail.com,user1_id.eq.chip.alexandru@eclipsai.com,user2_id.eq.chip.alexandru@eclipsai.com,seeker_id.eq.chip.alexandru@eclipsai.com,helper_id.eq.chip.alexandru@eclipsai.com')

    if (deletePotentialError) {
      console.error('Error deleting potential matches:', deletePotentialError)
      return NextResponse.json({ error: 'Failed to delete potential matches' }, { status: 500 })
    } else {
      console.log('✅ Potential matches deleted')
    }

    console.log('🎉 Complete reset finished!')

    return NextResponse.json({ 
      success: true, 
      message: 'Complete reset successful! Deleted: messages, confirmed matches, and potential matches. Ready for end-to-end testing.' 
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}