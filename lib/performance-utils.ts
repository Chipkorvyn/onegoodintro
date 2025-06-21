export interface CacheConfig {
  ttl: number
  key: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  orderBy?: string
  ascending?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export class PerformanceUtils {
  private static cache = new Map<string, { data: any; expires: number }>()

  static getCached<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (cached && cached.expires > Date.now()) {
      return cached.data as T
    }
    this.cache.delete(key)
    return null
  }

  static setCache<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlMs
    })
  }

  static clearCache(keyPattern?: string): void {
    if (!keyPattern) {
      this.cache.clear()
      return
    }
    
    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key)
      }
    }
  }

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(null, args), delay)
    }
  }

  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  static async withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs = 5 * 60 * 1000 // 5 minutes default
  ): Promise<T> {
    const cached = this.getCached<T>(key)
    if (cached) {
      return cached
    }

    const data = await fetcher()
    this.setCache(key, data, ttlMs)
    return data
  }

  static createPaginatedQuery(
    baseQuery: any,
    params: PaginationParams = {}
  ) {
    const {
      page = 1,
      limit = 20,
      orderBy = 'created_at',
      ascending = false
    } = params

    const offset = (page - 1) * limit

    return baseQuery
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1)
  }

  static async getPaginatedResults<T>(
    query: any,
    countQuery: any,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<T>> {
    const { page = 1, limit = 20 } = params

    const [{ data, error }, { count, error: countError }] = await Promise.all([
      query,
      countQuery
    ])

    if (error || countError) {
      throw new Error(error?.message || countError?.message || 'Query failed')
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  }

  static compressResponse(data: any): string {
    // Simple compression for large JSON responses
    return JSON.stringify(data, (key, value) => {
      // Remove null/undefined values
      if (value === null || value === undefined) {
        return undefined
      }
      // Truncate long strings if they're not essential
      if (typeof value === 'string' && value.length > 1000 && key !== 'content') {
        return value.substring(0, 1000) + '...'
      }
      return value
    })
  }

  static createCacheKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    return `${prefix}:${sortedParams}`
  }

  static async batchDatabaseOperations<T, R>(
    items: T[],
    operation: (batch: T[]) => Promise<R[]>,
    batchSize = 10
  ): Promise<R[]> {
    const results: R[] = []
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const batchResults = await operation(batch)
      results.push(...batchResults)
    }
    
    return results
  }

  static memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>()
    
    return ((...args: Parameters<T>): ReturnType<T> => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
      
      if (cache.has(key)) {
        return cache.get(key)!
      }
      
      const result = fn(...args)
      cache.set(key, result)
      return result
    }) as T
  }
}