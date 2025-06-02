import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();
    
    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
    }

    console.log('Generating card from transcript:', transcript.substring(0, 100) + '...');

    // Claude API call
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `You are analyzing a voice transcript where someone describes their professional experience and what they can help others with.

TRANSCRIPT: "${transcript}"

Generate a help card with:
1. TITLE: Specific problem they can help others solve (max 60 characters)
2. PROOF: Why they can solve it based on their experience (max 120 characters)

Focus on:
- Specific situations (not generic advice)
- Credible evidence from their story
- Problems others actually need help with
- Professional language

Return JSON format:
{ "title": "...", "proof": "..." }

IMPORTANT: Keep within character limits and make it sound professional but conversational.`
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      console.error('Claude API error:', claudeResponse.status, claudeResponse.statusText);
      return NextResponse.json({ error: 'AI processing failed' }, { status: 500 });
    }

    const claudeData = await claudeResponse.json();
    const content = claudeData.content[0]?.text;

    if (!content) {
      return NextResponse.json({ error: 'No content generated' }, { status: 500 });
    }

    // Parse JSON response from Claude
    let cardData;
    try {
      cardData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', content);
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 });
    }

    if (!cardData.title || !cardData.proof) {
      return NextResponse.json({ error: 'Incomplete card data' }, { status: 500 });
    }

    console.log('Generated card:', cardData);

    return NextResponse.json({
      title: cardData.title,
      proof: cardData.proof,
      success: true
    });

  } catch (error) {
    console.error('Card generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}