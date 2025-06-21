import { createClient, SupabaseClient } from '@supabase/supabase-js'

let adminSupabaseInstance: SupabaseClient | null = null

export function getAdminSupabase(): SupabaseClient {
  if (!adminSupabaseInstance) {
    adminSupabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return adminSupabaseInstance
}

export async function withTransaction<T>(
  supabase: SupabaseClient,
  callback: (client: SupabaseClient) => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const result = await callback(supabase)
    return { success: true, data: result }
  } catch (error) {
    console.error('Transaction failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Transaction failed' 
    }
  }
}

export interface PaginationOptions {
  page?: number
  limit?: number
  orderBy?: string
  ascending?: boolean
}

export function applyPagination<T extends any>(
  query: any,
  options: PaginationOptions = {}
): any {
  const { 
    page = 1, 
    limit = 20, 
    orderBy = 'created_at', 
    ascending = false 
  } = options

  const offset = (page - 1) * limit

  return query
    .order(orderBy, { ascending })
    .range(offset, offset + limit - 1)
}

export async function getUserByEmail(email: string) {
  const supabase = getAdminSupabase()
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

export async function getOrCreateUser(email: string, name?: string | null) {
  const existingUser = await getUserByEmail(email)
  if (existingUser) {
    return existingUser
  }

  const supabase = getAdminSupabase()
  
  const { data, error } = await supabase
    .from('users')
    .insert({ 
      email, 
      name: name || email.split('@')[0],
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create user:', error)
    return null
  }

  return data
}

export interface QueryError {
  message: string
  code?: string
  details?: any
}

export function formatDatabaseError(error: any): QueryError {
  if (error.code === '23505') {
    return {
      message: 'Duplicate entry found',
      code: 'DUPLICATE_ENTRY',
      details: error.details
    }
  }
  
  if (error.code === '23503') {
    return {
      message: 'Referenced record not found',
      code: 'FOREIGN_KEY_VIOLATION',
      details: error.details
    }
  }
  
  if (error.code === '23502') {
    return {
      message: 'Required field is missing',
      code: 'NOT_NULL_VIOLATION',
      details: error.details
    }
  }
  
  return {
    message: error.message || 'Database operation failed',
    code: error.code,
    details: error.details
  }
}