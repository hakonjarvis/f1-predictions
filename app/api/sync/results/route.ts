import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { dbHelpers } from '@/lib/db'
import {
  fetchRaceSessions,
  fetchSessionResults,
  fetchSessions,
} from '@/lib/openf1'
import { checkAdminAuth } from '@/lib/auth'
import { addCorsHeaders, handleCorsPrelight } from '@/lib/cors'
import { validateYear, validateSessionKey } from '@/lib/validation'

// F1 points system for top 10
const F1_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]

function getPointsForPosition(position: number): number {
  if (position <= 0 || position > 10) return 0
  return F1_POINTS[position - 1] || 0
}

export async function OPTIONS() {
  return handleCorsPrelight()
}

export async function POST(request: NextRequest) {
  // Check authentication
  const authResult = checkAdminAuth(request)
  if (authResult) return authResult

  try {
    const body = await request.json()
    const { sessionKey, year } = body

    let sessionsToSync: Array<{ session_key: number; session_name: string; location: string; year: number; round: number }> = []

    if (sessionKey) {
      // Validate session key
      const validatedSessionKey = validateSessionKey(sessionKey)
      if (validatedSessionKey instanceof NextResponse) {
        return addCorsHeaders(validatedSessionKey)
      }
      // Sync a specific session
      const allSessions = await fetchSessions(new Date().getFullYear())
      const session = allSessions.find((s) => s.session_key === validatedSessionKey)

      if (!session) {
        return addCorsHeaders(
          NextResponse.json(
            { error: 'Session not found' },
            { status: 404 }
          )
        )
      }

      // Find all race sessions to determine round number
      const raceSessions = await fetchRaceSessions(session.year)
      const sortedRaces = raceSessions.sort((a, b) =>
        new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
      )
      const roundNumber = sortedRaces.findIndex(s => s.session_key === session.session_key) + 1

      sessionsToSync.push({
        session_key: session.session_key,
        session_name: session.session_name,
        location: session.location,
        year: session.year,
        round: roundNumber,
      })
    } else if (year) {
      // Validate year
      const validatedYear = validateYear(year)
      if (validatedYear instanceof NextResponse) {
        return addCorsHeaders(validatedYear)
      }

      // Sync all race sessions for a year
      const raceSessions = await fetchRaceSessions(validatedYear)
      // Sort by date to assign round numbers
      const sortedRaces = raceSessions.sort((a, b) =>
        new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
      )
      sessionsToSync = sortedRaces.map((s, index) => ({
        session_key: s.session_key,
        session_name: s.session_name,
        location: s.location,
        year: s.year,
        round: index + 1,
      }))
    } else {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Either sessionKey or year must be provided' },
          { status: 400 }
        )
      )
    }

    const results = {
      sessionsProcessed: 0,
      resultsCreated: 0,
      resultsUpdated: 0,
      errors: [] as string[],
    }

    // Process each session
    for (const session of sessionsToSync) {
      try {
        // Fetch final positions
        const positions = await fetchSessionResults(session.session_key)

        // Get all drivers to map numbers to IDs
        const drivers = await dbHelpers.getAllDrivers()
        const driverMap = new Map(drivers.map((d) => [d.number, d]))

        // Process each position
        for (const pos of positions) {
          const driver = driverMap.get(pos.driver_number)

          if (!driver) {
            results.errors.push(
              `Driver #${pos.driver_number} not found in database (session ${session.session_key})`
            )
            continue
          }

          const points = getPointsForPosition(pos.position)

          // Upsert race result
          const resultData = await dbHelpers.upsertRaceResult({
            raceName: session.location,
            round: session.round,
            year: session.year,
            sessionKey: session.session_key,
            driverId: driver.id,
            position: pos.position,
            points,
          })

          if (resultData.isNew) {
            results.resultsCreated++
          } else {
            results.resultsUpdated++
          }
        }

        results.sessionsProcessed++
      } catch (error) {
        results.errors.push(
          `Error processing session ${session.session_key}: ${(error as Error).message}`
        )
      }
    }

    // Revalidate pages that display race results and points
    revalidatePath('/')
    revalidatePath('/leaderboard')

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        message: 'Race results synced successfully',
        results,
      })
    )
  } catch (error) {
    console.error('Error syncing race results:', error)
    return addCorsHeaders(
      NextResponse.json(
        { error: 'Failed to sync race results', details: (error as Error).message },
        { status: 500 }
      )
    )
  }
}