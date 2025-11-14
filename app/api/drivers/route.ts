import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const drivers = await prisma.driver.findMany({
      include: {
        team: true,
      },
      orderBy: {
        number: 'asc',
      },
    })

    return NextResponse.json(drivers)
  } catch (error) {
    console.error('Error fetching drivers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch drivers', details: (error as Error).message },
      { status: 500 }
    )
  }
}
