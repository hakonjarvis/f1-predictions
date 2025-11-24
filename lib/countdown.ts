// Reveal date: December 24, 2025 at 18:00 (Norway time - CET)
export const REVEAL_DATE = new Date('2025-12-24T18:00:00+01:00')

export function shouldRevealScores(): boolean {
  return new Date() >= REVEAL_DATE
}

export function getTimeUntilReveal(): {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
} {
  const now = new Date()
  const diff = REVEAL_DATE.getTime() - now.getTime()

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds, total: diff }
}

export function formatCountdown(time: ReturnType<typeof getTimeUntilReveal>): string {
  if (time.total <= 0) {
    return 'Poengene er nå synlige!'
  }

  const parts: string[] = []

  if (time.days > 0) {
    parts.push(`${time.days} dag${time.days !== 1 ? 'er' : ''}`)
  }
  if (time.hours > 0) {
    parts.push(`${time.hours} time${time.hours !== 1 ? 'r' : ''}`)
  }
  if (time.minutes > 0) {
    parts.push(`${time.minutes} minutt${time.minutes !== 1 ? 'er' : ''}`)
  }
  if (time.days === 0 && time.seconds > 0) {
    parts.push(`${time.seconds} sekund${time.seconds !== 1 ? 'er' : ''}`)
  }

  return parts.join(', ')
}
