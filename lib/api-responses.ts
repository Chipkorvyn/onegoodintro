import { NextResponse } from 'next/server'

export type ApiError = {
  error: string
  details?: unknown
}

export type ApiSuccess<T = unknown> = {
  data: T
  message?: string
}

export class ApiResponse {
  static success<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
    return NextResponse.json({ data }, { status })
  }

  static successWithMessage<T>(data: T, message: string, status = 200): NextResponse<ApiSuccess<T>> {
    return NextResponse.json({ data, message }, { status })
  }

  static error(message: string, status = 500, details?: unknown): NextResponse<ApiError> {
    const response: ApiError = { error: message }
    if (details !== undefined) {
      response.details = details
    }
    return NextResponse.json(response, { status })
  }

  static badRequest(message = 'Bad request'): NextResponse<ApiError> {
    return this.error(message, 400)
  }

  static unauthorized(message = 'Unauthorized'): NextResponse<ApiError> {
    return this.error(message, 401)
  }

  static forbidden(message = 'Forbidden'): NextResponse<ApiError> {
    return this.error(message, 403)
  }

  static notFound(message = 'Not found'): NextResponse<ApiError> {
    return this.error(message, 404)
  }

  static methodNotAllowed(message = 'Method not allowed'): NextResponse<ApiError> {
    return this.error(message, 405)
  }

  static conflict(message = 'Conflict'): NextResponse<ApiError> {
    return this.error(message, 409)
  }

  static unprocessableEntity(message = 'Unprocessable entity'): NextResponse<ApiError> {
    return this.error(message, 422)
  }

  static tooManyRequests(message = 'Too many requests'): NextResponse<ApiError> {
    return this.error(message, 429)
  }

  static internalServerError(message = 'Internal server error', details?: unknown): NextResponse<ApiError> {
    return this.error(message, 500, details)
  }

  static serviceUnavailable(message = 'Service unavailable'): NextResponse<ApiError> {
    return this.error(message, 503)
  }
}