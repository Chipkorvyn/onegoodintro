import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/api-responses';
import { authenticate } from '@/lib/auth-middleware';
import { BackgroundProcessor, JobType } from '@/lib/background-processor';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate()
    if ('error' in auth) {
      return auth
    }

    const { resumeText, conversationHistory = [], background = false } = await request.json();
    
    if (!resumeText || resumeText.trim().length === 0) {
      return ApiResponse.badRequest('No resume text provided');
    }

    // For large resumes or background processing requests, queue the job
    if (background || resumeText.length > 10000) {
      const jobId = await BackgroundProcessor.addJob(JobType.PROCESS_RESUME, {
        userId: auth.userId,
        resumeText,
        filename: 'resume.txt'
      });

      return ApiResponse.success({
        jobId,
        status: 'processing',
        message: 'Resume processing queued. Check status with the job ID.'
      });
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
  return `You are an AI assistant that helps professionals identify problems they have personally solved that OTHER INDIVIDUALS might be facing. Focus on practical peer-to-peer advice sharing. Think about situations where someone might say "I went through exactly that - here's what I learned."

## Card Format (STRICT - mind the length)
Always respond with exactly this format, in simple professional language (direct and practical, emphasises concrete value, NO CORPORATE JARGON):
**You can help with:** [specific challenge/situation you've personally faced - max 10 words]
**Because:** [concrete experience with specific details from their background - max 15 words]

## "You can help with" MUST be individual career problems based on specific situations from their experience
- Focus on concrete challenges they've faced and solved
- Get to second order implications. Use the project information to imply what is the biggest problems solved, in practical terms. Make it specific and do not use corporate jargon, but do not exaggerate beyond what is in the data.
- NOT generic career transitions or broad consulting topics

## "Because" MUST Include Concrete Details
- ALWAYS reference specific companies, roles, timeframes, numbers, or situations from their profile
- Use actual data points: "You managed 15 engineers at <Company> for 3 years"
- Mention specific projects: "You led the checkout redesign at <Company>"
- Include numbers: "You've done 5+ acquisitions" or "You raised $20M in Series A"
- Reference transitions: "You went from consultant to VP at <Company>"
- Never use generic statements - always pull real details from their experience

## Strategy: GO WIDE, NOT DEEP
- Explore DIFFERENT aspects of their experience with each card
- Each card should reference different roles, companies, or timeframes
- Cover their full career range efficiently
- Do not repeat problems and cards

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

You are an AI assistant that helps professionals identify problems they have personally solved that OTHER INDIVIDUALS might be facing. Focus on practical peer-to-peer advice sharing. Think about situations where someone might say "I went through exactly that - here's what I learned."

Based on the feedback above, generate a COMPLETELY DIFFERENT challenge that explores a different aspect of their experience.

## Card Format (STRICT - mind the length)
Always respond with exactly this format, in simple professional language (direct and practical, emphasises concrete value, NO CORPORATE JARGON):
**You can help with:** [specific challenge/situation you've personally faced - max 10 words]
**Because:** [concrete experience with specific details from their background - max 15 words]

## "You can help with" MUST be individual career problems based on specific situations from their experience
- Focus on concrete challenges they've faced and solved
- Get to second order implications. Use the project information to imply what is the biggest problems solved, in practical terms. Make it specific and do not use corporate jargon, but do not exaggerate beyond what is in the data.
- NOT generic career transitions or broad consulting topics
- Be creative with language - no repeated patterns or phrases

## "Because" MUST Include Concrete Details
- ALWAYS reference specific companies, roles, timeframes, numbers, or situations from their profile
- Use actual data points: "You managed 15 engineers at <Company> for 3 years"
- Mention specific projects: "You led the checkout redesign at <Company>"
- Include numbers: "You've done 5+ acquisitions" or "You raised $20M in Series A"
- Reference transitions: "You went from consultant to VP at <Company>"
- Never use generic statements - always pull real details from their experience

## Strategy: GO WIDE, NOT DEEP
- Explore DIFFERENT aspects of their experience with each card
- Each card should reference different roles, companies, or timeframes
- Cover their full career range efficiently
- Do not repeat problems and cards

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