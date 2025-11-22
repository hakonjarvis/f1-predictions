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
    return users
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
    return data
  },

  async deletePrediction(userId: number) {
    const { error } = await db
      .from('SeasonPrediction')
      .delete()
      .eq('userId', userId)

    if (error) throw error
  }
}
