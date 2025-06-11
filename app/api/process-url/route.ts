import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { detectUrlType, extractYoutubeVideoId } from '@/lib/url-processor'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url } = await request.json()
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const type = detectUrlType(url)
    
    if (type === 'youtube') {
      const videoId = extractYoutubeVideoId(url)
      if (!videoId) {
        return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
      }
      
      // Try to get YouTube metadata via oEmbed
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
        const response = await fetch(oembedUrl)
        
        if (response.ok) {
          const data = await response.json()
          return NextResponse.json({
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
      return NextResponse.json({
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
      
      return NextResponse.json({
        type: 'website',
        url,
        metadata
      })
    } catch (error) {
      console.error('Failed to fetch website metadata:', error)
      
      // Fallback for websites
      return NextResponse.json({
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
    return NextResponse.json({ error: 'Failed to process URL' }, { status: 500 })
  }
}