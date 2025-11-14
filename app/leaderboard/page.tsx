import { prisma } from '@/lib/prisma'
import { calculateTotalPoints, calculatePointsPerRace } from '@/lib/points'
import Link from 'next/link'
import LeaderboardClient from './LeaderboardClient'

export default async function LeaderboardPage() {
  // Hent brukere med gjetninger og løpsresultater
  const users = await prisma.user.findMany({
    include: {
      prediction: {
        include: { predictions: true },
      },
    },
  })

  const raceResults = await prisma.raceResult.findMany()

  const leaderboard = users
    .filter((user) => user.prediction) // Only show users who have submitted predictions
    .map((user) => {
      const predictions = user.prediction?.predictions ?? []
      const totalPoints = calculateTotalPoints(predictions, raceResults)
      const raceBreakdown = calculatePointsPerRace(predictions, raceResults)

      return {
        id: user.id,
        name: user.name,
        totalPoints,
        raceBreakdown,
      }
    })

  leaderboard.sort((a, b) => b.totalPoints - a.totalPoints)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white">Leaderboard</h1>
        <Link
          href="/"
          className="text-zinc-400 hover:text-zinc-300 text-sm transition-colors"
        >
          ← Tilbake
        </Link>
      </div>

      {leaderboard.length === 0 ? (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-12 text-center">
          <p className="text-zinc-400 text-lg mb-4">
            Ingen predictions ennå. Vær den første til å levere!
          </p>
          <Link
            href="/predictions/new"
            className="inline-block bg-white text-black px-6 py-2 rounded hover:bg-zinc-200 transition font-medium"
          >
            Lag din prediction
          </Link>
        </div>
      ) : (
        <LeaderboardClient users={leaderboard} />
      )}
    </div>
  )
}