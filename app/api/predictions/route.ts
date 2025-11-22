import { NextRequest, NextResponse } from 'next/server'
import { dbHelpers } from '@/lib/db'
import { addCorsHeaders, handleCorsPrelight } from '@/lib/cors'
import { checkRateLimit } from '@/lib/ratelimit'
import { createClient } from '@/lib/supabase/server'

export async function OPTIONS() {
  return handleCorsPrelight()
}

export async function POST(request: NextRequest) {
  // Check rate limit (5 submissions per minute per IP)
  const rateLimitResult = checkRateLimit(request, 5, 60000)
  if (rateLimitResult) return addCorsHeaders(rateLimitResult)

  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Du må være logget inn for å sende inn en prediction' },
          { status: 401 }
        )
      )
    }

    const body = await request.json()
    const { predictions } = body

    // Validation
    if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Predictions are required' },
          { status: 400 }
        )
      )
    }

    // Get user's name and email from auth metadata
    const name = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Anonym'
    const email = authUser.email!

    // Check if user already exists
    const existingUser = await dbHelpers.getUserByAuthId(authUser.id)

    if (existingUser?.prediction) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Du har allerede levert en prediction. Kontakt admin for å endre.' },
          { status: 400 }
        )
      )
    }

    // Create or update user with authId
    let user
    if (existingUser) {
      user = await dbHelpers.updateUser(authUser.id, name, email)
    } else {
      user = await dbHelpers.createUser(authUser.id, name, email)
    }

    // Create season prediction with driver predictions
    const seasonPrediction = await dbHelpers.createSeasonPrediction(
      user.id,
      predictions.map((pred: { driverId: number; position: number }) => ({
        driverId: pred.driverId,
        position: pred.position,
      }))
    )

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        message: 'Prediction lagret!',
        prediction: seasonPrediction,
      })
    )
  } catch (error) {
    console.error('Error saving prediction:', error)
    return addCorsHeaders(
      NextResponse.json(
        { error: 'Failed to save prediction', details: (error as Error).message },
        { status: 500 }
      )
    )
  }
}
