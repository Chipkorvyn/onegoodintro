import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST() {
  try {
    console.log('🚀 Starting match generation...')
    
    // Get active help requests that need matches
    const { data: helpRequests, error: requestsError } = await supabase
      .from('help_requests')
      .select(`
        *,
        users!help_requests_user_id_fkey (
          id,
          name,
          email,
          background,
          current_focus,
          role_title,
          industry,
          focus_area,
          experience_years
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    
    if (requestsError) {
      console.error('Error fetching help requests:', requestsError)
      return NextResponse.json({ error: 'Failed to fetch help requests' }, { status: 500 })
    }

    console.log(`📋 Found ${helpRequests?.length || 0} help requests:`, helpRequests?.map(r => ({
      id: r.id,
      title: r.title,
      user: r.users?.name,
      status: r.status
    })))

    // Get all users who could potentially help (excluding those who already have requests)
    const seekerIds = helpRequests?.map(req => req.user_id) || []
    
    const { data: potentialHelpers, error: helpersError } = await supabase
      .from('users')
      .select('*')
      .not('id', 'in', `(${seekerIds.join(',')})`)
      .not('current_focus', 'is', null)
    
    if (helpersError) {
      console.error('Error fetching potential helpers:', helpersError)
      return NextResponse.json({ error: 'Failed to fetch potential helpers' }, { status: 500 })
    }

    console.log(`👥 Found ${potentialHelpers?.length || 0} potential helpers:`, potentialHelpers?.map(h => ({
      id: h.id,
      name: h.name,
      current_focus: h.current_focus
    })))

    const matches = []

    // Generate matches using LLM
    for (const request of helpRequests || []) {
      const seeker = request.users
      
      // Create context for LLM matching
      const seekerContext = `
        Seeker: ${seeker.name}
        Professional Summary: ${seeker.current_focus || 'Not provided'}
        Background: ${seeker.background || 'Not provided'}
        Role/Title: ${seeker.role_title || 'Not provided'}
        Industry: ${seeker.industry || 'Not provided'}
        Focus Area: ${seeker.focus_area || 'Not provided'}
        Experience: ${seeker.experience_years || 'Not provided'}
        Help Request: ${request.title}
        Help Type: ${request.help_type}
        Context: ${request.proof}
        Timeline: ${request.timeline}
      `

      // Find best matches using LLM
      const helpersContext = potentialHelpers?.slice(0, 10).map(helper => `
        Helper ID: ${helper.id}
        Name: ${helper.name}
        Professional Summary: ${helper.current_focus || 'Not provided'}
        Background: ${helper.background || 'Not provided'}
        Role/Title: ${helper.role_title || 'Not provided'}
        Industry: ${helper.industry || 'Not provided'}
        Focus Area: ${helper.focus_area || 'Not provided'}
        Experience: ${helper.experience_years || 'Not provided'}
      `).join('\n\n') || ''

      const prompt = `
        You are a professional networking matching system. Given a help seeker and potential helpers, identify the top 2-3 best matches and provide rationale.

        HELP SEEKER:
        ${seekerContext}

        POTENTIAL HELPERS:
        ${helpersContext}

        Return a JSON array of matches in this format:
        [
          {
            "helper_id": "helper_uuid",
            "match_score": 0.85,
            "rationale": "Brief explanation of why this is a good match based on background, expertise, and current focus alignment"
          }
        ]

        Only include matches with score > 0.5. Focus on relevant experience, skills, and industry alignment.
      `

      try {
        console.log(`🤖 Sending request to OpenAI for: ${request.title}`)
        console.log('📝 Prompt preview:', prompt.substring(0, 200) + '...')
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 1000,
        })

        const responseText = completion.choices[0]?.message?.content
        console.log('🤖 OpenAI response:', responseText)
        
        if (responseText) {
          const llmMatches = JSON.parse(responseText)
          console.log(`✅ Parsed ${llmMatches.length} matches for request: ${request.title}`)
          
          for (const match of llmMatches) {
            // Insert potential match into database
            const { data: insertedMatch, error: insertError } = await supabase
              .from('potential_matches')
              .insert({
                seeker_id: seeker.id,
                helper_id: match.helper_id,
                request_id: request.id,
                match_score: match.match_score,
                rationale: match.rationale,
                status: 'pending'
              })
              .select()
              .single()

            if (!insertError && insertedMatch) {
              // Get helper details for response
              const helper = potentialHelpers?.find(h => h.id === match.helper_id)
              
              matches.push({
                id: insertedMatch.id,
                seeker: {
                  name: seeker.name,
                  email: seeker.email,
                  background: seeker.background,
                  request_title: request.title,
                  help_type: request.help_type
                },
                helper: {
                  name: helper?.name || 'Unknown',
                  email: helper?.email || '',
                  background: helper?.background || '',
                  current_focus: helper?.current_focus || ''
                },
                rationale: match.rationale
              })
            }
          }
        }
      } catch (llmError) {
        console.error('LLM matching error for request', request.id, ':', llmError)
        // Continue with other requests even if one fails
      }
    }

    console.log(`🎯 Final result: Generated ${matches.length} total matches`)
    return NextResponse.json(matches)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}