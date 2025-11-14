'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/contexts/AuthContext'
import { usePathname } from 'next/navigation'

export default function Header() {
  const { user, loading, signOut } = useAuth()
  const pathname = usePathname()

  // Don't show header on auth page
  if (pathname === '/auth') {
    return null
  }

  async function handleSignOut() {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <header className="border-b border-zinc-800 mb-6">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-white font-semibold text-lg hover:text-zinc-300 transition-colors">
          F1 Predictions
        </Link>

        <nav className="flex items-center gap-4">
          {loading ? (
            <div className="text-zinc-500 text-sm">Laster...</div>
          ) : user ? (
            <>
              <span className="text-zinc-400 text-sm">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="text-zinc-400 hover:text-zinc-300 text-sm transition-colors"
              >
                Logg ut
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="bg-white text-black px-4 py-1.5 rounded hover:bg-zinc-200 transition font-medium text-sm"
            >
              Logg inn
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
