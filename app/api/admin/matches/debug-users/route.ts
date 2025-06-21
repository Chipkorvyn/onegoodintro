import { NextResponse } from 'next/server'
import { getUsersForMatching } from '@/lib/matching-utils'

export async function GET() {
  try {
    const users = await getUsersForMatching()
    
    return NextResponse.json({
      users,
      count: users.length,
      message: 'Debug: Users found for mutual matching'
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error.message 
    }, { status: 500 })
  }
}