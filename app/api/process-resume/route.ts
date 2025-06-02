import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { resumeText, conversationHistory = [] } = await request.json();
    
    if (!resumeText || resumeText.trim().length === 0) {
      return NextResponse.json({ error: 'No resume text provided' }, { status: 400 });
    }

    console.log('Processing resume with conversation history:', conversationHistory.length, 'previous interactions');

    // Use your proven prompt logic
    const prompt = conversationHistory.length === 0 
      ? generateFirstPrompt(resumeText)
      : generateEnhancedPrompt(resumeText, conversationHistory);

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      console.error('Claude API error:', claudeResponse.status, claudeResponse.statusText);
      return NextResponse.json({ error: 'AI processing failed' }, { status: 500 });
    }

    const claudeData = await claudeResponse.json();
    const responseText = claudeData.content[0]?.text;

    if (!responseText) {
      return NextResponse.json({ error: 'No content generated' }, { status: 500 });
    }

    // Parse response using your proven logic
    const statementMatch = responseText.match(/\*\*You can help with:\*\*\s*(.*?)(?=\*\*Because:|$)/s);
    const reasonMatch = responseText.match(/\*\*Because:\*\*\s*(.*?)(?=\*\*|$)/s);

    if (!statementMatch || !reasonMatch) {
      console.error('Failed to parse response:', responseText);
      return NextResponse.json({ error: 'Unable to parse AI response' }, { status: 500 });
    }

    const title = statementMatch[1].trim();
    const proof = reasonMatch[1].trim();

    // Validate response quality (your validation logic)
    const warnings = validateResponse(responseText);
    if (warnings.length > 0) {
      console.warn('Response validation warnings:', warnings);
    }

    console.log('Generated resume card:', { title, proof });

    return NextResponse.json({
      title,
      proof,
      success: true
    });

  } catch (error) {
    console.error('Resume processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Your proven prompt generation functions
function generateFirstPrompt(resumeText: string): string {
  return `You are reading a resume/LinkedIn profile written for job applications. Extract what peer advice this person could share based on challenges they've personally navigated in their career.

## Card Format (STRICT - mind the length)
Always respond with exactly this format, using natural workplace conversation language - sound like someone sharing experience in a casual work conversation, no corporate jargon, just real talk:
**You can help with:** [specific challenge/situation they've personally navigated - max 10 words]
**Because:** [concrete experience with specific details from their background - max 15 words]

## "You can help with" MUST be challenges they've personally faced that other individuals might also be dealing with
- Focus on concrete situations they've navigated and solved
- Think: "What struggles has this person been through that others face too?"

## "Because" MUST Include Concrete Details
- ALWAYS reference specific companies, roles, timeframes, numbers, or situations from their profile
- Use actual data points from their experience
- Mention specific projects or achievements
- Include numbers where available
- Never use generic statements - always pull real details from their experience

## Examples of GOOD "Because" statement formats:
- "You [specific action] at [Company] for [timeframe]"
- "You [achievement] including [specific detail/number]"
- "You [leadership role] [team size/scope] at [Company]"

## Strategy: GO WIDE, NOT DEEP
- Explore DIFFERENT aspects of their experience with each card
- Each card should reference different roles, companies, or timeframes
- Cover their full career range efficiently
- Do not repeat problems and cards

## After Each Card:
ALWAYS ask: "Is this experience accurate? Can you help individuals with this? Please respond with YES or NO."

Profile text to analyze:
${resumeText}

IMPORTANT: Generate the card immediately using the exact format above. Do not ask for clarification or additional context.`;
}

function generateEnhancedPrompt(resumeText: string, conversationHistory: any[]): string {
  // Build conversation history
  const historyText = conversationHistory.map(item => 
    `Assistant: **You can help with:** ${item.statement}
**Because:** ${item.reason}
User: ${item.response === 'yes' ? 'Yes, I can help' : 'No, not really'}`
  ).join('\n\n');
  
  return `Previous conversation:
${historyText}

IMPORTANT: Don't repeat previous words/phrases. Be creative with language.

You are reading a resume/LinkedIn profile written for job applications. Extract what peer advice this person could share based on challenges they've personally navigated in their career.

Based on the feedback above, generate a COMPLETELY DIFFERENT challenge that explores a different aspect of their experience.

## Card Format (STRICT - mind the length)
Always respond with exactly this format, using natural workplace conversation language - sound like someone sharing experience in a casual work conversation, no corporate jargon, just real talk:
**You can help with:** [specific challenge/situation they've personally navigated - max 10 words]
**Because:** [concrete experience with specific details from their background - max 15 words]

## "You can help with" MUST be challenges they've personally faced that other individuals might also be dealing with
- Focus on concrete situations they've navigated and solved
- Think: "What struggles has this person been through that others face too?"
- Be creative with language - no repeated patterns or phrases

## "Because" MUST Include Concrete Details
- ALWAYS reference specific companies, roles, timeframes, numbers, or situations from their profile
- Use actual data points from their experience
- Mention specific projects or achievements
- Include numbers where available
- Never use generic statements - always pull real details from their experience

## Examples of GOOD "Because" statement formats:
- "You [specific action] at [Company] for [timeframe]"
- "You [achievement] including [specific detail/number]"
- "You [leadership role] [team size/scope] at [Company]"

## Strategy: GO WIDE, NOT DEEP
- Explore DIFFERENT aspects of their experience with each card
- Each card should reference different roles, companies, or timeframes
- Cover their full career range efficiently
- Do not repeat problems and cards

## After Each Card:
ALWAYS ask: "Is this experience accurate? Can you help individuals with this? Please respond with YES or NO."

Profile text to analyze:
${resumeText}

IMPORTANT: Generate the card immediately using the exact format above. Do not ask for clarification or additional context.`;
}

function validateResponse(response: string): string[] {
  const warnings: string[] = [];
  
  // Check for generic phrases that suggest non-specific content
  const genericPhrases = [
    'years of experience',
    'multiple projects',
    'various companies',
    'successful track record',
    'proven ability',
    'extensive experience'
  ];

  genericPhrases.forEach(phrase => {
    if (response.toLowerCase().includes(phrase.toLowerCase())) {
      warnings.push(`Response contains generic phrase: "${phrase}"`);
    }
  });

  // Check for proper structure
  if (!response.includes('**You can help with:**')) {
    warnings.push('Missing "You can help with:" section');
  }
  if (!response.includes('**Because:**')) {
    warnings.push('Missing "Because:" section');
  }

  // Check for specific details
  const hasNumbers = /\d+/.test(response);
  if (!hasNumbers) {
    warnings.push('Response lacks specific numbers or metrics');
  }

  const hasCompanyNames = /[A-Z][a-zA-Z]{2,}/.test(response);
  if (!hasCompanyNames) {
    warnings.push('Response may lack company names');
  }

  return warnings;
}