import React, { useState, useEffect, useRef, useCallback } from 'react'

// Standalone EventDetailView Component - Komplett in sich geschlossen
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
      regenerateCount: selectedEvent.regenerateCount || 0
    }
  })
  
  const [schedule, setSchedule] = useState([])
  const [currentRound, setCurrentRound] = useState(0)
  const [matchResults, setMatchResults] = useState({})
  const [activeView, setActiveView] = useState('schedule')
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [newPlayer, setNewPlayer] = useState({ name: '', gender: 'male', skillLevel: 'B' })
  const [scores, setScores] = useState({})
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showPlayerDatabase, setShowPlayerDatabase] = useState(false)

  // Initialize from selectedEvent
  useEffect(() => {
    if (selectedEvent) {
      const safeEvent = {
        ...selectedEvent,
        players: Array.isArray(selectedEvent.players) ? selectedEvent.players : [],
        schedule: Array.isArray(selectedEvent.schedule) ? selectedEvent.schedule : [],
        results: selectedEvent.results || {},
        currentRound: selectedEvent.currentRound || 0,
        timerState: selectedEvent.timerState || 'stopped'
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

  // Americano Schedule Generation
  const generateAmericanoSchedule = (players, courts, rounds) => {
    const schedule = []
    const playerCount = players.length
    const playersPerMatch = 4
    const matchesPerRound = Math.min(Math.floor(playerCount / playersPerMatch), courts)
    
    // Tracking
    const partnerCount = {}
    const opponentCount = {}
    const gamesPlayed = {}
    const lastPlayed = {}
    
    // Initialize tracking
    players.forEach(p => {
      gamesPlayed[p.id] = 0
      lastPlayed[p.id] = -10
      partnerCount[p.id] = {}
      opponentCount[p.id] = {}
      players.forEach(p2 => {
        if (p.id !== p2.id) {
          partnerCount[p.id][p2.id] = 0
          opponentCount[p.id][p2.id] = 0
        }
      })
    })
    
    // Generate rounds
    for (let round = 0; round < rounds; round++) {
      const roundMatches = []
      const usedPlayers = new Set()
      
      // Sort players by games played (ascending)
      const availablePlayers = [...players].sort((a, b) => {
        const diff = gamesPlayed[a.id] - gamesPlayed[b.id]
        if (diff !== 0) return diff
        return (round - lastPlayed[b.id]) - (round - lastPlayed[a.id])
      })
      
      // Create matches for this round
      for (let court = 1; court <= matchesPerRound && availablePlayers.filter(p => !usedPlayers.has(p.id)).length >= 4; court++) {
        // Get 4 players with least games
        const matchPlayers = []
        for (const player of availablePlayers) {
          if (!usedPlayers.has(player.id) && matchPlayers.length < 4) {
            matchPlayers.push(player)
            usedPlayers.add(player.id)
          }
        }
        
        if (matchPlayers.length === 4) {
          // Find best pairing
          let bestPairing = null
          let bestScore = Infinity
          
          const pairings = [
            [[0, 1], [2, 3]],
            [[0, 2], [1, 3]],
            [[0, 3], [1, 2]]
          ]
          
          for (const [[a, b], [c, d]] of pairings) {
            const p1 = matchPlayers[a]
            const p2 = matchPlayers[b]
            const p3 = matchPlayers[c]
            const p4 = matchPlayers[d]
            
            // Calculate score (lower is better)
            let score = 0
            score += partnerCount[p1.id][p2.id] * 100
            score += partnerCount[p3.id][p4.id] * 100
            score += opponentCount[p1.id][p3.id] * 10
            score += opponentCount[p1.id][p4.id] * 10
            score += opponentCount[p2.id][p3.id] * 10
            score += opponentCount[p2.id][p4.id] * 10
            
            if (score < bestScore) {
              bestScore = score
              bestPairing = {
                team1: [p1, p2],
                team2: [p3, p4]
              }
            }
          }
          
          if (bestPairing) {
            roundMatches.push({
              court,
              team1: bestPairing.team1,
              team2: bestPairing.team2
            })
            
            // Update tracking
            const { team1, team2 } = bestPairing
            partnerCount[team1[0].id][team1[1].id]++
            partnerCount[team1[1].id][team1[0].id]++
            partnerCount[team2[0].id][team2[1].id]++
            partnerCount[team2[1].id][team2[0].id]++
            
            team1.forEach(p1 => {
              team2.forEach(p2 => {
                opponentCount[p1.id][p2.id]++
                opponentCount[p2.id][p1.id]++
              })
              gamesPlayed[p1.id]++
              lastPlayed[p1.id] = round
            })
            
            team2.forEach(p => {
              gamesPlayed[p.id]++
              lastPlayed[p.id] = round
            })
          }
        }
      }
      
      // Waiting players
      const waitingPlayers = players.filter(p => !usedPlayers.has(p.id))
      
      schedule.push({
        round: round + 1,
        matches: roundMatches,
        waitingPlayers,
        startTime: round * localEvent.roundDuration || 0
      })
    }
    
    return schedule
  }

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
    
    const newSchedule = generateAmericanoSchedule(
      localEvent.players,
      localEvent.courts,
      totalRounds
    )
    
    setSchedule(newSchedule)
    handleUpdateEvent({ 
      schedule: newSchedule,
      regenerateCount: (localEvent.regenerateCount || 0) + 1
    })
  }

  // Score handling
  const handleScoreChange = (matchIdx, team, value) => {
    const matchKey = `${currentRound}-${matchIdx}`
    setScores(prev => ({
      ...prev,
      [matchKey]: {
        ...prev[matchKey],
        [`team${team}Score`]: parseInt(value) || 0
      }
    }))
  }

  const handleSubmitScores = () => {
    const roundData = schedule[currentRound]
    if (!roundData) return
    
    const results = {}
    
    roundData.matches.forEach((match, idx) => {
      const matchKey = `${currentRound}-${idx}`
      const score = scores[matchKey]
      
      if (score && (score.team1Score !== undefined && score.team2Score !== undefined)) {
        const team1Points = score.team1Score > score.team2Score ? 2 : score.team1Score < score.team2Score ? 0 : 1
        const team2Points = score.team1Score < score.team2Score ? 2 : score.team1Score > score.team2Score ? 0 : 1
        
        results[matchKey] = {
          ...match,
          result: {
            team1Score: score.team1Score,
            team2Score: score.team2Score,
            team1Points,
            team2Points
          }
        }
      }
    })
    
    const updatedResults = { ...matchResults, ...results }
    setMatchResults(updatedResults)
    handleUpdateEvent({ results: updatedResults })
    
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 3000)
  }

  const handleRoundChange = (newRound) => {
    if (newRound === currentRound) return
    
    // Speichere aktuelle Runden-Ergebnisse bevor zur nächsten Runde gewechselt wird
    const roundData = schedule[currentRound]
    if (roundData) {
      const hasUnsavedScores = roundData.matches.some((match, idx) => {
        const matchKey = `${currentRound}-${idx}`
        const score = scores[matchKey]
        return score && (score.team1Score !== undefined || score.team2Score !== undefined) && !matchResults[matchKey]
      })
      
      if (hasUnsavedScores) {
        if (!confirm('Es gibt ungespeicherte Ergebnisse in dieser Runde. Möchten Sie fortfahren ohne zu speichern?')) {
          return
        }
      }
    }
    
    setCurrentRound(newRound)
    handleUpdateEvent({ currentRound: newRound })
    
    // Initialize scores for new round
    const newRoundData = schedule[newRound]
    if (newRoundData) {
      const initialScores = {}
      newRoundData.matches.forEach((match, idx) => {
        const matchKey = `${newRound}-${idx}`
        if (matchResults[matchKey]) {
          initialScores[matchKey] = {
            team1Score: matchResults[matchKey].result?.team1Score || 0,
            team2Score: matchResults[matchKey].result?.team2Score || 0
          }
        }
      })
      setScores(initialScores)
    }
  }

  // Calculate standings
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
    
    // Process all results
    Object.entries(matchResults).forEach(([matchKey, matchData]) => {
      if (!matchData.result) return
      
      const { team1, team2, result } = matchData
      
      // Update team 1
      team1.forEach((player, i) => {
        // Skip if player no longer exists in the event
        if (!playerStats[player.id]) return
        
        playerStats[player.id].gamesPlayed++
        playerStats[player.id].gamesWon += result.team1Score || 0
        playerStats[player.id].points += result.team1Points || 0
        
        // Track partner
        const partnerId = team1[1-i]?.id
        if (partnerId && playerStats[partnerId]) {
          playerStats[player.id].partners.add(partnerId)
        }
        
        // Track opponents
        team2.forEach(opp => {
          if (opp?.id && playerStats[opp.id]) {
            playerStats[player.id].opponents.add(opp.id)
          }
        })
      })
      
      // Update team 2
      team2.forEach((player, i) => {
        // Skip if player no longer exists in the event
        if (!playerStats[player.id]) return
        
        playerStats[player.id].gamesPlayed++
        playerStats[player.id].gamesWon += result.team2Score || 0
        playerStats[player.id].points += result.team2Points || 0
        
        // Track partner
        const partnerId = team2[1-i]?.id
        if (partnerId && playerStats[partnerId]) {
          playerStats[player.id].partners.add(partnerId)
        }
        
        // Track opponents
        team1.forEach(opp => {
          if (opp?.id && playerStats[opp.id]) {
            playerStats[player.id].opponents.add(opp.id)
          }
        })
      })
    })
    
    // Convert to array and calculate fairness
    const standings = Object.values(playerStats).map(player => ({
      ...player,
      uniquePartners: player.partners.size,
      uniqueOpponents: player.opponents.size,
      fairnessScore: Math.round((player.partners.size + player.opponents.size) / Math.max(1, player.gamesPlayed * 3) * 100)
    }))
    
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

  // Components
  const NavigationTabs = () => (
    <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => setActiveView('schedule')}
        className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
          activeView === 'schedule' 
            ? 'bg-white text-blue-600 shadow-sm' 
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Spielplan
      </button>
      <button
        onClick={() => setActiveView('scores')}
        className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
          activeView === 'scores' 
            ? 'bg-white text-blue-600 shadow-sm' 
            : 'text-gray-600 hover:text-gray-800'
        }`}
        disabled={!schedule || schedule.length === 0}
      >
        Ergebnisse
      </button>
      <button
        onClick={() => setActiveView('standings')}
        className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
          activeView === 'standings' 
            ? 'bg-white text-blue-600 shadow-sm' 
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Tabelle
      </button>
    </div>
  )

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
                console.log('Aus Datenbank clicked');
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

      {/* Main Content with Tabs */}
      {schedule && schedule.length > 0 && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{schedule.length}</span> Runden • 
              <span className="font-medium"> {localEvent.players?.length || 0}</span> Spieler • 
              <span className="font-medium"> {localEvent.courts || 1}</span> Plätze
            </div>
            
            <button
              onClick={() => {
                setSchedule([])
                setMatchResults({})
                setCurrentRound(0)
                handleUpdateEvent({ 
                  schedule: [], 
                  results: {},
                  currentRound: 0
                })
                setTimeout(generateSchedule, 100)
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              🔄 Neu generieren
            </button>
          </div>
          
          <NavigationTabs />
          
          {/* Schedule View */}
          {activeView === 'schedule' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Spielplan</h3>
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
                      {round.matches?.map((match, matchIndex) => (
                        <div key={matchIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="text-sm font-medium text-gray-600">
                            Platz {match.court}
                          </span>
                          <div className="flex-1 mx-4 text-center">
                            <span className="font-medium">
                              {match.team1?.map(p => p.name).join(' & ')}
                            </span>
                            <span className="mx-3 text-gray-500">vs</span>
                            <span className="font-medium">
                              {match.team2?.map(p => p.name).join(' & ')}
                            </span>
                          </div>
                        </div>
                      ))}
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
          )}
          
          {/* Score Entry View */}
          {activeView === 'scores' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">
                Ergebnisse eintragen - Runde {currentRound + 1}
              </h3>
              
              {showSuccessMessage && (
                <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg">
                  Ergebnisse erfolgreich gespeichert!
                </div>
              )}
              
              {/* Round Navigation */}
              <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                <button
                  onClick={() => handleRoundChange(currentRound - 1)}
                  disabled={currentRound === 0}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    currentRound === 0 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  ← Vorherige Runde
                </button>
                
                <span className="font-semibold text-lg">
                  Runde {currentRound + 1} von {schedule.length}
                </span>
                
                <button
                  onClick={() => {
                    // Prüfe ob alle Ergebnisse eingetragen sind
                    const roundData = schedule[currentRound]
                    const allScoresEntered = roundData?.matches?.every((_, idx) => {
                      const matchKey = `${currentRound}-${idx}`
                      const score = scores[matchKey]
                      return score && score.team1Score !== undefined && score.team2Score !== undefined
                    })
                    
                    if (!allScoresEntered) {
                      alert('Bitte tragen Sie alle Ergebnisse ein bevor Sie zur nächsten Runde wechseln.')
                      return
                    }
                    
                    // Speichere Ergebnisse automatisch
                    handleSubmitScores()
                    
                    // Wechsle zur nächsten Runde nach kurzer Verzögerung
                    setTimeout(() => {
                      handleRoundChange(currentRound + 1)
                    }, 500)
                  }}
                  disabled={currentRound >= schedule.length - 1}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    currentRound >= schedule.length - 1 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Nächste Runde →
                </button>
              </div>
              
              {/* Match Scores */}
              <div className="space-y-4 mb-6">
                {schedule[currentRound]?.matches?.map((match, idx) => {
                  const matchKey = `${currentRound}-${idx}`
                  const score = scores[matchKey] || {}
                  
                  return (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="text-sm font-semibold text-gray-600 mb-2">
                        Platz {match.court}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 items-center">
                        <div className="text-right">
                          <div className="font-medium">
                            {match.team1.map(p => p.name).join(' & ')}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={score.team1Score || ''}
                            onChange={(e) => handleScoreChange(idx, 1, e.target.value)}
                            className="w-16 text-center border rounded px-2 py-1 text-lg font-bold"
                            placeholder="0"
                          />
                          <span className="text-gray-500">-</span>
                          <input
                            type="number"
                            min="0"
                            max="99"
                            value={score.team2Score || ''}
                            onChange={(e) => handleScoreChange(idx, 2, e.target.value)}
                            className="w-16 text-center border rounded px-2 py-1 text-lg font-bold"
                            placeholder="0"
                          />
                        </div>
                        
                        <div className="text-left">
                          <div className="font-medium">
                            {match.team2.map(p => p.name).join(' & ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <button
                onClick={handleSubmitScores}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Runden-Ergebnisse speichern
              </button>
              
              {/* Zeige gespeicherte Ergebnisse */}
              <div className="mt-6 p-4 bg-gray-50 rounded">
                <h4 className="font-semibold mb-2">Gespeicherte Ergebnisse:</h4>
                {schedule[currentRound]?.matches?.map((match, idx) => {
                  const matchKey = `${currentRound}-${idx}`
                  const savedResult = matchResults[matchKey]
                  
                  if (!savedResult?.result) return null
                  
                  return (
                    <div key={idx} className="text-sm mb-1">
                      <span className="font-medium">Platz {match.court}:</span> {savedResult.result.team1Score} - {savedResult.result.team2Score}
                      <span className="text-green-600 ml-2">✓ Gespeichert</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Standings View */}
          {activeView === 'standings' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">Turnierstand</h3>
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