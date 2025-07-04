﻿import { useState, useEffect, useCallback } from 'react'
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
import { transformToDB, transformFromDB } from './utils/dbHelpers'
import { ToastProvider, useToast, ErrorBoundary } from './components/Toast'
import { withErrorHandling, createNetworkStatusHandler } from './utils/errorHandling'
import { generateTournament } from './utils/tournaments'
import './App.css'

/**
 * ================================================================================
 * ROBUSTE DATUMS-VALIDIERUNG UND EVENT-VERWALTUNG
 * ================================================================================
 * Behandelt fehlerhafte Daten wie "0002-07-06" automatisch
 */

/**
 * Erweiterte Datums-Validierung fÃ¼r Events
 */
const isValidEventDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
    return false
  }
  
  const cleanDate = dateStr.trim()
  
  // Erkenne fehlerhafte Datumsmuster
  const corruptedPatterns = [
    /^000[0-9]/,                 // 0001-XX-XX, 0002-XX-XX, etc.
    /^0{1,3}-/,                  // FÃ¼hrende Nullen: 0-, 00-, 000-
    /^[1-9]\d{0,2}-/,           // Zu kurze Jahre: 1-, 12-, 123-
    /^[0-9]{5,}-/,              // Zu lange Jahre: 12345-
    /undefined|null|NaN|invalid/i, // Textuelle Fehler
    /[^\d\-T:\.Z]/,             // UngÃ¼ltige Zeichen
    /--+/,                      // Mehrfache Bindestriche
    /^-|-$/,                    // Beginnt/endet mit Bindestrich
    /^\d+-\d+-$/,               // UnvollstÃ¤ndiges Datum
    /^\d{4}-\d{1}-\d/,          // Einstelliger Monat
    /^\d{4}-\d{2}-\d{1}$/       // Einstelliger Tag
  ]
  
  if (corruptedPatterns.some(pattern => pattern.test(cleanDate))) {
    // removed console.warn
    return false
  }
  
  if (cleanDate.length < 8 || cleanDate.length > 25) {
    return false
  }
  
  try {
    const parsedDate = new Date(cleanDate)
    
    if (isNaN(parsedDate.getTime())) {
      return false
    }
    
    const year = parsedDate.getFullYear()
    const month = parsedDate.getMonth() + 1
    const day = parsedDate.getDate()
    
    // Realistische Jahresgrenzen fÃ¼r Events
    if (year < 2020 || year > 2035) {
      // removed console.warn
      return false
    }
    
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return false
    }
    
    // Konsistenz-PrÃ¼fung
    const reformatted = parsedDate.toISOString().split('T')[0]
    const inputBase = cleanDate.includes('T') ? cleanDate.split('T')[0] : cleanDate.substring(0, 10)
    
    if (Math.abs(new Date(reformatted).getTime() - new Date(inputBase).getTime()) > 24 * 60 * 60 * 1000) {
      // removed console.warn
      return false
    }
    
    return true
    
  } catch (parseError) {
    // removed console.warn
    return false
  }
}

/**
 * Intelligente Event-Daten-Bereinigung
 */
const cleanEventData = (rawEvent) => {
  if (!rawEvent || typeof rawEvent !== 'object') {
    // removed console.warn
    return rawEvent
  }
  
  const cleaned = { ...rawEvent }
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const currentTimestamp = now.toISOString()
  
  // DATUM-BEREINIGUNG
  if (cleaned.date) {
    if (!isValidEventDate(cleaned.date)) {
      // removed console.warn
      cleaned.date = today
    }
  } else {
    cleaned.date = today
  }
  
  // Bereinige End-Datum
  if (cleaned.endDate && !isValidEventDate(cleaned.endDate)) {
    delete cleaned.endDate
  }
  
  // TIMESTAMP-FELDER
  const timestampFields = ['created_at', 'updated_at', 'completed_at', 'started_at']
  timestampFields.forEach(field => {
    if (cleaned[field]) {
      try {
        const timestamp = new Date(cleaned[field])
        if (isNaN(timestamp.getTime()) || timestamp.getFullYear() < 2020 || timestamp.getFullYear() > 2035) {
          cleaned[field] = currentTimestamp
        }
      } catch (error) {
        cleaned[field] = currentTimestamp
      }
    }
  })
  
  // TEXT-FELDER
  if (!cleaned.name || typeof cleaned.name !== 'string' || cleaned.name.trim() === '') {
    cleaned.name = `Event ${Date.now()}`
  } else {
    cleaned.name = cleaned.name.trim()
  }
  
  // ID-BEREINIGUNG
  if (!cleaned.id || cleaned.id === 'undefined' || cleaned.id === 'null' || typeof cleaned.id !== 'string') {
    cleaned.id = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  // NUMERISCHE FELDER
  if (cleaned.courts) {
    const courts = parseInt(cleaned.courts)
    if (isNaN(courts) || courts < 1 || courts > 20) {
      cleaned.courts = 1
    }
  }
  
  if (cleaned.maxPlayers) {
    const maxPlayers = parseInt(cleaned.maxPlayers)
    if (isNaN(maxPlayers) || maxPlayers < 4 || maxPlayers > 100) {
      cleaned.maxPlayers = 16
    }
  }
  
  // STATUS
  const validStatuses = ['upcoming', 'active', 'completed', 'cancelled']
  if (!cleaned.status || !validStatuses.includes(cleaned.status)) {
    cleaned.status = 'upcoming'
  }
  
  // ZEIT-FELDER
  const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (cleaned.startTime && !timePattern.test(cleaned.startTime)) {
    cleaned.startTime = '09:00'
  }
  
  if (cleaned.endTime && !timePattern.test(cleaned.endTime)) {
    cleaned.endTime = '18:00'
  }
  
  return cleaned
}

/**
 * Event-Deduplizierung mit Konflikt-AuflÃ¶sung
 */
const deduplicateEvents = (eventList) => {
  if (!Array.isArray(eventList)) {
    return []
  }
  
  const uniqueEvents = new Map()
  const processedEvents = []
  
  for (const event of eventList) {
    if (!event || typeof event !== 'object') {
      continue
    }
    
    const cleanedEvent = cleanEventData(event)
    
    const identityKey = [
      (cleanedEvent.name || 'unnamed').toLowerCase().trim(),
      cleanedEvent.date || 'no-date',
      cleanedEvent.startTime || 'no-time',
      (cleanedEvent.location || 'no-location').toLowerCase().trim()
    ].join('::')
    
    if (uniqueEvents.has(identityKey)) {
      const existingEvent = uniqueEvents.get(identityKey)
      
      // Bevorzuge Events mit echten IDs
      const existingHasRealId = existingEvent.id && !existingEvent.id.toString().startsWith('temp_')
      const newHasRealId = cleanedEvent.id && !cleanedEvent.id.toString().startsWith('temp_')
      
      if (newHasRealId && !existingHasRealId) {
        uniqueEvents.set(identityKey, cleanedEvent)
        const existingIndex = processedEvents.findIndex(e => e.id === existingEvent.id)
        if (existingIndex !== -1) {
          processedEvents[existingIndex] = cleanedEvent
        }
      } else if (!newHasRealId && existingHasRealId) {
        // Behalte das bestehende
      } else {
        // Bevorzuge neueres updated_at
        const existingTime = new Date(existingEvent.updated_at || 0).getTime()
        const newTime = new Date(cleanedEvent.updated_at || 0).getTime()
        
        if (newTime > existingTime) {
          uniqueEvents.set(identityKey, cleanedEvent)
          const existingIndex = processedEvents.findIndex(e => e.id === existingEvent.id)
          if (existingIndex !== -1) {
            processedEvents[existingIndex] = cleanedEvent
          }
        }
      }
    } else {
      uniqueEvents.set(identityKey, cleanedEvent)
      processedEvents.push(cleanedEvent)
    }
  }
  
  return processedEvents
}

/**
 * Event-Validierung vor dem Speichern
 */
const validateEventForSave = (event) => {
  const errors = []
  
  if (!event || typeof event !== 'object') {
    return { isValid: false, errors: ['Event-Objekt ist ungÃ¼ltig'] }
  }
  
  if (!event.name || event.name.trim() === '') {
    errors.push('Event-Name ist erforderlich')
  }
  
  if (!event.date || !isValidEventDate(event.date)) {
    errors.push('GÃ¼ltiges Datum ist erforderlich')
  }
  
  if (!event.startTime || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(event.startTime)) {
    errors.push('GÃ¼ltige Startzeit ist erforderlich')
  }
  
  if (!event.endTime || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(event.endTime)) {
    errors.push('GÃ¼ltige Endzeit ist erforderlich')
  }
  
  if (!event.sport || !['padel', 'pickleball', 'spinxball', 'tennis'].includes(event.sport.toLowerCase())) {
    errors.push('GÃ¼ltige Sportart ist erforderlich')
  }
  
  const courts = parseInt(event.courts)
  if (isNaN(courts) || courts < 1 || courts > 20) {
    errors.push('Courts: 1-20 erlaubt')
  }
  
  const maxPlayers = parseInt(event.maxPlayers)
  if (isNaN(maxPlayers) || maxPlayers < 4 || maxPlayers > 100) {
    errors.push('Spieler: 4-100 erlaubt')
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  }
}

// Hauptinhalt der App
function AppContent() {
  const t = useTranslation()?.t || ((key) => key)
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
        showErrorToast: false,
        retries: 2,
        retryDelay: 1000
      }
    )

    if (!result.success) {
      // removed console.warn
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
        successMessage: null,
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

  /**
   * Verbesserte loadEvents Funktion
   */
  const loadEvents = async () => {
    setIsLoading(true)
    // removed console.log
    
    const result = await withErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true })
        
        if (error) throw error
        
        // removed console.log
        
        // Verarbeite Events: Transform â†’ Clean â†’ Filter â†’ Deduplicate â†’ Sort
        let processedEvents = (data || [])
          .map((rawEvent, index) => {
            try {
              const transformed = transformFromDB(rawEvent)
              const cleaned = cleanEventData(transformed)
              // removed console.log
              return cleaned
            } catch (error) {
              // removed console.warn
              return null
            }
          })
          .filter(event => {
            if (!event || !event.id || !event.name) {
              return false
            }
            
            if (!isValidEventDate(event.date)) {
              // removed console.warn
              return false
            }
            
            return true
          })
        
        // Deduplizierung
        processedEvents = deduplicateEvents(processedEvents)
        
        // Sortierung
        processedEvents.sort((a, b) => {
          const statusPriority = { 'active': 0, 'upcoming': 1, 'completed': 2, 'cancelled': 3 }
          const statusDiff = (statusPriority[a.status] || 2) - (statusPriority[b.status] || 2)
          
          if (statusDiff !== 0) return statusDiff
          return new Date(a.date) - new Date(b.date)
        })
        
        // removed console.log
        
        setEvents(processedEvents)
        
        // Sichere in localStorage
        try {
          localStorage.setItem('events', JSON.stringify(processedEvents))
        } catch (storageError) {
          // removed console.warn
        }
        
        return processedEvents
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
      // removed console.warn
      loadFromLocalStorage()
      
      toast.showWarning(
        t('app.offlineMode') || 'Offline-Modus: Events aus lokalem Speicher.',
        6000
      )
    }
    
    setIsLoading(false)
  }

  /**
   * LocalStorage Laden mit gleicher Bereinigungslogik
   */
  const loadFromLocalStorage = () => {
    // removed console.log
    
    try {
      const savedEvents = localStorage.getItem('events')
      if (!savedEvents) {
        // removed console.log
        return false
      }
      
      const parsedEvents = JSON.parse(savedEvents)
      // removed console.log
      
      // Gleiche Bereinigungslogik wie bei Supabase
      let cleanedEvents = parsedEvents
        .map((event, index) => {
          try {
            return cleanEventData(event)
          } catch (error) {
            // removed console.warn
            return null
          }
        })
        .filter(event => {
          if (!event || !event.id || !event.name) {
            return false
          }
          
          if (!isValidEventDate(event.date)) {
            // removed console.warn
            return false
          }
          
          return true
        })
      
      // Deduplizierung
      cleanedEvents = deduplicateEvents(cleanedEvents)
      
      // removed console.log
      
      setEvents(cleanedEvents)
      
      // Sichere bereinigte Daten zurÃ¼ck
      try {
        localStorage.setItem('events', JSON.stringify(cleanedEvents))
      } catch (error) {
        // removed console.warn
      }
      
      return true
      
    } catch (error) {
      // removed console.error
      toast.showError(t('errors.localStorage') || 'Lokale Daten konnten nicht geladen werden.')
      return false
    }
  }

  /**
   * Verbesserte saveEvents Funktion
   */
  const saveEvents = async (updatedEvents, eventToSave = null) => {
    // Sofort lokal speichern
    try {
      localStorage.setItem('events', JSON.stringify(updatedEvents))
      setEvents(updatedEvents)
    } catch (error) {
      // removed console.error
      toast.showError(t('errors.localStorageSave') || 'Lokale Speicherung fehlgeschlagen.')
    }
    
    if (!eventToSave) return { success: true }
    
    // Validierung mit neuer Funktion
    const validation = validateEventForSave(eventToSave)
    if (!validation.isValid) {
      const firstError = validation.errors[0]
      toast.showError(`Validierungsfehler: ${firstError}`)
      return { success: false, error: 'Validation failed' }
    }

    // ZusÃ¤tzliche Datums-Validierung
    if (!isValidEventDate(eventToSave.date)) {
      toast.showError('UngÃ¼ltiges Datum. Bitte wÃ¤hlen Sie ein Datum zwischen 2020 und 2030.')
      return { success: false, error: 'Invalid date' }
    }

    return await withErrorHandling(
      async () => {
        const cleanedEvent = cleanEventData(eventToSave)
        const dbEvent = transformToDB(cleanedEvent)
        
        if (eventToSave.id.startsWith('temp_')) {
          // Neues Event - INSERT
          const insertData = {
            ...dbEvent,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            format: dbEvent.format || 'doubles',
            event_type: dbEvent.event_type || 'americano',
            sport: dbEvent.sport || 'padel',
            status: dbEvent.status || 'upcoming'
          }
          
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
          
          // Update temp ID mit echter Supabase ID
          const index = updatedEvents.findIndex(e => e.id === eventToSave.id)
          if (index !== -1) {
            updatedEvents[index] = { ...updatedEvents[index], id: data.id, created_by: data.created_by }
            localStorage.setItem('events', JSON.stringify(updatedEvents))
            setEvents([...updatedEvents])
          }
          
          return data
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
    if (!window.confirm(t('messages.confirmDelete') || 'Wirklich lÃ¶schen?')) {
      return
    }
    
    const result = await withErrorHandling(
      async () => {
        const updatedEvents = events.filter(event => event.id !== eventId)
        setEvents(updatedEvents)
        localStorage.setItem('events', JSON.stringify(updatedEvents))
        
        if (selectedEvent && selectedEvent.id === eventId) {
          setSelectedEvent(null)
        }
        
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
        loadingMessage: t('event.deleting') || 'Event wird gelÃ¶scht...',
        successMessage: t('event.deleted') || 'Event erfolgreich gelÃ¶scht',
        retries: 1
      }
    )

    return result.success
  }

  const handleSelectEvent = useCallback((event) => {
    if (!event || !event.id) {
      // removed console.warn
      return
    }
    setSelectedEvent(event)
  }, [])

  const handleEditEvent = useCallback((event) => {
    setEditingEvent(event)
    setShowEventForm(true)
  }, [])

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
          throw new Error('Keine neuen Spieler hinzugefÃ¼gt. Alle ausgewÃ¤hlten Spieler sind bereits angemeldet.')
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
        loadingMessage: t('player.adding') || 'Spieler werden hinzugefÃ¼gt...',
        successMessage: null
      }
    )

    if (result.success && result.data > 0) {
      toast.showSuccess(`${result.data} Spieler erfolgreich hinzugefÃ¼gt`)
    }
  }, [selectedEvent, handleUpdateEvent, toast, t])

  const handleStartTournament = useCallback((event) => {
    if (!event.players || event.players.length < 4) {
      toast.showError(t('tournament.needMorePlayers') || 'Mindestens 4 Spieler benÃ¶tigt')
      return
    }
    
    try {
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
      
      const enhancedEvent = {
        ...event,
        tournament,
        schedule: tournament.schedule,
        tournamentStats: tournament.statistics
      }
      
      setRunningTournament(enhancedEvent)
      toast.showSuccess(t('tournament.started') || 'Turnier gestartet!')
      
    } catch (error) {
      // removed console.error
      toast.showError(`Turnier-Generierung fehlgeschlagen: ${error.message}`)
    }
  }, [toast, t])

 const handleTournamentComplete = useCallback(async (completionData) => {
  console.log('🔧 handleTournamentComplete called with:', completionData)
  
  if (!runningTournament) {
    console.warn('⚠️ No running tournament found')
    return
  }

  // Prüfe ob es eine echte Tournament Completion ist
  if (completionData && completionData.action === 'TOURNAMENT_COMPLETED' && completionData.completed) {
    console.log('✅ Valid tournament completion detected')
    
    // Tournament erfolgreich abgeschlossen
    const updatedEvent = {
      ...runningTournament,
      results: completionData.results || {},
      summary: completionData.summary || {},
      status: 'completed',
      completed_at: new Date().toISOString(),
      winner: completionData.summary?.winner || null,
      finalStandings: completionData.summary?.finalStandings || []
    }
    
    console.log('💾 Saving completed tournament:', updatedEvent)
    
    // Speichere das abgeschlossene Tournament
    await handleUpdateEvent(updatedEvent)
    
    // Beende das laufende Tournament (wichtig!)
    setRunningTournament(null)
    
    // Zeige Success Message mit Details
    const winner = completionData.summary?.winner
    const successMessage = winner 
      ? `🏆 Turnier abgeschlossen! Gewinner: ${winner.name}`
      : t('tournament.completed') || 'Turnier erfolgreich abgeschlossen!'
    
    toast.showSuccess(successMessage)
    
    console.log('🎉 Tournament completion process finished successfully')
    
  } else {
    // Fallback für unerwartete Calls (z.B. Cancel)
    console.log('⚠️ Tournament completion cancelled or invalid data')
    setRunningTournament(null)
  }
}, [runningTournament, handleUpdateEvent, toast, t])

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
                                    {userProfile?.role === 'tournament_director' ? `ðŸŽ¾ ${t('userMenu.tournamentDirector')}` : `ðŸ‘¤ ${t('userMenu.player')}`}
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
                      <div className="event-list-section lg:col-span-1">
                        <EventList 
                          events={events}
                          selectedEvent={selectedEvent}
                          onSelectEvent={handleSelectEvent}
                          onDeleteEvent={handleDeleteEvent}
                          canManageEvents={userProfile?.role === 'tournament_director'}
                        />
                      </div>

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

// Haupt-App-Komponente
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


