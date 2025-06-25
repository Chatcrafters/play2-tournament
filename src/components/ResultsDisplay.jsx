import React from 'react'
import { Trophy, Medal, Award } from 'lucide-react'

export const ResultsDisplay = ({ results, players }) => {
  // Calculate standings from results
  const calculateStandings = () => {
    const playerStats = {}
    
    // Initialize stats for all players
    players.forEach(player => {
      playerStats[player.id] = {
        ...player,
        points: 0,
        gamesWon: 0,
        gamesPlayed: 0,
        setsWon: 0,
        setsLost: 0
      }
    })
    
    // Process all match results
    Object.values(results || {}).forEach(match => {
      if (!match.result) return
      
      const { team1, team2, result } = match
      
      // Update team1 stats
      team1?.forEach(player => {
        if (playerStats[player.id]) {
          playerStats[player.id].gamesPlayed++
          playerStats[player.id].gamesWon += result.team1Score || 0
          playerStats[player.id].points += result.team1Points || 0
          if (result.team1Score > result.team2Score) {
            playerStats[player.id].setsWon++
          } else {
            playerStats[player.id].setsLost++
          }
        }
      })
      
      // Update team2 stats
      team2?.forEach(player => {
        if (playerStats[player.id]) {
          playerStats[player.id].gamesPlayed++
          playerStats[player.id].gamesWon += result.team2Score || 0
          playerStats[player.id].points += result.team2Points || 0
          if (result.team2Score > result.team1Score) {
            playerStats[player.id].setsWon++
          } else {
            playerStats[player.id].setsLost++
          }
        }
      })
    })
    
    // Convert to array and sort by points, then games won
    return Object.values(playerStats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      return b.gamesWon - a.gamesWon
    })
  }
  
  const standings = calculateStandings()
  const hasResults = Object.keys(results || {}).length > 0
  
  if (!hasResults) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Ergebnisse</h3>
        <p className="text-gray-500 text-center py-8">
          Noch keine Ergebnisse eingetragen
        </p>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-6">Turnier-Ergebnisse</h3>
      
      {/* Standings Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left py-3 px-4">Platz</th>
              <th className="text-left py-3 px-4">Spieler</th>
              <th className="text-center py-3 px-4">Punkte</th>
              <th className="text-center py-3 px-4">Spiele</th>
              <th className="text-center py-3 px-4">Gewonnen</th>
              <th className="text-center py-3 px-4">Sets</th>
              <th className="text-center py-3 px-4">Diff</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((player, index) => {
              const isTop3 = index < 3
              const rowClass = index === 0 ? 'bg-yellow-50' : 
                             index === 1 ? 'bg-gray-100' : 
                             index === 2 ? 'bg-orange-50' : ''
              
              return (
                <tr key={player.id} className={`border-b ${rowClass}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {index === 0 && <Trophy className="w-5 h-5 text-yellow-600" />}
                      {index === 1 && <Medal className="w-5 h-5 text-gray-600" />}
                      {index === 2 && <Award className="w-5 h-5 text-orange-600" />}
                      <span className="font-semibold">{index + 1}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-xs text-gray-500">
                        {player.gender === 'female' ? '♀' : '♂'} • Level {player.skillLevel}
                      </p>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="text-lg font-bold">{player.points}</span>
                  </td>
                  <td className="text-center py-3 px-4">{player.gamesPlayed}</td>
                  <td className="text-center py-3 px-4">{player.gamesWon}</td>
                  <td className="text-center py-3 px-4">
                    {player.setsWon}:{player.setsLost}
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={player.setsWon - player.setsLost >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {player.setsWon - player.setsLost > 0 ? '+' : ''}{player.setsWon - player.setsLost}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {/* Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600">Gespielte Matches</p>
          <p className="text-2xl font-bold text-blue-700">
            {Object.keys(results).length}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600">Höchste Punktzahl</p>
          <p className="text-2xl font-bold text-green-700">
            {standings[0]?.points || 0}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600">Ø Punkte/Spieler</p>
          <p className="text-2xl font-bold text-purple-700">
            {standings.length > 0 
              ? (standings.reduce((sum, p) => sum + p.points, 0) / standings.length).toFixed(1)
              : 0
            }
          </p>
        </div>
      </div>
    </div>
  )
}