import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types
export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  current_focus: string
  background: string
  personal_info: string
  linkedin_url: string | null
  linkedin_status: 'empty' | 'processing' | 'complete'
  linkedin_data: any
  resume_filename: string | null
  resume_status: 'empty' | 'processing' | 'complete'
  ai_suggestions_shown: boolean
  profile_completion_score: number
  created_at: string
  updated_at: string
}

export interface UserProblem {
  id: string
  user_id: string
  title: string
  proof: string
  verified: boolean
  helped_count: number
  ai_generated: boolean
  created_at: string
}