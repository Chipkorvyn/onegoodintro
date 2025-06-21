import React, { memo, useMemo, useCallback } from 'react'

// Higher-order component for memoizing components with props comparison
export function withMemo<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  propsAreEqual?: (prevProps: T, nextProps: T) => boolean
) {
  return memo(Component, propsAreEqual)
}

// Hook for memoizing expensive computations
export function useExpensiveComputation<T>(
  computation: () => T,
  dependencies: React.DependencyList
): T {
  return useMemo(computation, dependencies)
}

// Hook for memoizing callback functions
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: React.DependencyList
): T {
  return useCallback(callback, dependencies)
}

// Hook for debouncing values
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Hook for throttling values
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value)
  const lastRan = React.useRef(Date.now())

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}

// Virtualized list component for large datasets
interface VirtualizedListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  itemHeight: number
  containerHeight: number
  overscan?: number
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 5
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0)

  const totalHeight = items.length * itemHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = items.slice(startIndex, endIndex + 1)

  const handleScroll = useStableCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${startIndex * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) =>
            renderItem(item, startIndex + index)
          )}
        </div>
      </div>
    </div>
  )
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = React.useRef<number>()
  const renderCount = React.useRef(0)

  React.useEffect(() => {
    renderStartTime.current = performance.now()
  })

  React.useEffect(() => {
    renderCount.current++
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current
      if (renderTime > 16) { // More than one frame
        console.warn(
          `Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms (render #${renderCount.current})`
        )
      }
    }
  })

  return {
    renderCount: renderCount.current,
    logRenderTime: () => {
      if (renderStartTime.current) {
        console.log(
          `${componentName} render time: ${(performance.now() - renderStartTime.current).toFixed(2)}ms`
        )
      }
    }
  }
}

// Optimized image component with lazy loading
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  fallback?: string
  loading?: 'lazy' | 'eager'
}

export const OptimizedImage = memo(({
  src,
  alt,
  fallback = '/placeholder.svg',
  loading = 'lazy',
  ...props
}: OptimizedImageProps) => {
  const [imageSrc, setImageSrc] = React.useState(src)
  const [isLoading, setIsLoading] = React.useState(true)

  const handleLoad = useStableCallback(() => {
    setIsLoading(false)
  }, [])

  const handleError = useStableCallback(() => {
    setImageSrc(fallback)
    setIsLoading(false)
  }, [fallback])

  return (
    <img
      {...props}
      src={imageSrc}
      alt={alt}
      loading={loading}
      onLoad={handleLoad}
      onError={handleError}
      style={{
        ...props.style,
        opacity: isLoading ? 0.5 : 1,
        transition: 'opacity 0.3s ease'
      }}
    />
  )
})

OptimizedImage.displayName = 'OptimizedImage'

// Data fetching hook with caching
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    staleTime?: number
    cacheTime?: number
  } = {}
) {
  const { staleTime = 5 * 60 * 1000, cacheTime = 10 * 60 * 1000 } = options
  
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const cacheRef = React.useRef<{
    data: T
    timestamp: number
  } | null>(null)

  const fetchData = useStableCallback(async () => {
    // Check cache first
    if (cacheRef.current) {
      const { data: cachedData, timestamp } = cacheRef.current
      const age = Date.now() - timestamp
      
      if (age < staleTime) {
        setData(cachedData)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      setData(result)
      cacheRef.current = {
        data: result,
        timestamp: Date.now()
      }

      // Clear cache after cacheTime
      setTimeout(() => {
        cacheRef.current = null
      }, cacheTime)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [fetcher, staleTime, cacheTime])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}