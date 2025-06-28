import { Calendar, Clock, Users, MapPin } from 'lucide-react'
import { useTranslation } from './LanguageSelector'
import { useRef } from 'react'

export const EventList = ({ events, selectedEvent, onSelectEvent, onDeleteEvent, canManageEvents }) => {
  const { t } = useTranslation()
  const touchStartTime = useRef(0)
  const touchStartY = useRef(0)
  
  // Debug: Props prüfen
  console.log('EventList props:', { 
    eventsCount: events?.length, 
    hasOnSelectEvent: !!onSelectEvent,
    hasOnDeleteEvent: !!onDeleteEvent 
  });
  
  // ROBUSTE DATUM-STATUS LOGIC - BUG FIX
  const getEventStatus = (event) => {
    if (event.status === 'completed') return t('event.status.completed')
    if (event.status === 'running') return t('event.status.running')
    
    // Aktuelles Datum (lokale Zeitzone)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()) // Heute 00:00:00
    
    // Event-Datum parsen (lokale Zeitzone, NICHT UTC!)
    let eventDate
    try {
      if (event.date) {
        if (event.date.includes('T')) {
          // ISO Format mit Zeit - nur Datum extrahieren
          eventDate = new Date(event.date.split('T')[0] + 'T00:00:00')
        } else if (event.date.includes('-')) {
          // YYYY-MM-DD Format
          const [year, month, day] = event.date.split('-').map(Number)
          eventDate = new Date(year, month - 1, day) // month-1 weil JS 0-basiert
        } else {
          console.warn('Unbekanntes Datumsformat:', event.date)
          eventDate = new Date(event.date)
        }
      } else {
        console.warn('Event hat kein Datum:', event)
        return t('event.status.unknown') || 'Unbekannt'
      }
    } catch (error) {
      console.error('Fehler beim Parsen des Event-Datums:', error, event.date)
      return t('event.status.unknown') || 'Unbekannt'
    }
    
    // Datum auf Mitternacht setzen für korrekten Vergleich
    const eventDateMidnight = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
    
    console.log('Event:', event.name, {
      originalDate: event.date,
      parsedDate: eventDate,
      eventDateMidnight: eventDateMidnight,
      today: today,
      comparison: eventDateMidnight.getTime() - today.getTime()
    })
    
    // Datum-Vergleich (nur Tage, keine Zeit)
    const daysDifference = Math.floor((eventDateMidnight.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDifference < 0) {
      // Event war an einem vergangenen Tag
      return t('event.status.past')
    } else if (daysDifference === 0) {
      // Event ist heute - prüfe zusätzlich die Endzeit
      if (event.endTime || event.end_time) {
        try {
          const endTime = event.endTime || event.end_time
          const [endHour, endMinute] = endTime.split(':').map(Number)
          
          // Event-Ende-DateTime für heute
          const eventEndDateTime = new Date()
          eventEndDateTime.setHours(endHour, endMinute, 0, 0)
          
          // Nur als "past" markieren wenn SOWOHL Datum vergangen UND Endzeit vorbei
          if (now > eventEndDateTime) {
            return t('event.status.past')
          }
        } catch (timeError) {
          console.warn('Fehler beim Parsen der Endzeit:', timeError, event.endTime || event.end_time)
          // Bei Zeit-Parsing-Fehlern: Event als "heute" behandeln
        }
      }
      
      return t('event.status.today')
    } else {
      // Event ist in der Zukunft
      return t('event.status.upcoming')
    }
  }

  const getStatusColor = (status) => {
    // Verbesserter Status-Color-Mapping
    const statusMappings = {
      // Deutsch
      'Abgeschlossen': 'text-gray-500',
      'Laufend': 'text-green-600', 
      'Heute': 'text-blue-600',
      'Vergangen': 'text-red-600',
      'Geplant': 'text-gray-700',
      'Unbekannt': 'text-gray-400',
      
      // Spanisch
      'Completado': 'text-gray-500',
      'En curso': 'text-green-600',
      'Hoy': 'text-blue-600', 
      'Pasado': 'text-red-600',
      'Próximo': 'text-gray-700',
      'Desconocido': 'text-gray-400',
      
      // Englisch (Fallback)
      'Completed': 'text-gray-500',
      'Running': 'text-green-600',
      'Today': 'text-blue-600',
      'Past': 'text-red-600',
      'Upcoming': 'text-gray-700',
      'Unknown': 'text-gray-400'
    }
    
    return statusMappings[status] || 'text-gray-700'
  }

  const sortedEvents = [...events].sort((a, b) => {
    // Sortiere nach Datum (neueste zuerst)
    try {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateB.getTime() - dateA.getTime()
    } catch (error) {
      console.warn('Fehler beim Sortieren der Events:', error)
      return 0
    }
  })

  // Event Selection Handler
  const handleEventClick = (event) => {
    console.log('handleEventClick called with:', event.name || event.id);
    console.log('Full event object:', event);
    if (onSelectEvent && typeof onSelectEvent === 'function') {
      onSelectEvent(event);
    } else {
      console.error('onSelectEvent is not a function or not provided');
    }
  };

  // iOS-optimierter Touch Handler
  const handleTouchStart = (e) => {
    touchStartTime.current = Date.now();
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e, event) => {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime.current;
    const touchEndY = e.changedTouches[0].clientY;
    const touchDistance = Math.abs(touchEndY - touchStartY.current);
    
    // Nur als Tap werten wenn wenig Bewegung (ignoriere Zeit)
    if (touchDistance < 10) {
      e.preventDefault();
      e.stopPropagation();
      handleEventClick(event);
    }
  };

  // Delete Handler
  const handleDeleteClick = (e, eventId) => {
    console.log('handleDeleteClick called for:', eventId);
    e.stopPropagation();
    e.preventDefault();
    
    if (window.confirm(t('messages.confirmDelete'))) {
      if (onDeleteEvent && typeof onDeleteEvent === 'function') {
        onDeleteEvent(eventId);
      } else {
        console.error('onDeleteEvent is not a function or not provided');
      }
    }
  };

  // Verbessertes Datum-Rendering
  const formatEventDate = (dateString) => {
    try {
      if (!dateString) return 'Kein Datum'
      
      let date
      if (dateString.includes('T')) {
        date = new Date(dateString.split('T')[0])
      } else {
        date = new Date(dateString)
      }
      
      // Prüfe ob Datum gültig ist
      if (isNaN(date.getTime())) {
        console.warn('Ungültiges Datum:', dateString)
        return dateString // Fallback: Original-String anzeigen
      }
      
      // Formatiere Datum lokalisiert
      return date.toLocaleDateString('de-DE', {
        weekday: 'short',
        year: 'numeric', 
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      console.error('Fehler beim Formatieren des Datums:', error, dateString)
      return dateString || 'Ungültiges Datum'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">{t('event.myEvents')}</h2>
      
      {sortedEvents.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {t('event.noEvents') || 'Keine Events vorhanden'}
        </p>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map(event => {
            const status = getEventStatus(event)
            const isSelected = selectedEvent?.id === event.id
            
            console.log('Rendering event:', event.name, 'Status:', status) // Debug
            
            return (
              <div
                key={event.id}
                onTouchStart={handleTouchStart}
                onTouchEnd={(e) => handleTouchEnd(e, event)}
                onClick={(e) => {
                  // Nur für Desktop/Non-Touch
                  if (!('ontouchstart' in window)) {
                    handleEventClick(event);
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleEventClick(event);
                  }
                }}
                className={`p-4 rounded-lg transition-all select-none ${
                  isSelected 
                    ? 'bg-blue-50 border-2 border-blue-500' 
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  cursor: 'pointer',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none',
                  msUserSelect: 'none',
                  MozUserSelect: 'none'
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{event.title || event.name || 'Unbenanntes Event'}</h3>
                  <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                    {status}
                  </button>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatEventDate(event.date)}</button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{event.startTime || event.start_time} - {event.endTime || event.end_time}</button>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</button>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>
                      {event.players?.length || 0} / {event.maxPlayers || event.max_players || 16} {t('player.players')}
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {event.sport === 'padel' ? t('sports.padel') : 
                       event.sport === 'pickleball' ? t('sports.pickleball') : 
                       t('sports.spinxball')}
                    </button>
                    {(event.isAmericano || event.event_type === 'americano' || event.eventType === 'americano') && (
                      <span className="text-xs bg-purple-200 px-2 py-1 rounded">
                        {t('eventTypes.americano')}
                      </button>
                    )}
                    {event.genderMode && event.genderMode !== 'open' && event.genderMode !== 'mixed' && (
                      <span className="text-xs bg-pink-200 px-2 py-1 rounded">
                        {event.genderMode === 'men' || event.genderMode === 'menOnly' ? t('player.male') : t('player.female')}
                      </button>
                    )}
                  </div>
                  
                  {canManageEvents && (
                    <button
                      onClick={(e) => handleDeleteClick(e, event.id)}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                      }}
                      className="text-red-500 hover:text-red-700 text-sm px-3 py-1 -mr-2 rounded hover:bg-red-50 active:bg-red-100 transition-colors"
                      style={{ touchAction: 'manipulation' }}
                    >
                      {t('navigation.delete')}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
