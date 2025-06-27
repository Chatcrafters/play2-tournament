import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Calendar, Clock, MapPin, Trophy, Users, Play, Pause, RotateCcw, Check } from 'lucide-react'
import { useTranslation } from './LanguageSelector'

// Timer-Komponente
const Timer = ({ isRunning, onTick, duration, currentTime }) => {
  const intervalRef = useRef(null)
  
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        onTick()
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, onTick])
  
  const minutes = Math.floor(currentTime / 60)
  const seconds = currentTime % 60
  const progress = duration > 0 ? ((duration * 60 - currentTime) / (duration * 60)) * 100 : 100
  
  return (
    <div className="w-full">
      <div className="text-3xl font-bold text-center mb-2">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export const AmericanoTournament = ({ event, onComplete, onCancel }) => {
  const { t } = useTranslation()
  
  // States
  const [currentRound, setCurrentRound] = useState(event.currentRound || 0)
  const [timerState, setTimerState] = useState(event.timerState || 'stopped')
  const [currentTime, setCurrentTime] = useState(0)
  const [matchResults, setMatchResults] = useState(event.results || {})
  const [showResults, setShowResults] = useState(false)
  const [scores, setScores] = useState({})
  
  // Refs
  const lastUpdateRef = useRef(Date.now())
  
  // Callbacks
  const handleTimerTick = useCallback(() => {
    setCurrentTime(prev => prev + 1)
  }, [])
  
  const handleTimerControl = (action) => {
    switch (action) {
      case 'start':
        setTimerState('running')
        break
      case 'pause':
        setTimerState('paused')
        break
      case 'reset':
        setTimerState('stopped')
        setCurrentTime(0)
        break
    }
  }
  
  const handleNextRound = () => {
    if (currentRound < event.schedule.length - 1) {
      setCurrentRound(currentRound + 1)
      setTimerState('stopped')
      setCurrentTime(0)
    }
  }
  
  const handlePreviousRound = () => {
    if (currentRound > 0) {
      setCurrentRound(currentRound - 1)
      setTimerState('stopped')
      setCurrentTime(0)
    }
  }
  
  // Score handling
  const handleScoreChange = (matchIndex, team, value) => {
    setScores(prev => ({
      ...prev,
      [`${currentRound}-${matchIndex}`]: {
        ...prev[`${currentRound}-${matchIndex}`],
        [`team${team}Score`]: parseInt(value) || 0
      }
    }))
  }
  
  const handleScoreSubmit = (matchIndex) => {
    const matchKey = `${currentRound}-${matchIndex}`
    const score = scores[matchKey]
    const match = event.schedule[currentRound].matches[matchIndex]
    
    if (!score || score.team1Score === undefined || score.team2Score === undefined) {
      alert('Bitte beide Ergebnisse eingeben')
      return
    }
    
    // Berechne Punkte: 2 für Sieg, 1 für Unentschieden, 0 für Niederlage
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
    
    setMatchResults(prev => ({
      ...prev,
      [matchKey]: result
    }))
    
    // Clear the score input
    setScores(prev => {
      const newScores = { ...prev }
      delete newScores[matchKey]
      return newScores
    })
  }
  
  const handleCompleteTournament = () => {
    onComplete(matchResults)
  }
  
  // WICHTIGER FIX: Button mit type="button" um Form-Submit zu verhindern
  const handleCancelClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onCancel) {
      onCancel()
    }
  }
  
  // Calculate standings
  const calculateStandings = () => {
    const playerStats = {}
    
    // Initialize all players
    event.players.forEach(player => {
      playerStats[player.id] = {
        ...player,
        points: 0,
        gamesWon: 0,
        gamesPlayed: 0
      }
    })
    
    // Process all results
    Object.entries(matchResults).forEach(([matchKey, matchData]) => {
      if (!matchData.result) return
      
      const { team1, team2, result } = matchData
      
      // Update team 1
      team1.forEach(player => {
        playerStats[player.id].gamesPlayed++
        playerStats[player.id].gamesWon += result.team1Score
        playerStats[player.id].points += result.team1Points
      })
      
      // Update team 2
      team2.forEach(player => {
        playerStats[player.id].gamesPlayed++
        playerStats[player.id].gamesWon += result.team2Score
        playerStats[player.id].points += result.team2Points
      })
    })
    
    // Sort by points, then games won
    return Object.values(playerStats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      return b.gamesWon - a.gamesWon
    })
  }
  
  const allMatchesComplete = () => {
    return event.schedule.every((round, roundIdx) => 
      round.matches.every((_, matchIdx) => 
        matchResults[`${roundIdx}-${matchIdx}`]?.result
      )
    )
  }
  
  // Auto-save periodically
  useEffect(() => {
    const now = Date.now()
    if (now - lastUpdateRef.current > 5000) { // Save every 5 seconds
      lastUpdateRef.current = now
      // Here you would save to database
      // saveToDatabase({ currentRound, timerState, currentTime, matchResults })
    }
  }, [currentRound, timerState, currentTime, matchResults])
  
  const currentSchedule = event.schedule[currentRound]
  const standings = calculateStandings()
  
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            type="button"  {/* WICHTIG: type="button" hinzugefügt */}
            onClick={handleCancelClick}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Zurück zur Event-Übersicht
          </button>
          
          <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
          <p className="text-gray-600">Live Turnier-Verwaltung</p>
        </div>
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Timer & Round Control */}
          <div className="lg:col-span-1">
            {/* Timer Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">Runden-Timer</h3>
              
              <Timer
                isRunning={timerState === 'running'}
                onTick={handleTimerTick}
                duration={event.roundDuration || 15}
                currentTime={currentTime}
              />
              
              <div className="mt-4 flex gap-2">
                {timerState === 'stopped' && (
                  <button
                    onClick={() => handleTimerControl('start')}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start
                  </button>
                )}
                
                {timerState === 'running' && (
                  <button
                    onClick={() => handleTimerControl('pause')}
                    className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 flex items-center justify-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                )}
                
                {timerState === 'paused' && (
                  <button
                    onClick={() => handleTimerControl('start')}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Weiter
                  </button>
                )}
                
                <button
                  onClick={() => handleTimerControl('reset')}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Round Navigation */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Runden-Navigation</h3>
              
              <div className="text-center mb-4">
                <p className="text-3xl font-bold">
                  Runde {currentRound + 1} / {event.schedule.length}
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handlePreviousRound}
                  disabled={currentRound === 0}
                  className={`flex-1 px-4 py-2 rounded ${
                    currentRound === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  ← Vorherige
                </button>
                
                <button
                  onClick={handleNextRound}
                  disabled={currentRound === event.schedule.length - 1}
                  className={`flex-1 px-4 py-2 rounded ${
                    currentRound === event.schedule.length - 1
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Nächste →
                </button>
              </div>
              
              {/* Tournament Complete Button */}
              {allMatchesComplete() && (
                <button
                  onClick={handleCompleteTournament}
                  className="w-full mt-4 bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 flex items-center justify-center gap-2 font-semibold"
                >
                  <Check className="w-5 h-5" />
                  Turnier abschließen
                </button>
              )}
            </div>
          </div>
          
          {/* Middle Column - Current Matches */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Aktuelle Spiele</h3>
              
              {currentSchedule && (
                <div className="space-y-4">
                  {currentSchedule.matches.map((match, matchIndex) => {
                    const matchKey = `${currentRound}-${matchIndex}`
                    const result = matchResults[matchKey]
                    const score = scores[matchKey] || {}
                    
                    return (
                      <div key={matchIndex} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-semibold">Platz {match.court}</span>
                          {result?.result && (
                            <span className="text-green-600 font-semibold">✓ Ergebnis eingetragen</span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          {/* Team 1 */}
                          <div className="text-center md:text-right">
                            <p className="font-medium text-lg">
                              {match.team1.map(p => p.name).join(' & ')}
                            </p>
                          </div>
                          
                          {/* Score Input or Result */}
                          <div className="text-center">
                            {result?.result ? (
                              <div className="text-2xl font-bold">
                                {result.result.team1Score} - {result.result.team2Score}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="99"
                                  value={score.team1Score || ''}
                                  onChange={(e) => handleScoreChange(matchIndex, 1, e.target.value)}
                                  className="w-16 text-center border rounded px-2 py-1"
                                  placeholder="0"
                                />
                                <span className="text-xl">-</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="99"
                                  value={score.team2Score || ''}
                                  onChange={(e) => handleScoreChange(matchIndex, 2, e.target.value)}
                                  className="w-16 text-center border rounded px-2 py-1"
                                  placeholder="0"
                                />
                                <button
                                  onClick={() => handleScoreSubmit(matchIndex)}
                                  className="ml-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                >
                                  ✓
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* Team 2 */}
                          <div className="text-center md:text-left">
                            <p className="font-medium text-lg">
                              {match.team2.map(p => p.name).join(' & ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Waiting Players */}
                  {currentSchedule.waitingPlayers?.length > 0 && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                      <p className="font-semibold text-yellow-800 mb-2">Pausierend:</p>
                      <p className="text-yellow-700">
                        {currentSchedule.waitingPlayers.map(p => p.name).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Live Standings */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Live-Tabelle</h3>
                <button
                  onClick={() => setShowResults(!showResults)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {showResults ? 'Verbergen' : 'Alle Ergebnisse'}
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Rang</th>
                      <th className="text-left py-2">Spieler</th>
                      <th className="text-center py-2">Punkte</th>
                      <th className="text-center py-2">Gewonnene Spiele</th>
                      <th className="text-center py-2">Gespielte Matches</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((player, idx) => (
                      <tr key={player.id} className="border-b">
                        <td className="py-2">{idx + 1}</td>
                        <td className="py-2 font-medium">{player.name}</td>
                        <td className="text-center py-2 font-bold">{player.points}</td>
                        <td className="text-center py-2">{player.gamesWon}</td>
                        <td className="text-center py-2">{player.gamesPlayed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        {/* All Results Modal */}
        {showResults && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Alle Ergebnisse</h2>
                <button
                  onClick={() => setShowResults(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              {/* Results by round */}
              {event.schedule.map((round, roundIdx) => (
                <div key={roundIdx} className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Runde {roundIdx + 1}</h3>
                  <div className="space-y-2">
                    {round.matches.map((match, matchIdx) => {
                      const result = matchResults[`${roundIdx}-${matchIdx}`]
                      return (
                        <div key={matchIdx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span>{match.team1.map(p => p.name).join(' & ')}</span>
                          <span className="font-bold">
                            {result?.result ? `${result.result.team1Score} - ${result.result.team2Score}` : '-'}
                          </span>
                          <span>{match.team2.map(p => p.name).join(' & ')}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}