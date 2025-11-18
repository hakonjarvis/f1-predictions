/**
 * OpenF1 API Client
 * Documentation: https://openf1.org
 */

const OPENF1_BASE_URL = 'https://api.openf1.org/v1'

export interface OpenF1Driver {
  session_key: number
  driver_number: number
  broadcast_name: string
  full_name: string
  name_acronym: string
  team_name: string
  team_colour: string
  country_code: string
  headshot_url: string | null
}

export interface OpenF1Session {
  session_key: number
  session_name: string
  session_type: string
  date_start: string
  date_end: string
  gmt_offset: string
  location: string
  country_name: string
  circuit_short_name: string
  meeting_key: number
  year: number
}

export interface OpenF1Position {
  date: string
  driver_number: number
  meeting_key: number
  position: number
  session_key: number
}

/**
 * Fetch drivers for a specific session
 */
export async function fetchDrivers(sessionKey: number): Promise<OpenF1Driver[]> {
  const response = await fetch(`${OPENF1_BASE_URL}/drivers?session_key=${sessionKey}`)
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(`OpenF1 API rate limit exceeded. Please wait a moment and try again.`)
    }
    throw new Error(`OpenF1 API error: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

/**
 * Fetch all sessions for a specific year
 */
export async function fetchSessions(year: number): Promise<OpenF1Session[]> {
  const response = await fetch(`${OPENF1_BASE_URL}/sessions?year=${year}`)
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(`OpenF1 API rate limit exceeded. Please wait a moment and try again.`)
    }
    throw new Error(`OpenF1 API error: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

/**
 * Fetch race sessions only (not practice or qualifying)
 */
export async function fetchRaceSessions(year: number): Promise<OpenF1Session[]> {
  const sessions = await fetchSessions(year)
  return sessions.filter(s => s.session_name === 'Race')
}

/**
 * Fetch final positions for a session
 * Returns the last known position for each driver in the session
 */
export async function fetchSessionResults(sessionKey: number): Promise<OpenF1Position[]> {
  const response = await fetch(`${OPENF1_BASE_URL}/position?session_key=${sessionKey}`)
  if (!response.ok) {
    throw new Error(`OpenF1 API error: ${response.statusText}`)
  }

  const positions: OpenF1Position[] = await response.json()

  // Group by driver and get the latest position for each
  const latestPositions = new Map<number, OpenF1Position>()

  for (const pos of positions) {
    const existing = latestPositions.get(pos.driver_number)
    if (!existing || new Date(pos.date) > new Date(existing.date)) {
      latestPositions.set(pos.driver_number, pos)
    }
  }

  return Array.from(latestPositions.values()).sort((a, b) => a.position - b.position)
}

/**
 * Get the latest session (useful for development/testing)
 */
export async function fetchLatestSession(): Promise<OpenF1Session | null> {
  const response = await fetch(`${OPENF1_BASE_URL}/sessions?session_key=latest`)
  if (!response.ok) {
    throw new Error(`OpenF1 API error: ${response.statusText}`)
  }
  const sessions = await response.json()
  return sessions[0] || null
}
