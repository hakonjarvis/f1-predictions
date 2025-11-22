import { createClient } from '@supabase/supabase-js'

// Create Supabase client for server-side database operations
// Using service role key would be better for admin operations, but we'll use anon key for now
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const db = createClient(supabaseUrl, supabaseKey)

// Helper functions for common queries
export const dbHelpers = {
  async getAllUsersWithPredictions() {
    const { data: users, error } = await db
      .from('User')
      .select(`
        *,
        prediction:SeasonPrediction(
          *,
          predictions:DriverPrediction(
            *,
            driver:Driver(*)
          )
        )
      `)
      .order('createdAt', { ascending: false })

    if (error) throw error

    // Transform: convert prediction array to single object or null
    // Supabase returns one-to-one relations as arrays, but frontend expects single object
    return users?.map(user => ({
      ...user,
      prediction: Array.isArray(user.prediction) && user.prediction.length > 0
        ? user.prediction[0]
        : null
    })) || []
  },

  async getDrivers() {
    const { data, error } = await db
      .from('Driver')
      .select('*, team:Team(*)')
      .order('number', { ascending: true })

    if (error) throw error
    return data
  },

  async getUserByAuthId(authId: string) {
    const { data, error } = await db
      .from('User')
      .select(`
        *,
        prediction:SeasonPrediction(
          *,
          predictions:DriverPrediction(
            *,
            driver:Driver(*)
          )
        )
      `)
      .eq('authId', authId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"

    // Transform: convert prediction array to single object or null
    if (data && Array.isArray(data.prediction) && data.prediction.length > 0) {
      data.prediction = data.prediction[0]
    } else if (data) {
      data.prediction = null
    }

    return data
  },

  async deletePrediction(userId: number) {
    const { error } = await db
      .from('SeasonPrediction')
      .delete()
      .eq('userId', userId)

    if (error) throw error
  },

  async upsertTeam(name: string) {
    // Check if team exists
    const { data: existing, error: selectError } = await db
      .from('Team')
      .select('*')
      .eq('name', name)
      .single()

    if (selectError && selectError.code !== 'PGRST116') throw selectError

    if (existing) {
      // Team exists, return it
      return existing
    } else {
      // Create new team
      const { data, error } = await db
        .from('Team')
        .insert({ name })
        .select()
        .single()

      if (error) throw error
      return data
    }
  },

  async upsertDriver(driver: {
    name: string
    code: string
    number: number
    country: string | null
    headshotUrl: string | null
    teamId: number
  }) {
    // Check if driver exists
    const { data: existing, error: selectError } = await db
      .from('Driver')
      .select('*')
      .eq('code', driver.code)
      .single()

    if (selectError && selectError.code !== 'PGRST116') throw selectError

    if (existing) {
      // Update existing driver
      const { data, error } = await db
        .from('Driver')
        .update({
          name: driver.name,
          number: driver.number,
          country: driver.country,
          headshotUrl: driver.headshotUrl,
          teamId: driver.teamId,
        })
        .eq('code', driver.code)
        .select()
        .single()

      if (error) throw error
      return { data, isNew: false }
    } else {
      // Create new driver
      const { data, error } = await db
        .from('Driver')
        .insert(driver)
        .select()
        .single()

      if (error) throw error
      return { data, isNew: true }
    }
  },

  async upsertRaceResult(result: {
    raceName: string
    round: number
    year: number
    sessionKey: number
    driverId: number
    position: number
    points: number
  }) {
    // Check if result exists
    const { data: existing, error: selectError } = await db
      .from('RaceResult')
      .select('*')
      .eq('sessionKey', result.sessionKey)
      .eq('driverId', result.driverId)
      .single()

    if (selectError && selectError.code !== 'PGRST116') throw selectError

    if (existing) {
      // Update existing result
      const { data, error } = await db
        .from('RaceResult')
        .update({
          raceName: result.raceName,
          round: result.round,
          position: result.position,
          points: result.points,
        })
        .eq('sessionKey', result.sessionKey)
        .eq('driverId', result.driverId)
        .select()
        .single()

      if (error) throw error
      return { data, isNew: false }
    } else {
      // Create new result
      const { data, error } = await db
        .from('RaceResult')
        .insert(result)
        .select()
        .single()

      if (error) throw error
      return { data, isNew: true }
    }
  },

  async getAllRaceResults() {
    const { data, error } = await db
      .from('RaceResult')
      .select('*')

    if (error) throw error
    return data
  },

  async getTeamByName(name: string) {
    const { data, error } = await db
      .from('Team')
      .select('*')
      .eq('name', name)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getDriverByCode(code: string) {
    const { data, error } = await db
      .from('Driver')
      .select('*')
      .eq('code', code)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getAllDrivers() {
    const { data, error } = await db
      .from('Driver')
      .select('*')

    if (error) throw error
    return data
  },

  async createUser(authId: string, name: string, email: string) {
    const { data, error } = await db
      .from('User')
      .insert({ authId, name, email })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateUser(authId: string, name: string, email: string) {
    const { data, error } = await db
      .from('User')
      .update({ name, email })
      .eq('authId', authId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async createSeasonPrediction(userId: number, predictions: Array<{ driverId: number; position: number }>) {
    // Create season prediction
    const { data: seasonPrediction, error: seasonError } = await db
      .from('SeasonPrediction')
      .insert({ userId })
      .select()
      .single()

    if (seasonError) throw seasonError

    // Create driver predictions
    const driverPredictions = predictions.map(pred => ({
      seasonPredictionId: seasonPrediction.id,
      driverId: pred.driverId,
      predictedPosition: pred.position,
    }))

    const { error: predError } = await db
      .from('DriverPrediction')
      .insert(driverPredictions)

    if (predError) throw predError

    // Fetch the complete prediction with driver details
    const { data, error } = await db
      .from('SeasonPrediction')
      .select(`
        *,
        predictions:DriverPrediction(
          *,
          driver:Driver(*)
        )
      `)
      .eq('id', seasonPrediction.id)
      .single()

    if (error) throw error
    return data
  }
}
