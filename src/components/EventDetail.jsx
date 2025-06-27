import { Calendar, Clock, MapPin, Trophy, Users, Edit, Play, BarChart3, RefreshCw } from 'lucide-react'
import { EventShare } from './EventShare'
import { useTranslation } from './LanguageSelector'
import { interpolate } from '../utils/translations'
import { generateAmericanoSchedule } from '../utils/americanoAlgorithm'
import { useState } from 'react'

export const EventDetail = ({ event, onEdit, onUpdateEvent, onStartTournament, canManageEvent = false }) => {
  const { t } = useTranslation()
  const [showScheduleOptions, setShowScheduleOptions] = useState(false)
  const [scheduleOptions, setScheduleOptions] = useState([])
  const [selectedScheduleIndex, setSelectedScheduleIndex] = useState(null)
  
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

  // Spielplan generieren mit 3 Varianten
  const handleGenerateSchedule = () => {
    if (!hasEnoughPlayers) {
      alert('Mindestens 4 Spieler erforderlich für einen Spielplan!')
      return
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
    
    // Generiere 3 verschiedene Spielplan-Varianten
    const options = []
    for (let i = 0; i < 3; i++) {
      const result = generateAmericanoSchedule(
        event.players,
        courtsCount,
        numberOfRounds,
        {
          regenerateCount: i,
          eventId: event.id
        }
      )
      
      // Berechne Fairness-Metriken
      const fairnessMetrics = calculateFairnessMetrics(result, event.players)
      
      options.push({
        schedule: result.schedule,
        fairness: fairnessMetrics,
        regenerateCount: i
      })
    }
    
    setScheduleOptions(options)
    setShowScheduleOptions(true)
  }

  // Fairness-Metriken berechnen
  const calculateFairnessMetrics = (result, players) => {
    const playerCount = players.length
    
    // Durchschnittliche verschiedene Partner pro Spieler
    const avgUniquePartners = players.reduce((sum, player, idx) => {
      const partners = Object.values(result.statistics.partnerMatrix[idx] || {})
        .filter(count => count > 0).length
      return sum + partners
    }, 0) / playerCount
    
    // Durchschnittliche verschiedene Gegner pro Spieler
    const avgUniqueOpponents = players.reduce((sum, player, idx) => {
      const opponents = Object.values(result.statistics.opponentMatrix[idx] || {})
        .filter(count => count > 0).length
      return sum + opponents
    }, 0) / playerCount
    
    // Maximale Partner-Wiederholungen
    const maxPartnerRepeats = Math.max(...Object.values(result.statistics.partnerMatrix)
      .map(row => Math.max(...Object.values(row))))
    
    // Maximale Gegner-Wiederholungen
    const maxOpponentRepeats = Math.max(...Object.values(result.statistics.opponentMatrix)
      .map(row => Math.max(...Object.values(row))))
    
    // Gleichmäßigkeit der Spiele (Standardabweichung)
    const avgGames = result.statistics.gamesPlayed.reduce((a, b) => a + b, 0) / playerCount
    const gameDeviation = Math.sqrt(
      result.statistics.gamesPlayed.reduce((sum, games) => 
        sum + Math.pow(games - avgGames, 2), 0) / playerCount
    )
    
    // Gesamt-Fairness-Score (0-100)
    const partnerScore = Math.min(100, (avgUniquePartners / (playerCount - 1)) * 100)
    const opponentScore = Math.min(100, (avgUniqueOpponents / (playerCount - 1)) * 100)
    const repeatScore = Math.max(0, 100 - (maxPartnerRepeats - 1) * 20)
    const balanceScore = Math.max(0, 100 - gameDeviation * 10)
    
    const overallScore = Math.round(
      (partnerScore * 0.3 + opponentScore * 0.3 + repeatScore * 0.25 + balanceScore * 0.15)
    )
    
    return {
      overallScore,
      avgUniquePartners: avgUniquePartners.toFixed(1),
      avgUniqueOpponents: avgUniqueOpponents.toFixed(1),
      maxPartnerRepeats,
      maxOpponentRepeats,
      gameBalance: gameDeviation.toFixed(2),
      partnerScore: Math.round(partnerScore),
      opponentScore: Math.round(opponentScore),
      repeatScore: Math.round(repeatScore),
      balanceScore: Math.round(balanceScore)
    }
  }

  // Spielplan-Option auswählen
  const handleSelectSchedule = (index) => {
    const selectedOption = scheduleOptions[index]
    
    // Update Event mit Schedule
    const updatedEvent = {
      ...event,
      schedule: selectedOption.schedule,
      currentRound: 0,
      status: 'scheduled',
      regenerateCount: selectedOption.regenerateCount,
      fairnessScore: selectedOption.fairness.overallScore
    }

    // WICHTIG: onUpdateEvent verwenden, nicht onEdit!
    onUpdateEvent(updatedEvent)
    setShowScheduleOptions(false)
    setScheduleOptions([])
  }

  // Fairness-Score Farbe
  const getFairnessColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    if (score >= 40) return 'text-orange-600 bg-orange-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <p className="font-medium text-blue-800">
                  Spielplan vorhanden: {event.schedule.length} Runden
                </p>
              </div>
              {event.fairnessScore && (
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getFairnessColor(event.fairnessScore)}`}>
                  Fairness: {event.fairnessScore}%
                </div>
              )}
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

      {/* Modal für Spielplan-Optionen */}
      {showScheduleOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Wähle einen Spielplan</h2>
              <button
                onClick={() => {
                  setShowScheduleOptions(false)
                  setScheduleOptions([])
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              Es wurden 3 verschiedene Spielplan-Varianten generiert. Wähle die Option mit der besten Fairness für dein Turnier:
            </p>
            
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {scheduleOptions.map((option, index) => (
                  <div 
                    key={index}
                    className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleSelectSchedule(index)}
                  >
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Variante {index + 1}</h3>
                      
                      {/* Gesamt-Fairness */}
                      <div className={`text-center p-4 rounded-lg mb-4 ${getFairnessColor(option.fairness.overallScore)}`}>
                        <div className="text-3xl font-bold">
                          {option.fairness.overallScore}%
                        </div>
                        <div className="text-sm font-medium">Gesamt-Fairness</div>
                      </div>
                      
                      {/* Detail-Metriken */}
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Partner-Vielfalt:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{option.fairness.avgUniquePartners}</span>
                            <div className={`text-xs px-2 py-1 rounded ${getFairnessColor(option.fairness.partnerScore)}`}>
                              {option.fairness.partnerScore}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Gegner-Vielfalt:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{option.fairness.avgUniqueOpponents}</span>
                            <div className={`text-xs px-2 py-1 rounded ${getFairnessColor(option.fairness.opponentScore)}`}>
                              {option.fairness.opponentScore}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Max. Partner-Wdh:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{option.fairness.maxPartnerRepeats}x</span>
                            <div className={`text-xs px-2 py-1 rounded ${getFairnessColor(option.fairness.repeatScore)}`}>
                              {option.fairness.repeatScore}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Spiel-Balance:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">±{option.fairness.gameBalance}</span>
                            <div className={`text-xs px-2 py-1 rounded ${getFairnessColor(option.fairness.balanceScore)}`}>
                              {option.fairness.balanceScore}%
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Erste Runden Preview */}
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-gray-600 mb-2">Erste 2 Runden:</p>
                        {option.schedule.slice(0, 2).map((round, rIdx) => (
                          <div key={rIdx} className="mb-2">
                            <p className="text-xs font-semibold">Runde {round.round}:</p>
                            {round.matches.slice(0, 2).map((match, mIdx) => (
                              <p key={mIdx} className="text-xs text-gray-600 ml-2">
                                Platz {match.court}: {match.players.length} Spieler
                              </p>
                            ))}
                            {round.matches.length > 2 && (
                              <p className="text-xs text-gray-400 ml-2">
                                + {round.matches.length - 2} weitere Matches
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <button
                      className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                    >
                      Diese Variante wählen
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Erklärung */}
            <div className="mt-6 p-4 bg-gray-50 rounded text-sm">
              <p className="font-semibold mb-2">Fairness-Bewertung:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-semibold">80-100%</span>
                  <span>Exzellent</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-semibold">60-79%</span>
                  <span>Gut</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded font-semibold">40-59%</span>
                  <span>Akzeptabel</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-semibold">0-39%</span>
                  <span>Verbesserungswürdig</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}