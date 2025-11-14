import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a proper rate limiting service
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetTime < now) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Check if a request should be rate limited
 * @param request - The incoming request
 * @param maxRequests - Maximum requests allowed in the time window
 * @param windowMs - Time window in milliseconds
 * @returns NextResponse with 429 status if rate limited, null otherwise
 */
export function checkRateLimit(
  request: NextRequest,
  maxRequests: number = 5,
  windowMs: number = 60 * 1000 // 1 minute default
): NextResponse | null {
  // Get client identifier (IP address or forwarded IP)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const key = `ratelimit:${ip}`
  const now = Date.now()

  const entry = rateLimitMap.get(key)

  if (!entry || entry.resetTime < now) {
    // Create new entry
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return null
  }

  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)

    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString(),
        },
      }
    )
  }

  // Increment counter
  entry.count++
  return null
}
