import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

    // Get all race sessions for the year to ensure we get all drivers
    const raceSessions = await fetchRaceSessions(validatedYear)

    if (raceSessions.length === 0) {
      return addCorsHeaders(
        NextResponse.json(
          { error: `No race sessions found for year ${validatedYear}` },
          { status: 404 }
        )
      )
    }

    // Collect all unique drivers from all sessions
    const allDriversMap = new Map()

    for (const session of raceSessions) {
      const sessionDrivers = await fetchDrivers(session.session_key)
      for (const driver of sessionDrivers) {
        // Use driver number as unique key
        allDriversMap.set(driver.driver_number, driver)
      }
    }

    const openF1Drivers = Array.from(allDriversMap.values())

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
      const existingTeam = await prisma.team.findUnique({
        where: { name: openDriver.team_name },
      })

      // Upsert team first
      const team = await prisma.team.upsert({
        where: { name: openDriver.team_name },
        create: {
          name: openDriver.team_name,
        },
        update: {
          name: openDriver.team_name,
        },
      })

      if (existingTeam) {
        results.teamsUpdated++
      } else {
        results.teamsCreated++
      }

      // Upsert driver
      const existingDriver = await prisma.driver.findUnique({
        where: { code: openDriver.name_acronym },
      })

      await prisma.driver.upsert({
        where: { code: openDriver.name_acronym },
        create: {
          name: openDriver.full_name,
          code: openDriver.name_acronym,
          number: openDriver.driver_number,
          country: openDriver.country_code,
          headshotUrl: openDriver.headshot_url,
          teamId: team.id,
        },
        update: {
          name: openDriver.full_name,
          number: openDriver.driver_number,
          country: openDriver.country_code,
          headshotUrl: openDriver.headshot_url,
          teamId: team.id,
        },
      })

      if (existingDriver) {
        results.driversUpdated++
      } else {
        results.driversCreated++
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
