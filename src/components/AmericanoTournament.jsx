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
    if (player && player.id) {  // Sicherheitscheck
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
      if (player && player.id && playerStats[player.id]) {  // Sicherheitscheck
        playerStats[player.id].gamesPlayed++
        playerStats[player.id].gamesWon += match.result.team1Score
        playerStats[player.id].points += match.result.team1Points
      }
    })
    
    match.team2?.forEach(player => {
      if (player && player.id && playerStats[player.id]) {  // Sicherheitscheck
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
  
  const currentRoundData = event.schedule[currentRound]
  const standings = calculateStandings()
  const isLastRound = currentRound === event.schedule.length - 1
  const allMatchesComplete = event.schedule.every((round, rIdx) => 
    round.matches.every((_, mIdx) => matchResults[`${rIdx}-${mIdx}`]?.result)
  )
  
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
      
      {/* Timer Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">
            Runde {currentRound + 1} von {event.schedule.length}
          </h2>
          
          {/* Timer Display */}
          <div className="text-6xl font-mono font-bold mb-6">
            {formatTime(timeRemaining)}
          </div>
          
          {/* Timer Controls */}
          <div className="flex justify-center gap-4 mb-4">
            {timerState === 'stopped' || timerState === 'paused' ? (
              <button
                onClick={startTimer}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Play className="w-5 h-5" />
                {timerState === 'paused' ? 'Fortsetzen' : 'Start'}
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                <Pause className="w-5 h-5" />
                Pause
              </button>
            )}
            
            <button
              onClick={resetTimer}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </div>
          
          {/* Round Navigation */}
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={prevRound}
              disabled={currentRound === 0}
              className={`p-2 rounded ${
                currentRound === 0 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <span className="font-medium">
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
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Current Round Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Aktuelle Paarungen
          </h3>
          
          <div className="space-y-3">
            {currentRoundData?.matches.map((match, idx) => {
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
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">
                        {match.team1?.map(p => p.name).join(' & ')}
                      </p>
                    </div>
                    
                    {result?.result ? (
                      <div className="flex items-center gap-2 px-4">
                        <span className="text-xl font-bold">{result.result.team1Score}</span>
                        <span className="text-gray-500">:</span>
                        <span className="text-xl font-bold">{result.result.team2Score}</span>
                      </div>
                    ) : showScoreInput === matchKey ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={scoreInput.team1}
                          onChange={(e) => setScoreInput({...scoreInput, team1: e.target.value})}
                          className="w-12 px-2 py-1 border rounded text-center"
                          min="0"
                          max="99"
                        />
                        <span>:</span>
                        <input
                          type="number"
                          value={scoreInput.team2}
                          onChange={(e) => setScoreInput({...scoreInput, team2: e.target.value})}
                          className="w-12 px-2 py-1 border rounded text-center"
                          min="0"
                          max="99"
                        />
                        <button
                          onClick={() => handleScoreSubmit(currentRound, idx)}
                          className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setShowScoreInput(null)
                            setScoreInput({ team1: '', team2: '' })
                          }}
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
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
                    
                    <div className="flex-1 text-right">
                      <p className="font-medium">
                        {match.team2?.map(p => p.name).join(' & ')}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {currentRoundData?.waitingPlayers?.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">
                <Users className="w-4 h-4 inline mr-1" />
                Pausiert: {currentRoundData.waitingPlayers.map(p => p.name).join(', ')}
              </p>
            </div>
          )}
        </div>
        
        {/* Live Standings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Live-Tabelle
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm">
                  <th className="text-left py-2">#</th>
                  <th className="text-left py-2">Spieler</th>
                  <th className="text-center py-2">Pkt</th>
                  <th className="text-center py-2">Gew</th>
                  <th className="text-center py-2">Sp</th>
                </tr>
              </thead>
              <tbody>
                {standings.slice(0, 10).map((player, idx) => (
                  <tr key={player.id} className="border-b">
                    <td className="py-2 font-semibold">{idx + 1}</td>
                    <td className="py-2">{player.name}</td>
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
      
      {/* Tournament Complete */}
      {isLastRound && allMatchesComplete && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg text-center">
          <Trophy className="w-12 h-12 mx-auto mb-2" />
          <h3 className="text-xl font-bold mb-2">Turnier abgeschlossen!</h3>
          <p>Gratulation an {standings[0]?.name} zum Turniersieg!</p>
        </div>
      )}
    </div>
  )
}