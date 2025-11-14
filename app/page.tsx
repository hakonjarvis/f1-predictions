import { prisma } from '@/lib/prisma'
import { calculateTotalPoints, calculatePointsPerRace } from '@/lib/points'
import Link from 'next/link'

export default async function HomePage() {
  // Hent topp 5 brukere for leaderboard preview
  const users = await prisma.user.findMany({
    include: {
      prediction: {
        include: { predictions: true },
      },
    },
  })

  const raceResults = await prisma.raceResult.findMany()

  // Calculate current leaderboard
  const currentLeaderboard = users
    .filter((user) => user.prediction)
    .map((user) => {
      const predictions = user.prediction?.predictions ?? []
      const totalPoints = calculateTotalPoints(predictions, raceResults)
      const raceBreakdown = calculatePointsPerRace(predictions, raceResults)
      const lastRacePoints = raceBreakdown.length > 0 ? raceBreakdown[raceBreakdown.length - 1].points : 0

      return {
        id: user.id,
        name: user.name,
        totalPoints,
        lastRacePoints,
        predictions,
      }
    })
    .sort((a, b) => b.totalPoints - a.totalPoints)

  // Calculate previous leaderboard (without last race)
  const lastRaceSessionKey = raceResults.length > 0
    ? Math.max(...raceResults.map(r => (r as any).sessionKey || 0))
    : null

  const previousLeaderboard = lastRaceSessionKey
    ? users
        .filter((user) => user.prediction)
        .map((user) => {
          const predictions = user.prediction?.predictions ?? []
          const resultsExcludingLast = raceResults.filter(
            r => (r as any).sessionKey !== lastRaceSessionKey
          )
          const totalPoints = calculateTotalPoints(predictions, resultsExcludingLast)
          return {
            id: user.id,
            totalPoints,
          }
        })
        .sort((a, b) => b.totalPoints - a.totalPoints)
    : []

  // Calculate position changes
  const leaderboard = currentLeaderboard.map((user, currentIndex) => {
    const previousIndex = previousLeaderboard.findIndex(u => u.id === user.id)
    const positionChange = previousIndex >= 0 ? previousIndex - currentIndex : 0

    return {
      ...user,
      positionChange,
    }
  }).slice(0, 5)

  const totalPredictions = users.filter((u) => u.prediction).length

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-20 px-4">
        <div className="inline-block bg-zinc-800 text-zinc-300 px-3 py-1 rounded text-xs font-medium mb-6 border border-zinc-700">
          F1 2025 SEASON
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
          F1 Predictions
        </h1>
        <p className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Gjett hvem som vinner F1-mesterskapet 2025. Rangér driverne og tjen poeng
          basert på nøyaktigheten til prediksjonen din.
        </p>
        <div className="flex gap-3 justify-center flex-wrap mb-16">
          <Link
            href="/predictions/new"
            className="bg-white text-black px-6 py-2.5 rounded hover:bg-zinc-200 transition font-medium"
          >
            Lag prediction
          </Link>
          <Link
            href="/leaderboard"
            className="bg-zinc-800 text-zinc-300 px-6 py-2.5 rounded hover:bg-zinc-700 transition font-medium border border-zinc-700"
          >
            Se leaderboard
          </Link>
        </div>
          {/* Leaderboard Preview */}
          {leaderboard.length > 0 && (
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden mb-8">
              <div className="border-b border-zinc-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-1">Topp 5</h2>
                <p className="text-sm text-zinc-500">{totalPredictions} deltakere</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Pos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Navn
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Totalt
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Siste race
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Endring
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {leaderboard.map((user, idx) => (
                      <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-2xl font-bold text-zinc-600">
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-zinc-200">{user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-xl font-semibold text-zinc-300">{user.totalPoints}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-lg font-medium text-zinc-400">
                            {user.lastRacePoints > 0 ? `+${user.lastRacePoints}` : '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {user.positionChange > 0 && (
                            <span className="text-green-500 font-medium">▲ {user.positionChange}</span>
                          )}
                          {user.positionChange < 0 && (
                            <span className="text-red-500 font-medium">▼ {Math.abs(user.positionChange)}</span>
                          )}
                          {user.positionChange === 0 && lastRaceSessionKey && (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-zinc-800 p-4">
                <Link
                  href="/leaderboard"
                  className="block text-center text-zinc-400 hover:text-zinc-300 text-sm transition-colors"
                >
                  Se full leaderboard →
                </Link>
              </div>
            </div>
          )}
        
      </div>

      {/* How it Works */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8 mb-8">
        <h2 className="text-xl font-semibold mb-8 text-white">Slik fungerer det</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-zinc-800 w-8 h-8 rounded flex items-center justify-center text-zinc-400 font-semibold text-sm border border-zinc-700">
                1
              </div>
              <h3 className="font-medium text-zinc-200">Ranger driverne</h3>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Dra og slipp for å rangere F1-driverne i den rekkefølgen du tror de
              ender opp i championship.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-zinc-800 w-8 h-8 rounded flex items-center justify-center text-zinc-400 font-semibold text-sm border border-zinc-700">
                2
              </div>
              <h3 className="font-medium text-zinc-200">Tjen poeng</h3>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Etter hvert løp får du poeng basert på hvor nøyaktig prediksjonen din er.
              Jo nærmere, desto flere poeng.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-zinc-800 w-8 h-8 rounded flex items-center justify-center text-zinc-400 font-semibold text-sm border border-zinc-700">
                3
              </div>
              <h3 className="font-medium text-zinc-200">Konkurrér</h3>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Klatre på leaderboard og vis at du er ekspert på F1. Den med flest
              poeng vinner.
            </p>
          </div>
        </div>
      </div>

      {/* Points System */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8 mb-8">
        <h2 className="text-xl font-semibold mb-3 text-white">Poengsystem</h2>
        <p className="text-zinc-500 text-sm mb-6">
          Poeng tildeles basert på hvor mange posisjoner unna din prediksjonen er
        </p>
        <div className="grid grid-cols-5 gap-3 max-w-2xl">
          <div className="bg-zinc-800/50 rounded p-3 text-center border border-zinc-800">
            <div className="text-xl font-semibold text-zinc-300">25</div>
            <div className="text-xs text-zinc-600 mt-1">Eksakt</div>
          </div>
          <div className="bg-zinc-800/50 rounded p-3 text-center border border-zinc-800">
            <div className="text-xl font-semibold text-zinc-300">18</div>
            <div className="text-xs text-zinc-600 mt-1">±1</div>
          </div>
          <div className="bg-zinc-800/50 rounded p-3 text-center border border-zinc-800">
            <div className="text-xl font-semibold text-zinc-300">15</div>
            <div className="text-xs text-zinc-600 mt-1">±2</div>
          </div>
          <div className="bg-zinc-800/50 rounded p-3 text-center border border-zinc-800">
            <div className="text-xl font-semibold text-zinc-300">12</div>
            <div className="text-xs text-zinc-600 mt-1">±3</div>
          </div>
          <div className="bg-zinc-800/50 rounded p-3 text-center border border-zinc-800">
            <div className="text-xl font-semibold text-zinc-300">...</div>
            <div className="text-xs text-zinc-600 mt-1">Ned til 0</div>
          </div>
        </div>
      </div>
    </div>
  )
}
