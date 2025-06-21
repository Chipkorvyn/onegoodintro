import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ApiResponse } from '@/lib/api-responses'
import { createClient } from '@supabase/supabase-js'
import type { Session } from 'next-auth'
import type { NextRequest } from 'next/server'

export interface AuthenticatedRequest {
  session: Session
  userId: string
  userEmail: string
}

export async function authenticate(request?: NextRequest): Promise<AuthenticatedRequest | ReturnType<typeof ApiResponse.unauthorized>> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return ApiResponse.unauthorized()
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: user, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (error || !user) {
    return ApiResponse.unauthorized('User not found')
  }

  return {
    session,
    userId: user.id,
    userEmail: session.user.email
  }
}

export async function authenticateAdmin(request?: NextRequest): Promise<AuthenticatedRequest | ReturnType<typeof ApiResponse.forbidden>> {
  const authResult = await authenticate(request)
  
  if ('error' in authResult) {
    return authResult
  }

  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  
  if (!adminEmails.includes(authResult.userEmail)) {
    return ApiResponse.forbidden('Admin access required')
  }

  return authResult
}

export function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}