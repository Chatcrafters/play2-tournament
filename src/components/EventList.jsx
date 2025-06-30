import { Calendar, Clock, Users, MapPin } from 'lucide-react'
import { fixEncoding } from '../utils/encoding';
import { useTranslation } from './LanguageSelector'
import { useRef, useMemo, useCallback } from 'react'
export const EventList = ({ events, selectedEvent, onSelectEvent, onDeleteEvent, canManageEvents }) => {
  const t = useTranslation()?.t || ((key) => key)
  const touchStartTime = useRef(0)
  const touchStartY = useRef(0)
  
  // FIXED: Memoized date parsing function to prevent re-calculations
  const parseEventDate = useCallback((dateStr) => {
    if (!dateStr) return null;
    
    try {
      // FIXED: Handle malformed dates like "0002-07-06"
      if (dateStr.startsWith('000') || dateStr.length < 8) {
        // removed console.warn;
        return null;
      }
      
      let eventDate;
      if (dateStr.includes('T')) {
        // ISO format with time - extract date only
        eventDate = new Date(dateStr.split('T')[0] + 'T00:00:00');
      } else if (dateStr.includes('-')) {
        // YYYY-MM-DD format - validate year
        const [year, month, day] = dateStr.split('-').map(Number);
        
        // FIXED: Validate reasonable year range
        if (year < 2020 || year > 2030) {
          // removed console.warn;
          return null;
        }
        
        eventDate = new Date(year, month - 1, day);
      } else {
        eventDate = new Date(dateStr);
      }
      
      // Validate the parsed date
      if (isNaN(eventDate.getTime())) {
        // removed console.warn;
        return null;
      }
      
      return eventDate;
    } catch (error) {
      // removed console.error;
      return null;
    }
  }, []);

  // FIXED: Memoized status calculation
  const getEventStatus = useCallback((event) => {
    if (event.status === 'completed') return t('event.status.completed');
    if (event.status === 'running') return t('event.status.running');
    
    const eventDate = parseEventDate(event.date);
    if (!eventDate) return t('event.status.unknown') || 'Unknown';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDateMidnight = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    
    const daysDifference = Math.floor((eventDateMidnight.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference < 0) {
      return t('event.status.past');
    } else if (daysDifference === 0) {
      // Check end time for today's events
      if (event.endTime || event.end_time) {
        try {
          const endTime = event.endTime || event.end_time;
          const [endHour, endMinute] = endTime.split(':').map(Number);
          const eventEndDateTime = new Date();
          eventEndDateTime.setHours(endHour, endMinute, 0, 0);
          
          if (now > eventEndDateTime) {
            return t('event.status.past');
          }
        } catch (timeError) {
          // removed console.warn;
        }
      }
      return t('event.status.today');
    } else {
      return t('event.status.upcoming');
    }
  }, [parseEventDate, t]);

  // FIXED: Memoized status color mapping
  const getStatusColor = useCallback((status) => {
    const statusMappings = {
      // Deutsch
      'Abgeschlossen': 'text-gray-500',
      'Laufend': 'text-green-600', 
      'Heute': 'text-blue-600',
      'Vergangen': 'text-red-600',
      'Geplant': 'text-gray-700',
      'Anstehend': 'text-gray-700',
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
    };
    
    return statusMappings[status] || 'text-gray-700';
  }, []);

  // FIXED: Memoized sorted events to prevent re-sorting on every render
  const sortedEvents = useMemo(() => {
    if (!events || !Array.isArray(events)) return [];
    
    return [...events].sort((a, b) => {
      try {
        const dateA = parseEventDate(a.date);
        const dateB = parseEventDate(b.date);
        
        // Handle null dates
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        
        // Sort by date (newest first)
        return dateB.getTime() - dateA.getTime();
      } catch (error) {
        // removed console.warn;
        return 0;
      }
    });
  }, [events, parseEventDate]);

  // FIXED: Optimized event click handler
  const handleEventClick = useCallback((event) => {
    if (onSelectEvent && typeof onSelectEvent === 'function') {
      onSelectEvent(event);
    } else {
      // removed console.error;
    }
  }, [onSelectEvent]);

  // FIXED: Optimized touch handlers
  const handleTouchStart = useCallback((e) => {
    touchStartTime.current = Date.now();
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e, event) => {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime.current;
    const touchEndY = e.changedTouches[0].clientY;
    const touchDistance = Math.abs(touchEndY - touchStartY.current);
    
    // Only treat as tap if minimal movement
    if (touchDistance < 10) {
      e.preventDefault();
      e.stopPropagation();
      handleEventClick(event);
    }
  }, [handleEventClick]);

  // FIXED: Optimized delete handler
  const handleDeleteClick = useCallback((e, eventId) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (window.confirm(t('messages.confirmDelete'))) {
      if (onDeleteEvent && typeof onDeleteEvent === 'function') {
        onDeleteEvent(eventId);
      } else {
        // removed console.error;
      }
    }
  }, [onDeleteEvent, t]);

  // FIXED: Memoized date formatting function
  const formatEventDate = useCallback((dateString) => {
    if (!dateString) return t('event.noDate') || 'Kein Datum';
    
    const eventDate = parseEventDate(dateString);
    if (!eventDate) {
      // removed console.warn;
      return dateString; // Fallback: show original string
    }
    
    try {
      return eventDate.toLocaleDateString('de-DE', {
        weekday: 'short',
        year: 'numeric', 
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      // removed console.error;
      return dateString || 'Invalid Date';
    }
  }, [parseEventDate, t]);

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
            const status = getEventStatus(event);
            const isSelected = selectedEvent?.id === event.id;
            
            return (
              <div
                key={event.id}
                onTouchStart={handleTouchStart}
                onTouchEnd={(e) => handleTouchEnd(e, event)}
                onClick={(e) => {
                  // Only for desktop/non-touch
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
                className={`p-4 rounded-lg transition-all select-none cursor-pointer ${
                  isSelected 
                    ? 'bg-blue-50 border-2 border-blue-500' 
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none',
                  msUserSelect: 'none',
                  MozUserSelect: 'none'
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">
                    {fixEncoding(event.title || event.name) || t('event.unnamed') || 'Unbenanntes Event'}
                  </h3>
                  <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                    {status}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatEventDate(event.date)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {(event.startTime || event.start_time)} - {(event.endTime || event.end_time)}
                    </span>
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
                        {event.genderMode === 'men' || event.genderMode === 'menOnly' ? 
                          t('player.male') : t('player.female')}
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
            );
          })}
        </div>
      )}
    </div>
  );
};




