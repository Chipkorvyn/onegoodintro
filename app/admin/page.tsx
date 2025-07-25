"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { HelpRequest } from '@/lib/supabase'

export default function AdminPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'requests' | 'matching'>('requests')
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState<any[]>([])
  const [matchingLoading, setMatchingLoading] = useState(false)

  useEffect(() => {
    loadAdminRequests()
  }, [])

  useEffect(() => {
    if (activeTab === 'matching') {
      loadPotentialMatches()
    }
  }, [activeTab])

  const loadAdminRequests = async () => {
    try {
      const response = await fetch('/api/admin/requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (error) {
      console.error('Error loading admin requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPotentialMatches = async () => {
    setMatchingLoading(true)
    try {
      const response = await fetch('/api/admin/matches')
      if (response.ok) {
        const data = await response.json()
        setMatches(data)
      }
    } catch (error) {
      console.error('Error loading matches:', error)
    } finally {
      setMatchingLoading(false)
    }
  }

  const runMatching = async () => {
    console.log('🔄 Starting matching process...')
    setMatchingLoading(true)
    try {
      console.log('📡 Calling API...')
      const response = await fetch('/api/admin/matches/generate', { method: 'POST' })
      console.log('📊 Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ API Success! Received data:', data)
        console.log('📊 Data length:', data.length)
        if (data.length === 0) {
          console.log('⚠️ No matches returned - check server logs for details')
        }
        setMatches(data)
      } else {
        const errorText = await response.text()
        console.error('❌ API Error:', response.status, errorText)
      }
    } catch (error) {
      console.error('💥 Network Error:', error)
    } finally {
      setMatchingLoading(false)
      console.log('🏁 Matching process finished')
    }
  }

  const confirmMatch = async (matchId: string) => {
    console.log('✅ Confirm button clicked for match ID:', matchId)
    try {
      const response = await fetch(`/api/admin/matches/${matchId}/confirm`, { method: 'POST' })
      console.log('📊 Confirm response status:', response.status)
      
      if (response.ok) {
        console.log('✅ Match confirmed successfully!')
        loadPotentialMatches()
      } else {
        const errorText = await response.text()
        console.error('❌ Confirm failed:', response.status, errorText)
      }
    } catch (error) {
      console.error('💥 Confirm error:', error)
    }
  }

  const rejectMatch = async (matchId: string) => {
    try {
      const response = await fetch(`/api/admin/matches/${matchId}/reject`, { method: 'POST' })
      if (response.ok) {
        loadPotentialMatches()
      }
    } catch (error) {
      console.error('Error rejecting match:', error)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
          <p className="text-gray-600">Please sign in to access the admin dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Help Requests ({requests.length})
            </button>
            <button
              onClick={() => {
                console.log('🔀 Switching to matching tab')
                setActiveTab('matching')
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'matching'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Matching
            </button>
          </nav>
        </div>

        {/* Help Requests Tab */}
        {activeTab === 'requests' && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading requests...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">"{request.title}"</h3>
                        <p className="text-gray-600 text-sm">by {request.users?.name || request.user_id}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'active' ? 'bg-green-100 text-green-800' :
                        request.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2"><strong>Context:</strong> {request.proof}</p>
                    <p className="text-gray-700 mb-2"><strong>Looking for:</strong> {request.help_type}</p>
                    <p className="text-gray-700"><strong>Timeline:</strong> {request.timeline}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Matching Tab */}
        {activeTab === 'matching' && (
          <div>
            <div className="mb-6">
              <button
                onClick={() => {
                  console.log('🎯 Run Matching button clicked!')
                  runMatching()
                }}
                disabled={matchingLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {matchingLoading ? 'Running Matching...' : 'Run Mutual Matching'}
              </button>
            </div>

            {matchingLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating mutual matches...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {matches.map((match) => (
                  <div key={match.id} className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Mutual Match #{match.id}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            match.mutual_score >= 8 ? 'bg-green-100 text-green-800' :
                            match.mutual_score >= 6 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            Score: {match.mutual_score}/10 • {match.match_type}
                          </span>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            match.status === 'confirmed' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {match.status === 'confirmed' ? '✓ Confirmed' : 'Pending'}
                          </span>
                        </div>
                      </div>
                      {match.status === 'pending' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => confirmMatch(match.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => rejectMatch(match.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Confirmed • Users can now see this match
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold text-blue-600 mb-2">{match.user1.name}</h4>
                        <p className="text-sm mb-2"><strong>Gives:</strong> {match.user1_gives}</p>
                        <p className="text-sm"><strong>Gets:</strong> {match.user1_gets}</p>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold text-green-600 mb-2">{match.user2.name}</h4>
                        <p className="text-sm mb-2"><strong>Gives:</strong> {match.user2_gives}</p>
                        <p className="text-sm"><strong>Gets:</strong> {match.user2_gets}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-2">Why This Works</h4>
                      <p className="text-sm text-gray-600">{match.rationale}</p>
                    </div>
                  </div>
                ))}

                {matches.length === 0 && !matchingLoading && (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No mutual matches available. Click "Run Mutual Matching" to generate new matches.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}