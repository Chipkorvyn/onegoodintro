import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { OpenAI } from 'openai'
import { getUsersForMatching, generateMutualMatchPrompt } from '@/lib/matching-utils'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST() {
  try {
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

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    })

    const responseText = completion.choices[0]?.message?.content
    console.log('🤖 OpenAI response received:', responseText)

    if (!responseText) {
      return NextResponse.json({ error: 'No response from OpenAI' }, { status: 500 })
    }

    // Clean and parse response
    let cleanedResponse = responseText.trim()
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/\s*```$/, '')
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\s*/, '').replace(/\s*```$/, '')
    }

    console.log('🧹 Cleaned response:', cleanedResponse)

    const llmMatches = JSON.parse(cleanedResponse)
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
    return NextResponse.json(savedMatches)

  } catch (error) {
    console.error('💥 Matching error:', error)
    return NextResponse.json({ error: 'Matching failed', details: error.message }, { status: 500 })
  }
}