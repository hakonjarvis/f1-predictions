'use client'

import { useState, useEffect } from 'react'
import { getTimeUntilReveal, formatCountdown } from '@/lib/countdown'

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilReveal())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilReveal())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 md:p-8 mb-8 text-center">
        <div className="inline-block bg-zinc-800 text-zinc-300 px-4 py-2 rounded text-sm font-medium mb-4 border border-zinc-700">
          ⏳ KOMMER SNART
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Leaderboard låses til jul
        </h2>
        <p className="text-zinc-400 text-sm md:text-base mb-6">
          Poengene vil bli synlige 24. desember 2025 kl. 18:00
        </p>
      </div>
    )
  }

  if (timeLeft.total <= 0) {
    return null
  }

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 md:p-8 mb-8 text-center">
      <div className="inline-block bg-zinc-800 text-zinc-300 px-4 py-2 rounded text-sm font-medium mb-4 border border-zinc-700">
        ⏳ KOMMER SNART
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
        Leaderboard låses til jul
      </h2>
      <p className="text-zinc-400 text-sm md:text-base mb-6">
        Poengene vil bli synlige 24. desember 2025 kl. 18:00
      </p>

      <div className="flex flex-wrap justify-center gap-4 mb-6">
        {timeLeft.days > 0 && (
          <div className="bg-zinc-800/50 rounded-lg p-4 min-w-[80px] border border-zinc-700">
            <div className="text-3xl md:text-4xl font-bold text-zinc-200">{timeLeft.days}</div>
            <div className="text-xs md:text-sm text-zinc-500 mt-1">
              {timeLeft.days === 1 ? 'dag' : 'dager'}
            </div>
          </div>
        )}
        {(timeLeft.days > 0 || timeLeft.hours > 0) && (
          <div className="bg-zinc-800/50 rounded-lg p-4 min-w-[80px] border border-zinc-700">
            <div className="text-3xl md:text-4xl font-bold text-zinc-200">{timeLeft.hours}</div>
            <div className="text-xs md:text-sm text-zinc-500 mt-1">
              {timeLeft.hours === 1 ? 'time' : 'timer'}
            </div>
          </div>
        )}
        <div className="bg-zinc-800/50 rounded-lg p-4 min-w-[80px] border border-zinc-700">
          <div className="text-3xl md:text-4xl font-bold text-zinc-200">{timeLeft.minutes}</div>
          <div className="text-xs md:text-sm text-zinc-500 mt-1">
            {timeLeft.minutes === 1 ? 'minutt' : 'minutter'}
          </div>
        </div>
        {timeLeft.days === 0 && (
          <div className="bg-zinc-800/50 rounded-lg p-4 min-w-[80px] border border-zinc-700">
            <div className="text-3xl md:text-4xl font-bold text-zinc-200">{timeLeft.seconds}</div>
            <div className="text-xs md:text-sm text-zinc-500 mt-1">
              {timeLeft.seconds === 1 ? 'sekund' : 'sekunder'}
            </div>
          </div>
        )}
      </div>

      <p className="text-sm text-zinc-600">
        {formatCountdown(timeLeft)} til poengene vises
      </p>
    </div>
  )
}
