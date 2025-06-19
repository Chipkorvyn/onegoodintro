"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Match {
  id: string
  other_user: {
    name: string
    email: string
    background: string
    current_focus: string
  }
  request: {
    title: string
    help_type: string
    proof: string
  }
  rationale: string
  is_seeker: boolean
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

export default function MatchesPage() {
  const { data: session, status } = useSession()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      loadMatches()
    }
  }, [status])

  const loadMatches = async () => {
    try {
      const response = await fetch('/api/matches')
      if (response.ok) {
        const data = await response.json()
        setMatches(data)
      }
    } catch (error) {
      console.error('Error loading matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (matchId: string) => {
    try {
      const response = await fetch(`/api/matches/${matchId}/accept`, {
        method: 'POST'
      })
      if (response.ok) {
        // Update local state
        setMatches(matches.map(match => 
          match.id === matchId 
            ? { ...match, status: 'accepted' as const }
            : match
        ))
      }
    } catch (error) {
      console.error('Error accepting match:', error)
    }
  }

  const handleDecline = async (matchId: string) => {
    try {
      const response = await fetch(`/api/matches/${matchId}/decline`, {
        method: 'POST'
      })
      if (response.ok) {
        // Remove from local state
        setMatches(matches.filter(match => match.id !== matchId))
      }
    } catch (error) {
      console.error('Error declining match:', error)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-gray-600">Please sign in to view your matches.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Your Matches</h1>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading matches...</p>
            </div>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🤝</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No matches yet</h2>
            <p className="text-gray-600">
              We're working on finding the perfect matches for you. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {matches.map((match) => (
              <div key={match.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {match.is_seeker ? 'Someone can help you!' : 'Someone needs your help!'}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(match.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {match.status === 'accepted' && (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        Accepted
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {match.is_seeker ? 'Your Helper' : 'Person Seeking Help'}
                      </h3>
                      <p className="font-medium text-lg">{match.other_user.name}</p>
                      <p className="text-sm text-gray-600 mb-2">{match.other_user.email}</p>
                      <p className="text-sm mb-2">
                        <strong>Background:</strong> {match.other_user.background}
                      </p>
                      <p className="text-sm">
                        <strong>Current Focus:</strong> {match.other_user.current_focus}
                      </p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {match.is_seeker ? 'Your Request' : 'Help Needed'}
                      </h3>
                      <p className="font-medium text-lg mb-2">{match.request.title}</p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Type:</strong> {match.request.help_type}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Context:</strong> {match.request.proof}
                      </p>
                    </div>
                  </div>

                  {match.rationale && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-blue-900 mb-2">Why this match?</h4>
                      <p className="text-blue-800 text-sm">{match.rationale}</p>
                    </div>
                  )}

                  {match.status === 'pending' && (
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleAccept(match.id)}
                        className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-medium"
                      >
                        Accept Introduction
                      </button>
                      <button
                        onClick={() => handleDecline(match.id)}
                        className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 font-medium"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {match.status === 'accepted' && (
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <h4 className="font-semibold text-green-900 mb-2">
                        🎉 You've accepted this introduction!
                      </h4>
                      <p className="text-green-800 text-sm">
                        {match.is_seeker 
                          ? `${match.other_user.name} will be notified and can reach out to help you.`
                          : `${match.other_user.name} will be notified that you're ready to help.`
                        }
                      </p>
                      <p className="text-green-800 text-sm mt-2">
                        This connection will appear in your network once both parties accept.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}