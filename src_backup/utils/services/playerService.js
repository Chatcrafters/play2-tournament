import { supabase } from '../lib/supabase'

const playerService = {
  // Alle Spieler des Benutzers abrufen
  async getPlayers() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Kein Benutzer angemeldet')

      const { data, error } = await supabase
        .from('play2_players')
        .select('*')
        .eq('event_id', null)  // Globale Spieler (nicht event-spezifisch)
        .order('name')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Fehler beim Abrufen der Spieler:', error)
      return []
    }
  },

  // Spieler suchen (für Autocomplete)
  async searchPlayers(searchTerm) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Kein Benutzer angemeldet')

      const { data, error } = await supabase
        .from('play2_players')
        .select('*')
        .eq('event_id', null)
        .ilike('name', `%${searchTerm}%`)
        .order('name')
        .limit(10)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Fehler bei der Spielersuche:', error)
      return []
    }
  },

  // Neuen Spieler erstellen
  async createPlayer(playerData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Kein Benutzer angemeldet')

      const { data, error } = await supabase
        .from('play2_players')
        .insert([{
          name: playerData.name,
          email: playerData.email || null,
          phone: playerData.phone || null,
          skill_level: playerData.skill_level || 3,
          sports: playerData.sports || { padel: true, pickleball: false, spinxball: false },
          notes: playerData.notes || null,
          event_id: null  // Globaler Spieler
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Fehler beim Erstellen des Spielers:', error)
      throw error
    }
  },

  // Spieler aktualisieren
  async updatePlayer(playerId, updates) {
    try {
      const { data, error } = await supabase
        .from('play2_players')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', playerId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Spielers:', error)
      throw error
    }
  },

  // Spieler löschen
  async deletePlayer(playerId) {
    try {
      const { error } = await supabase
        .from('play2_players')
        .delete()
        .eq('id', playerId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Fehler beim Löschen des Spielers:', error)
      throw error
    }
  },

  // Spieler zu Event hinzufügen (Teilnahme registrieren)
  async addPlayerToEvent(playerId, eventId, skillLevel) {
    try {
      const { data, error } = await supabase
        .from('play2_player_participations')
        .insert([{
          player_id: playerId,
          event_id: eventId,
          skill_level: skillLevel
        }])
        .select()
        .single()

      if (error) throw error

      // Aktualisiere last_played_at
      await this.updatePlayer(playerId, {
        last_played_at: new Date().toISOString()
      })

      return data
    } catch (error) {
      console.error('Fehler beim Hinzufügen zum Event:', error)
      throw error
    }
  },

  // Spieler-Statistiken für ein Event aktualisieren
  async updatePlayerStats(playerId, eventId, stats) {
    try {
      const { data, error } = await supabase
        .from('play2_player_participations')
        .update({
          games_played: stats.games_played,
          games_won: stats.games_won,
          points_scored: stats.points_scored
        })
        .eq('player_id', playerId)
        .eq('event_id', eventId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Statistiken:', error)
      throw error
    }
  },

  // Spieler-Historie abrufen
  async getPlayerHistory(playerId) {
    try {
      const { data, error } = await supabase
        .from('play2_player_participations')
        .select(`
          *,
          event:play2_events (
            name,
            date,
            sport,
            eventType
          )
        `)
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Fehler beim Abrufen der Historie:', error)
      return []
    }
  },

  // Spieler importieren (aus CSV/Excel)
  async importPlayers(playersArray) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Kein Benutzer angemeldet')

      const playersToInsert = playersArray.map(player => ({
        name: player.name,
        email: player.email || null,
        phone: player.phone || null,
        skill_level: player.skill_level || 3,
        sports: player.sports || { padel: true, pickleball: false, spinxball: false },
        notes: player.notes || null,
        event_id: null
      }))

      const { data, error } = await supabase
        .from('play2_players')
        .insert(playersToInsert)
        .select()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Fehler beim Importieren der Spieler:', error)
      throw error
    }
  },

  // Prüfen ob Spieler bereits existiert
  async checkPlayerExists(name) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Kein Benutzer angemeldet')

      const { data, error } = await supabase
        .from('play2_players')
        .select('id, name')
        .eq('event_id', null)
        .ilike('name', name)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('Fehler beim Prüfen des Spielers:', error)
      return null
    }
  }
}

export default playerService