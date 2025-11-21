'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface User {
  id: number
  name: string
  email: string
  prediction: {
    id: number
    createdAt: string
    predictions: Array<{
      id: number
      predictedPosition: number
      driver: {
        id: number
        name: string
        code: string
        number: number | null
      }
    }>
  } | null
}

export default function AdminPredictionsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [adminPassword, setAdminPassword] = useState<string>('')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  useEffect(() => {
    // Check if password is stored in sessionStorage
    const stored = sessionStorage.getItem('adminPassword')
    if (stored) {
      setAdminPassword(stored)
      setIsAuthenticated(true)
      fetchUsers(stored)
    } else {
      setLoading(false)
    }
  }, [])

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (adminPassword) {
      // Verify password by making a test API call
      const response = await fetch('/api/admin/predictions', {
        headers: {
          'Authorization': `Bearer ${adminPassword}`,
        },
      })

      if (response.ok) {
        sessionStorage.setItem('adminPassword', adminPassword)
        setIsAuthenticated(true)
        const data = await response.json()
        if (Array.isArray(data)) {
          setUsers(data)
        }
        setLoading(false)
      } else {
        alert('Ugyldig passord')
      }
    }
  }

  function logout() {
    sessionStorage.removeItem('adminPassword')
    setAdminPassword('')
    setIsAuthenticated(false)
  }

  async function fetchUsers(password?: string) {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/predictions', {
        headers: {
          'Authorization': `Bearer ${password || adminPassword}`,
        },
      })
      const data = await response.json()

      if (response.status === 401) {
        // Unauthorized - clear stored password and force re-login
        sessionStorage.removeItem('adminPassword')
        setIsAuthenticated(false)
        alert('Invalid admin password')
        return
      }

      if (!response.ok) {
        console.error('Failed to fetch users:', data)
        return
      }

      if (Array.isArray(data)) {
        setUsers(data)
      } else {
        console.error('Unexpected response format:', data)
        setUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deletePrediction(userId: number) {
    if (!confirm('Er du sikker på at du vil slette denne prediksjonen?')) {
      return
    }

    setDeleting(userId)

    try {
      const response = await fetch(`/api/admin/predictions/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminPassword}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete')
      }

      // Refresh the list
      await fetchUsers()
      alert('Prediction slettet!')
    } catch (error) {
      console.error('Error deleting prediction:', error)
      alert('Kunne ikke slette prediction. Prøv igjen.')
    } finally {
      setDeleting(null)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8">
          <h1 className="text-2xl font-semibold text-white mb-6">Admin Login</h1>
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-zinc-400">Laster predictions...</p>
      </div>
    )
  }

  return (
    <div className="w-full px-6 py-6">
      <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-white">Admin: Predictions</h1>
        <div className="flex gap-4">
          <Link
            href="/admin/sync"
            className="text-zinc-400 hover:text-zinc-300 text-sm transition-colors"
          >
            ← Tilbake til Sync
          </Link>
          <button
            onClick={logout}
            className="text-zinc-400 hover:text-zinc-300 text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 max-w-7xl mx-auto overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-zinc-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Navn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                E-post
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Opprettet
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Handlinger
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-zinc-200">{user.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-zinc-400">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.prediction ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-medium rounded bg-green-900/30 text-green-400 border border-green-800">
                      Levert
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-medium rounded bg-zinc-800 text-zinc-500 border border-zinc-700">
                      Ikke levert
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                  {user.prediction
                    ? new Date(user.prediction.createdAt).toLocaleDateString('no-NO')
                    : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {user.prediction ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-zinc-300 hover:text-white transition-colors"
                      >
                        Vis detaljer
                      </button>
                      <button
                        onClick={() => deletePrediction(user.id)}
                        disabled={deleting === user.id}
                        className="text-red-400 hover:text-red-300 disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors"
                      >
                        {deleting === user.id ? 'Sletter...' : 'Slett'}
                      </button>
                    </div>
                  ) : (
                    <span className="text-zinc-600">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            Ingen brukere med predictions ennå
          </div>
        )}
      </div>

      {/* Modal for viewing prediction details */}
      {selectedUser && selectedUser.prediction && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Prediction fra {selectedUser.name}
                </h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-zinc-400">
                  E-post: {selectedUser.email}
                </p>
                <p className="text-sm text-zinc-400">
                  Opprettet:{' '}
                  {new Date(selectedUser.prediction.createdAt).toLocaleString('no-NO')}
                </p>
              </div>

              <h3 className="font-medium mb-3 text-white text-sm">Predicted Championship Order:</h3>
              <div className="space-y-2">
                {selectedUser.prediction.predictions
                  .sort((a, b) => a.predictedPosition - b.predictedPosition)
                  .map((pred) => (
                    <div
                      key={pred.id}
                      className="flex items-center gap-3 bg-zinc-800/50 border border-zinc-800 rounded p-3"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-zinc-700 text-zinc-400 rounded flex items-center justify-center font-semibold text-sm border border-zinc-600">
                        {pred.predictedPosition}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-zinc-200">{pred.driver.name}</p>
                        <p className="text-sm text-zinc-500">
                          {pred.driver.code}
                          {pred.driver.number && ` • #${pred.driver.number}`}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="mt-6 w-full bg-zinc-800 text-zinc-300 py-2 rounded hover:bg-zinc-700 transition font-medium border border-zinc-700"
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
