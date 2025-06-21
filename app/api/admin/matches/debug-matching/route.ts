import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUsersForMatching, generateMutualMatchPrompt } from '@/lib/matching-utils'
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
  try {
    console.log('🔍 Starting debug matching process...')

    // Step 1: Check if we can get users
    const users = await getUsersForMatching()
    console.log(`👥 Found ${users.length} users for matching`)

    if (users.length < 2) {
      return NextResponse.json({
        step: 'users_check',
        error: 'Not enough users for matching',
        users_count: users.length,
        users: users
      })
    }

    // Step 2: Generate prompt
    const prompt = generateMutualMatchPrompt(users)
    console.log('📝 Generated prompt')

    // Step 3: Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        step: 'openai_key_check',
        error: 'OpenAI API key not found',
        has_key: false
      })
    }

    // Step 4: Try OpenAI call
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
      })

      const responseText = completion.choices[0]?.message?.content
      console.log('🤖 OpenAI response received')

      // Step 5: Try to parse response
      let cleanedResponse = responseText?.trim() || ''
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/\s*```$/, '')
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\s*/, '').replace(/\s*```$/, '')
      }

      let llmMatches
      try {
        llmMatches = JSON.parse(cleanedResponse)
      } catch (parseError) {
        return NextResponse.json({
          step: 'json_parse',
          error: 'Failed to parse OpenAI response as JSON',
          raw_response: responseText,
          cleaned_response: cleanedResponse,
          parse_error: parseError.message
        })
      }

      // Step 6: Check database schema
      const { data: schemaCheck, error: schemaError } = await supabase
        .from('potential_matches')
        .select('user1_id, user2_id, match_type, mutual_score')
        .limit(1)

      if (schemaError) {
        return NextResponse.json({
          step: 'database_schema',
          error: 'Database schema issue - new columns may not exist',
          schema_error: schemaError.message,
          suggestion: 'Run the SQL migration to add mutual matching columns'
        })
      }

      return NextResponse.json({
        step: 'success',
        users_count: users.length,
        users_summary: users.map(u => ({ name: u.name, expertise_count: u.proven_expertise.length, asks_count: u.current_asks.length })),
        prompt_length: prompt.length,
        openai_response_length: responseText?.length || 0,
        parsed_matches_count: llmMatches.length,
        parsed_matches: llmMatches,
        schema_check: 'OK - mutual matching columns exist'
      })

    } catch (openaiError) {
      return NextResponse.json({
        step: 'openai_call',
        error: 'OpenAI API call failed',
        openai_error: openaiError.message,
        has_key: !!process.env.OPENAI_API_KEY
      })
    }

  } catch (error) {
    return NextResponse.json({
      step: 'general_error',
      error: 'Debug matching failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}