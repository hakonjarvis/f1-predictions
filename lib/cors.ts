import { NextResponse } from 'next/server'

/**
 * Add CORS headers to a response
 * Allows requests from your own domain and handles preflight requests
 */
export function addCorsHeaders(response: NextResponse): NextResponse {
  // Allow requests from your own domain (adjust ALLOWED_ORIGIN in production)
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*'

  response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400') // 24 hours

  return response
}

/**
 * Handle OPTIONS preflight requests
 */
export function handleCorsPrelight(): NextResponse {
  const response = new NextResponse(null, { status: 204 })
  return addCorsHeaders(response)
}
