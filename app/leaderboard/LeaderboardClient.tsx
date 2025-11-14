'use client'

import { useState } from 'react'
import { RaceBreakdown } from '@/lib/points'

interface LeaderboardUser {
  id: number
  name: string
  totalPoints: number
  raceBreakdown: RaceBreakdown[]
}

export default function LeaderboardClient({ users }: { users: LeaderboardUser[] }) {
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null)

  function toggleExpand(userId: number) {
    setExpandedUserId(expandedUserId === userId ? null : userId)
  }

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
      <table className="w-full">
        <thead className="border-b border-zinc-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Posisjon
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Navn
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Poeng
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Detaljer
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {users.map((user, idx) => (
            <>
              <tr
                key={user.id}
                className="hover:bg-zinc-800/50 transition-colors cursor-pointer"
                onClick={() => toggleExpand(user.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-lg font-semibold text-zinc-400">{idx + 1}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-zinc-200">{user.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-lg font-semibold text-zinc-300">{user.totalPoints}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpand(user.id)
                    }}
                  >
                    {expandedUserId === user.id ? '▼' : '▶'}
                  </button>
                </td>
              </tr>
              {expandedUserId === user.id && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 bg-zinc-950/50">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-zinc-300 mb-3">
                        Poeng per race:
                      </h4>
                      {user.raceBreakdown.length === 0 ? (
                        <p className="text-sm text-zinc-500">Ingen race-resultater ennå</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {user.raceBreakdown.map((race) => (
                            <div
                              key={race.sessionKey}
                              className="bg-zinc-900 border border-zinc-800 rounded p-3 flex justify-between items-center"
                            >
                              <div>
                                <p className="text-sm font-medium text-zinc-300">
                                  {race.raceName}
                                </p>
                                <p className="text-xs text-zinc-600">Runde {race.round}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-zinc-300">
                                  {race.points}
                                </p>
                                <p className="text-xs text-zinc-600">poeng</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
