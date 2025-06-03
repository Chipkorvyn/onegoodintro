import { Anthropic } from '@anthropic-ai/sdk';

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json();
    
    if (!transcript || transcript.trim().length === 0) {
      return Response.json({ error: 'No transcript provided' }, { status: 400 });
    }
    
    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY!,
    });

    const prompt = `Based on this voice transcript, create a single well-formatted help request that follows this template:

"I need help with [specific challenge] because [brief reason]. I'd like to talk to someone who [type of person/experience]."

Voice transcript: "${transcript}"

Rules:
- Extract the core request without adding details not mentioned
- Keep it concise (1-2 sentences maximum)
- Follow the template structure exactly
- If something is unclear, use general language
- Don't make up specifics not in the transcript

Example output: "I need help with finding a technical co-founder because I don't have a development background. I'd like to talk to someone who has built a SaaS product from scratch."

Respond with ONLY the formatted request sentence, nothing else:`;

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    let responseContent = response.content[0];
    if (responseContent.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const formattedRequest = responseContent.text
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/\s+/g, ' ');

    return Response.json({ 
      formattedRequest: formattedRequest 
    });
  } catch (error) {
    console.error('Request generation error:', error);
    return Response.json({ error: 'Request generation failed' }, { status: 500 });
  }
} 