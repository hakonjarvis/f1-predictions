'use client'

import { useState, useEffect } from 'react'

interface SyncResult {
  success: boolean
  message: string
  results?: any
  error?: string
  details?: string
  sessionsScanned?: number
  year?: number
}

export default function SyncPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [driverResult, setDriverResult] = useState<SyncResult | null>(null)
  const [raceResult, setRaceResult] = useState<SyncResult | null>(null)
  const [year, setYear] = useState<number>(2025)
  const [adminPassword, setAdminPassword] = useState<string>('')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  useEffect(() => {
    // Check if password is stored in sessionStorage
    const stored = sessionStorage.getItem('adminPassword')
    if (stored) {
      setAdminPassword(stored)
      setIsAuthenticated(true)
    }
  }, [])

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (adminPassword) {
      // Verify password by making a test API call
      try {
        const response = await fetch('/api/admin/predictions', {
          headers: {
            'Authorization': `Bearer ${adminPassword}`,
          },
        })

        if (response.ok) {
          sessionStorage.setItem('adminPassword', adminPassword)
          setIsAuthenticated(true)
        } else {
          alert('Ugyldig passord')
        }
      } catch (error) {
        alert('Kunne ikke verifisere passord')
      }
    }
  }

  function logout() {
    sessionStorage.removeItem('adminPassword')
    setAdminPassword('')
    setIsAuthenticated(false)
  }

  async function syncDrivers() {
    setLoading('drivers')
    setDriverResult(null)

    try {
      const response = await fetch('/api/sync/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminPassword}`,
        },
        body: JSON.stringify({ year }),
      })

      const data = await response.json()
      setDriverResult(data)
    } catch (error) {
      setDriverResult({
        success: false,
        message: 'Failed to sync drivers',
        error: (error as Error).message,
      })
    } finally {
      setLoading(null)
    }
  }

  async function syncRaceResults() {
    setLoading('results')
    setRaceResult(null)

    try {
      const response = await fetch('/api/sync/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminPassword}`,
        },
        body: JSON.stringify({ year }),
      })

      const data = await response.json()
      setRaceResult(data)
    } catch (error) {
      setRaceResult({
        success: false,
        message: 'Failed to sync race results',
        error: (error as Error).message,
      })
    } finally {
      setLoading(null)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto p-4 md:p-6">
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 md:p-8">
          <h1 className="text-xl md:text-2xl font-semibold text-white mb-6">Admin Login</h1>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-400">
                Admin Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-600"
                placeholder="Enter admin password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-white text-black py-2 rounded hover:bg-zinc-200 transition font-medium"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-white">Admin: Sync Data</h1>
        <div className="flex gap-3 md:gap-4">
          <a
            href="/admin/predictions"
            className="text-zinc-400 hover:text-zinc-300 text-xs md:text-sm transition-colors whitespace-nowrap"
          >
            Se Predictions →
          </a>
          <button
            onClick={logout}
            className="text-zinc-400 hover:text-zinc-300 text-xs md:text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Sync Drivers */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 md:p-6">
          <h2 className="text-base md:text-lg font-medium mb-2 text-white">Sync Drivers og Teams</h2>
          <p className="text-zinc-400 text-sm mb-4">
            Henter alle aktive drivers og teams fra alle race-sesjoner for et gitt år.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 mb-4">
            <label className="text-sm font-medium text-zinc-400">År:</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 w-24 text-zinc-200 text-sm focus:outline-none focus:border-zinc-600"
              min="2023"
              max="2025"
            />
          </div>

          <button
            onClick={syncDrivers}
            disabled={loading !== null}
            className="w-full sm:w-auto bg-white text-black px-5 py-2 rounded hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed transition font-medium text-sm"
          >
            {loading === 'drivers' ? 'Synkroniserer...' : 'Sync Drivers'}
          </button>

          {driverResult && (
            <div
              className={`mt-4 p-4 rounded border text-sm ${
                driverResult.success
                  ? 'bg-green-900/20 border-green-800 text-green-400'
                  : 'bg-red-900/20 border-red-800 text-red-400'
              }`}
            >
              <p className="font-medium mb-2">{driverResult.message}</p>
              {driverResult.results && (
                <div className="space-y-1 text-xs">
                  {driverResult.sessionsScanned && (
                    <p>Sesjoner scannet: {driverResult.sessionsScanned}</p>
                  )}
                  <p>Teams opprettet: {driverResult.results.teamsCreated}</p>
                  <p>Teams oppdatert: {driverResult.results.teamsUpdated}</p>
                  <p>Drivers opprettet: {driverResult.results.driversCreated}</p>
                  <p>Drivers oppdatert: {driverResult.results.driversUpdated}</p>
                </div>
              )}
              {driverResult.error && (
                <p className="text-xs mt-2">{driverResult.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Sync Race Results */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 md:p-6">
          <h2 className="text-base md:text-lg font-medium mb-2 text-white">Sync Race Results</h2>
          <p className="text-zinc-400 text-sm mb-4">
            Henter alle race-resultater for et gitt år.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 mb-4">
            <label className="text-sm font-medium text-zinc-400">År:</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 w-24 text-zinc-200 text-sm focus:outline-none focus:border-zinc-600"
              min="2023"
              max="2025"
            />
          </div>

          <button
            onClick={syncRaceResults}
            disabled={loading !== null}
            className="w-full sm:w-auto bg-white text-black px-5 py-2 rounded hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed transition font-medium text-sm"
          >
            {loading === 'results' ? 'Synkroniserer...' : 'Sync Race Results'}
          </button>

          {raceResult && (
            <div
              className={`mt-4 p-4 rounded border text-sm ${
                raceResult.success
                  ? 'bg-green-900/20 border-green-800 text-green-400'
                  : 'bg-red-900/20 border-red-800 text-red-400'
              }`}
            >
              <p className="font-medium mb-2">{raceResult.message}</p>
              {raceResult.results && (
                <div className="space-y-1 text-xs">
                  <p>Sesjoner prosessert: {raceResult.results.sessionsProcessed}</p>
                  <p>Resultater opprettet: {raceResult.results.resultsCreated}</p>
                  <p>Resultater oppdatert: {raceResult.results.resultsUpdated}</p>
                  {raceResult.results.errors?.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium text-orange-400">Advarsler:</p>
                      <ul className="list-disc list-inside text-orange-500">
                        {raceResult.results.errors.map((err: string, i: number) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {raceResult.error && (
                <p className="text-xs mt-2">{raceResult.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 md:p-6">
          <h3 className="font-medium mb-2 text-white text-sm">Anbefalt rekkefølge:</h3>
          <ol className="list-decimal list-inside space-y-1 text-zinc-400 text-sm">
            <li>Sync Drivers først for å få alle drivers i databasen</li>
            <li>Deretter sync Race Results for å hente faktiske resultater</li>
            <li>Du kan re-synce når som helst for å oppdatere data</li>
          </ol>
        </div>
      </div>
    </div>
  )
}