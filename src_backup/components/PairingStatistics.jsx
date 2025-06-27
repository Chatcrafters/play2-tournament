import { useState, useEffect } from 'react'

export const PairingStatistics = ({ schedule, players }) => {
  const [showDetails, setShowDetails] = useState(false)
  const [pairingMatrix, setPairingMatrix] = useState({})
  
  useEffect(() => {
    if (schedule && players.length > 0) {
      const matrix = calculatePairingMatrix()
      setPairingMatrix(matrix)
    }
  }, [schedule, players])
  
  const calculatePairingMatrix = () => {
    if (!schedule || !players || players.length === 0) return {}
    
    // Erstelle eine Map von Spieler-IDs zu Indizes
    const playerIndexMap = {}
    players.forEach((player, index) => {
      playerIndexMap[player.id] = index
    })
    
    // Initialisiere Matrizen
    const matrix1 = Array(players.length).fill(null).map(() => Array(players.length).fill(0))
    const matrix2 = Array(players.length).fill(null).map(() => Array(players.length).fill(0))
    
    // Zähle Paarungen
    schedule.rounds.forEach(round => {
      if (!round.isBreak && round.matches) {
        round.matches.forEach(match => {
          if (match.players && match.players.length === 4) {
            const playerIds = match.players.map(id => playerIndexMap[id])
            
            // Überprüfe ob alle Spieler-IDs gültig sind
            if (playerIds.every(idx => idx !== undefined)) {
              // Team 1: players[0] & players[1]
              if (playerIds[0] !== undefined && playerIds[1] !== undefined) {
                matrix1[playerIds[0]][playerIds[1]]++
                matrix1[playerIds[1]][playerIds[0]]++
              }
              
              // Team 2: players[2] & players[3]
              if (playerIds[2] !== undefined && playerIds[3] !== undefined) {
                matrix1[playerIds[2]][playerIds[3]]++
                matrix1[playerIds[3]][playerIds[2]]++
              }
              
              // Gegner-Paarungen
              for (let i = 0; i < 2; i++) {
                for (let j = 2; j < 4; j++) {
                  if (playerIds[i] !== undefined && playerIds[j] !== undefined) {
                    matrix2[playerIds[i]][playerIds[j]]++
                    matrix2[playerIds[j]][playerIds[i]]++
                  }
                }
              }
            }
          }
        })
      }
    })
    
    return { withMatrix: matrix1, againstMatrix: matrix2 }
  }
  
  const getMaxPairings = (matrix) => {
    let max = 0
    for (let i = 0; i < matrix.length; i++) {
      for (let j = i + 1; j < matrix.length; j++) {
        if (matrix[i][j] > max) max = matrix[i][j]
      }
    }
    return max
  }
  
  const getMinPairings = (matrix) => {
    let min = Infinity
    for (let i = 0; i < matrix.length; i++) {
      for (let j = i + 1; j < matrix.length; j++) {
        if (matrix[i][j] < min) min = matrix[i][j]
      }
    }
    return min === Infinity ? 0 : min
  }
  
  const getColorClass = (value, max, min) => {
    if (max === min) return 'bg-gray-100'
    const ratio = (value - min) / (max - min)
    if (ratio < 0.33) return 'bg-green-100'
    if (ratio < 0.67) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  // Sicherer Zugriff auf Matrix-Daten
  const safeMatrixAccess = (matrix, i, j) => {
    if (!matrix || !matrix[i] || matrix[i][j] === undefined) return 0
    return matrix[i][j]
  }
  
  if (!schedule || !players || players.length === 0) {
    return null
  }
  
  const { withMatrix, againstMatrix } = pairingMatrix
  
  if (!withMatrix || !againstMatrix) {
    return <div className="text-gray-500">Lade Statistiken...</div>
  }
  
  const maxWith = getMaxPairings(withMatrix)
  const minWith = getMinPairings(withMatrix)
  const maxAgainst = getMaxPairings(againstMatrix)
  const minAgainst = getMinPairings(againstMatrix)
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Paarungs-Statistik</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 hover:text-blue-800"
        >
          {showDetails ? 'Ausblenden' : 'Details anzeigen'}
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 p-3 rounded">
          <h4 className="font-semibold text-sm mb-1">Max. zusammen gespielt</h4>
          <p className="text-2xl font-bold">{maxWith}x</p>
        </div>
        <div className="bg-orange-50 p-3 rounded">
          <h4 className="font-semibold text-sm mb-1">Max. gegeneinander</h4>
          <p className="text-2xl font-bold">{maxAgainst}x</p>
        </div>
      </div>
      
      {showDetails && (
        <div className="space-y-6">
          {/* Zusammen gespielt Matrix */}
          <div>
            <h4 className="font-semibold mb-2">Zusammen gespielt (als Team)</h4>
            <div className="overflow-x-auto">
              <table className="text-xs">
                <thead>
                  <tr>
                    <th className="p-1"></th>
                    {players.map((p, i) => (
                      <th key={i} className="p-1 text-center" title={p.name}>
                        {p.name.substring(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, i) => (
                    <tr key={i}>
                      <td className="p-1 font-semibold" title={player.name}>
                        {player.name.substring(0, 8)}
                      </td>
                      {players.map((_, j) => (
                        <td 
                          key={j} 
                          className={`p-1 text-center border ${
                            i === j ? 'bg-gray-300' : getColorClass(safeMatrixAccess(withMatrix, i, j), maxWith, minWith)
                          }`}
                        >
                          {i === j ? '-' : safeMatrixAccess(withMatrix, i, j)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Gegeneinander gespielt Matrix */}
          <div>
            <h4 className="font-semibold mb-2">Gegeneinander gespielt</h4>
            <div className="overflow-x-auto">
              <table className="text-xs">
                <thead>
                  <tr>
                    <th className="p-1"></th>
                    {players.map((p, i) => (
                      <th key={i} className="p-1 text-center" title={p.name}>
                        {p.name.substring(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, i) => (
                    <tr key={i}>
                      <td className="p-1 font-semibold" title={player.name}>
                        {player.name.substring(0, 8)}
                      </td>
                      {players.map((_, j) => (
                        <td 
                          key={j} 
                          className={`p-1 text-center border ${
                            i === j ? 'bg-gray-300' : getColorClass(safeMatrixAccess(againstMatrix, i, j), maxAgainst, minAgainst)
                          }`}
                        >
                          {i === j ? '-' : safeMatrixAccess(againstMatrix, i, j)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="text-xs text-gray-600">
            <p>Farbcode: 
              <span className="inline-block w-4 h-4 bg-green-100 mx-1"></span> Wenig
              <span className="inline-block w-4 h-4 bg-yellow-100 mx-1"></span> Mittel
              <span className="inline-block w-4 h-4 bg-red-100 mx-1"></span> Viel
            </p>
          </div>
        </div>
      )}
    </div>
  )
}