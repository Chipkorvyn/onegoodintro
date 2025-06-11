import React, { useState } from 'react'
import { ExternalLink, Play, Globe } from 'lucide-react'

interface MediaPreviewProps {
  url: string
  type: 'youtube' | 'website'
  metadata?: {
    title?: string
    description?: string
    thumbnail?: string
    favicon?: string
    siteName?: string
    videoId?: string
  }
  className?: string
  onClick?: () => void
  allowPlayback?: boolean
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({ 
  url, 
  type, 
  metadata,
  className = '',
  onClick,
  allowPlayback = true
}) => {
  const [showIframe, setShowIframe] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleYoutubeClick = () => {
    if (onClick) {
      onClick()
    } else {
      setShowIframe(true)
    }
  }

  const handleWebsiteClick = () => {
    if (onClick) {
      onClick()
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  if (type === 'youtube' && metadata?.videoId) {
    if (showIframe) {
      return (
        <div className={`relative w-64 aspect-video rounded-lg overflow-hidden group ${className}`}>
          <iframe
            src={`https://www.youtube.com/embed/${metadata.videoId}?autoplay=1`}
            title={metadata.title || 'YouTube video'}
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
          
          {/* Close button - appears on hover */}
          <button
            onClick={() => setShowIframe(false)}
            className="absolute top-2 right-2 p-1 bg-black bg-opacity-60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-80"
            title="Close video"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Edit button - appears on hover */}
          {onClick && (
            <button
              onClick={onClick}
              className="absolute top-2 left-2 p-1 bg-black bg-opacity-60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-80"
              title="Edit link"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>
      )
    }

    // Small card design for YouTube with hover actions
    return (
      <div 
        className={`relative flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors group ${className}`}
      >
        {/* Thumbnail */}
        <div className="flex-shrink-0 relative w-16 h-12 rounded overflow-hidden">
          {metadata.thumbnail && !imageError ? (
            <img 
              src={metadata.thumbnail} 
              alt={metadata.title || 'YouTube video thumbnail'}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <Play className="w-4 h-4 text-gray-500" />
            </div>
          )}
          
          {/* Play button overlay - appears on hover */}
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => setShowIframe(true)}
          >
            <div className="bg-red-600 rounded-full p-1 hover:scale-110 transition-transform">
              <Play className="w-3 h-3 text-white fill-white" />
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">
            {metadata?.title || 'YouTube Video'}
          </p>
          {metadata?.description && (
            <p className="text-gray-400 text-xs line-clamp-1 mt-1">
              {metadata.description}
            </p>
          )}
        </div>
        
        {/* YouTube icon */}
        <div className="flex-shrink-0">
          <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
            <Play className="w-3 h-3 text-white fill-white" />
          </div>
        </div>

        {/* Edit button - appears on hover in top right */}
        {onClick && (
          <button
            onClick={onClick}
            className="absolute top-2 right-2 p-1 bg-gray-900 bg-opacity-80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-100"
            title="Edit link"
          >
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>
    )
  }

  if (type === 'website') {
    return (
      <div 
        className={`relative flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors group cursor-pointer ${className}`}
        onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
      >
        {/* Favicon or default icon */}
        <div className="flex-shrink-0">
          {metadata?.favicon && !imageError ? (
            <img 
              src={metadata.favicon} 
              alt={metadata.siteName || 'Website favicon'}
              className="w-8 h-8 rounded"
              onError={() => setImageError(true)}
            />
          ) : (
            <Globe className="w-8 h-8 text-gray-400" />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">
            {metadata?.title || new URL(url).hostname}
          </p>
          {metadata?.description && (
            <p className="text-gray-400 text-xs line-clamp-2 mt-1">
              {metadata.description}
            </p>
          )}
        </div>
        
        {/* External link icon */}
        <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />

        {/* Edit button - appears on hover in top right */}
        {onClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="absolute top-2 right-2 p-1 bg-gray-900 bg-opacity-80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-100"
            title="Edit link"
          >
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>
    )
  }

  return null
}