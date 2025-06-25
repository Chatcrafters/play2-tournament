import { Calendar, Clock, MapPin, Trophy, Users, Edit, Play } from 'lucide-react'
import { EventShare } from './EventShare'
import { useTranslation } from './LanguageSelector'
import { interpolate } from '../utils/translations'

export const EventDetail = ({ event, onEdit, onStartTournament }) => {
  const { t } = useTranslation()
  
  if (!event) return null

  const canStartTournament = event.players && event.players.length >= 4 && event.status !== 'completed'
  const eventDate = new Date(event.date)
  const isEventPast = eventDate < new Date() && event.status !== 'completed'

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">{event.title || event.name || 'Unbenanntes Event'}</h2>
          <p className="text-gray-600">{event.description}</p>
        </div>
        
        <div className="flex gap-2">
          <EventShare event={event} />
          <button
            onClick={() => onEdit(event)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            <Edit className="w-4 h-4" />
            {t('navigation.edit')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">{t('event.date')}</p>
              <p className="font-medium">{eventDate.toLocaleDateString('de-DE', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">{t('event.time')}</p>
              <p className="font-medium">{event.startTime || event.start_time} - {event.endTime || event.end_time} Uhr</p>
            </div>
          </div>

          {event.location && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">{t('event.location')}</p>
                <p className="font-medium">{event.location}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">{t('event.sport')}</p>
              <p className="font-medium">
                {event.sport === 'padel' ? t('sports.padel') : 
                 event.sport === 'pickleball' ? t('sports.pickleball') : 
                 t('sports.spinxball')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">{t('player.players')}</p>
              <p className="font-medium">
                {event.players?.length || 0} / {event.maxPlayers || event.max_players || 16} {t('player.players')}
              </p>
            </div>
          </div>

          {event.price && (
            <div className="flex items-center gap-3">
              <span className="text-xl">💰</span>
              <div>
                <p className="text-sm text-gray-500">Teilnahmegebühr</p>
                <p className="font-medium">{event.price}€</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Details */}
      <div className="border-t pt-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Format:</span>
            <span className="ml-2 font-medium">
              {event.teamFormat === 'single' || event.format === 'singles' ? 'Einzel' : 'Doppel'}
            </span>
          </div>
          
          {(event.isAmericano || event.event_type === 'americano') && (
            <div>
              <span className="text-gray-500">Spielmodus:</span>
              <span className="ml-2 font-medium">{t('eventTypes.americano')}</span>
            </div>
          )}
          
          <div>
            <span className="text-gray-500">{t('event.courts')}:</span>
            <span className="ml-2 font-medium">{event.courts || 2}</span>
          </div>
          
          {event.genderMode && event.genderMode !== 'open' && (
            <div>
              <span className="text-gray-500">{t('player.gender')}:</span>
              <span className="ml-2 font-medium">
                {event.genderMode === 'men' ? t('player.male') : t('player.female')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Status and Actions */}
      {event.status === 'completed' ? (
        <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg">
          <p className="font-semibold">✅ {t('messages.tournamentComplete')}</p>
        </div>
      ) : isEventPast ? (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-3 rounded-lg">
          <p className="font-semibold">⚠️ Event-Datum ist vorbei</p>
        </div>
      ) : canStartTournament ? (
        <button
          onClick={() => onStartTournament(event)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Play className="w-5 h-5" />
          {t('event.startTournament')}
        </button>
      ) : (
        <div className="bg-gray-100 text-gray-600 px-4 py-3 rounded-lg text-center">
          <p className="font-medium">
            {event.players?.length < 4 
              ? `Noch ${4 - (event.players?.length || 0)} Spieler benötigt zum Starten`
              : 'Turnier kann gestartet werden'}
          </p>
        </div>
      )}
    </div>
  )
}