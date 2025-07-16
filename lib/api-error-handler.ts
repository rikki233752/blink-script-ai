import { NextResponse } from "next/server"

export interface ApiError {
  success: false
  error: string
  code?: string
  details?: any
}

export interface ApiSuccess<T = any> {
  success: true
  data: T
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError

export function createErrorResponse(error: string, status = 500, code?: string, details?: any): NextResponse<ApiError> {
  console.error(`❌ API Error [${status}]:`, error, details ? { details } : "")

  return NextResponse.json(
    {
      success: false,
      error,
      code,
      details: process.env.NODE_ENV === "development" ? details : undefined,
    },
    { status },
  )
}

export function createSuccessResponse<T>(data: T): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({
    success: true,
    data,
  })
}

export function handleApiError(error: any, context: string): NextResponse<ApiError> {
  console.error(`❌ ${context}:`, error)

  // Handle different types of errors
  if (error.name === "AbortError") {
    return createErrorResponse("Request timeout. Please try again.", 408, "TIMEOUT")
  }

  if (error.message?.includes("fetch")) {
    return createErrorResponse("Network error. Please check your connection.", 503, "NETWORK_ERROR")
  }

  if (error.message?.includes("JSON")) {
    return createErrorResponse("Invalid response format.", 502, "INVALID_RESPONSE")
  }

  if (error.status) {
    return createErrorResponse(error.message || "External API error", error.status, "EXTERNAL_API_ERROR", {
      originalStatus: error.status,
    })
  }

  // Generic server error
  return createErrorResponse(error.message || "Internal server error", 500, "INTERNAL_ERROR", { stack: error.stack })
}
