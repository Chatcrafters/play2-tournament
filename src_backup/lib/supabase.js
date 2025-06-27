import { createClient } from '@supabase/supabase-js'

// Diese Werte kommen aus der .env.local Datei
const supabaseUrl = 'https://ycwavingkihnepinrxlx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljd2F2aW5na2lobmVwaW5yeGx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MTMwOTUsImV4cCI6MjA2Mzk4OTA5NX0.FkUmAxmCOz9-jw_6VZkmmHmmMQTxjN2Gha3xxFjz120'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL und Anon Key müssen in .env definiert sein')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database operations helper - OHNE Transformationen
export const dbOperations = {
  // Events
  async createEvent(eventData) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Nicht angemeldet')
    
    // Direkt verwenden, keine Transformation
    const dbData = {
      ...eventData,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Stelle sicher, dass Arrays existieren
      players: eventData.players || [],
      schedule: eventData.schedule || [],
      breaks: eventData.breaks || [],
      daily_schedule: eventData.daily_schedule || [],
      results: eventData.results || {}
    }
    
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
    
    return data
  },

  async updateEvent(id, updates) {
    try {
      console.log('Updating event:', id, updates)
      
      // Direkt verwenden, keine Transformation
      const dbUpdates = {
        ...updates,
        updated_at: new Date().toISOString()
      }
      
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
      return data
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
    
    // Stelle sicher, dass Arrays korrekt sind
    return (data || []).map(event => ({
      ...event,
      schedule: Array.isArray(event.schedule) ? event.schedule : [],
      players: Array.isArray(event.players) ? event.players : [],
      breaks: Array.isArray(event.breaks) ? event.breaks : [],
      daily_schedule: Array.isArray(event.daily_schedule) ? event.daily_schedule : [],
      results: event.results || {}
    }))
  },

  async getEvent(eventId) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()
      
      if (error) throw error
      
      // Stelle sicher, dass Arrays korrekt sind
      if (data) {
        data.schedule = Array.isArray(data.schedule) ? data.schedule : []
        data.players = Array.isArray(data.players) ? data.players : []
        data.breaks = Array.isArray(data.breaks) ? data.breaks : []
        data.daily_schedule = Array.isArray(data.daily_schedule) ? data.daily_schedule : []
        data.results = data.results || {}
      }
      
      return data
    } catch (error) {
      console.error('Get event error:', error)
      throw error
    }
  },

  // Players
  async createPlayer(player) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Nicht angemeldet')
    
    const dbData = {
      ...player,
      user_id: user.id,
      created_at: new Date().toISOString(),
      sports: player.sports || {
        padel: false,
        pickleball: false,
        spinxball: false
      },
      padelSkill: player.padelSkill || player.padel_skill || 'B',
      pickleballSkill: player.pickleballSkill || player.pickleball_skill || 3.0,
      spinxballSkill: player.spinxballSkill || player.spinxball_skill || 3.0
    }
    
    const { data, error } = await supabase
      .from('players')
      .insert([dbData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updatePlayer(id, updates) {
    const dbUpdates = {
      ...updates,
      // Akzeptiere beide Schreibweisen
      padelSkill: updates.padelSkill || updates.padel_skill || 'B',
      pickleballSkill: updates.pickleballSkill || updates.pickleball_skill || 3.0,
      spinxballSkill: updates.spinxballSkill || updates.spinxball_skill || 3.0
    }
    
    const { data, error } = await supabase
      .from('players')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
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
      // Stelle sicher, dass alte Spieler ohne sports-Feld kompatibel sind
      if (!player.sports) {
        player.sports = {
          padel: true, // Default: Padel ist aktiviert
          pickleball: false,
          spinxball: false
        }
      }
      return player
    })
  },

  // Tournament results
  async saveTournamentResult(eventId, results) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Nicht angemeldet')
    
    const dbData = {
      event_id: eventId,
      results: results,
      user_id: user.id,
      created_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('tournament_results')
      .insert([dbData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getTournamentResults(eventId) {
    const { data, error } = await supabase
      .from('tournament_results')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
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
      console.groupEnd()
      
      return rawData
    } catch (error) {
      console.error('Debug error:', error)
      throw error
    }
  }
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
          callback(payload.new)
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