// Smart Americano Algorithm - Maximale Durchmischung mit Seed-System
export const generateAmericanoSchedule = (players, courts, rounds, options = {}) => {
  // Validierung
  if (!players || players.length < 4) {
    throw new Error('Mindestens 4 Spieler erforderlich')
  }
  
  if (courts < 1) {
    throw new Error('Mindestens 1 Platz erforderlich')
  }
  
  if (rounds < 1) {
    throw new Error('Mindestens 1 Runde erforderlich')
  }
  
  // Seed-System: 4 verschiedene Varianten, dann Wiederholung
  const seed = (options.regenerateCount || 0) % 4
  const randomGen = createSeededRandom(seed + (options.eventId || '').length)
  
  const schedule = []
  const playerCount = players.length
  const playersPerMatch = 4
  const matchesPerRound = Math.min(Math.floor(playerCount / playersPerMatch), courts)
  
  // Tracking-Matrizen für Paarungen
  const partnerMatrix = createMatrix(playerCount)
  const opponentMatrix = createMatrix(playerCount)
  const gamesPlayed = new Array(playerCount).fill(0)
  const lastPlayed = new Array(playerCount).fill(-999)
  const courtAssignments = new Array(playerCount).fill(null).map(() => [])
  
  // Seeded Random Generator
  function createSeededRandom(seed) {
    let value = seed
    return {
      next: () => {
        value = (value * 9301 + 49297) % 233280
        return value / 233280
      },
      shuffle: (array) => {
        const arr = [...array]
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(value * (i + 1)) % (i + 1)
          value = (value * 9301 + 49297) % 233280
          ;[arr[i], arr[j]] = [arr[j], arr[i]]
        }
        return arr
      }
    }
  }
  
  // Helper: Matrix erstellen
  function createMatrix(size) {
    return Array(size).fill(null).map(() => Array(size).fill(0))
  }
  
  // Helper: Spieler-Index finden
  function getPlayerIndex(playerId) {
    return players.findIndex(p => p.id === playerId)
  }
  
  // Helper: Paarungs-Score berechnen (niedriger = besser)
  function calculatePairingScore(p1Idx, p2Idx, p3Idx, p4Idx, currentRound, courtNum) {
    let score = 0
    
    // Team 1: p1 + p2, Team 2: p3 + p4
    
    // 1. Penalisiere häufige Partner-Wiederholungen (höchste Priorität)
    score += partnerMatrix[p1Idx][p2Idx] * 100
    score += partnerMatrix[p3Idx][p4Idx] * 100
    
    // 2. Penalisiere häufige Gegner-Wiederholungen
    score += opponentMatrix[p1Idx][p3Idx] * 50
    score += opponentMatrix[p1Idx][p4Idx] * 50
    score += opponentMatrix[p2Idx][p3Idx] * 50
    score += opponentMatrix[p2Idx][p4Idx] * 50
    
    // 3. Bevorzuge Spieler die länger pausiert haben
    const waitingBonus = [p1Idx, p2Idx, p3Idx, p4Idx].reduce((sum, idx) => {
      const waitTime = currentRound - lastPlayed[idx] - 1
      return sum + (waitTime > 0 ? waitTime * 30 : 0)
    }, 0)
    score -= waitingBonus
    
    // 4. Gleichmäßige Spielverteilung
    const gamesDiff = Math.max(...[p1Idx, p2Idx, p3Idx, p4Idx].map(idx => gamesPlayed[idx])) -
                     Math.min(...[p1Idx, p2Idx, p3Idx, p4Idx].map(idx => gamesPlayed[idx]))
    score += gamesDiff * 80
    
    // 5. Court-Rotation berücksichtigen
    const courtPenalty = [p1Idx, p2Idx, p3Idx, p4Idx].reduce((sum, idx) => {
      const lastCourt = courtAssignments[idx][courtAssignments[idx].length - 1]
      return sum + (lastCourt === courtNum ? 10 : 0)
    }, 0)
    score += courtPenalty
    
    // 6. Seed-basierte Variation
    score += randomGen.next() * seed * 5
    
    return score
  }
  
  // Helper: Generiere alle möglichen 4er-Kombinationen
  function generateCombinations(players, size = 4) {
    const combinations = []
    
    function combine(start, current) {
      if (current.length === size) {
        combinations.push([...current])
        return
      }
      
      for (let i = start; i < players.length; i++) {
        current.push(players[i])
        combine(i + 1, current)
        current.pop()
      }
    }
    
    combine(0, [])
    return combinations
  }
  
  // Helper: Finde beste Matches für eine Runde
  function findBestMatchesForRound(availablePlayers, currentRound) {
    const matches = []
    const usedPlayers = new Set()
    const availableList = availablePlayers.filter(p => !usedPlayers.has(p.id))
    
    // Für jeden Court
    for (let courtNum = 1; courtNum <= matchesPerRound && availableList.length >= 4; courtNum++) {
      let bestMatch = null
      let bestScore = Infinity
      
      // Generiere mögliche Kombinationen
      const playerIndices = availableList.map(p => getPlayerIndex(p.id))
      const combinations = generateCombinations(playerIndices, 4)
      
      // Begrenze Kombinationen für Performance (mit Seed-basierter Auswahl)
      let testCombinations = combinations
      if (combinations.length > 50) {
        // Verwende Seed für konsistente aber verschiedene Auswahl
        const shuffled = randomGen.shuffle(combinations)
        testCombinations = shuffled.slice(0, 50)
      }
      
      // Teste jede Kombination
      for (const combo of testCombinations) {
        // Probiere verschiedene Team-Aufteilungen
        const teamSplits = [
          [[combo[0], combo[1]], [combo[2], combo[3]]],
          [[combo[0], combo[2]], [combo[1], combo[3]]],
          [[combo[0], combo[3]], [combo[1], combo[2]]]
        ]
        
        for (const [[p1, p2], [p3, p4]] of teamSplits) {
          const score = calculatePairingScore(p1, p2, p3, p4, currentRound, courtNum)
          
          if (score < bestScore) {
            bestScore = score
            bestMatch = {
              court: courtNum,
              players: [
                players[p1].id,
                players[p2].id,
                players[p3].id,
                players[p4].id
              ],
              playerIndices: [p1, p2, p3, p4]
            }
          }
        }
      }
      
      if (bestMatch) {
        matches.push(bestMatch)
        // Markiere Spieler als verwendet
        bestMatch.players.forEach(playerId => usedPlayers.add(playerId))
        // Entferne verwendete Spieler aus verfügbarer Liste
        availableList.splice(0, availableList.length, 
          ...availableList.filter(p => !usedPlayers.has(p.id))
        )
      }
    }
    
    return { matches, restingPlayers: availableList }
  }
  
  // Generiere Schedule
  for (let round = 0; round < rounds; round++) {
    const availablePlayers = [...players]
    const { matches, restingPlayers } = findBestMatchesForRound(availablePlayers, round)
    
    // Update Tracking-Daten
    matches.forEach(match => {
      const [p1, p2, p3, p4] = match.playerIndices
      
      // Update Partner-Matrix
      partnerMatrix[p1][p2]++
      partnerMatrix[p2][p1]++
      partnerMatrix[p3][p4]++
      partnerMatrix[p4][p3]++
      
      // Update Gegner-Matrix
      opponentMatrix[p1][p3]++
      opponentMatrix[p1][p4]++
      opponentMatrix[p2][p3]++
      opponentMatrix[p2][p4]++
      opponentMatrix[p3][p1]++
      opponentMatrix[p4][p1]++
      opponentMatrix[p3][p2]++
      opponentMatrix[p4][p2]++
      
      // Update Spiele und letzte Runde
      ;[p1, p2, p3, p4].forEach(idx => {
        gamesPlayed[idx]++
        lastPlayed[idx] = round
        courtAssignments[idx].push(match.court)
      })
    })
    
    schedule.push({
      round: round + 1,
      matches: matches.map(m => ({
        court: m.court,
        // Team-basierte Struktur für Americano
        team1: [
          players.find(p => p.id === m.players[0]),
          players.find(p => p.id === m.players[1])
        ].filter(p => p), // Filter out undefined
        team2: [
          players.find(p => p.id === m.players[2]),
          players.find(p => p.id === m.players[3])
        ].filter(p => p), // Filter out undefined
        players: m.players // Keep the player IDs for reference
      })),
      waitingPlayers: restingPlayers  // Vollständige Spieler-Objekte
    })
  }

  // Füge Statistiken hinzu
  return {
    schedule,
    statistics: {
      partnerMatrix,
      opponentMatrix,
      gamesPlayed,
      maxGames: Math.max(...gamesPlayed),
      minGames: Math.min(...gamesPlayed),
      seed,
      regenerateCount: options.regenerateCount || 0
    }
  }
}

// Export für Komponenten
export const canRegenerateSchedule = (regenerateCount) => {
  // Nach 4 Regenerierungen beginnt der Zyklus von vorne
  return true // Immer erlauben, aber nach 4x wiederholt sich das Muster
}

export const getRegenerateMessage = (regenerateCount) => {
  const variant = regenerateCount % 4
  const messages = [
    "Neue Spielplan-Variante generieren",
    "Alternative Paarungen erstellen",
    "Andere Kombinationen ausprobieren",
    "Weitere Variante generieren"
  ]
  
  if (regenerateCount >= 4) {
    return `${messages[variant]} (Variante ${variant + 1}/4)`
  }
  
  return messages[variant]
}