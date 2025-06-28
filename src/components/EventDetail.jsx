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

  // Sichere Defaults für alle event properties
  const safeEvent = {
    ...event,
    players: Array.isArray(event.players) ? event.players : [],
    schedule: Array.isArray(event.schedule) ? event.schedule : [],
    startTime: event.startTime || event.start_time || '09:00',
    endTime: event.endTime || event.end_time || '13:00',
    courts: parseInt(event.courts) || 2,
    roundDuration: parseInt(event.roundDuration) || 15,
    minGamesPerPlayer: parseInt(event.minGamesPerPlayer) || 3,
    status: event.status || 'pending',
    fairnessScore: event.fairnessScore || 0,
    regenerateCount: event.regenerateCount || 0,
    maxPlayers: event.maxPlayers || event.max_players || 16,
    sport: event.sport || 'padel',
    format: event.format || 'doubles',
    eventType: event.eventType || event.event_type || 'americano',
    genderMode: event.genderMode || 'open',
    location: event.location || '',
    price: event.price || event.entryFee || 0,
    name: event.name || event.title || '',
    description: event.description || event.eventInfo || '',
    date: event.date || new Date().toISOString().split('T')[0]
  }

  // Status-Prüfungen
  const hasEnoughPlayers = safeEvent.players.length >= 4
  const hasSchedule = safeEvent.schedule.length > 0
  const canGenerateSchedule = hasEnoughPlayers && !hasSchedule && safeEvent.status !== 'completed' && canManageEvent
  const canStartTournament = hasEnoughPlayers && hasSchedule && safeEvent.status !== 'completed' && canManageEvent
  
  const eventDate = new Date(safeEvent.date)
  const isEventPast = eventDate < new Date() && safeEvent.status !== 'completed'

  // Zeit-Informationen
  const getTimeInfo = () => {
    return {
      startTime: safeEvent.startTime,
      endTime: safeEvent.endTime
    };
  };

  const { startTime, endTime } = getTimeInfo();

  // Spielplan generieren mit 3 Varianten
  const handleGenerateSchedule = () => {
    if (!hasEnoughPlayers) {
      alert(t('messages.minPlayersForSchedule'))
      return
    }

    // Berechne Anzahl der Runden basierend auf Mindestspiele
    const playersCount = safeEvent.players.length
    const courtsCount = safeEvent.courts
    const minGamesPerPlayer = safeEvent.minGamesPerPlayer
    
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
      try {
        const result = generateAmericanoSchedule(
          safeEvent.players,
          courtsCount,
          numberOfRounds,
          {
            regenerateCount: i,
            eventId: safeEvent.id
          }
        )
        
        // Berechne Fairness-Metriken
        const fairnessMetrics = calculateFairnessMetrics(result, safeEvent.players)
        
        options.push({
          schedule: result.schedule,
          fairness: fairnessMetrics,
          regenerateCount: i
        })
      } catch (error) {
        console.error('Fehler beim Generieren der Variante', i, error)
      }
    }
    
    if (options.length === 0) {
      alert(t('messages.errorGeneratingSchedule') || 'Fehler beim Generieren des Spielplans')
      return
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
      ...safeEvent,
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

  // Berechne Tabellen-Standings
  const calculateStandings = () => {
    const playerStats = {}
    
    // Initialisiere alle Spieler
    safeEvent.players.forEach(player => {
      playerStats[player.id] = {
        ...player,
        points: 0,
        gamesWon: 0,
        gamesPlayed: 0
      }
    })
    
    // Verarbeite alle Ergebnisse aus dem Event
    if (safeEvent.results) {
      Object.entries(safeEvent.results).forEach(([matchKey, matchData]) => {
        if (matchData && matchData.result) {
          const { team1, team2, result } = matchData
          
          // Update Team 1
          team1?.forEach(player => {
            if (player?.id && playerStats[player.id]) {
              playerStats[player.id].gamesPlayed++
              playerStats[player.id].gamesWon += result.team1Score || 0
              playerStats[player.id].points += result.team1Points || 0
            }
          })
          
          // Update Team 2
          team2?.forEach(player => {
            if (player?.id && playerStats[player.id]) {
              playerStats[player.id].gamesPlayed++
              playerStats[player.id].gamesWon += result.team2Score || 0
              playerStats[player.id].points += result.team2Points || 0
            }
          })
        }
      })
    }
    
    // Sortiere nach Punkten, dann nach gewonnenen Spielen
    return Object.values(playerStats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      return b.gamesWon - a.gamesWon
    })
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
            <h2 className="text-2xl font-bold mb-2">{safeEvent.title || safeEvent.name || t('event.unnamed')}</h2>
            <p className="text-gray-600">{safeEvent.description}</p>
          </div>
          
          <div className="flex gap-2">
            <EventShare event={safeEvent} />
            {canManageEvent && (
              <button
                onClick={() => onEdit(safeEvent)}
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
              <Calendar className="w-4 h-4 text-gray-500" />
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
                <p className="font-medium">
                  {startTime && endTime ? (
                    `${startTime} - ${endTime}`
                  ) : (
                    t('event.noTime') || 'Keine Zeit angegeben'
                  )}
                </p>
              </div>
            </div>

            {safeEvent.location && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">{t('event.location')}</p>
                  <p className="font-medium">{safeEvent.location}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">{t('event.sport')}</p>
                <p className="font-medium">{t(`sports.${safeEvent.sport}`)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">{t('player.players')}</p>
                <p className="font-medium">
                  {safeEvent.players.length} / {safeEvent.maxPlayers || safeEvent.max_players || 16} {t('player.players')}
                </p>
              </div>
            </div>

            {safeEvent.price && (
              <div className="flex items-center gap-3">
                <span className="text-xl">💰</span>
                <div>
                  <p className="text-sm text-gray-500">{t('event.participationFee')}</p>
                  <p className="font-medium">{safeEvent.price}€</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Event Details */}
        <div className="border-t pt-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">{t('event.format.title')}:</span>
              <span className="ml-2 font-medium">
                {safeEvent.teamFormat === 'single' || safeEvent.format === 'singles' ? t('event.format.single') : t('event.format.double')}
              </span>
            </div>
            
            {(safeEvent.isAmericano || safeEvent.event_type === 'americano' || safeEvent.eventType === 'americano') && (
              <div>
                <span className="text-gray-500">{t('event.playMode')}:</span>
                <span className="ml-2 font-medium">{t('eventTypes.americano')}</span>
              </div>
            )}
            
            <div>
              <span className="text-gray-500">{t('event.courts')}:</span>
              <span className="ml-2 font-medium">{safeEvent.courts}</span>
            </div>
            
            {safeEvent.genderMode && safeEvent.genderMode !== 'open' && (
              <div>
                <span className="text-gray-500">{t('player.gender')}:</span>
                <span className="ml-2 font-medium">
                  {safeEvent.genderMode === 'men' ? t('player.male') : t('player.female')}
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
                  {interpolate(t('schedule.scheduled'), { rounds: safeEvent.schedule.length })}
                </p>
              </div>
              {safeEvent.fairnessScore && (
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getFairnessColor(safeEvent.fairnessScore)}`}>
                  {t('schedule.fairness')}: {safeEvent.fairnessScore}%
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status and Actions */}
        {safeEvent.status === 'completed' ? (
          <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg">
            <p className="font-semibold">✅ {t('messages.tournamentComplete')}</p>
          </div>
        ) : isEventPast ? (
          <div className="bg-yellow-100 text-yellow-800 px-4 py-3 rounded-lg">
            <p className="font-semibold">⚠️ {t('messages.eventDatePast')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {!hasEnoughPlayers && (
              <div className="bg-gray-100 text-gray-600 px-4 py-3 rounded-lg text-center">
                <p className="font-medium">
                  {interpolate(t('messages.minPlayersNeeded'), { count: 4 - (safeEvent.players?.length || 0) })}
                </p>
              </div>
            )}
            
            {canGenerateSchedule && (
              <button
                onClick={handleGenerateSchedule}
                disabled={!canGenerateSchedule}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors font-medium ${
                  canGenerateSchedule 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                {t('schedule.generateSchedule')}
              </button>
            )}
            
            {canStartTournament && (
              <button
                onClick={() => onStartTournament(safeEvent)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Play className="w-5 h-5" />
                {t('event.startTournament')}
              </button>
            )}
            
            {!canManageEvent && hasEnoughPlayers && !hasSchedule && (
              <div className="bg-yellow-100 text-yellow-800 px-4 py-3 rounded-lg text-center">
                <p className="font-medium">
                  {t('messages.waitingForSchedule')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live-Tabelle mit Ausblenden-Option */}
      {hasSchedule && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">{t('results.standings')}</h3>
            {canManageEvent && (
              <button
                onClick={() => {
                  const updatedEvent = {
                    ...safeEvent,
                    showLiveTable: !safeEvent.showLiveTable
                  }
                  onUpdateEvent(updatedEvent)
                }}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
              >
                {safeEvent.showLiveTable !== false ? '👁️ ' + t('table.hide') : '👁️‍🗨️ ' + t('table.show')}
              </button>
            )}
          </div>

          {/* Tabelle nur anzeigen wenn showLiveTable nicht false ist */}
          {safeEvent.showLiveTable !== false ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">{t('results.rank')}</th>
                    <th className="text-left py-2 px-3">{t('results.player')}</th>
                    <th className="text-center py-2 px-3">{t('results.points')}</th>
                    <th className="text-center py-2 px-3">{t('results.gamesWon')}</th>
                    <th className="text-center py-2 px-3">{t('results.matches')}</th>
                  </tr>
                </thead>
                <tbody>
                  {calculateStandings().map((player, idx) => (
                    <tr key={player.id} className={`border-b ${
                      idx === 0 ? 'bg-yellow-50' : 
                      idx === 1 ? 'bg-gray-100' : 
                      idx === 2 ? 'bg-orange-50' : ''
                    }`}>
                      <td className="py-2 px-3 font-semibold">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </td>
                      <td className="py-2 px-3">{player.name}</td>
                      <td className="text-center py-2 px-3 font-bold">{player.points || 0}</td>
                      <td className="text-center py-2 px-3">{player.gamesWon || 0}</td>
                      <td className="text-center py-2 px-3">{player.gamesPlayed || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>{t('table.hiddenByDirector')}</p>
            </div>
          )}
        </div>
      )}

      {/* Modal für Spielplan-Optionen */}
      {showScheduleOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{t('schedule.chooseSchedule')}</h2>
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
              {t('schedule.scheduleVariants') || 'Wählen Sie eine der generierten Spielplan-Varianten aus:'}
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
                      <h3 className="text-lg font-semibold mb-2">{t('schedule.variant')} {index + 1}</h3>
                      
                      {/* Gesamt-Fairness */}
                      <div className={`text-center p-4 rounded-lg mb-4 ${getFairnessColor(option.fairness.overallScore)}`}>
                        <div className="text-3xl font-bold">
                          {option.fairness.overallScore}%
                        </div>
                        <div className="text-sm font-medium">{t('schedule.overallFairness')}</div>
                      </div>
                      
                      {/* Detail-Metriken */}
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{t('schedule.partnerVariety')}:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{option.fairness.avgUniquePartners}</span>
                            <div className={`text-xs px-2 py-1 rounded ${getFairnessColor(option.fairness.partnerScore)}`}>
                              {option.fairness.partnerScore}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{t('schedule.opponentVariety')}:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{option.fairness.avgUniqueOpponents}</span>
                            <div className={`text-xs px-2 py-1 rounded ${getFairnessColor(option.fairness.opponentScore)}`}>
                              {option.fairness.opponentScore}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{t('schedule.maxPartnerRepeat')}:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{option.fairness.maxPartnerRepeats}x</span>
                            <div className={`text-xs px-2 py-1 rounded ${getFairnessColor(option.fairness.repeatScore)}`}>
                              {option.fairness.repeatScore}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{t('schedule.gameBalance')}:</span>
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
                        <p className="text-xs text-gray-600 mb-2">{t('schedule.firstRounds')}:</p>
                        {option.schedule.slice(0, 2).map((round, rIdx) => (
                          <div key={rIdx} className="mb-2">
                            <p className="text-xs font-semibold">{t('schedule.round')} {round.round}:</p>
                            {round.matches.slice(0, 2).map((match, mIdx) => (
                              <p key={mIdx} className="text-xs text-gray-600 ml-2">
                                {t('schedule.court')} {match.court}: 
                                {match.team1 && match.team2 && match.team1[0] && match.team1[1] && match.team2[0] && match.team2[1] ? (
                                  ` ${match.team1[0].name.split(' ')[0]} & ${match.team1[1].name.split(' ')[0]} vs ${match.team2[0].name.split(' ')[0]} & ${match.team2[1].name.split(' ')[0]}`
                                ) : (
                                  ' ' + t('schedule.matchError')
                                )}
                              </p>
                            ))}
                            {round.matches.length > 2 && (
                              <p className="text-xs text-gray-400 ml-2">
                                + {round.matches.length - 2} {t('schedule.moreMatches')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <button
                      className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                    >
                      {t('schedule.selectVariant')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Erklärung */}
            <div className="mt-6 p-4 bg-gray-50 rounded text-sm">
              <p className="font-semibold mb-2">{t('schedule.fairnessRating')}:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-semibold">80-100%</span>
                  <span>{t('schedule.excellent')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-semibold">60-79%</span>
                  <span>{t('schedule.good')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded font-semibold">40-59%</span>
                  <span>{t('schedule.acceptable')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-semibold">0-39%</span>
                  <span>{t('schedule.needsImprovement')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}