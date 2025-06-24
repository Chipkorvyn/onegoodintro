import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ApiResponse } from '@/lib/api-responses'
import { authenticateWithSession } from '@/lib/auth-middleware'
import { BackgroundProcessor } from '@/lib/background-processor'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const auth = await authenticateWithSession(session, request)
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