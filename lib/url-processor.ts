export interface ProcessedMediaUrl {
  type: 'youtube' | 'website'
  url: string
  metadata: {
    title?: string
    description?: string
    thumbnail?: string
    favicon?: string
    siteName?: string
    duration?: string
    videoId?: string
  }
}

export function detectUrlType(url: string): 'youtube' | 'website' {
  const youtubePatterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]+)/
  ]
  
  for (const pattern of youtubePatterns) {
    if (pattern.test(url)) {
      return 'youtube'
    }
  }
  
  return 'website'
}

export function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}

export async function processMediaUrl(url: string): Promise<ProcessedMediaUrl> {
  const type = detectUrlType(url)
  
  if (type === 'youtube') {
    const videoId = extractYoutubeVideoId(url)
    if (!videoId) {
      throw new Error('Invalid YouTube URL')
    }
    
    // YouTube oEmbed endpoint doesn't require API key
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      const response = await fetch(oembedUrl)
      
      if (response.ok) {
        const data = await response.json()
        return {
          type: 'youtube',
          url,
          metadata: {
            title: data.title,
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            videoId,
            siteName: 'YouTube'
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch YouTube metadata:', error)
    }
    
    // Fallback if oEmbed fails
    return {
      type: 'youtube',
      url,
      metadata: {
        title: 'YouTube Video',
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        videoId,
        siteName: 'YouTube'
      }
    }
  }
  
  // For websites, we'll need server-side processing due to CORS
  // This will be handled by the API endpoint
  return {
    type: 'website',
    url,
    metadata: {
      title: new URL(url).hostname,
      description: 'Loading preview...',
      favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`
    }
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function normalizeUrl(url: string): string {
  // Remove any leading/trailing whitespace
  url = url.trim()
  
  // If it already has a protocol, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // If it starts with www., add https://
  if (url.startsWith('www.')) {
    return `https://${url}`
  }
  
  // If it looks like a domain (contains a dot but no spaces), add https://www.
  if (url.includes('.') && !url.includes(' ') && !url.includes('/')) {
    return `https://www.${url}`
  }
  
  // If it's a path or has slashes, add https://
  if (url.includes('/')) {
    return `https://${url}`
  }
  
  // Default: add https://www.
  return `https://www.${url}`
}