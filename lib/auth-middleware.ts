import { ApiResponse } from '@/lib/api-responses'
import { createClient } from '@supabase/supabase-js'
import type { Session } from 'next-auth'
import type { NextRequest } from 'next/server'

export interface AuthenticatedRequest {
  session: Session
  userId: string
  userEmail: string
}

// New function that takes session as parameter instead of calling getServerSession
export async function authenticateWithSession(
  session: Session | null,
  request?: NextRequest
): Promise<AuthenticatedRequest | ReturnType<typeof ApiResponse.unauthorized>> {
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

// Keep the old function for backward compatibility but mark as deprecated
export async function authenticate(request: NextRequest): Promise<AuthenticatedRequest | ReturnType<typeof ApiResponse.unauthorized>> {
  // This function is deprecated - use authenticateWithSession instead
  throw new Error('authenticate() is deprecated. Use authenticateWithSession() and pass session explicitly.')
}

export async function authenticateAdminWithSession(
  session: Session | null,
  request?: NextRequest
): Promise<AuthenticatedRequest | ReturnType<typeof ApiResponse.forbidden>> {
  const authResult = await authenticateWithSession(session, request)
  
  if ('error' in authResult) {
    return authResult
  }

  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  
  if (!adminEmails.includes(authResult.userEmail)) {
    return ApiResponse.forbidden('Admin access required')
  }

  return authResult
}

// Keep the old function for backward compatibility but mark as deprecated
export async function authenticateAdmin(request: NextRequest): Promise<AuthenticatedRequest | ReturnType<typeof ApiResponse.forbidden>> {
  // This function is deprecated - use authenticateAdminWithSession instead
  throw new Error('authenticateAdmin() is deprecated. Use authenticateAdminWithSession() and pass session explicitly.')
}

export function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}