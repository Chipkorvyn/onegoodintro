import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/api-responses'
import { authenticate } from '@/lib/auth-middleware'
import { BackgroundProcessor } from '@/lib/background-processor'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await authenticate(request)
    if ('error' in auth) {
      return auth
    }

    const { jobId } = params

    if (!jobId) {
      return ApiResponse.badRequest('Job ID is required')
    }

    const job = await BackgroundProcessor.getJob(jobId)

    if (!job) {
      return ApiResponse.notFound('Job not found')
    }

    // Return job status and result if completed
    const response = {
      id: job.id,
      type: job.type,
      status: job.status,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      error: job.error,
      ...(job.status === 'completed' && { result: job.result })
    }

    return ApiResponse.success(response)
  } catch (error) {
    console.error('Job status error:', error)
    return ApiResponse.internalServerError('Failed to get job status')
  }
}