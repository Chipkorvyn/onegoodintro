import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export interface AIServiceConfig {
  temperature?: number
  maxTokens?: number
  model?: string
}

export interface AIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  rawResponse?: string
}

export class AIService {
  private static anthropic: Anthropic | null = null
  private static openai: OpenAI | null = null

  private static getAnthropic(): Anthropic {
    if (!this.anthropic) {
      this.anthropic = new Anthropic({
        apiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY!,
      })
    }
    return this.anthropic
  }

  private static getOpenAI(): OpenAI {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY!,
      })
    }
    return this.openai
  }

  static async generateWithClaude<T = any>(
    prompt: string,
    config: AIServiceConfig = {}
  ): Promise<AIResponse<T>> {
    try {
      const anthropic = this.getAnthropic()
      
      const response = await anthropic.messages.create({
        model: config.model || 'claude-3-5-sonnet-20241022',
        max_tokens: config.maxTokens || 1024,
        temperature: config.temperature || 0,
        messages: [{ role: 'user', content: prompt }]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        return { success: false, error: 'Unexpected response type' }
      }

      const parsedData = this.parseJSONResponse<T>(content.text)
      return {
        success: true,
        data: parsedData,
        rawResponse: content.text
      }
    } catch (error) {
      console.error('Claude API error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate with Claude' 
      }
    }
  }

  static async generateWithGPT<T = any>(
    prompt: string,
    config: AIServiceConfig = {}
  ): Promise<AIResponse<T>> {
    try {
      const openai = this.getOpenAI()
      
      const response = await openai.chat.completions.create({
        model: config.model || 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature || 0,
        max_tokens: config.maxTokens || 1024,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        return { success: false, error: 'No content in response' }
      }

      const parsedData = this.parseJSONResponse<T>(content)
      return {
        success: true,
        data: parsedData,
        rawResponse: content
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate with GPT' 
      }
    }
  }

  static parseJSONResponse<T>(text: string): T | null {
    try {
      let cleanedText = text.trim()
      
      // Remove markdown code blocks if present
      if (cleanedText.includes('```json')) {
        cleanedText = cleanedText
          .replace(/```json\s*/g, '')
          .replace(/\s*```/g, '')
      } else if (cleanedText.includes('```')) {
        cleanedText = cleanedText
          .replace(/```\s*/g, '')
          .replace(/\s*```/g, '')
      }
      
      // Try to extract JSON from the text
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
      if (jsonMatch) {
        cleanedText = jsonMatch[0]
      }
      
      return JSON.parse(cleanedText) as T
    } catch (error) {
      console.error('Failed to parse JSON:', error)
      console.error('Raw text:', text)
      return null
    }
  }

  static async generateWithRetry<T = any>(
    serviceFn: () => Promise<AIResponse<T>>,
    maxRetries = 3,
    delay = 1000
  ): Promise<AIResponse<T>> {
    for (let i = 0; i < maxRetries; i++) {
      const result = await serviceFn()
      if (result.success) {
        return result
      }
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
    
    return { success: false, error: `Failed after ${maxRetries} retries` }
  }
}