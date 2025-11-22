import { NextRequest, NextResponse } from 'next/server'

/**
 * Basic authentication middleware for admin routes
 * Checks for a simple password in Authorization header
 *
 * Usage in API routes:
 * const authResult = checkAdminAuth(request)
 * if (authResult) return authResult // Returns 401 if auth fails
 */
export function checkAdminAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization')
  const adminPassword = process.env.ADMIN_PASSWORD

  // If no admin password is set, block all access
  if (!adminPassword) {
    return NextResponse.json(
      { error: 'Admin access not configured' },
      { status: 500 }
    )
  }

  // Check for Bearer token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized - Missing authentication' },
      { status: 401 }
    )
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  if (token !== adminPassword) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid credentials' },
      { status: 401 }
    )
  }

  // Auth successful
  return null
}
