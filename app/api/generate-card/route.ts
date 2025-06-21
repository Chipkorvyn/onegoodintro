import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-responses';
import { AIService } from '@/lib/ai-services';

interface CardData {
  title: string;
  proof: string;
}

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();
    
    if (!transcript || transcript.trim().length === 0) {
      return ApiResponse.badRequest('No transcript provided');
    }

    console.log('Generating card from transcript:', transcript.substring(0, 100) + '...');

    const prompt = `You are analyzing a voice transcript where someone describes their professional experience and what they can help others with.

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

IMPORTANT: Keep within character limits and make it sound professional but conversational, no corporate jargon.`;

    const response = await AIService.generateWithClaude<CardData>(prompt, {
      model: 'claude-3-sonnet-20240229',
      maxTokens: 300
    });

    if (!response.success || !response.data) {
      console.error('AI generation failed:', response.error);
      return ApiResponse.internalServerError('AI processing failed');
    }

    if (!response.data.title || !response.data.proof) {
      return ApiResponse.internalServerError('Incomplete card data');
    }

    console.log('Generated card:', response.data);

    return ApiResponse.success({
      title: response.data.title,
      proof: response.data.proof,
      success: true
    });

  } catch (error) {
    console.error('Card generation error:', error);
    return ApiResponse.internalServerError('Internal server error');
  }
}