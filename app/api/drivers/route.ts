import { NextResponse } from 'next/server'
import { dbHelpers } from '@/lib/db'

export async function GET() {
  try {
    const drivers = await dbHelpers.getDrivers()

    return NextResponse.json(drivers)
  } catch (error) {
    console.error('Error fetching drivers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch drivers', details: (error as Error).message },
      { status: 500 }
    )
  }
}
