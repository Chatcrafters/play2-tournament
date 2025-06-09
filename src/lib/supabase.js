import { createClient } from '@supabase/supabase-js'
import { transformFromDB, transformToDB, cleanEventData, sanitizeEventData } from '../utils/dbHelpers'

// Diese Werte kommen aus der .env.local Datei
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL und Anon Key müssen in .env definiert sein')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database operations helper
export const dbOperations = {
  // Events
  async createEvent(eventData) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Nicht angemeldet')
    
    // Bereinige die Daten vor der Transformation
    const cleanedData = cleanEventData({
      ...eventData,
      userId: user.id,
      createdAt: new Date().toISOString(),
      // Stelle sicher, dass Arrays existieren
      players: eventData.players || [],
      schedule: eventData.schedule || [],
      breaks: eventData.breaks || [],
      dailySchedule: eventData.dailySchedule || [],
      results: eventData.results || {},
      // Konvertiere leere Datums-Strings zu null
      date: eventData.date || null,
      endDate: eventData.endDate || null,
      registrationDeadline: eventData.registrationDeadline || null
    })
    
    // WICHTIG: transformToDB verwenden!
    const dbData = transformToDB(cleanedData)
    
    // Entferne undefined Werte
    Object.keys(dbData).forEach(key => {
      if (dbData[key] === undefined) {
        delete dbData[key]
      }
    })
    
    console.log('Creating event with data:', dbData)
    
    const { data, error } = await supabase
      .from('events')
      .insert([dbData])
      .select()
      .single()
    
    if (error) {
      console.error('Create event error:', error)
      throw error
    }
    
    return transformFromDB(data)
  },

  async updateEvent(id, updates) {
    try {
      console.log('Updating event:', id, updates)
      
      // Bereinige Updates
      const cleanedUpdates = cleanEventData(updates)
      
      // Bereite Updates für DB vor
      const dbUpdates = transformToDB(cleanedUpdates)
      
      // Stelle sicher, dass Arrays als Arrays gespeichert werden
      if ('schedule' in dbUpdates && dbUpdates.schedule === null) {
        dbUpdates.schedule = []
      }
      if ('players' in dbUpdates && dbUpdates.players === null) {
        dbUpdates.players = []
      }
      if ('results' in dbUpdates && dbUpdates.results === null) {
        dbUpdates.results = {}
      }
      
      console.log('DB updates:', dbUpdates)
      
      const { data, error } = await supabase
        .from('events')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Supabase update error:', error)
        throw error
      }
      
      console.log('Update successful:', data)
      return transformFromDB(data)
    } catch (error) {
      console.error('Update event error:', error)
      throw error
    }
  },

  async deleteEvent(id) {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async getEvents() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Nicht angemeldet')
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return (data || []).map(event => {
      const transformed = transformFromDB(event)
      // Zusätzliche Sicherheit
      return sanitizeEventData(transformed)
    })
  },

  async getEvent(eventId) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()
      
      if (error) throw error
      
      // Transformiere und sanitize
      const transformed = transformFromDB(data)
      
      // Zusätzliche Sicherheit für Arrays
      if (transformed) {
        transformed.schedule = Array.isArray(transformed.schedule) ? transformed.schedule : []
        transformed.players = Array.isArray(transformed.players) ? transformed.players : []
        transformed.breaks = Array.isArray(transformed.breaks) ? transformed.breaks : []
        transformed.dailySchedule = Array.isArray(transformed.dailySchedule) ? transformed.dailySchedule : []
        transformed.results = transformed.results || {}
      }
      
      return transformed
    } catch (error) {
      console.error('Get event error:', error)
      throw error
    }
  },

  // Players
  async createPlayer(player) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Nicht angemeldet')
    
    const cleanedPlayer = {
      ...player,
      userId: user.id,
      createdAt: new Date().toISOString(),
      sports: player.sports || {
        padel: false,
        pickleball: false,
        spinxball: false
      },
      padelSkill: player.padelSkill || 'B',
      pickleballSkill: player.pickleballSkill || 3.0,
      spinxballSkill: player.spinxballSkill || 3.0
    }
    
    const dbData = transformToDB(cleanedPlayer)
    
    const { data, error } = await supabase
      .from('players')
      .insert([dbData])
      .select()
      .single()
    
    if (error) throw error
    return transformFromDB(data)
  },

  async updatePlayer(id, updates) {
    // Bereinige Update-Daten
    const cleanedUpdates = {
      ...updates,
      // Stelle sicher, dass skills die richtigen Datentypen haben
      padelSkill: updates.padelSkill || 'B',
      pickleballSkill: typeof updates.pickleballSkill === 'number' 
        ? updates.pickleballSkill 
        : parseFloat(updates.pickleballSkill) || 3.0,
      spinxballSkill: typeof updates.spinxballSkill === 'number' 
        ? updates.spinxballSkill 
        : parseFloat(updates.spinxballSkill) || 3.0
    }
    
    const dbUpdates = transformToDB(cleanedUpdates)
    
    const { data, error } = await supabase
      .from('players')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return transformFromDB(data)
  },

  async deletePlayer(id) {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async getPlayers() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Nicht angemeldet')
    
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    
    if (error) throw error
    
    return (data || []).map(player => {
      const transformed = transformFromDB(player)
      // Stelle sicher, dass alte Spieler ohne sports-Feld kompatibel sind
      if (!transformed.sports) {
        transformed.sports = {
          padel: true, // Default: Padel ist aktiviert
          pickleball: false,
          spinxball: false
        }
      }
      // Stelle sicher, dass Skills den richtigen Typ haben
      if (transformed.padelSkill && typeof transformed.padelSkill === 'number') {
        // Konvertiere alte numerische Padel-Skills zu Buchstaben
        transformed.padelSkill = convertNumericPadelSkill(transformed.padelSkill)
      }
      return transformed
    })
  },

  // Tournament results
  async saveTournamentResult(eventId, results) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Nicht angemeldet')
    
    const dbData = transformToDB({
      eventId,
      results,
      userId: user.id,
      createdAt: new Date().toISOString()
    })
    
    const { data, error } = await supabase
      .from('tournament_results')
      .insert([dbData])
      .select()
      .single()
    
    if (error) throw error
    return transformFromDB(data)
  },

  async getTournamentResults(eventId) {
    const { data, error } = await supabase
      .from('tournament_results')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []).map(result => transformFromDB(result))
  },

  // Batch operations
  async batchUpdateEvents(updates) {
    const results = []
    
    for (const update of updates) {
      try {
        const result = await dbOperations.updateEvent(update.id, update.data)
        results.push({ success: true, id: update.id, data: result })
      } catch (error) {
        console.error(`Error updating event ${update.id}:`, error)
        results.push({ success: false, id: update.id, error: error.message })
      }
    }
    
    return results
  },

  // Debug helpers
  async debugEventData(eventId) {
    try {
      // Hole Rohdaten direkt aus der DB
      const { data: rawData, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()
      
      if (error) throw error
      
      console.group('🔍 Event Debug Info')
      console.log('Raw DB data:', rawData)
      console.log('Schedule type:', typeof rawData.schedule)
      console.log('Schedule value:', rawData.schedule)
      console.log('Schedule is null?', rawData.schedule === null)
      console.log('Schedule is array?', Array.isArray(rawData.schedule))
      
      const transformed = transformFromDB(rawData)
      console.log('Transformed data:', transformed)
      console.log('Transformed schedule:', transformed.schedule)
      console.log('Transformed schedule is array?', Array.isArray(transformed.schedule))
      console.groupEnd()
      
      return { raw: rawData, transformed }
    } catch (error) {
      console.error('Debug error:', error)
      throw error
    }
  }
}

// Helper-Funktion für die Konvertierung alter numerischer Padel-Skills
function convertNumericPadelSkill(numericSkill) {
  if (numericSkill <= 2.0) return 'C'
  if (numericSkill <= 3.25) return 'B-'
  if (numericSkill <= 3.75) return 'B'
  if (numericSkill <= 4.25) return 'B+'
  if (numericSkill <= 4.75) return 'A-'
  return 'A'
}

// Auth helpers
export const authHelpers = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
    return data
  },

  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
    return data
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Storage helpers
export const storageHelpers = {
  async uploadFile(bucket, path, file) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file)
    
    if (error) throw error
    return data
  },

  async downloadFile(bucket, path) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)
    
    if (error) throw error
    return data
  },

  async deleteFile(bucket, path) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path])
    
    if (error) throw error
    return data
  },

  getPublicUrl(bucket, path) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    return data.publicUrl
  }
}

// Realtime subscriptions
export const realtimeHelpers = {
  subscribeToEvent(eventId, callback) {
    return supabase
      .channel(`event:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`
        },
        (payload) => {
          console.log('Realtime update:', payload)
          callback(transformFromDB(payload.new))
        }
      )
      .subscribe()
  },

  unsubscribe(subscription) {
    supabase.removeChannel(subscription)
  }
}

// Export default
export default supabase