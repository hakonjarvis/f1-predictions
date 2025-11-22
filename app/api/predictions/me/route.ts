import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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
    const { data: user, error } = await db
      .from('User')
      .select(`
        *,
        prediction:SeasonPrediction(
          *,
          predictions:DriverPrediction(
            *,
            driver:Driver(
              *,
              team:Team(*)
            )
          )
        )
      `)
      .eq('authId', authUser.id)
      .order('predictedPosition', { foreignTable: 'SeasonPrediction.DriverPrediction', ascending: true })
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

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
