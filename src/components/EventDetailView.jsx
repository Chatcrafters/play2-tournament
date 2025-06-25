import { EventShare } from './EventShare'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { generateAmericanoSchedule } from '../utils/americanoAlgorithm'

console.log('EventDetailView loaded - Version 1.0');

// Komplette EventDetailView mit Fairness-Anzeige, Inline-Ergebniseingabe und Tabellen-Optionen
export function EventDetailView({ 
  selectedEvent, 
  onUpdateEvent, 
  onBack,
  savedPlayers,
  onOpenPlayerDatabase
}) {
  // State Management
  const [localEvent, setLocalEvent] = useState(() => {
    if (!selectedEvent) return null
    return {
      ...selectedEvent,
      players: selectedEvent.players || [],
      schedule: selectedEvent.schedule || [],
      results: selectedEvent.results || {},
      currentRound: selectedEvent.currentRound || 0,
      timerState: selectedEvent.timerState || 'stopped',
      name: selectedEvent.name || 'Unbenanntes Event',
      sport: selectedEvent.sport || 'padel',
      eventType: selectedEvent.eventType || 'americano',
      format: selectedEvent.format || 'doubles',
      courts: selectedEvent.courts || 2,
      roundDuration: selectedEvent.roundDuration || 15,
      startTime: selectedEvent.startTime || '09:00',
      endTime: selectedEvent.endTime || '13:00',
      regenerateCount: selectedEvent.regenerateCount || 0,
      showRealTimeTable: selectedEvent.showRealTimeTable !== false // Default: true
    }
  })
  
  const [schedule, setSchedule] = useState([])
  const [scheduleStats, setScheduleStats] = useState(null) // NEU: Fairness-Statistiken
  const [currentRound, setCurrentRound] = useState(0)
  const [matchResults, setMatchResults] = useState({})
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [newPlayer, setNewPlayer] = useState({ name: '', gender: 'male', skillLevel: 'B' })
  const [scores, setScores] = useState({})
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showPlayerDatabase, setShowPlayerDatabase] = useState(false)
  const [showTableSettings, setShowTableSettings] = useState(false) // NEU: Tabellen-Einstellungen

  // Initialize from selectedEvent
  useEffect(() => {
    if (selectedEvent) {
      const safeEvent = {
        ...selectedEvent,
        players: Array.isArray(selectedEvent.players) ? selectedEvent.players : [],
        schedule: Array.isArray(selectedEvent.schedule) ? selectedEvent.schedule : [],
        results: selectedEvent.results || {},
        currentRound: selectedEvent.currentRound || 0,
        timerState: selectedEvent.timerState || 'stopped',
        showRealTimeTable: selectedEvent.showRealTimeTable !== false
      }
      
      setLocalEvent(safeEvent)
      setSchedule(safeEvent.schedule)
      setMatchResults(safeEvent.results)
      setCurrentRound(safeEvent.currentRound || 0)
    }
  }, [selectedEvent])

  // Safety check
  if (!localEvent) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <button onClick={onBack} className="mb-4 text-blue-600 hover:text-blue-800">
          ← Zurück zur Übersicht
        </button>
        <p>Event konnte nicht geladen werden.</p>
      </div>
    )
  }

  // Helper Functions
  const handleUpdateEvent = (updates) => {
    const updatedEvent = { 
      ...localEvent, 
      ...updates,
      players: Array.isArray(updates.players) ? updates.players : (localEvent.players || []),
      schedule: Array.isArray(updates.schedule) ? updates.schedule : (localEvent.schedule || [])
    }
    setLocalEvent(updatedEvent)
    onUpdateEvent(updatedEvent)
  }

  const handleAddPlayer = () => {
    if (!newPlayer.name.trim()) return
    
    const player = {
      ...newPlayer,
      id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      skillLevel: newPlayer.skillLevel || 'B'
    }
    
    const updatedPlayers = [...(localEvent.players || []), player]
    handleUpdateEvent({ players: updatedPlayers })
    setNewPlayer({ name: '', gender: 'male', skillLevel: 'B' })
    setShowAddPlayer(false)
  }

  const handleRemovePlayer = (playerId) => {
    const updatedPlayers = localEvent.players.filter(p => p.id !== playerId)
    handleUpdateEvent({ players: updatedPlayers })
  }

  // Erweiterte Spielplan-Generierung mit Fairness-Statistiken
  const generateSchedule = () => {
    const playerCount = localEvent.players?.length || 0
    
    if (playerCount < 4) {
      alert('Mindestens 4 Spieler erforderlich für einen Spielplan')
      return
    }

    // Calculate total rounds based on available time
    const [startHours, startMins] = localEvent.startTime.split(':').map(Number)
    const [endHours, endMins] = localEvent.endTime.split(':').map(Number)
    const totalMinutes = (endHours * 60 + endMins) - (startHours * 60 + startMins)
    const totalRounds = Math.floor(totalMinutes / localEvent.roundDuration)
    
    // Generiere Spielplan mit dem neuen Algorithmus
    const result = generateAmericanoSchedule(
      localEvent.players,
      localEvent.courts,
      totalRounds,
      {
        regenerateCount: localEvent.regenerateCount || 0,
        eventId: localEvent.id
      }
    )
    
    // Konvertiere zum erwarteten Format für EventDetailView
    const newSchedule = result.schedule.map((round, index) => {
      // Finde alle Spieler für diese Runde
      const playingPlayerIds = new Set()
      const matches = []
      
      round.matches.forEach(match => {
        match.players.forEach(playerId => playingPlayerIds.add(playerId))
        
        // Konvertiere zum erwarteten Format mit team1 und team2
        const playerObjects = match.players.map(id => 
          localEvent.players.find(p => p.id === id)
        ).filter(p => p) // Filter out undefined
        
        if (playerObjects.length === 4) {
          matches.push({
            court: match.court,
            team1: [playerObjects[0], playerObjects[1]],
            team2: [playerObjects[2], playerObjects[3]]
          })
        }
      })
      
      const waitingPlayers = localEvent.players.filter(p => 
        !playingPlayerIds.has(p.id)
      )
      
      const startMinutes = index * localEvent.roundDuration
      
      return {
        round: round.round,
        startTime: startMinutes,
        matches,
        waitingPlayers
      }
    })
    
    // Berechne Fairness-Statistiken basierend auf dem Ergebnis
    const stats = {
      playerStats: localEvent.players.map((player, idx) => {
        const games = result.statistics.gamesPlayed[idx] || 0
        const partnerCount = Object.values(result.statistics.partnerMatrix[idx] || {}).filter(v => v > 0).length
        const opponentCount = Object.values(result.statistics.opponentMatrix[idx] || {}).filter(v => v > 0).length
        const maxPartners = localEvent.players.length - 1
        const fairness = maxPartners > 0 ? Math.round((partnerCount / maxPartners) * 100) : 100
        
        return {
          name: player.name,
          games,
          uniquePartners: partnerCount,
          uniqueOpponents: opponentCount,
          fairness
        }
      }),
      summary: {
        avgFairness: 0,
        avgUniquePartners: 0,
        avgUniqueOpponents: 0,
        maxPartnerRepeats: 0
      }
    }
    
    // Berechne Zusammenfassung
    if (stats.playerStats.length > 0) {
      stats.summary.avgFairness = Math.round(
        stats.playerStats.reduce((sum, p) => sum + p.fairness, 0) / stats.playerStats.length
      )
      stats.summary.avgUniquePartners = Math.round(
        stats.playerStats.reduce((sum, p) => sum + p.uniquePartners, 0) / stats.playerStats.length
      )
      stats.summary.avgUniqueOpponents = Math.round(
        stats.playerStats.reduce((sum, p) => sum + p.uniqueOpponents, 0) / stats.playerStats.length
      )
      
      // Max Partner-Wiederholungen
      const maxRepeats = Math.max(...Object.values(result.statistics.partnerMatrix).map(row => 
        Math.max(...Object.values(row))
      ))
      stats.summary.maxPartnerRepeats = maxRepeats
    }
    
    setScheduleStats(stats)
    setSchedule(newSchedule)
    handleUpdateEvent({ 
      schedule: newSchedule,
      regenerateCount: (localEvent.regenerateCount || 0) + 1
    })
  }

  // Score handling mit inline Eingabe
  const handleInlineScoreChange = (roundIdx, matchIdx, team, value) => {
    const matchKey = `${roundIdx}-${matchIdx}`
    setScores(prev => ({
      ...prev,
      [matchKey]: {
        ...prev[matchKey],
        [`team${team}Score`]: parseInt(value) || 0
      }
    }))
  }

  const handleInlineScoreSubmit = (roundIdx, matchIdx) => {
  const matchKey = `${roundIdx}-${matchIdx}`
  const score = scores[matchKey]
  const match = schedule[roundIdx].matches[matchIdx]
  
  if (!score || score.team1Score === undefined || score.team2Score === undefined) {
    alert('Bitte beide Ergebnisse eingeben')
    return
  }
  
  const team1Points = score.team1Score > score.team2Score ? 2 : score.team1Score < score.team2Score ? 0 : 1
  const team2Points = score.team1Score < score.team2Score ? 2 : score.team1Score > score.team2Score ? 0 : 1
  
  const result = {
    ...match,
    result: {
      team1Score: score.team1Score,
      team2Score: score.team2Score,
      team1Points,
      team2Points
    }
  }
  
  const updatedResults = { ...matchResults, [matchKey]: result }
  setMatchResults(updatedResults)
  
  // WICHTIG: Hier müssen wir das komplette Event updaten, nicht nur results
  const updatedEvent = {
    ...localEvent,
    results: updatedResults
  }
  
  // Update both local state and database
  console.log('Saving results to DB:', updatedResults);
  console.log('Updated event:', updatedEvent);
  setLocalEvent(updatedEvent)
  onUpdateEvent(updatedEvent)
  
  // Clear the score input
  setScores(prev => {
    const newScores = { ...prev }
    delete newScores[matchKey]
    return newScores
  })
  
  // Kurzes visuelles Feedback
  const element = document.getElementById(`match-${matchKey}`)
  if (element) {
    element.classList.add('bg-green-50')
    setTimeout(() => element.classList.remove('bg-green-50'), 1000)
  }
}

 // Calculate standings with fairness from schedule generation
const calculateStandings = () => {
  const playerStats = {}
  
  // Initialize
  localEvent.players.forEach(player => {
    playerStats[player.id] = {
      ...player,
      points: 0,
      gamesWon: 0,
      gamesPlayed: 0,
      partners: new Set(),
      opponents: new Set()
    }
  })
  
  // Process schedule first to get partner/opponent data
  schedule.forEach(round => {
    round.matches?.forEach(match => {
      if (match.team1 && match.team2) {
        // Track partners
        if (match.team1[0] && match.team1[1]) {
          playerStats[match.team1[0].id]?.partners.add(match.team1[1].id)
          playerStats[match.team1[1].id]?.partners.add(match.team1[0].id)
        }
        if (match.team2[0] && match.team2[1]) {
          playerStats[match.team2[0].id]?.partners.add(match.team2[1].id)
          playerStats[match.team2[1].id]?.partners.add(match.team2[0].id)
        }
        
        // Track opponents
        match.team1?.forEach(p1 => {
          match.team2?.forEach(p2 => {
            if (playerStats[p1.id] && playerStats[p2.id]) {
              playerStats[p1.id].opponents.add(p2.id)
              playerStats[p2.id].opponents.add(p1.id)
            }
          })
        })
      }
    })
  })
  
  // Process all results
  Object.entries(matchResults).forEach(([matchKey, matchData]) => {
    if (!matchData.result) return
    
    const { team1, team2, result } = matchData
    
    // Update team 1
    team1?.forEach(player => {
      if (!player?.id || !playerStats[player.id]) {
        console.warn('Missing player in team1:', player)
        return
      }
      
      playerStats[player.id].gamesPlayed++
      playerStats[player.id].gamesWon += result.team1Score || 0
      playerStats[player.id].points += result.team1Points || 0
    })
    
    // Update team 2
    team2?.forEach(player => {
      if (!player?.id || !playerStats[player.id]) {
        console.warn('Missing player in team2:', player)
        return
      }
      
      playerStats[player.id].gamesPlayed++
      playerStats[player.id].gamesWon += result.team2Score || 0
      playerStats[player.id].points += result.team2Points || 0
    })
  })
  
  // Verwende Fairness-Score aus der Spielplan-Generierung wenn verfügbar
  const standings = Object.values(playerStats).map(player => {
    const scheduleFairness = scheduleStats?.playerStats?.find(p => p.name === player.name)?.fairness
    
    // Berechne Fairness basierend auf verschiedenen Partnern/Gegnern
    const maxPossiblePartners = Math.max(1, localEvent.players.length - 1)
    const actualPartners = player.partners.size
    const actualOpponents = player.opponents.size
    
    let fairnessScore = 0
    if (maxPossiblePartners > 0) {
      const partnerRatio = actualPartners / maxPossiblePartners
      const opponentRatio = actualOpponents / maxPossiblePartners
      fairnessScore = Math.round(((partnerRatio + opponentRatio) / 2) * 100)
    }
    
    return {
      ...player,
      uniquePartners: actualPartners,
      uniqueOpponents: actualOpponents,
      fairnessScore: scheduleFairness || fairnessScore
    }
  })
  
  // Sort by points, then games won
  return standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    return b.gamesWon - a.gamesWon
  })
}

  const formatTime = (minutes) => {
    const [startHours, startMins] = localEvent.startTime.split(':').map(Number)
    const totalMins = startHours * 60 + startMins + minutes
    const hours = Math.floor(totalMins / 60)
    const mins = totalMins % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  // Kann noch weitere Male regeneriert werden?
  const canRegenerate = () => {
    return (localEvent.regenerateCount || 0) < 3 // Initial + 2 weitere = max 3
  }

  // Main Render
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
<div className="mb-6">
  <button
    onClick={onBack}
    className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
  >
    ← Zurück zur Übersicht
  </button>
  
  <div className="flex justify-between items-start">
    <div>
      <h2 className="text-3xl font-bold mb-2">{localEvent.name}</h2>
      <p className="text-gray-600">
        {localEvent.sport} • {localEvent.eventType} • {localEvent.format}
      </p>
      <p className="text-sm text-gray-500 mt-1">
        {localEvent.date ? new Date(localEvent.date).toLocaleDateString('de-DE') : 'Kein Datum'} • 
        {localEvent.location || 'Kein Ort angegeben'}
      </p>
    </div>
    
    {/* NEU: Event Share Button */}
    <div>
      <EventShare event={localEvent} />
    </div>
  </div>
</div>

      {/* Player Management */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Spieler ({localEvent.players?.length || 0})</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddPlayer(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Spieler hinzufügen
            </button>
            <button
              onClick={() => {
                if (onOpenPlayerDatabase) {
                  onOpenPlayerDatabase();
                } else {
                  setShowPlayerDatabase(true);
                }
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              📚 Aus Datenbank
            </button>
          </div>
        </div>
        
        {showAddPlayer && (
          <div className="mb-4 p-4 bg-gray-50 rounded">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Name"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                className="px-3 py-2 border rounded"
              />
              <select
                value={newPlayer.gender}
                onChange={(e) => setNewPlayer({...newPlayer, gender: e.target.value})}
                className="px-3 py-2 border rounded"
              >
                <option value="male">Männlich</option>
                <option value="female">Weiblich</option>
              </select>
              <select
                value={newPlayer.skillLevel}
                onChange={(e) => setNewPlayer({...newPlayer, skillLevel: e.target.value})}
                className="px-3 py-2 border rounded"
              >
                <option value="C">C</option>
                <option value="B-">B-</option>
                <option value="B">B</option>
                <option value="B+">B+</option>
                <option value="A-">A-</option>
                <option value="A">A</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleAddPlayer}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Hinzufügen
                </button>
                <button
                  onClick={() => setShowAddPlayer(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          {localEvent.players?.map(player => (
            <div key={player.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="font-medium">{player.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {player.gender === 'female' ? '♀' : '♂'} • {player.skillLevel || 'B'}
                </span>
                <button
                  onClick={() => handleRemovePlayer(player.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {localEvent.players?.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            Noch keine Spieler hinzugefügt
          </p>
        )}
      </div>

      {/* Schedule Generation */}
      {(!schedule || schedule.length === 0) && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
          <p className="text-gray-600 mb-4">
            {localEvent.players?.length || 0} von {localEvent.maxPlayers || 16} Spielern angemeldet
          </p>
          <button
            onClick={generateSchedule}
            disabled={(localEvent.players?.length || 0) < 4}
            className={`px-6 py-3 rounded-lg font-medium ${
              (localEvent.players?.length || 0) >= 4
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Spielplan generieren
          </button>
          {(localEvent.players?.length || 0) < 4 && (
            <p className="text-sm text-gray-500 mt-2">
              Mindestens 4 Spieler erforderlich
            </p>
          )}
        </div>
      )}

      {/* Main Content - Schedule with inline scores */}
      {schedule && schedule.length > 0 && (
        <>
          {/* Header mit Regenerate Button und Stats */}
          <div className="mb-4 bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{schedule.length}</span> Runden • 
                <span className="font-medium"> {localEvent.players?.length || 0}</span> Spieler • 
                <span className="font-medium"> {localEvent.courts || 1}</span> Plätze
              </div>
              
              <div className="flex items-center gap-3">
                {/* Tabellen-Einstellungen */}
                <button
                  onClick={() => setShowTableSettings(!showTableSettings)}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  ⚙️ Tabellen-Einstellungen
                </button>
                
                {/* Regenerate Button mit Counter */}
                {canRegenerate() && (
                  <button
                    onClick={() => {
                      setSchedule([])
                      setMatchResults({})
                      setCurrentRound(0)
                      setScheduleStats(null)
                      handleUpdateEvent({ 
                        schedule: [], 
                        results: {},
                        currentRound: 0
                      })
                      setTimeout(generateSchedule, 100)
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                  >
                    🔄 Neu generieren ({localEvent.regenerateCount || 0}/2)
                  </button>
                )}
              </div>
            </div>
            
            {/* Tabellen-Einstellungen Dropdown */}
            {showTableSettings && (
              <div className="mt-3 p-3 bg-gray-50 rounded">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localEvent.showRealTimeTable}
                    onChange={(e) => handleUpdateEvent({ showRealTimeTable: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Real-Time Tabelle anzeigen (Tabelle wird nach jeder Ergebniseingabe aktualisiert)</span>
                </label>
                {!localEvent.showRealTimeTable && (
                  <p className="text-xs text-gray-600 mt-1 ml-6">
                    Die Tabelle wird erst angezeigt, wenn alle Ergebnisse eingegeben wurden.
                  </p>
                )}
              </div>
            )}
            
            {/* Fairness-Statistiken anzeigen */}
            {scheduleStats && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-700">
                    {scheduleStats.summary?.avgFairness || 0}%
                  </div>
                  <div className="text-xs text-gray-600">Durchschn. Fairness</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-700">
                    {scheduleStats.summary?.avgUniquePartners || 0}
                  </div>
                  <div className="text-xs text-gray-600">Ø Verschiedene Partner</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded">
                  <div className="text-2xl font-bold text-purple-700">
                    {scheduleStats.summary?.avgUniqueOpponents || 0}
                  </div>
                  <div className="text-xs text-gray-600">Ø Verschiedene Gegner</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded">
                  <div className="text-2xl font-bold text-orange-700">
                    {scheduleStats.summary?.maxPartnerRepeats || 0}x
                  </div>
                  <div className="text-xs text-gray-600">Max. Partner-Wiederholung</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Spielplan mit inline Ergebniseingabe */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Spielplan & Ergebnisse</h3>
            <div className="space-y-6">
              {schedule.map((round, roundIndex) => (
                <div key={roundIndex} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-lg">Runde {round.round}</h4>
                    <span className="text-sm font-medium text-gray-600">
                      {formatTime(round.startTime)}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {round.matches?.map((match, matchIndex) => {
                      const matchKey = `${roundIndex}-${matchIndex}`
                      const result = matchResults[matchKey]
                      const score = scores[matchKey] || {}
                      
                      return (
                        <div 
                          key={matchIndex} 
                          id={`match-${matchKey}`}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-600 w-16">
                            Platz {match.court}
                          </span>
                          
                          <div className="flex-1 flex items-center justify-center gap-4">
                            <div className="text-right flex-1">
                              <span className="font-medium">
                                {match.team1?.map(p => p.name).join(' & ')}
                              </span>
                            </div>
                            
                            {/* Inline Score Entry oder Ergebnis-Anzeige */}
                            <div className="flex items-center gap-2">
                              {result?.result ? (
                                // Ergebnis bereits eingetragen
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-lg">{result.result.team1Score}</span>
                                  <span className="text-gray-500">-</span>
                                  <span className="font-bold text-lg">{result.result.team2Score}</span>
                                  <button
                                    onClick={() => {
                                      // Ergebnis löschen
                                      const newResults = { ...matchResults }
                                      delete newResults[matchKey]
                                      setMatchResults(newResults)
                                      handleUpdateEvent({ results: newResults })
                                    }}
                                    className="ml-2 text-xs text-red-600 hover:text-red-800"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                // Ergebnis-Eingabe
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max="99"
                                    value={score.team1Score || ''}
                                    onChange={(e) => handleInlineScoreChange(roundIndex, matchIndex, 1, e.target.value)}
                                    className="w-12 text-center border rounded px-1 py-1 text-sm"
                                    placeholder="0"
                                  />
                                  <span className="text-gray-500">-</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="99"
                                    value={score.team2Score || ''}
                                    onChange={(e) => handleInlineScoreChange(roundIndex, matchIndex, 2, e.target.value)}
                                    className="w-12 text-center border rounded px-1 py-1 text-sm"
                                    placeholder="0"
                                  />
                                  <button
                                    onClick={() => handleInlineScoreSubmit(roundIndex, matchIndex)}
                                    disabled={score.team1Score === undefined || score.team2Score === undefined}
                                    className="ml-2 text-green-600 hover:text-green-800 disabled:text-gray-400"
                                  >
                                    ✓
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-left flex-1">
                              <span className="font-medium">
                                {match.team2?.map(p => p.name).join(' & ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {round.waitingPlayers?.length > 0 && (
                      <div className="p-3 bg-yellow-50 rounded">
                        <span className="font-medium text-sm">Pausiert: </span>
                        <span className="text-sm">
                          {round.waitingPlayers.map(p => p.name).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Tabelle - je nach Einstellung */}
          {(localEvent.showRealTimeTable || Object.keys(matchResults).length === schedule.reduce((sum, round) => sum + round.matches.length, 0)) && (
            <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">
                {localEvent.showRealTimeTable ? 'Live-Turnierstand' : 'Endstand'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-2">Rang</th>
                      <th className="text-left py-3 px-2">Spieler</th>
                      <th className="text-center py-3 px-2">Punkte</th>
                      <th className="text-center py-3 px-2">Gewonnene Spiele</th>
                      <th className="text-center py-3 px-2">Matches</th>
                      <th className="text-center py-3 px-2">Partner</th>
                      <th className="text-center py-3 px-2">Gegner</th>
                      <th className="text-center py-3 px-2">Fairness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculateStandings().map((player, idx) => (
                      <tr key={player.id} className={`border-b ${
                        idx === 0 ? 'bg-yellow-50' : 
                        idx === 1 ? 'bg-gray-100' : 
                        idx === 2 ? 'bg-orange-50' : ''
                      }`}>
                        <td className="py-3 px-2 font-semibold">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </td>
                        <td className="py-3 px-2 font-medium">{player.name}</td>
                        <td className="text-center py-3 px-2 font-bold text-lg">{player.points}</td>
                        <td className="text-center py-3 px-2">{player.gamesWon}</td>
                        <td className="text-center py-3 px-2">{player.gamesPlayed}</td>
                        <td className="text-center py-3 px-2">{player.uniquePartners}</td>
                        <td className="text-center py-3 px-2">{player.uniqueOpponents}</td>
                        <td className="text-center py-3 px-2">
                          <div className={`text-sm font-semibold px-2 py-1 rounded inline-block ${
                            player.fairnessScore >= 80 ? 'bg-green-100 text-green-800' :
                            player.fairnessScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            player.fairnessScore >= 40 ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {player.fairnessScore}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Nur bei Endstand: Fairness-Legende */}
              {!localEvent.showRealTimeTable && (
                <div className="mt-4 p-4 bg-gray-50 rounded text-sm">
                  <p className="font-semibold mb-2">Fairness-Score Erklärung:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">80-100%</span>
                      <span className="text-xs">Sehr gut durchmischt</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">60-79%</span>
                      <span className="text-xs">Gut durchmischt</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold">40-59%</span>
                      <span className="text-xs">Mittelmäßig</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">0-39%</span>
                      <span className="text-xs">Wenig Variation</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Player Database Modal - Nur als Fallback für Demo */}
      {showPlayerDatabase && !onOpenPlayerDatabase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Spieler aus Datenbank wählen</h2>
              <button
                onClick={() => setShowPlayerDatabase(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            {/* Mock Spieler-Datenbank */}
            <div className="flex-1 overflow-y-auto">
              <p className="text-gray-600 mb-4">
                Demo-Spieler für {localEvent.sport}:
              </p>
              
              <div className="space-y-2">
                {/* Demo-Spieler je nach Sportart */}
                {localEvent.sport === 'padel' && [
                  { id: 'demo1', name: 'Carlos Rodriguez', gender: 'male', skillLevel: 'A-' },
                  { id: 'demo2', name: 'Maria Gonzalez', gender: 'female', skillLevel: 'B+' },
                  { id: 'demo3', name: 'Juan Martinez', gender: 'male', skillLevel: 'B' },
                  { id: 'demo4', name: 'Ana Silva', gender: 'female', skillLevel: 'B-' },
                  { id: 'demo5', name: 'Pedro Sanchez', gender: 'male', skillLevel: 'C' },
                  { id: 'demo6', name: 'Laura Fernandez', gender: 'female', skillLevel: 'B' }
                ].map(player => (
                  <div key={player.id} className="p-3 bg-gray-50 rounded flex justify-between items-center">
                    <div>
                      <span className="font-medium">{player.name}</span>
                      <span className="ml-3 text-sm text-gray-600">
                        {player.gender === 'female' ? '♀' : '♂'} • {player.skillLevel}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        // Prüfe ob Spieler bereits angemeldet
                        const exists = localEvent.players.some(p => 
                          p.name.toLowerCase() === player.name.toLowerCase()
                        )
                        
                        if (exists) {
                          alert(`${player.name} ist bereits angemeldet!`)
                          return
                        }
                        
                        // Füge Spieler hinzu
                        const newPlayer = {
                          ...player,
                          id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                        }
                        
                        handleUpdateEvent({ 
                          players: [...localEvent.players, newPlayer] 
                        })
                        setShowPlayerDatabase(false)
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Hinzufügen
                    </button>
                  </div>
                ))}
                
                {localEvent.sport === 'pickleball' && [
                  { id: 'demo7', name: 'John Smith', gender: 'male', skillLevel: '4.0' },
                  { id: 'demo8', name: 'Sarah Johnson', gender: 'female', skillLevel: '3.5' },
                  { id: 'demo9', name: 'Mike Davis', gender: 'male', skillLevel: '3.0' },
                  { id: 'demo10', name: 'Emma Wilson', gender: 'female', skillLevel: '4.5' }
                ].map(player => (
                  <div key={player.id} className="p-3 bg-gray-50 rounded flex justify-between items-center">
                    <div>
                      <span className="font-medium">{player.name}</span>
                      <span className="ml-3 text-sm text-gray-600">
                        {player.gender === 'female' ? '♀' : '♂'} • Level {player.skillLevel}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const exists = localEvent.players.some(p => 
                          p.name.toLowerCase() === player.name.toLowerCase()
                        )
                        
                        if (exists) {
                          alert(`${player.name} ist bereits angemeldet!`)
                          return
                        }
                        
                        const newPlayer = {
                          ...player,
                          id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                        }
                        
                        handleUpdateEvent({ 
                          players: [...localEvent.players, newPlayer] 
                        })
                        setShowPlayerDatabase(false)
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Hinzufügen
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Info-Box */}
              <div className="mt-6 p-4 bg-blue-50 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Hinweis:</strong> Dies ist eine Demo-Spielerliste. 
                  In der vollständigen App können Sie Ihre eigene Spieler-Datenbank 
                  verwalten, Spieler importieren und exportieren.
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setShowPlayerDatabase(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}