import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:', {
    supabaseUrl: !!supabaseUrl,
    supabaseKey: !!supabaseKey
  })
  throw new Error('Missing Supabase environment variables. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.')
}

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
  attachment_url?: string | null
  attachment_type?: 'youtube' | 'website' | null
  attachment_metadata?: {
    title?: string
    description?: string
    thumbnail?: string
    favicon?: string
    siteName?: string
    duration?: string
  } | null
}

// Add these interfaces to your existing supabase.ts file
export interface HelpRequest {
  id: string
  user_id: string
  title: string
  proof: string
  help_type: string
  timeline: 'urgent' | 'standard' | 'flexible'
  status: 'pending' | 'matched' | 'completed'
  status_text: string
  views: number
  match_count: number
  created_at: string
  updated_at: string
  challenge?: string
  reason?: string
  matching_frequency: 'daily' | 'weekly' | 'off'
  website?: string | null
  media?: string | null
}

// Utility function to format time ago
export function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  
  const diffInWeeks = Math.floor(diffInDays / 7)
  return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`
}