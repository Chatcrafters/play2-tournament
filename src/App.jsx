import { useState, useEffect, useCallback } from 'react'
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
import { ToastProvider, useToast, ErrorBoundary } from './components/Toast'
import { withErrorHandling, createNetworkStatusHandler, handleSupabaseError, validateForm } from './utils/errorHandling'
// GEÄNDERT: Neuer einheitlicher Import für Turnier-Algorithmen
import { generateTournament, generateAmericanoSchedule } from './utils/tournaments'
import './App.css'

// FIXED: Deduplizierungs-Hilfsfunktion
const deduplicateEvents = (events) => {
  const seen = new Map()
  
  return events.filter(event => {
    // Erstelle eindeutigen Schlüssel basierend auf Name, Datum und wichtigen Eigenschaften
    const key = `${event.name}-${event.date}-${event.startTime}-${event.location || ''}`
    
    if (seen.has(key)) {
      // Behalte das mit neuerer updated_at oder das mit einer echten ID
      const existing = seen.get(key)
      const current = event
      
      // Bevorzuge Events mit echten IDs über temp IDs
      if (existing.id.startsWith('temp_') && !current.id.startsWith('temp_')) {
        seen.set(key, current)
        return true
      }
      
      // Bevorzuge zuletzt aktualisierte Events
      const existingTime = new Date(existing.updated_at || 0).getTime()
      const currentTime = new Date(current.updated_at || 0).getTime()
      
      if (currentTime > existingTime) {
        seen.set(key, current)
        return true
      }
      
      return false // Überspringe Duplikat
    }
    
    seen.set(key, event)
    return true
  })
}

// FIXED: Erweiterte Datumsvalidierung
const isValidEventDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false
  
  // Prüfe auf fehlerhafte Daten wie "0002-07-06"
  if (dateStr.startsWith('000') || dateStr.length < 8) {
    console.warn('Ungültiges Datumsformat erkannt:', dateStr)
    return false
  }
  
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return false
    
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()
    
    // Strengere Validierung
    if (year < 2020 || year > 2035) return false
    if (month < 0 || month > 11) return false
    if (day < 1 || day > 31) return false
    
    return true
  } catch (error) {
    console.warn('Datums-Parsing-Fehler:', error, dateStr)
    return false
  }
}

// Hauptinhalt der App als separate Komponente für useTranslation Hook
function AppContent() {
  const { t } = useTranslation()
  const toast = useToast()
  
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

  // Network status monitoring
  useEffect(() => {
    const cleanup = createNetworkStatusHandler(toast, t)
    return cleanup
  }, [toast, t])

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
    const result = await withErrorHandling(
      async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser(user)
          await loadUserProfile(user.id)
        }
        return user
      },
      toast,
      t,
      {
        showErrorToast: false, // Don't show error for initial auth check
        retries: 2,
        retryDelay: 1000
      }
    )

    if (!result.success) {
      console.warn('Initial auth check failed:', result.error)
    }
  }

  const loadUserProfile = async (userId) => {
    return await withErrorHandling(
      async () => {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (error) throw error
        
        setUserProfile(profile)
        return profile
      },
      toast,
      t,
      {
        loadingMessage: t('app.loadingProfile') || 'Profil wird geladen...',
        successMessage: null, // Don't show success for profile loading
        retries: 2
      }
    )
  }

  const handleLogout = async () => {
    const result = await withErrorHandling(
      async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        
        setUser(null)
        setUserProfile(null)
        setEvents([])
        setSelectedEvent(null)
        setShowUserMenu(false)
        
        return true
      },
      toast,
      t,
      {
        loadingMessage: t('auth.loggingOut') || 'Abmeldung...',
        successMessage: t('auth.loggedOut') || 'Erfolgreich abgemeldet'
      }
    )

    return result.success
  }

  // FIXED: Enhanced loadEvents with deduplication and better validation
  const loadEvents = async () => {
    setIsLoading(true)
    
    const result = await withErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true })
        
        if (error) throw error
        
        // Transform and validate events
        let transformedEvents = (data || [])
          .map(event => transformFromDB(event))
          .filter(event => {
            // Filter out events with invalid dates
            if (!isValidEventDate(event.date)) {
              console.warn('Filtering out event with invalid date:', event.name, event.date)
              return false
            }
            // Filter out events without required fields
            if (!event.id || !event.name) {
              console.warn('Filtering out incomplete event:', event)
              return false
            }
            return true
          })
        
        // FIXED: Deduplicate events
        transformedEvents = deduplicateEvents(transformedEvents)
        
        // FIXED: Sort by status and date to show active events first
        transformedEvents.sort((a, b) => {
          // First by status priority
          const statusPriority = { 'active': 0, 'upcoming': 1, 'completed': 2 }
          const statusDiff = (statusPriority[a.status] || 1) - (statusPriority[b.status] || 1)
          if (statusDiff !== 0) return statusDiff
          
          // Then by date
          return new Date(a.date) - new Date(b.date)
        })
        
        setEvents(transformedEvents)
        
        // Save to localStorage as backup
        try {
          localStorage.setItem('events', JSON.stringify(transformedEvents))
        } catch (storageError) {
          console.warn('Failed to save to localStorage:', storageError)
        }
        
        return transformedEvents
      },
      toast,
      t,
      {
        loadingMessage: t('app.loadingEvents') || 'Events werden geladen...',
        successMessage: null,
        showErrorToast: false
      }
    )

    if (!result.success) {
      // Fallback to localStorage with deduplication
      loadFromLocalStorage()
      
      toast.showWarning(
        t('app.offlineMode') || 'Offline-Modus: Events werden aus dem lokalen Speicher geladen.',
        6000
      )
    }
    
    setIsLoading(false)
  }

  // FIXED: Enhanced localStorage loading with deduplication
  const loadFromLocalStorage = () => {
    try {
      const savedEvents = localStorage.getItem('events')
      if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents)
        
        // Filter out invalid events and deduplicate
        let validEvents = parsedEvents.filter(event => {
          if (!event || !event.id) return false
          if (!isValidEventDate(event.date)) {
            console.warn('Filtering out localStorage event with invalid date:', event.name, event.date)
            return false
          }
          return true
        })
        
        // FIXED: Apply deduplication to localStorage events too
        validEvents = deduplicateEvents(validEvents)
        
        setEvents(validEvents)
        return true
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      toast.showError(t('errors.localStorage') || 'Lokale Daten konnten nicht geladen werden.')
    }
    return false
  }

  // Save events to both Supabase and localStorage
  const saveEvents = async (updatedEvents, eventToSave = null) => {
    // Immediately save locally for better UX
    try {
      localStorage.setItem('events', JSON.stringify(updatedEvents))
      setEvents(updatedEvents)
    } catch (error) {
      console.error('localStorage save failed:', error)
      toast.showError(t('errors.localStorageSave') || 'Lokale Speicherung fehlgeschlagen.')
    }
    
    // If no specific event given, don't save to Supabase
    if (!eventToSave) return { success: true }
    
    // Validation before saving
    const validationRules = {
      name: { required: true, minLength: 3, maxLength: 100 },
      date: { required: true },
      startTime: { required: true },
      endTime: { required: true },
      sport: { required: true },
      courts: { required: true, number: true, min: 1, max: 10 }
    }
    
    const validation = validateForm(eventToSave, validationRules)
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0][0]
      toast.showError(`Validierungsfehler: ${firstError}`)
      return { success: false, error: 'Validation failed' }
    }

    // Additional date validation
    if (!isValidEventDate(eventToSave.date)) {
      toast.showError('Ungültiges Datum. Bitte wählen Sie ein Datum zwischen 2020 und 2030.')
      return { success: false, error: 'Invalid date' }
    }

    return await withErrorHandling(
      async () => {
        // Clean and transform event for database
        const cleanedEvent = cleanEventData(eventToSave)
        const dbEvent = transformToDB(cleanedEvent)
        
        if (eventToSave.id.startsWith('temp_')) {
          // New event - INSERT
          const insertData = {
            ...dbEvent,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            format: dbEvent.format || 'doubles',
            event_type: dbEvent.event_type || 'americano',
            sport: dbEvent.sport || 'padel',
            status: dbEvent.status || 'upcoming'
          }
          
          // Remove temp ID and null/undefined values
          delete insertData.id
          Object.keys(insertData).forEach(key => {
            if (insertData[key] === undefined || insertData[key] === null) {
              delete insertData[key]
            }
          })
          
          const { data, error } = await supabase
            .from('events')
            .insert([insertData])
            .select()
            .single()
          
          if (error) throw error
          
          // Update temp ID with real Supabase ID
          const index = updatedEvents.findIndex(e => e.id === eventToSave.id)
          if (index !== -1) {
            updatedEvents[index] = { ...updatedEvents[index], id: data.id, created_by: data.created_by }
            localStorage.setItem('events', JSON.stringify(updatedEvents))
            setEvents([...updatedEvents])
          }
          
          return data
        } else {
          // Existing event - UPDATE
          const updateData = {
            ...dbEvent,
            updated_at: new Date().toISOString()
          }
          
          const { error } = await supabase
            .from('events')
            .update(updateData)
            .eq('id', eventToSave.id)
          
          if (error) throw error
          
          return true
        }
      },
      toast,
      t,
      {
        loadingMessage: eventToSave.id.startsWith('temp_') 
          ? (t('event.creating') || 'Event wird erstellt...') 
          : (t('event.updating') || 'Event wird aktualisiert...'),
        successMessage: eventToSave.id.startsWith('temp_') 
          ? (t('event.created') || 'Event erfolgreich erstellt') 
          : (t('event.updated') || 'Event erfolgreich aktualisiert'),
        retries: 2
      }
    )
  }

  const handleCreateEvent = async (eventData) => {
    const newEvent = {
      ...eventData,
      id: `temp_${Date.now()}`,
      players: [],
      results: {},
      status: 'upcoming',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const updatedEvents = [...events, newEvent]
    const result = await saveEvents(updatedEvents, newEvent)
    
    if (result.success) {
      setShowEventForm(false)
      setSelectedEvent(newEvent)
    }
  }

  const handleUpdateEvent = async (updatedEvent) => {
    const updatedEvents = events.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    )
    
    const result = await saveEvents(updatedEvents, updatedEvent)
    
    if (result.success) {
      setSelectedEvent(updatedEvent)
      
      if (editingEvent) {
        setEditingEvent(null)
        setShowEventForm(false)
      }
    }
  }

  const handleDeleteEvent = async (eventId) => {
    // Show confirmation dialog
    if (!window.confirm(t('messages.confirmDelete') || 'Wirklich löschen?')) {
      return
    }
    
    const result = await withErrorHandling(
      async () => {
        // Delete from local state
        const updatedEvents = events.filter(event => event.id !== eventId)
        setEvents(updatedEvents)
        localStorage.setItem('events', JSON.stringify(updatedEvents))
        
        if (selectedEvent && selectedEvent.id === eventId) {
          setSelectedEvent(null)
        }
        
        // Try to delete from Supabase (only if not temp)
        if (!eventId.startsWith('temp_')) {
          const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', eventId)
          
          if (error) throw error
        }
        
        return true
      },
      toast,
      t,
      {
        loadingMessage: t('event.deleting') || 'Event wird gelöscht...',
        successMessage: t('event.deleted') || 'Event erfolgreich gelöscht',
        retries: 1
      }
    )

    return result.success
  }

  // OPTIMIZED: Memoized and robust event selection
  const handleSelectEvent = useCallback((event) => {
    if (!event || !event.id) {
      console.warn('Invalid event selected:', event)
      return
    }
    setSelectedEvent(event)
  }, [])

  const handleEditEvent = useCallback((event) => {
    setEditingEvent(event)
    setShowEventForm(true)
  }, [])

  // OPTIMIZED: Enhanced player selection with better validation
  const handleSelectPlayersFromDatabase = useCallback(async (selectedPlayers) => {
    if (!selectedEvent || !Array.isArray(selectedPlayers)) return

    const result = await withErrorHandling(
      async () => {
        const currentPlayers = selectedEvent.players || []
        const maxPlayers = selectedEvent.maxPlayers || 16
        const remainingSlots = Math.max(0, maxPlayers - currentPlayers.length)
          
        if (remainingSlots === 0) {
          throw new Error(`Event ist bereits voll (${maxPlayers}/${maxPlayers} Spieler)`)
        }
        
        const newPlayers = []
        
        for (const dbPlayer of selectedPlayers.slice(0, remainingSlots)) {
          if (!dbPlayer || !dbPlayer.name) continue
          
          const alreadyExists = currentPlayers.some(p => 
            p.name === dbPlayer.name || 
            (p.email && dbPlayer.email && p.email === dbPlayer.email) ||
            (p.phone && dbPlayer.phone && p.phone === dbPlayer.phone)
          )
          
          if (!alreadyExists) {
            const newPlayer = {
              id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: dbPlayer.name,
              gender: dbPlayer.gender || 'male',
              skillLevel: dbPlayer.skillLevel || (selectedEvent.sport === 'padel' ? 'B' : 3),
              skillLevels: dbPlayer.skillLevels || {
                padel: dbPlayer.padelSkill || 'B',
                pickleball: dbPlayer.pickleballSkill || 3,
                spinxball: dbPlayer.spinxballSkill || 3
              },
              // Add contact data safely
              ...(dbPlayer.email && { email: dbPlayer.email }),
              ...(dbPlayer.phone && { phone: dbPlayer.phone }),
              ...(dbPlayer.birthday && { birthday: dbPlayer.birthday }),
              ...(dbPlayer.city && { city: dbPlayer.city }),
              ...(dbPlayer.club && { club: dbPlayer.club }),
              ...(dbPlayer.nationality && { nationality: dbPlayer.nationality })
            }
            
            newPlayers.push(newPlayer)
          }
        }
        
        if (newPlayers.length === 0) {
          throw new Error('Keine neuen Spieler hinzugefügt. Alle ausgewählten Spieler sind bereits angemeldet.')
        }
        
        const updatedEvent = {
          ...selectedEvent,
          players: [...currentPlayers, ...newPlayers]
        }
        
        await handleUpdateEvent(updatedEvent)
        
        return newPlayers.length
      },
      toast,
      t,
      {
        loadingMessage: t('player.adding') || 'Spieler werden hinzugefügt...',
        successMessage: null
      }
    )

    if (result.success && result.data > 0) {
      toast.showSuccess(`${result.data} Spieler erfolgreich hinzugefügt`)
    }
  }, [selectedEvent, handleUpdateEvent, toast, t])

  // GEÄNDERT: Verwende den neuen einheitlichen Turnier-Generator
  const handleStartTournament = useCallback((event) => {
    // Validation before start
    if (!event.players || event.players.length < 4) {
      toast.showError(t('tournament.needMorePlayers') || 'Mindestens 4 Spieler benötigt')
      return
    }
    
    try {
      // Generiere Turnier mit dem neuen System
      const tournamentConfig = {
        format: event.eventType || 'americano',
        players: event.players,
        courts: event.courts || 1,
        roundDuration: event.averageGameTime || 15,
        startTime: event.startTime || '09:00',
        endTime: event.endTime || '18:00',
        breaks: event.breaks || [],
        options: {
          regenerateCount: 0
        }
      }
      
      const tournament = generateTournament(tournamentConfig)
      
      // Erweitere Event mit Turnier-Daten
      const enhancedEvent = {
        ...event,
        tournament,
        schedule: tournament.schedule,
        tournamentStats: tournament.statistics
      }
      
      setRunningTournament(enhancedEvent)
      toast.showSuccess(t('tournament.started') || 'Turnier gestartet!')
      
    } catch (error) {
      console.error('Tournament generation failed:', error)
      toast.showError(`Turnier-Generierung fehlgeschlagen: ${error.message}`)
    }
  }, [toast, t])

  const handleTournamentComplete = useCallback(async (results) => {
    if (runningTournament) {
      const updatedEvent = {
        ...runningTournament,
        results: results || {},
        status: 'completed',
        completed_at: new Date().toISOString()
      }
      
      await handleUpdateEvent(updatedEvent)
      setRunningTournament(null)
      toast.showSuccess(t('tournament.completed') || 'Turnier erfolgreich abgeschlossen!')
    }
  }, [runningTournament, handleUpdateEvent, toast, t])

  // Utility functions (memoized where beneficial)
  const calculateTotalMinutes = useCallback((start, end, breaks = []) => {
    const startStr = String(start || '00:00')
    const endStr = String(end || '00:00')
    
    const [startHour, startMin] = startStr.split(':').map(Number)
    const [endHour, endMin] = endStr.split(':').map(Number)
    
    let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)
    
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60
    }
    
    const breakMinutes = Array.isArray(breaks) 
      ? breaks.reduce((sum, breakItem) => sum + (breakItem.duration || 0), 0)
      : 0
    
    return totalMinutes - breakMinutes
  }, [])
    
  const calculateMaxPlayers = useCallback(({
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
      const totalPlayerSlots = gamesPerCourt * courts * playersPerGame
      const uniquePlayers = Math.floor(totalPlayerSlots / (minGamesPerPlayer || 3))
      return Math.max(4, Math.min(64, uniquePlayers))
    }

    const simultaneousGames = courts
    const playersNeeded = simultaneousGames * playersPerGame
    const rotationFactor = gamesPerCourt / (minGamesPerPlayer || 3)
    const maxPlayers = Math.floor(playersNeeded * rotationFactor)

    return Math.max(playersNeeded, Math.min(64, maxPlayers))
  }, [])

  // FIXED: Hilfsfunktion für Event-Status
  const getEventStatus = (event) => {
    if (!event) return 'upcoming'
    
    if (event.status === 'completed' || event.results) return 'completed'
    if (event.tournament || event.schedule) return 'active'
    
    const now = new Date()
    const eventDate = new Date(event.date)
    const eventStart = new Date(`${event.date} ${event.startTime}`)
    
    if (eventStart <= now) return 'active'
    return 'upcoming'
  }

  // Show auth screen if not logged in
  if (!user) {
    return <Auth />
  }

  return (
    <Router>
      <Routes>
        <Route path="/event/:eventId" element={<EventRegistration />} />
        
        <Route path="/" element={
          <div className="min-h-screen bg-gray-100">
            {runningTournament && (
              <AmericanoTournament
                event={runningTournament}
                onComplete={handleTournamentComplete}
                onCancel={() => setRunningTournament(null)}
              />
            )}
            
            {!runningTournament && (
              <>
                {/* Header */}
                <header className="bg-white shadow-sm border-b">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">P2</span>
                          </div>
                          <h1 className="text-2xl font-bold text-gray-900">{t('app.title')}</h1>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
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
                              <EventDetail
                                event={selectedEvent}
                                onEdit={handleEditEvent}
                                onUpdateEvent={handleUpdateEvent}
                                onStartTournament={handleStartTournament}
                                canManageEvent={userProfile?.role === 'tournament_director'}
                              />
                              
                              {selectedEvent.status !== 'completed' && userProfile?.role === 'tournament_director' && (
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

// Haupt-App-Komponente mit Error Boundary und Toast Provider
function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </LanguageProvider>
    </ErrorBoundary>
  )
}

export default App