import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAdminAuth } from '@/lib/auth'
import { addCorsHeaders, handleCorsPrelight } from '@/lib/cors'

export async function OPTIONS() {
  return handleCorsPrelight()
}

export async function GET(request: NextRequest) {
  // Check authentication
  const authResult = checkAdminAuth(request)
  if (authResult) return authResult

  try {
    const users = await prisma.user.findMany({
      include: {
        prediction: {
          include: {
            predictions: {
              include: {
                driver: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return addCorsHeaders(NextResponse.json(users))
  } catch (error) {
    console.error('Error fetching predictions:', error)
    return addCorsHeaders(
      NextResponse.json(
        { error: 'Failed to fetch predictions', details: (error as Error).message },
        { status: 500 }
      )
    )
  }
}
