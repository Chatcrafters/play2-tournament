// src/components/ScoreEntry.jsx
import { useState } from 'react'

export const ScoreEntry = ({ 
  event, 
  schedule, 
  currentRound, 
  onScoreSubmit,
  onRoundChange,  // NEU: Diese Prop hinzugefügt
  existingResults = {},
  showStandings = false
}) => {
  const [scores, setScores] = useState({})
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  
  // Get current round data
  const roundData = schedule[currentRound]
  if (!roundData && !showStandings) return null
  
  // Initialize scores from existing results
  useState(() => {
    if (!showStandings) {
      const initialScores = {}
      roundData.matches.forEach((match, idx) => {
        const matchKey = `${currentRound}-${idx}`
        if (existingResults[matchKey]) {
          initialScores[matchKey] = existingResults[matchKey]
        }
      })
      setScores(initialScores)
    }
  }, [currentRound, existingResults])
  
  // Handle score change
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
  
  // Calculate points based on Americano rules
  const calculatePoints = (team1Score, team2Score) => {
    if (team1Score > team2Score) {
      return { team1Points: 2, team2Points: 0 }
    } else if (team1Score < team2Score) {
      return { team1Points: 0, team2Points: 2 }
    } else {
      return { team1Points: 1, team2Points: 1 }
    }
  }
  
  // Submit scores for the round
  const handleSubmitScores = () => {
    const results = {}
    
    roundData.matches.forEach((match, idx) => {
      const matchKey = `${currentRound}-${idx}`
      const score = scores[matchKey]
      
      if (score && (score.team1Score !== undefined && score.team2Score !== undefined)) {
        const points = calculatePoints(score.team1Score, score.team2Score)
        
        results[matchKey] = {
          ...match,
          result: {
            team1Score: score.team1Score,
            team2Score: score.team2Score,
            ...points
          }
        }
      }
    })
    
    onScoreSubmit(currentRound, results)
    
    // Show success message
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 3000)
  }
  
  // Check if all scores are entered
  const allScoresEntered = roundData?.matches.every((_, idx) => {
    const matchKey = `${currentRound}-${idx}`
    const score = scores[matchKey]
    return score && score.team1Score !== undefined && score.team2Score !== undefined
  })
  
  // Calculate current standings with fairness statistics
  const calculateStandings = () => {
    const playerStats = {}
    
    // Initialize all players
    event.players.forEach(player => {
      playerStats[player.id] = {
        ...player,
        points: 0,
        gamesWon: 0,
        gamesPlayed: 0,
        matches: [],
        partners: new Set(),
        opponents: new Set(),
        uniquePartners: 0,
        uniqueOpponents: 0,
        fairnessScore: 0
      }
    })
    
    // Process all rounds up to current (or all for standings view)
    const roundsToProcess = showStandings ? schedule.length : currentRound + 1
    
    for (let r = 0; r < roundsToProcess; r++) {
      const round = schedule[r]
      if (!round) continue
      
      round.matches.forEach((match, idx) => {
        const matchKey = `${r}-${idx}`
        const result = showStandings || r < currentRound ? existingResults[matchKey] : (r === currentRound ? scores[matchKey] : null)
        
        if (result && result.result) {
          const points = calculatePoints(result.result.team1Score, result.result.team2Score)
          
          // Update team 1 players
          match.team1.forEach((player, i) => {
            playerStats[player.id].gamesPlayed++
            playerStats[player.id].gamesWon += result.result.team1Score || 0
            playerStats[player.id].points += points.team1Points
            
            // Track partner (the other player in team1)
            const partnerId = match.team1[1-i]?.id
            if (partnerId) {
              playerStats[player.id].partners.add(partnerId)
            }
            
            // Track opponents (both players in team2)
            match.team2.forEach(opponent => {
              if (opponent?.id) {
                playerStats[player.id].opponents.add(opponent.id)
              }
            })
          })
          
          // Update team 2 players
          match.team2.forEach((player, i) => {
            playerStats[player.id].gamesPlayed++
            playerStats[player.id].gamesWon += result.result.team2Score || 0
            playerStats[player.id].points += points.team2Points
            
            // Track partner (the other player in team2)
            const partnerId = match.team2[1-i]?.id
            if (partnerId) {
              playerStats[player.id].partners.add(partnerId)
            }
            
            // Track opponents (both players in team1)
            match.team1.forEach(opponent => {
              if (opponent?.id) {
                playerStats[player.id].opponents.add(opponent.id)
              }
            })
          })
        } else if (match.team1 && match.team2) {
          // Auch für Spiele ohne Ergebnis Partner/Gegner tracken
          match.team1.forEach((player, i) => {
            playerStats[player.id].gamesPlayed++
            
            const partnerId = match.team1[1-i]?.id
            if (partnerId) {
              playerStats[player.id].partners.add(partnerId)
            }
            
            match.team2.forEach(opponent => {
              if (opponent?.id) {
                playerStats[player.id].opponents.add(opponent.id)
              }
            })
          })
          
          match.team2.forEach((player, i) => {
            playerStats[player.id].gamesPlayed++
            
            const partnerId = match.team2[1-i]?.id
            if (partnerId) {
              playerStats[player.id].partners.add(partnerId)
            }
            
            match.team1.forEach(opponent => {
              if (opponent?.id) {
                playerStats[player.id].opponents.add(opponent.id)
              }
            })
          })
        }
      })
    }
    
    // Berechne finale Statistiken
    Object.values(playerStats).forEach(player => {
      player.uniquePartners = player.partners.size
      player.uniqueOpponents = player.opponents.size
      // Fairness-Score: Durchschnitt aus Partner- und Gegner-Vielfalt
      const maxPartners = Math.min(player.gamesPlayed - 1, event.players.length - 1)
      const maxOpponents = Math.min(player.gamesPlayed * 2, event.players.length - 1)
      player.fairnessScore = Math.round(
        ((player.uniquePartners / Math.max(1, maxPartners)) + 
         (player.uniqueOpponents / Math.max(1, maxOpponents))) * 50
      )
    })
    
    // Convert to array and sort
    return Object.values(playerStats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon
      return b.fairnessScore - a.fairnessScore // Tiebreaker
    })
  }
  
  const standings = calculateStandings()
  
  // Wenn nur Standings anzeigen
  if (showStandings) {
    return (
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
            {standings.map((player, idx) => (
              <tr key={player.id} className={`border-b ${idx === 0 ? 'bg-yellow-50' : idx === 1 ? 'bg-gray-100' : idx === 2 ? 'bg-orange-50' : ''}`}>
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
                  <div className="flex items-center justify-center">
                    <div className={`text-sm font-semibold px-2 py-1 rounded ${
                      player.fairnessScore >= 80 ? 'bg-green-100 text-green-800' :
                      player.fairnessScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      player.fairnessScore >= 40 ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {player.fairnessScore}%
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Fairness-Legende */}
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
      </div>
    )
  }
  
  // Normale Score Entry Ansicht
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">
        Ergebnisse eintragen - Runde {currentRound + 1}
      </h3>
      
      {showSuccessMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg">
          Ergebnisse erfolgreich gespeichert!
        </div>
      )}
      
      {/* NEU: Runden-Navigation */}
      {onRoundChange && (
        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
          <button
            onClick={() => {
              if (currentRound > 0) {
                onRoundChange(currentRound - 1)
              }
            }}
            disabled={currentRound === 0}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
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
              if (currentRound < schedule.length - 1) {
                onRoundChange(currentRound + 1)
              }
            }}
            disabled={currentRound >= schedule.length - 1}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
              currentRound >= schedule.length - 1 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Nächste Runde →
          </button>
        </div>
      )}
      
      {/* Match score inputs */}
      <div className="space-y-4 mb-6">
        {roundData.matches.map((match, idx) => {
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
              
              {/* Show points earned */}
              {score.team1Score !== undefined && score.team2Score !== undefined && (
                <div className="mt-2 text-sm text-gray-600 text-center">
                  {(() => {
                    const points = calculatePoints(score.team1Score, score.team2Score)
                    return `Punkte: ${points.team1Points} - ${points.team2Points}`
                  })()}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      <button
        onClick={handleSubmitScores}
        disabled={!allScoresEntered}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
      >
        Runden-Ergebnisse speichern
      </button>
      
      {/* Aktuelle Zwischentabelle */}
      <div className="mt-8">
        <h4 className="text-lg font-bold mb-3">Aktueller Stand</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-2 px-1 text-sm">Rang</th>
                <th className="text-left py-2 px-1 text-sm">Spieler</th>
                <th className="text-center py-2 px-1 text-sm">Punkte</th>
                <th className="text-center py-2 px-1 text-sm">Spiele</th>
                <th className="text-center py-2 px-1 text-sm">Matches</th>
                <th className="text-center py-2 px-1 text-sm">Partner</th>
                <th className="text-center py-2 px-1 text-sm">Gegner</th>
              </tr>
            </thead>
            <tbody>
              {standings.slice(0, 10).map((player, idx) => (
                <tr key={player.id} className="border-b text-sm">
                  <td className="py-2 px-1">{idx + 1}</td>
                  <td className="py-2 px-1 font-medium">{player.name}</td>
                  <td className="text-center py-2 px-1 font-bold">{player.points}</td>
                  <td className="text-center py-2 px-1">{player.gamesWon}</td>
                  <td className="text-center py-2 px-1">{player.gamesPlayed}</td>
                  <td className="text-center py-2 px-1">{player.uniquePartners}</td>
                  <td className="text-center py-2 px-1">{player.uniqueOpponents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}