'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        if (!name.trim()) {
          setError('Vennligst skriv inn navnet ditt')
          setLoading(false)
          return
        }
        await signUp(email, password, name)
      }

      router.push('/predictions/new')
    } catch (err: any) {
      setError(err.message || 'Noe gikk galt. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 md:p-6">
      <div className="mb-4 md:mb-6">
        <a
          href="/"
          className="text-zinc-400 hover:text-zinc-300 text-xs md:text-sm transition-colors inline-flex items-center gap-1"
        >
          ← Tilbake
        </a>
      </div>

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 md:p-8">
        <h1 className="text-xl md:text-2xl font-semibold text-white mb-2">
          {isLogin ? 'Logg inn' : 'Opprett konto'}
        </h1>
        <p className="text-zinc-400 mb-6 text-sm">
          {isLogin
            ? 'Logg inn for å legge til din prediction'
            : 'Opprett en konto for å delta i konkurransen'}
        </p>

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded p-3 mb-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-400">
                Navn
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                placeholder="Navnet ditt"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-400">
              E-post
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              placeholder="din@epost.no"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-400">
              Passord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              placeholder="Minimum 6 tegn"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-2.5 rounded hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed transition font-medium"
          >
            {loading
              ? 'Vennligst vent...'
              : isLogin
              ? 'Logg inn'
              : 'Opprett konto'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
            }}
            className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            {isLogin
              ? 'Har du ikke en konto? Opprett konto'
              : 'Har du allerede en konto? Logg inn'}
          </button>
        </div>
      </div>
    </div>
  )
}
