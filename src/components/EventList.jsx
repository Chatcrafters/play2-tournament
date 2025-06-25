import { Calendar, Clock, Users, MapPin } from 'lucide-react'
import { useTranslation } from './LanguageSelector'

export const EventList = ({ events, selectedEvent, onSelectEvent, onDeleteEvent }) => {
  const { t } = useTranslation()
  
  const getEventStatus = (event) => {
    if (event.status === 'completed') return t('event.status.completed')
    if (event.status === 'running') return t('event.status.running')
    const eventDate = new Date(event.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    eventDate.setHours(0, 0, 0, 0)
    
    if (eventDate < today) return t('event.status.past')
    if (eventDate.getTime() === today.getTime()) return t('event.status.today')
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">{t('event.myEvents')}</h2>
      
      {sortedEvents.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {t('player.noPlayers')}
        </p>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map(event => {
            const status = getEventStatus(event)
            const isSelected = selectedEvent?.id === event.id
            
            return (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-blue-50 border-2 border-blue-500' 
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
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
                    {(event.isAmericano || event.event_type === 'americano') && (
                      <span className="text-xs bg-purple-200 px-2 py-1 rounded">
                        {t('eventTypes.americano')}
                      </span>
                    )}
                    {event.genderMode && event.genderMode !== 'open' && (
                      <span className="text-xs bg-pink-200 px-2 py-1 rounded">
                        {event.genderMode === 'men' ? t('player.male') : t('player.female')}
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.confirm(t('messages.confirmDelete'))) {
                        onDeleteEvent(event.id)
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    {t('navigation.delete')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}