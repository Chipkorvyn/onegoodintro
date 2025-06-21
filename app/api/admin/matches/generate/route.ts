import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/lib/api-responses'
import { authenticateAdmin, getAdminSupabase } from '@/lib/auth-middleware'
import { AIService } from '@/lib/ai-services'
import { getUsersForMatching, generateMutualMatchPrompt } from '@/lib/matching-utils'

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request)
    if ('error' in auth) {
      return auth
    }

    const supabase = getAdminSupabase()
    console.log('🚀 Starting mutual benefit matching...')

    // Get users for matching
    const users = await getUsersForMatching()
    console.log(`👥 Found ${users.length} users for matching:`, users.map(u => u.name))

    if (users.length < 2) {
      return NextResponse.json({ message: 'Need at least 2 users for matching', matches: [], users: users.length })
    }

    // Generate LLM prompt
    const prompt = generateMutualMatchPrompt(users)
    console.log('📝 Generated prompt for', users.length, 'users')

    // Call AI service
    const aiResponse = await AIService.generateWithGPT(prompt, {
      model: "gpt-4o-mini",
      temperature: 0.3,
      maxTokens: 2000
    })

    if (!aiResponse.success || !aiResponse.rawResponse) {
      console.error('AI generation failed:', aiResponse.error)
      return ApiResponse.internalServerError('Failed to generate matches')
    }

    const responseText = aiResponse.rawResponse
    console.log('🤖 AI response received')

    // Parse response using AI service utility
    const llmMatches = AIService.parseJSONResponse(responseText)
    
    if (!llmMatches || !Array.isArray(llmMatches)) {
      console.error('Invalid AI response format')
      return ApiResponse.internalServerError('Invalid AI response format')
    }
    console.log(`✅ Parsed ${llmMatches.length} mutual matches:`, llmMatches)

    // Save matches to database
    const savedMatches = []
    for (const match of llmMatches) {
      // Find users by ID (more robust than name matching)
      const user1 = users.find(u => u.id === match.user1_id)
      const user2 = users.find(u => u.id === match.user2_id)

      if (!user1 || !user2) {
        console.warn('⚠️ Could not find users for match:', match.user1_id, match.user2_id)
        console.warn('Available user IDs:', users.map(u => u.id))
        continue
      }

      // Save to database
      const { data: savedMatch, error } = await supabase
        .from('potential_matches')
        .insert({
          user1_id: user1.id,
          user2_id: user2.id,
          match_type: match.match_type,
          mutual_score: match.mutual_score,
          user1_gives: match.user1_gives,
          user1_gets: match.user1_gets,
          user2_gives: match.user2_gives,
          user2_gets: match.user2_gets,
          rationale: match.rationale,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error saving match:', error)
        console.error('Match data:', {
          user1_id: user1.id,
          user2_id: user2.id,
          match_type: match.match_type,
          mutual_score: match.mutual_score
        })
        continue
      }

      console.log('✅ Successfully saved match:', savedMatch.id)

      savedMatches.push({
        id: savedMatch.id,
        user1: { name: user1.name, id: user1.id },
        user2: { name: user2.name, id: user2.id },
        match_type: match.match_type,
        mutual_score: match.mutual_score,
        user1_gives: match.user1_gives,
        user1_gets: match.user1_gets,
        user2_gives: match.user2_gives,
        user2_gets: match.user2_gets,
        rationale: match.rationale
      })
    }

    console.log(`🎯 Successfully saved ${savedMatches.length} matches`)
    return ApiResponse.success(savedMatches)

  } catch (error) {
    console.error('💥 Matching error:', error)
    return ApiResponse.internalServerError('Matching failed')
  }
}