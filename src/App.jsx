import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { EventList } from './components/EventList'
import { EventForm } from './components/EventForm'
import { EventDetail } from './components/EventDetail'
import { PlayerManagement } from './components/PlayerManagement'
import { ResultsDisplay } from './components/ResultsDisplay'
import PlayerDatabase from './components/PlayerDatabase'
import { EventRegistration } from './components/EventRegistration'
import { AmericanoTournament } from './components/AmericanoTournament'
import { supabase } from './lib/supabase'
import { LanguageProvider, LanguageSelector, useTranslation } from './components/LanguageSelector'
import './App.css'

// Transform snake_case aus DB zu camelCase für Frontend
const transformFromSnakeCase = (obj) => {
  if (!obj) return obj;
  
  const transformed = {};
  
  Object.keys(obj).forEach(key => {
    // Spezielle Mappings für alle Felder
    const fieldMappings = {
      // Zeit-bezogene Felder
      start_time: 'startTime',
      end_time: 'endTime',
      end_date: 'endDate',
      registration_deadline: 'registrationDeadline',
      created_at: 'createdAt',
      updated_at: 'updatedAt',
      completed_at: 'completedAt',
      
      // Event-Einstellungen
      max_players: 'maxPlayers',
      event_type: 'eventType',
      event_info: 'eventInfo',
      round_duration: 'roundDuration',
      is_public: 'isPublic',
      registration_open: 'registrationOpen',
      entry_fee: 'entryFee',
      
      // Spielmodus-Felder
      mindest_spiele: 'mindestSpiele',
      garantie_spiele: 'garantieSpiele',
      mindest_minuten: 'mindestMinuten',
      garantie_minuten: 'garantieMinuten',
      team_format: 'teamFormat',
      average_game_time: 'averageGameTime',
      play_mode: 'playMode',
      draw_method: 'drawMethod',
      
      // Andere Felder bleiben wie sie sind
      id: 'id',
      name: 'name',
      date: 'date',
      location: 'location',
      sport: 'sport',
      courts: 'courts',
      phone: 'phone',
      spielmodus: 'spielmodus',
      players: 'players',
      results: 'results',
      schedule: 'schedule',
      breaks: 'breaks',
      status: 'status'
    };
    
    const frontendKey = fieldMappings[key] || key;
    transformed[frontendKey] = obj[key];
  });
  
  return transformed;
};

// Transform camelCase vom Frontend zu snake_case für DB
const transformToSnakeCase = (obj) => {
  if (!obj) return obj;
  
  const transformed = {};
  
  Object.keys(obj).forEach(key => {
    // Spezielle Mappings für alle Felder
    const fieldMappings = {
      // Zeit-bezogene Felder
      startTime: 'start_time',
      endTime: 'end_time',
      endDate: 'end_date',
      registrationDeadline: 'registration_deadline',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      completedAt: 'completed_at',
      
      // Event-Einstellungen
      maxPlayers: 'max_players',
      eventType: 'event_type',
      eventInfo: 'event_info',
      roundDuration: 'round_duration',
      isPublic: 'is_public',
      registrationOpen: 'registration_open',
      entryFee: 'entry_fee',
      
      // Spielmodus-Felder
      mindestSpiele: 'mindest_spiele',
      garantieSpiele: 'garantie_spiele',
      mindestMinuten: 'mindest_minuten',
      garantieMinuten: 'garantie_minuten',
      teamFormat: 'team_format',
      averageGameTime: 'average_game_time',
      playMode: 'play_mode',
      drawMethod: 'draw_method',
      
      // Andere Felder bleiben wie sie sind
      id: 'id',
      name: 'name',
      date: 'date',
      location: 'location',
      sport: 'sport',
      courts: 'courts',
      phone: 'phone',
      spielmodus: 'spielmodus',
      players: 'players',
      results: 'results',
      schedule: 'schedule',
      breaks: 'breaks',
      status: 'status'
    };
    
    const dbKey = fieldMappings[key] || key;
    
    // Skip undefined values
    if (obj[key] !== undefined) {
      transformed[dbKey] = obj[key];
    }
  });
  
  return transformed;
};

// Hilfsfunktion zur Daten-Migration
const migrateEventData = (event) => {
  return {
    ...event,
    // Stelle sicher, dass schedule immer ein Array ist
    schedule: Array.isArray(event.schedule) ? event.schedule : [],
    // Stelle sicher, dass players immer ein Array ist
    players: Array.isArray(event.players) ? event.players : [],
    // Stelle sicher, dass results ein Objekt ist
    results: event.results || {},
    // Stelle sicher, dass breaks ein Array ist
    breaks: Array.isArray(event.breaks) ? event.breaks : [],
    // Standard-Werte für fehlende Felder
    status: event.status || 'upcoming',
    courts: event.courts || 2,
    roundDuration: event.roundDuration || 15,
    isPublic: event.isPublic !== undefined ? event.isPublic : false,
    registrationOpen: event.registrationOpen !== undefined ? event.registrationOpen : false
  }
}

// Hauptinhalt der App als separate Komponente für useTranslation Hook
function AppContent() {
  const { t } = useTranslation()
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [showPlayerDatabase, setShowPlayerDatabase] = useState(false)
  const [runningTournament, setRunningTournament] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load events from Supabase on component mount
  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setIsLoading(true)
      console.log('Lade Events...')
      
      // Versuche zuerst aus Supabase zu laden
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true })
        
        if (error) {
          console.error('Supabase error:', error)
          // Fallback zu localStorage
          loadFromLocalStorage()
        } else if (data) {
          console.log('Events aus Supabase geladen:', data)
          // Transformiere alle Events von snake_case zu camelCase
          const transformedEvents = data.map(event => {
            const transformed = transformFromSnakeCase(event)
            console.log('Transformiert:', event, '->', transformed)
            return transformed
          })
          // Migriere alle Events beim Laden
          const migratedEvents = transformedEvents.map(migrateEventData)
          setEvents(migratedEvents)
          
          // Speichere auch in localStorage als Backup
          localStorage.setItem('events', JSON.stringify(migratedEvents))
        }
      } catch (supabaseError) {
        console.error('Supabase Verbindungsfehler:', supabaseError)
        // Fallback zu localStorage
        loadFromLocalStorage()
      }
    } catch (error) {
      console.error('Fehler beim Laden der Events:', error)
      loadFromLocalStorage()
    } finally {
      setIsLoading(false)
    }
  }

  const loadFromLocalStorage = () => {
    const savedEvents = localStorage.getItem('events')
    if (savedEvents) {
      console.log('Events aus localStorage geladen')
      const parsedEvents = JSON.parse(savedEvents)
      // Migriere auch localStorage Daten
      const migratedEvents = parsedEvents.map(migrateEventData)
      setEvents(migratedEvents)
      // Speichere migrierte Daten zurück
      localStorage.setItem('events', JSON.stringify(migratedEvents))
    }
  }

  // Save events to both Supabase and localStorage
  const saveEvents = async (updatedEvents) => {
    // Migriere alle Events vor dem Speichern
    const migratedEvents = updatedEvents.map(migrateEventData)
    
    // Speichere sofort in localStorage
    localStorage.setItem('events', JSON.stringify(migratedEvents))
    setEvents(migratedEvents)
    
    // Versuche in Supabase zu speichern
    try {
      for (const event of migratedEvents) {
        // Entferne Felder, die nicht in der Datenbank existieren sollten
        const { genderMode, ...eventData } = event;
        
        // Transformiere zu snake_case
        const dbEvent = transformToSnakeCase(eventData);
        
        console.log('Speichere Event in DB:', dbEvent)
        
        if (event.id.startsWith('temp_')) {
          // Neues Event - INSERT
          const { data, error } = await supabase
            .from('events')
            .insert([{
              ...dbEvent,
              id: undefined, // Lasse Supabase eine ID generieren
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select()
            .single()
          
          if (error) {
            console.error('Fehler beim Erstellen des Events:', error)
            console.error('Gesendete Daten:', dbEvent)
            // Zeige Benutzer-Fehlermeldung
            alert(`Fehler beim Speichern: ${error.message}`)
          } else if (data) {
            console.log('Event erfolgreich erstellt:', data)
            // Aktualisiere die temporäre ID mit der echten Supabase ID
            const index = migratedEvents.findIndex(e => e.id === event.id)
            if (index !== -1) {
              migratedEvents[index] = { ...migratedEvents[index], id: data.id }
              localStorage.setItem('events', JSON.stringify(migratedEvents))
              setEvents([...migratedEvents])
            }
          }
        } else {
          // Bestehendes Event - UPDATE
          const { error } = await supabase
            .from('events')
            .update({
              ...dbEvent,
              updated_at: new Date().toISOString()
            })
            .eq('id', event.id)
          
          if (error) {
            console.error('Fehler beim Aktualisieren des Events:', error)
            console.error('Gesendete Daten:', dbEvent)
            alert(`Fehler beim Aktualisieren: ${error.message}`)
          } else {
            console.log('Event erfolgreich aktualisiert')
          }
        }
      }
    } catch (error) {
      console.error('Fehler beim Speichern in Supabase:', error)
      alert('Die Änderungen wurden lokal gespeichert, konnten aber nicht mit der Datenbank synchronisiert werden.')
    }
  }

  const handleCreateEvent = (eventData) => {
    const newEvent = {
      ...eventData,
      id: `temp_${Date.now()}`, // Temporäre ID
      players: [],
      results: {},
      status: 'upcoming',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Erstelle schedule Array aus startTime und endTime falls nicht vorhanden
      schedule: eventData.schedule || (eventData.startTime && eventData.endTime ? [{
        start_time: eventData.startTime,
        end_time: eventData.endTime
      }] : [])
    }
    
    const updatedEvents = [...events, newEvent]
    saveEvents(updatedEvents)
    setShowEventForm(false)
    setSelectedEvent(newEvent)
  }

  const handleUpdateEvent = async (updatedEvent) => {
    // Migriere das Event vor dem Update
    const migratedEvent = migrateEventData(updatedEvent)
    
    const updatedEvents = events.map(event => 
      event.id === migratedEvent.id ? migratedEvent : event
    )
    await saveEvents(updatedEvents)
    setSelectedEvent(migratedEvent)
    
    if (editingEvent) {
      setEditingEvent(null)
      setShowEventForm(false)
    }
  }

  const handleDeleteEvent = async (eventId) => {
    // Zeige Bestätigungsdialog
    if (!window.confirm(t('messages.confirmDelete'))) {
      return
    }
    
    // Lösche aus lokalem State
    const updatedEvents = events.filter(event => event.id !== eventId)
    setEvents(updatedEvents)
    localStorage.setItem('events', JSON.stringify(updatedEvents))
    
    if (selectedEvent && selectedEvent.id === eventId) {
      setSelectedEvent(null)
    }
    
    // Versuche aus Supabase zu löschen
    if (!eventId.startsWith('temp_')) {
      try {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', eventId)
        
        if (error) {
          console.error('Fehler beim Löschen aus Supabase:', error)
          alert(`Fehler beim Löschen: ${error.message}`)
        } else {
          console.log('Event erfolgreich gelöscht')
        }
      } catch (error) {
        console.error('Fehler beim Löschen:', error)
      }
    }
  }

  const handleEditEvent = (event) => {
    // Migriere Event vor dem Editieren
    const migratedEvent = migrateEventData(event)
    setEditingEvent(migratedEvent)
    setShowEventForm(true)
  }

  const handleSelectPlayersFromDatabase = (selectedPlayers) => {
    if (selectedEvent) {
      const updatedPlayers = [...(selectedEvent.players || [])]
      const maxPlayers = selectedEvent.maxPlayers || 16
      const remainingSlots = maxPlayers - updatedPlayers.length
      
      // Nur so viele Spieler hinzufügen, wie noch Plätze frei sind
      let addedCount = 0
      
      selectedPlayers.forEach(dbPlayer => {
        // Stoppe, wenn max erreicht
        if (addedCount >= remainingSlots) return
        
        // Prüfe ob Spieler bereits existiert (nach Name, Email oder Telefon)
        const alreadyExists = updatedPlayers.some(p => 
          p.name === dbPlayer.name || 
          (p.email && p.email === dbPlayer.email) ||
          (p.phone && p.phone === dbPlayer.phone)
        )
        
        if (!alreadyExists) {
          const newPlayer = {
            id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${updatedPlayers.length}`,
            name: dbPlayer.name,
            gender: dbPlayer.gender || 'male',
            skillLevel: dbPlayer.skillLevel || (selectedEvent.sport === 'padel' ? 'B' : 3),
            skillLevels: dbPlayer.skillLevels || {
              padel: dbPlayer.padelSkill || 'B',
              pickleball: dbPlayer.pickleballSkill || 3,
              spinxball: dbPlayer.spinxballSkill || 3
            }
          }
          
          // Füge alle verfügbaren Kontaktdaten hinzu
          if (dbPlayer.email) newPlayer.email = dbPlayer.email
          if (dbPlayer.phone) newPlayer.phone = dbPlayer.phone
          if (dbPlayer.birthday) newPlayer.birthday = dbPlayer.birthday
          if (dbPlayer.city) newPlayer.city = dbPlayer.city
          if (dbPlayer.club) newPlayer.club = dbPlayer.club
          if (dbPlayer.nationality) newPlayer.nationality = dbPlayer.nationality
          
          updatedPlayers.push(newPlayer)
          addedCount++
        }
      })
      
      // Warnung anzeigen, wenn nicht alle hinzugefügt werden konnten
      if (selectedPlayers.length > remainingSlots) {
        alert(`Es konnten nur ${remainingSlots} von ${selectedPlayers.length} Spielern hinzugefügt werden. Das Event ist auf ${maxPlayers} Spieler begrenzt.`)
      }
      
      const updatedEvent = {
        ...selectedEvent,
        players: updatedPlayers
      }
      handleUpdateEvent(updatedEvent)
    }
  }

  const handleStartTournament = (event) => {
    // Migriere Event vor dem Turnier-Start
    const migratedEvent = migrateEventData(event)
    setRunningTournament(migratedEvent)
  }

  const handleTournamentComplete = (results) => {
    if (runningTournament) {
      const updatedEvent = {
        ...runningTournament,
        results: results || {},
        status: 'completed',
        completed_at: new Date().toISOString()
      }
      handleUpdateEvent(updatedEvent)
      setRunningTournament(null)
    }
  }

  const calculateTotalMinutes = (start, end, breaks = []) => {
    // Sicherstellen, dass start und end Strings sind
    const startStr = String(start || '00:00')
    const endStr = String(end || '00:00')
    
    const [startHour, startMin] = startStr.split(':').map(Number)
    const [endHour, endMin] = endStr.split(':').map(Number)
    
    let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)
    
    // Wenn Endzeit vor Startzeit liegt, nehmen wir an, es geht über Mitternacht
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60
    }
    
    // Ziehe Pausenzeiten ab
    const breakMinutes = Array.isArray(breaks) 
      ? breaks.reduce((sum, breakItem) => sum + (breakItem.duration || 0), 0)
      : 0
    
    return totalMinutes - breakMinutes
  }
    
  const calculateMaxPlayers = ({
    totalMinutes,
    courts,
    averageGameTime,
    teamFormat,
    playMode,
    minGamesPerPlayer,
    isAmericano
  }) => {
    if (!totalMinutes || !courts || !averageGameTime) return 16

    const totalGameSlots = Math.floor(totalMinutes / averageGameTime)
    const gamesPerCourt = Math.floor(totalGameSlots / courts)
    const playersPerGame = teamFormat === 'single' ? 2 : 4

    if (!playMode || playMode === 'simple' || !isAmericano) {
      // Einfache Berechnung
      const totalPlayerSlots = gamesPerCourt * courts * playersPerGame
      const uniquePlayers = Math.floor(totalPlayerSlots / (minGamesPerPlayer || 3))
      return Math.max(4, Math.min(64, uniquePlayers))
    }

    // Komplexere Berechnung für Americano-Turniere
    const simultaneousGames = courts
    const playersNeeded = simultaneousGames * playersPerGame
    const rotationFactor = gamesPerCourt / (minGamesPerPlayer || 3)
    const maxPlayers = Math.floor(playersNeeded * rotationFactor)

    return Math.max(playersNeeded, Math.min(64, maxPlayers))
  }

  return (
    <Router>
      <Routes>
        {/* Öffentliche Anmelde-Route */}
        <Route path="/event/:eventId" element={<EventRegistration />} />
        
        {/* Haupt-App Route */}
        <Route path="/" element={
          <div className="min-h-screen bg-gray-100">
            {/* Running Tournament View */}
            {runningTournament && (
              <AmericanoTournament
                event={runningTournament}
                onComplete={handleTournamentComplete}
                onCancel={() => setRunningTournament(null)}
              />
            )}
            
            {/* Main App View */}
            {!runningTournament && (
              <>
                {/* Header */}
                <header className="bg-white shadow-sm border-b">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">P2</span>
                          </div>
                          <h1 className="text-2xl font-bold text-gray-900">{t('app.title')}</h1>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Sprachauswahl */}
                        <LanguageSelector />
                        
                        <button 
                          onClick={() => {
                            setEditingEvent(null)
                            setShowEventForm(true)
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          + {t('event.new')}
                        </button>
                      </div>
                    </div>
                  </div>
                </header>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">{t('app.loading')}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Event List */}
                      <div className="lg:col-span-1">
                        <EventList 
                          events={events}
                          selectedEvent={selectedEvent}
                          onSelectEvent={setSelectedEvent}
                          onDeleteEvent={handleDeleteEvent}
                        />
                      </div>

                      {/* Event Details / Form */}
                      <div className="lg:col-span-2">
                        {showEventForm ? (
                          <EventForm
                            editingEvent={editingEvent}
                            onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
                            onCancel={() => {
                              setShowEventForm(false)
                              setEditingEvent(null)
                            }}
                            initialData={editingEvent}
                            calculateTotalMinutes={calculateTotalMinutes}
                            calculateMaxPlayers={calculateMaxPlayers}
                          />
                        ) : selectedEvent ? (
                          <>
                            <EventDetail 
                              event={selectedEvent}
                              onEdit={handleEditEvent}
                              onStartTournament={handleStartTournament}
                            />
                            
                            {selectedEvent.status !== 'completed' && (
                              <PlayerManagement 
                                event={selectedEvent}
                                onUpdateEvent={handleUpdateEvent}
                                onOpenPlayerDatabase={() => setShowPlayerDatabase(true)}
                              />
                            )}
                            
                            {selectedEvent.results && Object.keys(selectedEvent.results).length > 0 && (
                              <ResultsDisplay 
                                results={selectedEvent.results} 
                                players={selectedEvent.players || []}
                              />
                            )}
                          </>
                        ) : (
                          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                            <p className="text-lg">{t('app.noEventsSelected')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Player Database Modal */}
                {showPlayerDatabase && (
                  <PlayerDatabase
                    isOpen={showPlayerDatabase}
                    onClose={() => setShowPlayerDatabase(false)}
                    onSelectPlayers={handleSelectPlayersFromDatabase}
                    existingPlayers={selectedEvent ? selectedEvent.players : []}
                    event={selectedEvent}
                  />
                )}
              </>
            )}
          </div>
        } />
      </Routes>
    </Router>
  )
}

// Haupt-App-Komponente mit LanguageProvider
function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

export default App