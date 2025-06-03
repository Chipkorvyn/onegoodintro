"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { HelpRequest } from '@/lib/supabase'

export default function AdminPage() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAdminRequests()
  }, [])

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
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading requests...</p>
          </div>
        </div>
      ) : (
        <div className="p-8">
          <h2 className="text-xl font-bold mb-4">All Help Requests ({requests.length})</h2>
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
        </div>
      )}
    </div>
  )
}