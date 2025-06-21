import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/api-responses'
import { authenticate } from '@/lib/auth-middleware'
import { FileUtils } from '@/lib/file-utils'
import { detectUrlType, extractYoutubeVideoId } from '@/lib/url-processor'

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate()
    if ('error' in auth) {
      return auth
    }

    const { url } = await request.json()
    
    if (!url || typeof url !== 'string') {
      return ApiResponse.badRequest('Invalid URL')
    }

    // Validate URL format and security
    if (!FileUtils.isValidURL(url)) {
      return ApiResponse.badRequest('Invalid URL format')
    }

    // Security check: prevent SSRF attacks
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    
    const blockedHosts = [
      'localhost', '127.0.0.1', '0.0.0.0',
      '10.', '192.168.', '172.16.', '172.17.', '172.18.', '172.19.',
      '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
      '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.',
      '169.254.' // Link-local
    ]
    
    const isBlocked = blockedHosts.some(blocked => 
      hostname === blocked || hostname.startsWith(blocked)
    )
    
    if (isBlocked) {
      return ApiResponse.badRequest('URL is not allowed')
    }

    const type = detectUrlType(url)
    
    if (type === 'youtube') {
      const videoId = extractYoutubeVideoId(url)
      if (!videoId) {
        return ApiResponse.badRequest('Invalid YouTube URL')
      }
      
      // Try to get YouTube metadata via oEmbed
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
        const response = await fetch(oembedUrl)
        
        if (response.ok) {
          const data = await response.json()
          return ApiResponse.success({
            type: 'youtube',
            url,
            metadata: {
              title: data.title,
              thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              videoId,
              siteName: 'YouTube'
            }
          })
        }
      } catch (error) {
        console.error('Failed to fetch YouTube metadata:', error)
      }
      
      // Fallback
      return ApiResponse.success({
        type: 'youtube',
        url,
        metadata: {
          title: 'YouTube Video',
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          videoId,
          siteName: 'YouTube'
        }
      })
    }
    
    // For regular websites, fetch OpenGraph data
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OneGoodIntro/1.0)'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch website')
      }
      
      const html = await response.text()
      
      // Simple regex-based OpenGraph parser
      const getMetaContent = (property: string): string | undefined => {
        const regex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i')
        const match = html.match(regex)
        if (match) return match[1]
        
        // Try name attribute as fallback
        const nameRegex = new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i')
        const nameMatch = html.match(nameRegex)
        return nameMatch?.[1]
      }
      
      const getTitleFromHTML = (): string => {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        return titleMatch?.[1] || new URL(url).hostname
      }
      
      const metadata = {
        title: getMetaContent('og:title') || getMetaContent('twitter:title') || getTitleFromHTML(),
        description: getMetaContent('og:description') || getMetaContent('description') || getMetaContent('twitter:description'),
        thumbnail: getMetaContent('og:image') || getMetaContent('twitter:image'),
        siteName: getMetaContent('og:site_name') || new URL(url).hostname,
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`
      }
      
      return ApiResponse.success({
        type: 'website',
        url,
        metadata
      })
    } catch (error) {
      console.error('Failed to fetch website metadata:', error)
      
      // Fallback for websites
      return ApiResponse.success({
        type: 'website',
        url,
        metadata: {
          title: new URL(url).hostname,
          siteName: new URL(url).hostname,
          favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`
        }
      })
    }
  } catch (error) {
    console.error('Error processing URL:', error)
    return ApiResponse.internalServerError('Failed to process URL')
  }
}