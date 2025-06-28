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
  
  const getEventStatus = (event) => {
    if (event.status === 'completed') return t('event.status.completed')
    if (event.status === 'running') return t('event.status.running')
    
    const now = new Date()
    
    // Parse das Datum korrekt - als lokale Zeit
    let eventDate
    if (event.date && event.date.includes('T')) {
      // Bereits im ISO Format
      eventDate = new Date(event.date)
    } else if (event.date) {
      // Nur Datum ohne Zeit - füge lokale Mitternacht hinzu
      const [year, month, day] = event.date.split('-')
      eventDate = new Date(year, month - 1, day) // month - 1 weil JS Monate 0-basiert sind
    } else {
      eventDate = new Date()
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const eventDateMidnight = new Date(eventDate)
    eventDateMidnight.setHours(0, 0, 0, 0)
    
    // Event ist in der Vergangenheit (anderer Tag)
    if (eventDateMidnight < today) {
      return t('event.status.past')
    }
    
    // Event ist heute
    if (eventDateMidnight.getTime() === today.getTime()) {
      // Prüfe ob das Event schon vorbei ist basierend auf der Endzeit
      if (event.endTime || event.end_time) {
        const endTime = event.endTime || event.end_time
        const [endHour, endMinute] = endTime.split(':').map(Number)
        
        // Erstelle End-DateTime basierend auf dem geparsten eventDate
        const eventEndDateTime = new Date(eventDate)
        eventEndDateTime.setHours(endHour, endMinute, 0, 0)
        
        // Nur als "past" markieren wenn die Endzeit vorbei ist
        if (now > eventEndDateTime) {
          return t('event.status.past')
        }
      }
      return t('event.status.today')
    }
    
    // Event ist in der Zukunft
    return t('event.status.upcoming')
  }

  const getStatusColor = (status) => {
    const statusKey = Object.keys(t('event.status')).find(
      key => t(`event.status.${key}`) === status
    )
    
    switch (statusKey) {
      case 'completed': return 'text-gray-500'
      case 'running': return 'text-green-600'
      case 'today': return 'text-blue-600'
      case 'past': return 'text-red-600'
      default: return 'text-gray-700'
    }
  }

  const sortedEvents = [...events].sort((a, b) => {
    // Sortiere nach Datum (neueste zuerst)
    return new Date(b.date) - new Date(a.date)
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
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{event.startTime || event.start_time} - {event.endTime || event.end_time}</span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>
                      {event.players?.length || 0} / {event.maxPlayers || event.max_players || 16} {t('player.players')}
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {event.sport === 'padel' ? t('sports.padel') : 
                       event.sport === 'pickleball' ? t('sports.pickleball') : 
                       t('sports.spinxball')}
                    </span>
                    {(event.isAmericano || event.event_type === 'americano' || event.eventType === 'americano') && (
                      <span className="text-xs bg-purple-200 px-2 py-1 rounded">
                        {t('eventTypes.americano')}
                      </span>
                    )}
                    {event.genderMode && event.genderMode !== 'open' && event.genderMode !== 'mixed' && (
                      <span className="text-xs bg-pink-200 px-2 py-1 rounded">
                        {event.genderMode === 'men' || event.genderMode === 'menOnly' ? t('player.male') : t('player.female')}
                      </span>
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