import { transformFromDB, transformToDB } from './utils/dbHelpers'
import { formatTimeRange } from './utils/timeFormat'
import { useState, useEffect } from 'react'
import { EventDetailView } from './components/EventDetailView'
import { EventForm } from './components/EventForm'
import PlayerDatabase from './components/PlayerDatabase.jsx'
import { LoginScreen } from './components/LoginScreen'
import { PublicHomePage } from './components/PublicHomePage'
import { calculateTotalMinutes, calculateMaxPlayers } from './utils/utils'
import { supabase, dbOperations } from './lib/supabase'

// Einfache cn Funktion
const cn = (...classes) => classes.filter(Boolean).join(' ')

// Einfache Style-Objekte
const STYLES = {
  button: {
    base: 'px-4 py-2 rounded transition-all',
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-purple-600 text-white hover:bg-purple-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
  },
  card: {
    base: 'bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow'
  },
  badge: {
    base: 'inline-block px-2 py-1 text-xs font-semibold rounded-full',
    sport: {
      padel: 'bg-emerald-100 text-emerald-800',
      pickleball: 'bg-amber-100 text-amber-800',
      spinxball: 'bg-purple-100 text-purple-800'
    }
  }
}

const getSportTheme = (sport) => ({
  color: sport === 'padel' ? '#10b981' : sport === 'pickleball' ? '#f59e0b' : '#8b5cf6',
  badge: STYLES.badge.sport[sport] || STYLES.badge.sport.padel
})

function App() {
  // State Management
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [savedPlayers, setSavedPlayers] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [showPlayerDatabase, setShowPlayerDatabase] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  
  // Initial form data
  const getInitialFormData = () => ({
    name: '',
    sport: 'padel',
    eventType: 'americano',
    format: 'doubles',
    genderMode: 'open',
    teamFormat: 'double',
    date: '',
    startTime: '09:00',
    endTime: '18:00',
    location: '',
    phone: '',
    courts: 1,
    roundDuration: 15,
    players: [],
    maxPlayers: 16,
    breaks: [],
    playMode: 'continuous',
    minGamesPerPlayer: 3,
    minPlayTimeMinutes: 45,
    waitingTime: 5,
    spielmodus: 'durchgehend',
    garantieSpiele: false,
    mindestSpiele: 3,
    garantieMinuten: false,
    mindestMinuten: 45,
    endDate: '',
    spielPause: 30,
    flexibleTimes: false,
    dailySchedule: [],
    showAdvancedOptions: false,
    eventInfo: '',
    results: {},
    isPublic: false,
    registrationOpen: false,
    registrationDeadline: '',
    entryFee: 0
  })

  const [formData, setFormData] = useState(getInitialFormData())

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load data when user logs in
  useEffect(() => {
    if (user) {
      loadEvents()
      loadPlayers()
    }
  }, [user])

  // Load events from Supabase
  const loadEvents = async () => {
    try {
      const data = await dbOperations.getEvents()
      setEvents(data || [])
    } catch (error) {
      console.error('Error loading events:', error)
    }
  }

  // Load players from Supabase
  const loadPlayers = async () => {
    try {
      const data = await dbOperations.getPlayers()
      setSavedPlayers(data || [])
    } catch (error) {
      console.error('Error loading players:', error)
    }
  }

  // Event handlers
  const handleCreateEvent = async (eventData) => {
    try {
      // Sicherstellen dass Zeitfelder nicht leer sind
      const eventToCreate = {
        ...eventData,
        startTime: eventData.startTime || '09:00',
        endTime: eventData.endTime || '18:00',
        results: {},
        schedule: null
      }
      
      console.log('Creating event with data:', eventToCreate)
      
      const newEvent = await dbOperations.createEvent(eventToCreate)
      
      setEvents([...events, newEvent])
      setShowCreateForm(false)
      setFormData(getInitialFormData())
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Fehler beim Erstellen des Events')
    }
  }

  const handleUpdateEvent = async (updatedEvent) => {
  try {
    // Sicherstellen dass Zeitfelder nicht leer sind
    const eventToUpdate = {
      ...updatedEvent,
      startTime: updatedEvent.startTime || '09:00',
      endTime: updatedEvent.endTime || '18:00'
    }
    
    console.log('Updating event with results:', eventToUpdate.results)
    
    const updated = await dbOperations.updateEvent(eventToUpdate.id, eventToUpdate)
    
    setEvents(events.map(event => 
      event.id === updated.id ? updated : event
    ))
    
    if (selectedEvent?.id === updated.id) {
      setSelectedEvent(updated)
    }
    
    if (editingEvent?.id === updated.id) {
      setEditingEvent(null)
      setShowCreateForm(false)
      setFormData(getInitialFormData())
    }
  } catch (error) {
    console.error('Error updating event:', error)
    alert('Fehler beim Aktualisieren des Events')
  }
}

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Möchten Sie dieses Event wirklich löschen?')) {
      try {
        await dbOperations.deleteEvent(eventId)
        setEvents(events.filter(event => event.id !== eventId))
        if (selectedEvent?.id === eventId) {
          setSelectedEvent(null)
        }
      } catch (error) {
        console.error('Error deleting event:', error)
        alert('Fehler beim Löschen des Events')
      }
    }
  }

  const handleEditEvent = (event) => {
    console.log('Editing event:', event)
    console.log('Event endDate:', event.endDate)
    setEditingEvent(event)
    setFormData({
      ...event,
      showAdvancedOptions: false
    })
    setShowCreateForm(true)
  }

  const handleOpenEvent = (event) => {
    setSelectedEvent(event)
  }

  // Form helpers
  const addBreak = () => {
    setFormData({
      ...formData,
      breaks: [...formData.breaks, { startTime: '', duration: 15 }]
    })
  }

  const updateBreak = (index, field, value) => {
    const newBreaks = [...formData.breaks]
    newBreaks[index][field] = value
    setFormData({ ...formData, breaks: newBreaks })
  }

  const removeBreak = (index) => {
    setFormData({
      ...formData,
      breaks: formData.breaks.filter((_, i) => i !== index)
    })
  }

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="play2-skeleton w-32 h-32 rounded-full"></div>
      </div>
    )
  }

  // Show public homepage if not authenticated
  if (!user && !showLogin) {
    return <PublicHomePage 
      onLogin={() => setShowLogin(true)}
    />
  }

  // Show login screen when requested
  if (!user && showLogin) {
    return <LoginScreen 
      signIn={async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }}
      signUp={async (email, password) => {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      }}
    />
  }

  // Render Event Detail View
  if (selectedEvent) {
    return (
      <>
        <EventDetailView
          selectedEvent={selectedEvent}
          onUpdateEvent={handleUpdateEvent}
          onBack={() => setSelectedEvent(null)}
          savedPlayers={savedPlayers}
          onOpenPlayerDatabase={() => setShowPlayerDatabase(true)}
        />
        
        {/* Player Database Modal */}
        {showPlayerDatabase && (
          <PlayerDatabase 
            isOpen={showPlayerDatabase}
            onClose={() => setShowPlayerDatabase(false)}
            event={selectedEvent}
            existingPlayers={selectedEvent.players || []}
            onSelectPlayers={(players) => {
              const updatedEvent = {
                ...selectedEvent,
                players: [...selectedEvent.players, ...players]
              }
              handleUpdateEvent(updatedEvent)
              setShowPlayerDatabase(false)
            }}
          />
        )}
      </>
    )
  }

  // Main App View
  return (
    <div className="min-h-screen play2-bg-aurora">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl play2-hover-glow">
                P2
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Play2</h1>
                <p className="text-xs text-gray-500">app2.club</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowPlayerDatabase(true)}
                className={cn(STYLES.button.base, STYLES.button.secondary, 'play2-no-print')}
              >
                <span className="mr-2">👥</span>
                Spieler-Datenbank
              </button>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                }}
                className={cn(STYLES.button.base, STYLES.button.outline, 'play2-no-print')}
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 play2-animate-in relative z-10">
        {/* Player Database Modal */}
        {showPlayerDatabase && (
          <PlayerDatabase 
            isOpen={showPlayerDatabase}
            onClose={() => setShowPlayerDatabase(false)}
            onImportPlayers={(players) => {
              console.log('Importing players:', players)
            }}
          />
        )}

        {/* Event Form Modal */}
        {showCreateForm && (
          <EventForm
            editingEvent={editingEvent}
            onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
            onCancel={() => {
              setShowCreateForm(false)
              setEditingEvent(null)
              setFormData(getInitialFormData())
            }}
            initialData={formData}
            calculateTotalMinutes={calculateTotalMinutes}
            calculateMaxPlayers={calculateMaxPlayers}
            addBreak={addBreak}
            updateBreak={updateBreak}
            removeBreak={removeBreak}
          />
        )}

        {/* Action Bar */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Ihre Events</h2>
            <p className="text-gray-600">Verwalten Sie Ihre Padel, Pickleball und SpinXball Turniere</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className={cn(STYLES.button.base, STYLES.button.primary, 'play2-hover-lift')}
          >
            <span className="text-xl mr-2">+</span>
            Neues Event erstellen
          </button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const theme = getSportTheme(event.sport)
            
            // Funktion zur Formatierung der Datums- und Zeitanzeige
            const getEventDateDisplay = () => {
              const startDate = event.date ? new Date(event.date) : null
              const endDate = event.endDate ? new Date(event.endDate) : null
              
              if (!startDate) return { dateText: 'Kein Datum', timeText: '' }
              
              // Ein-Tages-Event
              if (!endDate || startDate.toDateString() === endDate.toDateString()) {
                return {
                  dateText: startDate.toLocaleDateString('de-DE'),
                  timeText: formatTimeRange(event.startTime, event.endTime),
                  isMultiDay: false
                }
              }
              
              // Mehrtägiges Event
              const startDateNormalized = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
              const endDateNormalized = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
              const daysDiff = Math.floor((endDateNormalized - startDateNormalized) / (1000 * 60 * 60 * 24)) + 1
              
              const useFlexibleTimes = event.flexibleTimes && event.dailySchedule && event.dailySchedule.length > 0
              
              const days = []
              for (let i = 0; i < Math.min(daysDiff, 2); i++) {
                const currentDate = new Date(startDate)
                currentDate.setDate(startDate.getDate() + i)
                
                let timeRange = formatTimeRange(event.startTime, event.endTime)
                
                if (useFlexibleTimes && event.dailySchedule[i]) {
                  const daySchedule = event.dailySchedule[i]
                  if (daySchedule.start && daySchedule.end) {
                    timeRange = formatTimeRange(daySchedule.start, daySchedule.end)
                  }
                }
                
                days.push({
                  date: currentDate.toLocaleDateString('de-DE', { 
                    day: '2-digit', 
                    month: '2-digit' 
                  }),
                  time: timeRange
                })
              }
              
              return {
                dateText: `${startDate.toLocaleDateString('de-DE', { 
                  day: '2-digit', 
                  month: '2-digit' 
                })} - ${endDate.toLocaleDateString('de-DE', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric' 
                })}`,
                days: days,
                totalDays: daysDiff,
                isMultiDay: true
              }
            }

            const dateDisplay = getEventDateDisplay()
            
            return (
              <div 
                key={event.id} 
                className={cn(STYLES.card.base, 'play2-hover-lift play2-animate-slide')}
                style={{
                  borderTop: `4px solid ${theme.color}`
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-900">{event.name}</h3>
                  <span className={cn(STYLES.badge.base, theme.badge)}>
                    {event.sport}
                  </span>
                </div>
                
                {/* Datums- und Zeitanzeige */}
                <div className="text-gray-600 mb-4">
                  {dateDisplay.isMultiDay ? (
                    <>
                      <p className="mb-2">
                        📅 {dateDisplay.dateText} 
                        <span className="text-sm text-gray-500 ml-2">
                          ({dateDisplay.totalDays} {dateDisplay.totalDays === 1 ? 'Tag' : 'Tage'})
                        </span>
                      </p>
                      <div className="space-y-1 text-sm">
                        {dateDisplay.days.map((day, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">{day.date}:</span>
                            <span className="text-gray-600">{day.time}</span>
                          </div>
                        ))}
                        {dateDisplay.totalDays > 2 && (
                          <div className="text-gray-500 italic">
                            ... und {dateDisplay.totalDays - 2} weitere {dateDisplay.totalDays - 2 === 1 ? 'Tag' : 'Tage'}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p>📅 {dateDisplay.dateText}</p>
                      <p>🕐 {dateDisplay.timeText}</p>
                    </>
                  )}
                  {event.location && <p className="mt-1">📍 {event.location}</p>}
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-gray-900">
                    {event.players?.length || 0} Spieler
                  </span>
                  <span className={cn(
                    STYLES.badge.base,
                    event.players?.length >= event.maxPlayers 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  )}>
                    {event.players?.length >= event.maxPlayers ? 'Voll' : 'Plätze frei'}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEvent(event)}
                    className={cn(STYLES.button.base, STYLES.button.success, 'flex-1')}
                  >
                    Öffnen
                  </button>
                  <button
                    onClick={() => handleEditEvent(event)}
                    className={cn(STYLES.button.base, STYLES.button.primary)}
                  >
                    <span className="sr-only">Bearbeiten</span>
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className={cn(STYLES.button.base, STYLES.button.danger)}
                  >
                    <span className="sr-only">Löschen</span>
                    🗑️
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {events.length === 0 && (
          <div className="text-center py-16 play2-animate-in">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl">🎾</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Noch keine Events vorhanden
            </h3>
            <p className="text-gray-600 mb-6">
              Erstellen Sie Ihr erstes Turnier und starten Sie durch!
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className={cn(STYLES.button.base, STYLES.button.primary, 'play2-hover-lift')}
            >
              <span className="text-xl mr-2">+</span>
              Erstes Event erstellen
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
     {/* Footer entfernt */}
    </div>
  )
}

export default App