import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { addCorsHeaders, handleCorsPrelight } from '@/lib/cors'

export async function OPTIONS() {
  return handleCorsPrelight()
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Du må være logget inn' },
          { status: 401 }
        )
      )
    }

    // Find user's prediction
    const user = await prisma.user.findUnique({
      where: { authId: authUser.id },
      include: {
        prediction: {
          include: {
            predictions: {
              include: {
                driver: {
                  include: {
                    team: true,
                  },
                },
              },
              orderBy: {
                predictedPosition: 'asc',
              },
            },
          },
        },
      },
    })

    if (!user?.prediction) {
      return addCorsHeaders(
        NextResponse.json({ prediction: null })
      )
    }

    return addCorsHeaders(
      NextResponse.json({
        prediction: user.prediction,
      })
    )
  } catch (error) {
    console.error('Error fetching user prediction:', error)
    return addCorsHeaders(
      NextResponse.json(
        { error: 'Failed to fetch prediction', details: (error as Error).message },
        { status: 500 }
      )
    )
  }
}
