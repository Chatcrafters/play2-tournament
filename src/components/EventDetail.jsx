import { Calendar, Clock, MapPin, Trophy, Users, Edit, Play, BarChart3 } from 'lucide-react'
import { EventShare } from './EventShare'
import { useTranslation } from './LanguageSelector'
import { interpolate } from '../utils/translations'

export const EventDetail = ({ event, onEdit, onStartTournament, canManageEvent = false }) => {
  const { t } = useTranslation()
  
  if (!event) return null

  // Status-Prüfungen
  const hasEnoughPlayers = event.players && event.players.length >= 4
  const hasSchedule = event.schedule && event.schedule.length > 0
  const canGenerateSchedule = hasEnoughPlayers && !hasSchedule && event.status !== 'completed' && canManageEvent
  const canStartTournament = hasEnoughPlayers && hasSchedule && event.status !== 'completed' && canManageEvent
  
  const eventDate = new Date(event.date)
  const isEventPast = eventDate < new Date() && event.status !== 'completed'

  // Zeit-Informationen
  const getTimeInfo = () => {
    return {
      startTime: event.startTime || event.start_time || '',
      endTime: event.endTime || event.end_time || ''
    };
  };

  const { startTime, endTime } = getTimeInfo();

  // Spielplan generieren
  const handleGenerateSchedule = () => {
    if (!hasEnoughPlayers) {
      alert('Mindestens 4 Spieler erforderlich für einen Spielplan!')
      return
    }

    // Americano Schedule Generation
    const generateAmericanoSchedule = (players, courts, rounds) => {
      const schedule = []
      const playerCount = players.length
      const playersPerMatch = 4
      const matchesPerRound = Math.floor(courts)
      
      // Erstelle eine Kopie der Spielerliste für die Rotation
      let playerRotation = [...players]
      
      for (let round = 0; round < rounds; round++) {
        const roundMatches = []
        const usedPlayers = new Set()
        
        // Rotiere die Spielerliste für jede Runde
        if (round > 0) {
          playerRotation.push(playerRotation.shift())
        }
        
        for (let court = 0; court < matchesPerRound; court++) {
          if (usedPlayers.size + playersPerMatch > playerCount) break
          
          const match = {
            court: court + 1,
            players: []
          }
          
          // Wähle die nächsten 4 verfügbaren Spieler
          for (let i = 0; i < playerRotation.length && match.players.length < playersPerMatch; i++) {
            const player = playerRotation[i]
            if (!usedPlayers.has(player.id)) {
              match.players.push(player.id)
              usedPlayers.add(player.id)
            }
          }
          
          if (match.players.length === playersPerMatch) {
            // Erstelle Teams
            match.team1 = [
              players.find(p => p.id === match.players[0]),
              players.find(p => p.id === match.players[1])
            ]
            match.team2 = [
              players.find(p => p.id === match.players[2]),
              players.find(p => p.id === match.players[3])
            ]
            
            roundMatches.push(match)
          }
        }
        
        // Spieler die pausieren
        const restingPlayerIds = players
          .filter(p => !usedPlayers.has(p.id))
          .map(p => p.id)
        
        schedule.push({
          round: round + 1,
          matches: roundMatches,
          restingPlayerIds
        })
      }
      
      return schedule
    }

    // Berechne Anzahl der Runden basierend auf Mindestspiele
    const playersCount = event.players.length
    const courtsCount = event.courts || 2
    const minGamesPerPlayer = event.minGamesPerPlayer || 3
    
    // Spieler pro Runde = Courts * 4
    const playersPerRound = courtsCount * 4
    
    // Berechne benötigte Runden
    let numberOfRounds = minGamesPerPlayer
    if (playersCount > playersPerRound) {
      // Wenn mehr Spieler als Plätze, brauchen wir mehr Runden
      numberOfRounds = Math.ceil(minGamesPerPlayer * playersCount / playersPerRound)
    }
    
    const schedule = generateAmericanoSchedule(
      event.players,
      courtsCount,
      numberOfRounds
    )

    // Update Event mit Schedule
    const updatedEvent = {
      ...event,
      schedule: schedule,
      currentRound: 0,
      status: 'scheduled'
    }

    onEdit(updatedEvent)
    alert('Spielplan erfolgreich generiert!')
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">{event.title || event.name || 'Unbenanntes Event'}</h2>
          <p className="text-gray-600">{event.description}</p>
        </div>
        
        <div className="flex gap-2">
          <EventShare event={event} />
          {canManageEvent && (
            <button
              onClick={() => onEdit(event)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              <Edit className="w-4 h-4" />
              {t('navigation.edit')}
            </button>
          )}
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
              <p className="text-sm text-gray-500">{t('event.time') || 'Zeit'}</p>
              <p className="font-medium">
                {startTime && endTime ? (
                  `${startTime} - ${endTime} Uhr`
                ) : (
                  'Zeit nicht festgelegt'
                )}
              </p>
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
          
          {(event.isAmericano || event.event_type === 'americano' || event.eventType === 'americano') && (
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

      {/* Schedule Info */}
      {hasSchedule && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <p className="font-medium text-blue-800">
              Spielplan vorhanden: {event.schedule.length} Runden
            </p>
          </div>
        </div>
      )}

      {/* Status and Actions */}
      {event.status === 'completed' ? (
        <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg">
          <p className="font-semibold">✅ {t('messages.tournamentComplete')}</p>
        </div>
      ) : isEventPast ? (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-3 rounded-lg">
          <p className="font-semibold">⚠️ Event-Datum ist vorbei</p>
        </div>
      ) : (
        <div className="space-y-3">
          {!hasEnoughPlayers && (
            <div className="bg-gray-100 text-gray-600 px-4 py-3 rounded-lg text-center">
              <p className="font-medium">
                Noch {4 - (event.players?.length || 0)} Spieler benötigt
              </p>
            </div>
          )}
          
          {canGenerateSchedule && (
            <button
              onClick={handleGenerateSchedule}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <BarChart3 className="w-5 h-5" />
              Spielplan generieren
            </button>
          )}
          
          {canStartTournament && (
            <button
              onClick={() => onStartTournament(event)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Play className="w-5 h-5" />
              {t('event.startTournament')}
            </button>
          )}
          
          {!canManageEvent && hasEnoughPlayers && !hasSchedule && (
            <div className="bg-yellow-100 text-yellow-800 px-4 py-3 rounded-lg text-center">
              <p className="font-medium">
                Warten auf Spielplan-Generierung durch Turnierleiter
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}