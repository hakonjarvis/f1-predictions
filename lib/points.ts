import { DriverPrediction, RaceResult } from '@prisma/client'

export function calculatePointsForRace(
  predictions: DriverPrediction[],
  raceResults: RaceResult[]
): Record<number, number> {
  // Vi returnerer et objekt { driverId: poeng }
  const pointsMap: Record<number, number> = {}

  for (const prediction of predictions) {
    const actual = raceResults.find((r) => r.driverId === prediction.driverId)
    if (!actual) continue

    const diff = Math.abs(actual.position - prediction.predictedPosition)
    let points = 0

    if (diff === 0) points = 25
    else if (diff === 1) points = 18
    else if (diff === 2) points = 15
    else if (diff === 3) points = 12
    else if (diff === 4) points = 10
    else if (diff === 5) points = 8
    else if (diff === 6) points = 6
    else if (diff === 7) points = 4
    else if (diff === 8) points = 2
    else points = 0

    pointsMap[prediction.driverId] = points
  }

  return pointsMap
}

export function calculateTotalPoints(
  allPredictions: DriverPrediction[],
  allResults: RaceResult[]
): number {
  // Calculate points for each race and sum them up
  const raceBreakdown = calculatePointsPerRace(allPredictions, allResults)
  return raceBreakdown.reduce((total, race) => total + race.points, 0)
}

export interface RaceBreakdown {
  sessionKey: number
  raceName: string
  round: number
  points: number
}

export function calculatePointsPerRace(
  predictions: DriverPrediction[],
  allResults: RaceResult[]
): RaceBreakdown[] {
  // Group results by session
  const sessionMap = new Map<number, RaceResult[]>()

  for (const result of allResults) {
    const sessionKey = (result as any).sessionKey as number | null
    if (!sessionKey) continue

    if (!sessionMap.has(sessionKey)) {
      sessionMap.set(sessionKey, [])
    }
    sessionMap.get(sessionKey)!.push(result)
  }

  const breakdown: RaceBreakdown[] = []

  // Calculate points for each race session
  for (const [sessionKey, raceResults] of sessionMap.entries()) {
    const pointsMap = calculatePointsForRace(predictions, raceResults)
    const totalPoints = Object.values(pointsMap).reduce((a, b) => a + b, 0)

    if (totalPoints > 0 || raceResults.length > 0) {
      breakdown.push({
        sessionKey,
        raceName: raceResults[0]?.raceName || 'Unknown',
        round: raceResults[0]?.round || 0,
        points: totalPoints,
      })
    }
  }

  // Sort by round
  breakdown.sort((a, b) => a.round - b.round)

  return breakdown
}

