import { dbHelpers } from '@/lib/db'
import { calculateTotalPoints, calculatePointsPerRace } from '@/lib/points'
import { shouldRevealScores } from '@/lib/countdown'
import Link from 'next/link'
import LeaderboardClient from './LeaderboardClient'
import Countdown from '@/components/Countdown'

export default async function LeaderboardPage() {
  const showScores = shouldRevealScores()

  // Hent brukere med gjetninger og løpsresultater
  const users = await dbHelpers.getAllUsersWithPredictions()

  const raceResults = await dbHelpers.getAllRaceResults()

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
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-white">Leaderboard</h1>
        <Link
          href="/"
          className="text-zinc-400 hover:text-zinc-300 text-xs md:text-sm transition-colors"
        >
          ← Tilbake
        </Link>
      </div>

      {!showScores ? (
        <Countdown />
      ) : leaderboard.length === 0 ? (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8 md:p-12 text-center">
          <p className="text-zinc-400 text-base md:text-lg mb-4">
            Ingen predictions ennå. Vær den første til å levere!
          </p>
          <Link
            href="/predictions/new"
            className="inline-block bg-white text-black px-6 py-2 rounded hover:bg-zinc-200 transition font-medium text-sm md:text-base"
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