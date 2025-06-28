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
import Auth from './components/Auth'
import { supabase } from './lib/supabase'
import { LanguageProvider, LanguageSelector, useTranslation } from './components/LanguageSelector'
import { transformToDB, transformFromDB, cleanEventData } from './utils/dbHelpers'
import './App.css'

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
  
  // Auth state
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Check authentication on mount
  useEffect(() => {
    checkUser()
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await loadUserProfile(session.user.id)
      } else {
        setUser(null)
        setUserProfile(null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // Load events when user is authenticated
  useEffect(() => {
    if (user) {
      loadEvents()
    }
  }, [user])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        await loadUserProfile(user.id)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    }
  }

  const loadUserProfile = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      
      setUserProfile(profile)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setUserProfile(null)
      setEvents([])
      setSelectedEvent(null)
      setShowUserMenu(false)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const loadEvents = async () => {
    try {
      setIsLoading(true)
      console.log('Lade Events...')
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })
      
      if (error) {
        console.error('Supabase error:', error)
        // Fallback zu localStorage
        loadFromLocalStorage()
      } else if (data) {
        // Transformiere Events von snake_case zu camelCase
        const transformedEvents = data.map(event => transformFromDB(event))
        console.log('Events aus Supabase geladen:', transformedEvents)
        setEvents(transformedEvents || [])
        
        // Speichere auch in localStorage als Backup (aber ohne saveEvents aufzurufen!)
        localStorage.setItem('events', JSON.stringify(transformedEvents || []))
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
      setEvents(JSON.parse(savedEvents))
    }
  }

  // Save events to both Supabase and localStorage
  const saveEvents = async (updatedEvents, eventToSave = null) => {
    // Speichere sofort in localStorage
    localStorage.setItem('events', JSON.stringify(updatedEvents))
    setEvents(updatedEvents)
    
    // Wenn kein spezifisches Event angegeben, nichts weiter tun
    if (!eventToSave) return
    
    // Versuche nur das spezifische Event in Supabase zu speichern
    try {
      console.log('Speichere Event:', eventToSave)
      
      // Bereinige und transformiere Event für die Datenbank
      const cleanedEvent = cleanEventData(eventToSave)
      const dbEvent = transformToDB(cleanedEvent)
      console.log('Transformiertes Event für DB:', dbEvent)
      
      if (eventToSave.id.startsWith('temp_')) {
        // Neues Event - INSERT
        console.log('Current user:', user) // Debug: User anzeigen
        
        // Neues Event - INSERT
        const insertData = {
          ...dbEvent,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Stelle sicher, dass alle required fields vorhanden sind
          format: dbEvent.format || 'doubles',
          event_type: dbEvent.event_type || 'americano',
          sport: dbEvent.sport || 'padel',
          status: dbEvent.status || 'upcoming'
        }
        
        // Entferne die temporäre ID
        delete insertData.id
        
        // Entferne null/undefined Werte
        Object.keys(insertData).forEach(key => {
          if (insertData[key] === undefined || insertData[key] === null) {
            delete insertData[key]
          }
        })
        
        console.log('Insert data (ohne created_by):', JSON.stringify(insertData, null, 2))
        
        // Erst Event ohne created_by erstellen
        const { data, error } = await supabase
          .from('events')
          .insert([insertData])
          .select()
          .single()
        
        if (error) {
          console.error('Fehler beim Erstellen des Events:', error)
          alert(`Fehler beim Speichern: ${error.message}`)
        } else if (data) {
          console.log('Event erfolgreich erstellt:', data)
          
          // Nach erfolgreichem Insert - NICHT versuchen created_by zu setzen
          console.log('Event erfolgreich erstellt ohne created_by')
          
          // Aktualisiere die temporäre ID mit der echten Supabase ID
          const index = updatedEvents.findIndex(e => e.id === eventToSave.id)
          if (index !== -1) {
            updatedEvents[index] = { ...updatedEvents[index], id: data.id, created_by: data.created_by }
            localStorage.setItem('events', JSON.stringify(updatedEvents))
            setEvents([...updatedEvents])
          }
        }
      } else {
        // Bestehendes Event - UPDATE
        const updateData = {
          ...dbEvent,
          updated_at: new Date().toISOString()
        }
        
        const { error } = await supabase
          .from('events')
          .update(updateData)
          .eq('id', eventToSave.id)
        
        if (error) {
          console.error('Fehler beim Aktualisieren des Events:', error)
          alert(`Fehler beim Aktualisieren: ${error.message}`)
        } else {
          console.log('Event erfolgreich aktualisiert')
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
      updated_at: new Date().toISOString()
    }
    
    const updatedEvents = [...events, newEvent]
    saveEvents(updatedEvents, newEvent) // Übergebe das spezifische Event
    setShowEventForm(false)
    setSelectedEvent(newEvent)
  }

  const handleUpdateEvent = async (updatedEvent) => {
    const updatedEvents = events.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    )
    await saveEvents(updatedEvents, updatedEvent) // Übergebe das spezifische Event
    setSelectedEvent(updatedEvent)
    
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

  const handleSelectEvent = (event) => {
    console.log('App.jsx - handleSelectEvent called with:', event);
    setSelectedEvent(event);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event)
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
    setRunningTournament(event)
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

  // Show auth screen if not logged in
  if (!user) {
    return <Auth />
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
                        
                        {/* User Menu */}
                        <div className="relative">
                          <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-sm font-medium">{userProfile?.name || user.email}</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {/* Dropdown Menu */}
                          {showUserMenu && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setShowUserMenu(false)}
                              />
                              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-20">
                                <div className="p-3 border-b">
                                  <p className="text-sm font-medium">{userProfile?.name || 'Usuario'}</p>
                                  <p className="text-xs text-gray-500">{user.email}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {userProfile?.role === 'tournament_director' ? `🎾 ${t('userMenu.tournamentDirector')}` : `👤 ${t('userMenu.player')}`}
                                  </p>
                                </div>
                                
                                <div className="p-1">
                                  <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2 text-red-600"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    {t('userMenu.logout')}
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        
                        {/* Create Event Button - nur für Turnierdirektoren */}
                        {userProfile?.role === 'tournament_director' && (
                          <button 
                            onClick={() => {
                              setEditingEvent(null)
                              setShowEventForm(true)
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            + {t('event.new')}
                          </button>
                        )}
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
                    <div className="main-content-grid lg:grid lg:grid-cols-3 lg:gap-8">
                      {/* Event List Section */}
                      <div className="event-list-section lg:col-span-1">
                        <EventList 
                          events={events}
                          selectedEvent={selectedEvent}
                          onSelectEvent={handleSelectEvent}
                          onDeleteEvent={handleDeleteEvent}
                          canManageEvents={userProfile?.role === 'tournament_director'}
                        />
                      </div>

                      {/* Event Details Section */}
                      <div className="event-details-section lg:col-span-2">
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
                            <div className="space-y-6">
                              {/* Event Detail Component */}
                              <EventDetail
                                event={selectedEvent}
                                onEdit={handleEditEvent}
                                onUpdateEvent={handleUpdateEvent}
                                onStartTournament={handleStartTournament}
                                canManageEvent={userProfile?.role === 'tournament_director'}
                              />
                              
                              {/* Player Management - only for tournament directors and non-completed events */}
                              {selectedEvent.status !== 'completed' && userProfile?.role === 'tournament_director' && (
                                <PlayerManagement
                                  event={selectedEvent}
                                  onUpdateEvent={handleUpdateEvent}
                                  onOpenPlayerDatabase={() => setShowPlayerDatabase(true)}
                                />
                              )}
                              
                              {/* Results Display - only if results exist */}
                              {selectedEvent.results && Object.keys(selectedEvent.results).length > 0 && (
                                <ResultsDisplay
                                  results={selectedEvent.results}
                                  players={selectedEvent.players || []}
                                />
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3a4 4 0 118 0v4m-4 12a4 4 0 110-8 4 4 0 010 8z" />
                            </svg>
                            <p className="text-lg mb-2">{t('app.noEventsSelected')}</p>
                            <p className="text-sm text-gray-400">
                              {userProfile?.role === 'tournament_director' 
                                ? t('app.selectEventOrCreate')
                                : t('app.selectEventToView')
                              }
                            </p>
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