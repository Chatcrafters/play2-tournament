import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Trophy, Users, Clock, ChevronRight, ChevronLeft, Check } from 'lucide-react'

export const AmericanoTournament = ({ 
  event, 
  onUpdateEvent,
  onBack 
}) => {
  // State Management
  const [currentRound, setCurrentRound] = useState(event.currentRound || 0)
  const [timerState, setTimerState] = useState(event.timerState || 'stopped')
  const [timeRemaining, setTimeRemaining] = useState(event.roundDuration * 60)
  const [matchResults, setMatchResults] = useState(event.results || {})
  const [showScoreInput, setShowScoreInput] = useState(null)
  const [scoreInput, setScoreInput] = useState({ team1: '', team2: '' })
  const [showStandings, setShowStandings] = useState(false) // NEU: Tabelle standardmäßig ausgeblendet
  
  const intervalRef = useRef(null)
  
  // Timer Logic
  useEffect(() => {
    if (timerState === 'running' && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setTimerState('stopped')
            // Play sound or notification
            playNotification()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    
    return () => clearInterval(intervalRef.current)
  }, [timerState, timeRemaining])
  
  // Play notification sound
  const playNotification = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1Wnk0')
    audio.play().catch(e => console.log('Audio play failed:', e))
  }
  
  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // Timer Controls
  const startTimer = () => {
    setTimerState('running')
  }
  
  const pauseTimer = () => {
    setTimerState('paused')
  }
  
  const resetTimer = () => {
    setTimerState('stopped')
    setTimeRemaining(event.roundDuration * 60)
  }
  
  const nextRound = () => {
    if (currentRound < event.schedule.length - 1) {
      setCurrentRound(currentRound + 1)
      resetTimer()
      onUpdateEvent({ ...event, currentRound: currentRound + 1 })
    }
  }
  
  const prevRound = () => {
    if (currentRound > 0) {
      setCurrentRound(currentRound - 1)
      resetTimer()
      onUpdateEvent({ ...event, currentRound: currentRound - 1 })
    }
  }
  
  // Score Input
  const handleScoreSubmit = (roundIdx, matchIdx) => {
    const matchKey = `${roundIdx}-${matchIdx}`
    const match = event.schedule[roundIdx].matches[matchIdx]
    
    const team1Score = parseInt(scoreInput.team1) || 0
    const team2Score = parseInt(scoreInput.team2) || 0
    
    const result = {
      ...match,
      result: {
        team1Score,
        team2Score,
        team1Points: team1Score > team2Score ? 2 : team1Score < team2Score ? 0 : 1,
        team2Points: team2Score > team1Score ? 2 : team2Score < team1Score ? 0 : 1
      }
    }
    
    const updatedResults = { ...matchResults, [matchKey]: result }
    setMatchResults(updatedResults)
    onUpdateEvent({ ...event, results: updatedResults })
    
    setShowScoreInput(null)
    setScoreInput({ team1: '', team2: '' })
  }
  
  // Calculate standings
  const calculateStandings = () => {
    const playerStats = {}
    
    // Initialize
    event.players.forEach(player => {
      if (player && player.id) {
        playerStats[player.id] = {
          ...player,
          points: 0,
          gamesWon: 0,
          gamesPlayed: 0
        }
      }
    })
    
    // Process results
    Object.values(matchResults).forEach(match => {
      if (!match.result) return
      
      match.team1?.forEach(player => {
        if (player && player.id && playerStats[player.id]) {
          playerStats[player.id].gamesPlayed++
          playerStats[player.id].gamesWon += match.result.team1Score
          playerStats[player.id].points += match.result.team1Points
        }
      })
      
      match.team2?.forEach(player => {
        if (player && player.id && playerStats[player.id]) {
          playerStats[player.id].gamesPlayed++
          playerStats[player.id].gamesWon += match.result.team2Score
          playerStats[player.id].points += match.result.team2Points
        }
      })
    })
    
    return Object.values(playerStats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      return b.gamesWon - a.gamesWon
    })
  }
  
  // Get player name helper
  const getPlayerName = (playerId) => {
    const player = event.players.find(p => p.id === playerId)
    return player ? player.name : 'Unknown'
  }
  
  // Debug logging
  console.log('Event:', event)
  console.log('Current Round:', currentRound)
  console.log('Schedule:', event.schedule)
  console.log('Players:', event.players)
  
  const currentRoundData = event.schedule?.[currentRound] || null
  const standings = calculateStandings()
  const isLastRound = currentRound === (event.schedule?.length || 0) - 1
  const allMatchesComplete = event.schedule?.every((round, rIdx) => 
    round.matches?.every((_, mIdx) => matchResults[`${rIdx}-${mIdx}`]?.result)
  ) || false
  
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Zurück zur Event-Übersicht
        </button>
        
        <h1 className="text-3xl font-bold">{event.name}</h1>
        <p className="text-gray-600">Live Turnier-Verwaltung</p>
      </div>
      
      {/* Check if schedule exists */}
      {!event.schedule || event.schedule.length === 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-6 py-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Kein Spielplan vorhanden</h3>
          <p>Bitte gehen Sie zurück zur Event-Übersicht und generieren Sie zuerst einen Spielplan.</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Zur Event-Übersicht
          </button>
        </div>
      ) : (
        <>
          {/* Timer Section - Smaller and more compact */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">
            Runde {currentRound + 1} von {event.schedule.length}
          </h2>
          
          {/* Timer Display */}
          <div className="text-4xl font-mono font-bold mb-4">
            {formatTime(timeRemaining)}
          </div>
          
          {/* Timer Controls */}
          <div className="flex justify-center gap-2 mb-3">
            {timerState === 'stopped' || timerState === 'paused' ? (
              <button
                onClick={startTimer}
                className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Play className="w-4 h-4" />
                {timerState === 'paused' ? 'Fortsetzen' : 'Start'}
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="flex items-center gap-1 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}
            
            <button
              onClick={resetTimer}
              className="flex items-center gap-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
          
          {/* Round Navigation */}
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={prevRound}
              disabled={currentRound === 0}
              className={`p-2 rounded ${
                currentRound === 0 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="px-3 font-medium">
              Runde {currentRound + 1} / {event.schedule.length}
            </span>
            
            <button
              onClick={nextRound}
              disabled={currentRound === event.schedule.length - 1}
              className={`p-2 rounded ${
                currentRound === event.schedule.length - 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content - Two columns on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Current Round Matches */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Aktuelle Paarungen
          </h3>
          
          {currentRoundData?.matches && currentRoundData.matches.length > 0 ? (
            <div className="space-y-3">
              {currentRoundData.matches.map((match, idx) => {
                const matchKey = `${currentRound}-${idx}`
                const result = matchResults[matchKey]
                
                return (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        Platz {match.court}
                      </span>
                      {result?.result && (
                        <Check className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm">
                        {match.players ? 
                          `${getPlayerName(match.players[0])} & ${getPlayerName(match.players[1])}` :
                          match.team1?.map(p => p.name).join(' & ')
                        }
                      </div>
                      
                      {/* Score Display or Input */}
                      <div className="flex justify-center items-center gap-2 py-2">
                        {result?.result ? (
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold">{result.result.team1Score}</span>
                            <span className="text-xl text-gray-500">:</span>
                            <span className="text-2xl font-bold">{result.result.team2Score}</span>
                            <button
                              onClick={() => {
                                const newResults = { ...matchResults }
                                delete newResults[matchKey]
                                setMatchResults(newResults)
                                onUpdateEvent({ ...event, results: newResults })
                              }}
                              className="ml-2 text-sm text-red-600 hover:text-red-800"
                            >
                              ✕
                            </button>
                          </div>
                        ) : showScoreInput === matchKey ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={scoreInput.team1}
                              onChange={(e) => setScoreInput({...scoreInput, team1: e.target.value})}
                              className="w-16 px-2 py-1 border rounded text-center"
                              min="0"
                              max="99"
                              placeholder="0"
                              autoFocus
                            />
                            <span>:</span>
                            <input
                              type="number"
                              value={scoreInput.team2}
                              onChange={(e) => setScoreInput({...scoreInput, team2: e.target.value})}
                              className="w-16 px-2 py-1 border rounded text-center"
                              min="0"
                              max="99"
                              placeholder="0"
                            />
                            <button
                              onClick={() => handleScoreSubmit(currentRound, idx)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => {
                                setShowScoreInput(null)
                                setScoreInput({ team1: '', team2: '' })
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setShowScoreInput(matchKey)
                              setScoreInput({ team1: '', team2: '' })
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Ergebnis
                          </button>
                        )}
                      </div>
                      
                      <div className="text-sm text-center">
                        {match.players ? 
                          `${getPlayerName(match.players[2])} & ${getPlayerName(match.players[3])}` :
                          match.team2?.map(p => p.name).join(' & ')
                        }
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {currentRoundData?.restingPlayerIds?.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">
                    <Users className="w-4 h-4 inline mr-1" />
                    Pausiert: {currentRoundData.restingPlayerIds.map(id => getPlayerName(id)).join(', ')}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Keine Paarungen für diese Runde vorhanden
            </p>
          )}
        </div>
        
        {/* Right Column: Live Standings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Live-Tabelle
            </h3>
            <button
              onClick={() => setShowStandings(!showStandings)}
              className={`px-3 py-1 text-sm rounded ${
                showStandings 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showStandings ? 'Ausblenden' : 'Einblenden'}
            </button>
          </div>
          
          {showStandings ? (
            <div className="overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white border-b-2">
                    <tr className="text-sm">
                      <th className="text-left py-2 bg-white">#</th>
                      <th className="text-left py-2 bg-white">Spieler</th>
                      <th className="text-center py-2 bg-white">Pkt</th>
                      <th className="text-center py-2 bg-white">Gew</th>
                      <th className="text-center py-2 bg-white">Sp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((player, idx) => (
                      <tr key={player.id} className={`border-b ${
                        idx === 0 ? 'bg-yellow-50' : 
                        idx === 1 ? 'bg-gray-50' : 
                        idx === 2 ? 'bg-orange-50' : ''
                      }`}>
                        <td className="py-2 font-semibold">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </td>
                        <td className="py-2 pr-2">
                          <div className="font-medium truncate max-w-[150px]" title={player.name}>
                            {player.name}
                          </div>
                        </td>
                        <td className="text-center py-2 font-bold">{player.points}</td>
                        <td className="text-center py-2">{player.gamesWon}</td>
                        <td className="text-center py-2">{player.gamesPlayed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {standings.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  Noch keine Ergebnisse eingetragen
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Tabelle ausgeblendet</p>
              <p className="text-sm mt-2">Klicken Sie auf "Einblenden" um die aktuelle Tabelle zu sehen</p>
            </div>
          )}
        </div>
      </div>
      
          {/* Tournament Complete */}
          {isLastRound && allMatchesComplete && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg text-center mt-6">
              <Trophy className="w-12 h-12 mx-auto mb-2" />
              <h3 className="text-xl font-bold mb-2">Turnier abgeschlossen!</h3>
              <p>Gratulation an {standings[0]?.name} zum Turniersieg!</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}