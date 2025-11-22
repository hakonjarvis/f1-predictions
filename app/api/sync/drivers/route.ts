import { NextRequest, NextResponse } from 'next/server'
import { dbHelpers } from '@/lib/db'
import { fetchRaceSessions, fetchDrivers } from '@/lib/openf1'
import { checkAdminAuth } from '@/lib/auth'
import { addCorsHeaders, handleCorsPrelight } from '@/lib/cors'
import { validateYear } from '@/lib/validation'

export async function OPTIONS() {
  return handleCorsPrelight()
}

export async function POST(request: NextRequest) {
  // Check authentication
  const authResult = checkAdminAuth(request)
  if (authResult) return authResult

  try {
    const body = await request.json().catch(() => ({}))
    const { year = 2025 } = body

    // Validate year
    const validatedYear = validateYear(year)
    if (validatedYear instanceof NextResponse) {
      return addCorsHeaders(validatedYear)
    }

    // Get race sessions for the year
    const raceSessions = await fetchRaceSessions(validatedYear)

    if (raceSessions.length === 0) {
      return addCorsHeaders(
        NextResponse.json(
          { error: `No race sessions found for year ${validatedYear}` },
          { status: 404 }
        )
      )
    }

    // Use only the latest session to avoid rate limiting
    // All current drivers should be in the most recent session
    const latestSession = raceSessions[raceSessions.length - 1]

    console.log(`Fetching drivers from latest session: ${latestSession.session_key} (${latestSession.session_name})`)

    const openF1Drivers = await fetchDrivers(latestSession.session_key)

    // Track results
    const results = {
      teamsCreated: 0,
      teamsUpdated: 0,
      driversCreated: 0,
      driversUpdated: 0,
    }

    // Process each driver
    for (const openDriver of openF1Drivers) {
      // Check if team exists before upsert
      const existingTeam = await dbHelpers.getTeamByName(openDriver.team_name)

      // Upsert team first
      const team = await dbHelpers.upsertTeam(openDriver.team_name)

      if (existingTeam) {
        results.teamsUpdated++
      } else {
        results.teamsCreated++
      }

      // Upsert driver
      const existingDriver = await dbHelpers.getDriverByCode(openDriver.name_acronym)

      const driverResult = await dbHelpers.upsertDriver({
        name: openDriver.full_name,
        code: openDriver.name_acronym,
        number: openDriver.driver_number,
        country: openDriver.country_code,
        headshotUrl: openDriver.headshot_url,
        teamId: team.id,
      })

      if (driverResult.isNew) {
        results.driversCreated++
      } else {
        results.driversUpdated++
      }
    }

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        message: 'Drivers and teams synced successfully',
        year: validatedYear,
        sessionsScanned: raceSessions.length,
        results,
      })
    )
  } catch (error) {
    console.error('Error syncing drivers:', error)
    return addCorsHeaders(
      NextResponse.json(
        { error: 'Failed to sync drivers', details: (error as Error).message },
        { status: 500 }
      )
    )
  }
}
