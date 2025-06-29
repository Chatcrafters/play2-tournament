// src/utils/tournaments.js
// Einheitlicher Turnier-Algorithmus für alle Formate

/**
 * Hauptfunktion: Generiert Turniere basierend auf Format
 * @param {Object} config - Turnier-Konfiguration
 * @returns {Object} Generierter Spielplan mit Statistiken
 */
export function generateTournament(config) {
  const {
    format = 'americano',
    players = [],
    courts = 1,
    rounds = null,
    roundDuration = 15,
    startTime = '09:00',
    endTime = '18:00',
    breaks = [],
    options = {}
  } = config

  // Validierung
  validateTournamentConfig(config)

  switch (format.toLowerCase()) {
    case 'americano':
      return generateAmericanoTournament(config)
    case 'roundrobin':
      return generateRoundRobinTournament(config)
    case 'elimination':
      return generateEliminationTournament(config)
    case 'swiss':
      return generateSwissTournament(config)
    default:
      throw new Error(`Unbekanntes Turnier-Format: ${format}`)
  }
}

/**
 * AMERICANO TURNIER - Optimierter Algorithmus mit maximaler Partner/Gegner-Durchmischung
 */
function generateAmericanoTournament(config) {
  const {
    players,
    courts,
    rounds: maxRounds,
    roundDuration,
    startTime,
    endTime,
    breaks = [],
    options = {}
  } = config

  console.log('=== AMERICANO TOURNAMENT GENERATOR ===')
  console.log(`Spieler: ${players.length}, Courts: ${courts}, MaxRounds: ${maxRounds}`)

  // Berechne optimale Rundenzahl falls nicht angegeben
  const totalMinutes = calculateTotalMinutes(startTime, endTime, breaks)
  const calculatedRounds = maxRounds || Math.floor(totalMinutes / roundDuration)
  const actualRounds = Math.min(calculatedRounds, 25) // Begrenze auf 25 Runden

  const schedule = []
  const stats = initializePlayerStats(players)
  const playersPerMatch = 4
  const matchesPerRound = Math.min(courts, Math.floor(players.length / playersPerMatch))

  // Seed-System für verschiedene Varianten
  const seed = (options.regenerateCount || 0) % 4
  const randomGen = createSeededRandom(seed + players.length)

  // Generiere Runden
  for (let roundNum = 0; roundNum < actualRounds; roundNum++) {
    console.log(`\n--- Generiere Runde ${roundNum + 1} ---`)
    
    const roundMatches = []
    const usedPlayers = new Set()
    
    // Sortiere verfügbare Spieler nach Priorität
    const availablePlayers = [...players].sort((a, b) => {
      // 1. Primär: Weniger Spiele gespielt
      const gamesDiff = stats.gamesPlayed[a.id] - stats.gamesPlayed[b.id]
      if (gamesDiff !== 0) return gamesDiff
      
      // 2. Sekundär: Länger pausiert
      const restDiff = (roundNum - stats.lastRestRound[b.id]) - (roundNum - stats.lastRestRound[a.id])
      if (restDiff !== 0) return restDiff
      
      // 3. Tertiär: Weniger verschiedene Partner
      const uniquePartnersA = Object.values(stats.partnerCount[a.id]).filter(c => c > 0).length
      const uniquePartnersB = Object.values(stats.partnerCount[b.id]).filter(c => c > 0).length
      return uniquePartnersA - uniquePartnersB
    })

    // Generiere Matches für diese Runde
    for (let court = 1; court <= matchesPerRound && availablePlayers.length >= 4; court++) {
      const match = findOptimalAmericanoMatch(
        availablePlayers.filter(p => !usedPlayers.has(p.id)),
        stats,
        court,
        roundNum,
        randomGen
      )

      if (match) {
        roundMatches.push({
          court,
          team1: match.team1,
          team2: match.team2,
          players: [...match.team1, ...match.team2].map(p => p.id)
        })

        // Update Statistiken
        updateAmericanoStats(match, stats, court, roundNum)

        // Markiere Spieler als verwendet
        match.team1.forEach(p => usedPlayers.add(p.id))
        match.team2.forEach(p => usedPlayers.add(p.id))
      }
    }

    // Pausende Spieler
    const waitingPlayers = players.filter(p => !usedPlayers.has(p.id))
    waitingPlayers.forEach(p => {
      stats.timesRested[p.id]++
      stats.lastRestRound[p.id] = roundNum
    })

    // Berechne Startzeit
    const currentStartTime = calculateRoundStartTime(startTime, roundNum, roundDuration, breaks)

    schedule.push({
      round: roundNum + 1,
      startTime: currentStartTime,
      endTime: addMinutesToTime(currentStartTime, roundDuration),
      matches: roundMatches,
      waitingPlayers
    })
  }

  // Berechne finale Statistiken
  const finalStats = calculateAmericanoFinalStats(players, stats)

  return {
    format: 'americano',
    schedule,
    statistics: finalStats,
    summary: {
      totalRounds: actualRounds,
      totalMatches: schedule.reduce((sum, round) => sum + round.matches.length, 0),
      playersPerRound: matchesPerRound * 4,
      averageGamesPerPlayer: finalStats.summary.avgGamesPerPlayer,
      fairnessScore: finalStats.summary.avgFairness
    }
  }
}

/**
 * Finde optimales Match für Americano mit verbessertem Scoring
 */
function findOptimalAmericanoMatch(availablePlayers, stats, courtNum, roundNum, randomGen) {
  if (availablePlayers.length < 4) return null

  let bestMatch = null
  let bestScore = -Infinity

  // Adaptive Suchtiefe
  const searchDepth = Math.min(200, calculateSearchDepth(availablePlayers.length))
  const candidates = selectAmericanoCandidates(availablePlayers, stats, roundNum, searchDepth)

  // Teste Kandidaten-Kombinationen
  for (const fourPlayers of candidates) {
    // Teste alle möglichen Team-Aufteilungen
    const teamConfigs = [
      [[fourPlayers[0], fourPlayers[1]], [fourPlayers[2], fourPlayers[3]]],
      [[fourPlayers[0], fourPlayers[2]], [fourPlayers[1], fourPlayers[3]]],
      [[fourPlayers[0], fourPlayers[3]], [fourPlayers[1], fourPlayers[2]]]
    ]

    for (const [team1, team2] of teamConfigs) {
      const score = calculateAmericanoMatchScore(team1, team2, stats, courtNum, roundNum, randomGen)

      if (score > bestScore) {
        bestScore = score
        bestMatch = { team1, team2 }
      }
    }
  }

  return bestMatch
}

/**
 * Berechne Match-Score für Americano mit Rundendistanz-Berücksichtigung
 */
function calculateAmericanoMatchScore(team1, team2, stats, courtNum, roundNum, randomGen) {
  let score = 0

  // 1. PARTNER-QUALITÄT (höchste Priorität)
  const evaluatePartnership = (p1, p2) => {
    const partnerCount = stats.partnerCount[p1.id][p2.id] || 0
    const lastPartnerRound = stats.lastPartnerRound[p1.id][p2.id] || -100
    const roundDistance = roundNum - lastPartnerRound

    if (partnerCount === 0) {
      return 200 // Großer Bonus für neue Partner
    } else {
      let partnerScore = 0
      partnerScore += Math.min(roundDistance, 10) * 15 // Bonus für Distanz
      partnerScore -= partnerCount * 80 // Strafe für häufige Wiederholungen
      
      // Extra-Strafe für aufeinanderfolgende Partner
      if (roundDistance < 3) {
        partnerScore -= (3 - roundDistance) * 50
      }
      
      return partnerScore
    }
  }

  score += evaluatePartnership(team1[0], team1[1])
  score += evaluatePartnership(team2[0], team2[1])

  // 2. GEGNER-QUALITÄT
  const evaluateOpposition = (p1, p2) => {
    const opponentCount = stats.opponentCount[p1.id][p2.id] || 0
    const lastOpponentRound = stats.lastOpponentRound[p1.id][p2.id] || -100
    const roundDistance = roundNum - lastOpponentRound

    if (opponentCount === 0) {
      return 150 // Bonus für neue Gegner
    } else {
      let opponentScore = 0
      opponentScore += Math.min(roundDistance, 8) * 12 // Bonus für Distanz
      opponentScore -= opponentCount * 40 // Strafe für häufige Wiederholungen
      
      // Extra-Strafe für aufeinanderfolgende Gegner
      if (roundDistance < 2) {
        opponentScore -= (2 - roundDistance) * 60
      }
      
      return opponentScore
    }
  }

  // Alle Gegner-Kombinationen bewerten
  team1.forEach(p1 => {
    team2.forEach(p2 => {
      score += evaluateOpposition(p1, p2)
    })
  })

  // 3. SPIELBALANCE
  const allPlayers = [...team1, ...team2]
  const gamesCounts = allPlayers.map(p => stats.gamesPlayed[p.id])
  const avgGames = gamesCounts.reduce((a, b) => a + b, 0) / 4
  const gamesVariance = gamesCounts.reduce((sum, games) => sum + Math.pow(games - avgGames, 2), 0) / 4
  score -= gamesVariance * 25

  // 4. PAUSE-FAIRNESS
  allPlayers.forEach(p => {
    const roundsSinceRest = roundNum - stats.lastRestRound[p.id]
    if (roundsSinceRest > 3) {
      score += roundsSinceRest * 8
    }
  })

  // 5. SKILL-BALANCE (falls vorhanden)
  if (team1[0].skillLevel !== undefined) {
    const getSkillValue = (player) => {
      if (typeof player.skillLevel === 'string') {
        const skillMap = { 'C': 1, 'B-': 2, 'B': 3, 'B+': 4, 'A-': 5, 'A': 6 }
        return skillMap[player.skillLevel] || 3
      }
      return player.skillLevel || 3
    }

    const team1Skill = getSkillValue(team1[0]) + getSkillValue(team1[1])
    const team2Skill = getSkillValue(team2[0]) + getSkillValue(team2[1])
    const skillDiff = Math.abs(team1Skill - team2Skill)
    score -= skillDiff * 15
  }

  // 6. COURT-ROTATION
  allPlayers.forEach(p => {
    const lastCourt = stats.courtHistory[p.id][stats.courtHistory[p.id].length - 1]
    if (lastCourt === courtNum) {
      score -= 8
    }
  })

  // 7. RANDOM-VARIABILITÄT
  score += randomGen.next() * 10

  return score
}

/**
 * ROUND ROBIN TURNIER
 */
function generateRoundRobinTournament(config) {
  const { players, courts, roundDuration } = config
  
  if (players.length < 2) {
    throw new Error('Round Robin benötigt mindestens 2 Spieler')
  }

  const schedule = []
  const totalRounds = players.length % 2 === 0 ? players.length - 1 : players.length
  
  // Generiere alle Paarungen
  for (let round = 0; round < totalRounds; round++) {
    const matches = []
    const roundPairs = generateRoundRobinPairs(players, round)
    
    // Verteile Paarungen auf Courts
    for (let i = 0; i < roundPairs.length && i < courts; i++) {
      matches.push({
        court: i + 1,
        team1: [roundPairs[i][0]],
        team2: [roundPairs[i][1]],
        players: [roundPairs[i][0].id, roundPairs[i][1].id]
      })
    }

    schedule.push({
      round: round + 1,
      matches,
      waitingPlayers: []
    })
  }

  return {
    format: 'roundrobin',
    schedule,
    statistics: {},
    summary: {
      totalRounds,
      totalMatches: schedule.reduce((sum, round) => sum + round.matches.length, 0)
    }
  }
}

/**
 * SWISS SYSTEM TURNIER
 */
function generateSwissTournament(config) {
  const { players, courts, rounds = 5 } = config
  
  const schedule = []
  const playerStats = {}
  
  // Initialisiere Stats
  players.forEach(p => {
    playerStats[p.id] = {
      wins: 0,
      losses: 0,
      opponents: new Set()
    }
  })

  for (let round = 0; round < rounds; round++) {
    // Sortiere nach Punkten
    const sortedPlayers = [...players].sort((a, b) => {
      const aPoints = playerStats[a.id].wins
      const bPoints = playerStats[b.id].wins
      return bPoints - aPoints
    })

    const matches = []
    const usedPlayers = new Set()

    // Paarung nach Swiss-System
    for (let i = 0; i < sortedPlayers.length - 1 && matches.length < courts; i++) {
      const player1 = sortedPlayers[i]
      if (usedPlayers.has(player1.id)) continue

      // Finde passenden Gegner
      for (let j = i + 1; j < sortedPlayers.length; j++) {
        const player2 = sortedPlayers[j]
        if (usedPlayers.has(player2.id)) continue
        if (playerStats[player1.id].opponents.has(player2.id)) continue

        matches.push({
          court: matches.length + 1,
          team1: [player1],
          team2: [player2],
          players: [player1.id, player2.id]
        })

        usedPlayers.add(player1.id)
        usedPlayers.add(player2.id)
        break
      }
    }

    schedule.push({
      round: round + 1,
      matches,
      waitingPlayers: players.filter(p => !usedPlayers.has(p.id))
    })
  }

  return {
    format: 'swiss',
    schedule,
    statistics: {},
    summary: {
      totalRounds: rounds,
      totalMatches: schedule.reduce((sum, round) => sum + round.matches.length, 0)
    }
  }
}

/**
 * ELIMINATION TURNIER
 */
function generateEliminationTournament(config) {
  const { players } = config
  
  // Bestimme nächste Potenz von 2
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(players.length)))
  const firstRoundByes = nextPowerOf2 - players.length
  
  const schedule = []
  let currentPlayers = [...players]
  let round = 1

  while (currentPlayers.length > 1) {
    const matches = []
    const nextRoundPlayers = []

    // Erste Runde: Berücksichtige Byes
    if (round === 1 && firstRoundByes > 0) {
      // Füge Spieler mit Bye direkt zur nächsten Runde hinzu
      for (let i = 0; i < firstRoundByes; i++) {
        nextRoundPlayers.push(currentPlayers[i])
      }
      currentPlayers = currentPlayers.slice(firstRoundByes)
    }

    // Erstelle Matches
    for (let i = 0; i < currentPlayers.length; i += 2) {
      if (i + 1 < currentPlayers.length) {
        matches.push({
          court: matches.length + 1,
          team1: [currentPlayers[i]],
          team2: [currentPlayers[i + 1]],
          players: [currentPlayers[i].id, currentPlayers[i + 1].id]
        })
      }
    }

    schedule.push({
      round,
      matches,
      waitingPlayers: []
    })

    // Simuliere Gewinner (für Demo - normalerweise durch echte Ergebnisse)
    matches.forEach(match => {
      const winner = Math.random() > 0.5 ? match.team1[0] : match.team2[0]
      nextRoundPlayers.push(winner)
    })

    currentPlayers = nextRoundPlayers
    round++
  }

  return {
    format: 'elimination',
    schedule,
    statistics: {},
    summary: {
      totalRounds: round - 1,
      totalMatches: schedule.reduce((sum, round) => sum + round.matches.length, 0)
    }
  }
}

/**
 * HILFSFUNKTIONEN
 */

function validateTournamentConfig(config) {
  const { players, courts, format } = config
  
  if (!players || players.length < 2) {
    throw new Error('Mindestens 2 Spieler erforderlich')
  }
  
  if (!courts || courts < 1) {
    throw new Error('Mindestens 1 Court erforderlich')
  }
  
  if (format === 'americano' && players.length < 4) {
    throw new Error('Americano benötigt mindestens 4 Spieler')
  }
}

function initializePlayerStats(players) {
  const stats = {
    gamesPlayed: {},
    partners: {},
    opponents: {},
    timesRested: {},
    lastRestRound: {},
    courtHistory: {},
    lastPartnerRound: {},
    lastOpponentRound: {},
    partnerCount: {},
    opponentCount: {}
  }

  players.forEach(p => {
    stats.gamesPlayed[p.id] = 0
    stats.partners[p.id] = {}
    stats.opponents[p.id] = {}
    stats.timesRested[p.id] = 0
    stats.lastRestRound[p.id] = -10
    stats.courtHistory[p.id] = []
    stats.lastPartnerRound[p.id] = {}
    stats.lastOpponentRound[p.id] = {}
    stats.partnerCount[p.id] = {}
    stats.opponentCount[p.id] = {}

    players.forEach(p2 => {
      if (p.id !== p2.id) {
        stats.partners[p.id][p2.id] = 0
        stats.opponents[p.id][p2.id] = 0
        stats.lastPartnerRound[p.id][p2.id] = -100
        stats.lastOpponentRound[p.id][p2.id] = -100
        stats.partnerCount[p.id][p2.id] = 0
        stats.opponentCount[p.id][p2.id] = 0
      }
    })
  })

  return stats
}

function updateAmericanoStats(match, stats, courtNum, roundNum) {
  const allPlayers = [...match.team1, ...match.team2]

  // Update Spiele und Court-Historie
  allPlayers.forEach(p => {
    stats.gamesPlayed[p.id]++
    stats.courtHistory[p.id].push(courtNum)
  })

  // Update Partner
  const updatePartnership = (p1, p2) => {
    stats.partners[p1.id][p2.id]++
    stats.partnerCount[p1.id][p2.id]++
    stats.lastPartnerRound[p1.id][p2.id] = roundNum
  }

  updatePartnership(match.team1[0], match.team1[1])
  updatePartnership(match.team1[1], match.team1[0])
  updatePartnership(match.team2[0], match.team2[1])
  updatePartnership(match.team2[1], match.team2[0])

  // Update Gegner
  match.team1.forEach(p1 => {
    match.team2.forEach(p2 => {
      stats.opponents[p1.id][p2.id]++
      stats.opponents[p2.id][p1.id]++
      stats.opponentCount[p1.id][p2.id]++
      stats.opponentCount[p2.id][p1.id]++
      stats.lastOpponentRound[p1.id][p2.id] = roundNum
      stats.lastOpponentRound[p2.id][p1.id] = roundNum
    })
  })
}

function selectAmericanoCandidates(players, stats, roundNum, maxCandidates) {
  const candidates = []
  const topPriority = players.slice(0, Math.min(8, players.length))

  // Generiere Top-Kombinationen
  for (let i = 0; i < topPriority.length - 3; i++) {
    for (let j = i + 1; j < topPriority.length - 2; j++) {
      for (let k = j + 1; k < topPriority.length - 1; k++) {
        for (let l = k + 1; l < topPriority.length; l++) {
          candidates.push([topPriority[i], topPriority[j], topPriority[k], topPriority[l]])
          if (candidates.length >= maxCandidates) {
            return candidates
          }
        }
      }
    }
  }

  return candidates
}

function calculateSearchDepth(availablePlayers) {
  if (availablePlayers <= 8) return 70
  if (availablePlayers <= 12) return 150
  if (availablePlayers <= 20) return 250
  return 400
}

function calculateAmericanoFinalStats(players, stats) {
  const playerStats = players.map(player => {
    const uniquePartners = Object.values(stats.partnerCount[player.id]).filter(c => c > 0).length
    const uniqueOpponents = Object.values(stats.opponentCount[player.id]).filter(c => c > 0).length
    const partnerCounts = Object.values(stats.partnerCount[player.id]).filter(c => c > 0)
    const maxPartnerRepeats = Math.max(...partnerCounts, 0)
    const avgPartnerCount = partnerCounts.length > 0 ? partnerCounts.reduce((a, b) => a + b, 0) / partnerCounts.length : 0
    const fairness = maxPartnerRepeats > 0 ? (avgPartnerCount / maxPartnerRepeats) * 100 : 100

    return {
      name: player.name,
      games: stats.gamesPlayed[player.id],
      uniquePartners,
      uniqueOpponents,
      maxPartnerRepeats,
      timesRested: stats.timesRested[player.id],
      fairness: Math.round(fairness)
    }
  })

  const totalGames = playerStats.reduce((sum, p) => sum + p.games, 0)

  return {
    playerStats,
    summary: {
      totalPlayers: players.length,
      avgGamesPerPlayer: totalGames / players.length,
      avgUniquePartners: playerStats.reduce((sum, p) => sum + p.uniquePartners, 0) / players.length,
      minGames: Math.min(...playerStats.map(p => p.games)),
      maxGames: Math.max(...playerStats.map(p => p.games)),
      avgFairness: Math.round(playerStats.reduce((sum, p) => sum + p.fairness, 0) / players.length)
    }
  }
}

function generateRoundRobinPairs(players, round) {
  const pairs = []
  const n = players.length
  
  if (n % 2 === 1) {
    // Ungerade Anzahl - füge "Bye" hinzu
    const extendedPlayers = [...players, { id: 'bye', name: 'Bye' }]
    return generateRoundRobinPairs(extendedPlayers, round).filter(pair => 
      pair[0].id !== 'bye' && pair[1].id !== 'bye'
    )
  }

  // Gerade Anzahl - Standard Round Robin
  const playersArray = [...players]
  const fixed = playersArray[0]
  const rotating = playersArray.slice(1)

  // Rotiere für diese Runde
  for (let i = 0; i < round; i++) {
    rotating.push(rotating.shift())
  }

  // Erstelle Paarungen
  pairs.push([fixed, rotating[0]])
  for (let i = 1; i < rotating.length / 2 + 1; i++) {
    if (rotating[i] && rotating[rotating.length - i]) {
      pairs.push([rotating[i], rotating[rotating.length - i]])
    }
  }

  return pairs
}

function createSeededRandom(seed) {
  let value = seed
  return {
    next: () => {
      value = (value * 9301 + 49297) % 233280
      return value / 233280
    }
  }
}

function calculateTotalMinutes(startTime, endTime, breaks = []) {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)
  
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60
  }
  
  const breakMinutes = breaks.reduce((sum, breakItem) => sum + (breakItem.duration || 0), 0)
  return totalMinutes - breakMinutes
}

function calculateRoundStartTime(startTime, roundNum, roundDuration, breaks = []) {
  const [hours, minutes] = startTime.split(':').map(Number)
  const startMinutes = hours * 60 + minutes
  const roundMinutes = roundNum * roundDuration
  
  // TODO: Berücksichtige Pausen
  const totalMinutes = startMinutes + roundMinutes
  const finalHours = Math.floor(totalMinutes / 60)
  const finalMins = totalMinutes % 60
  
  return `${finalHours.toString().padStart(2, '0')}:${finalMins.toString().padStart(2, '0')}`
}

function addMinutesToTime(timeStr, minutes) {
  const [hours, mins] = timeStr.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const finalHours = Math.floor(totalMinutes / 60)
  const finalMins = totalMinutes % 60
  
  return `${finalHours.toString().padStart(2, '0')}:${finalMins.toString().padStart(2, '0')}`
}

/**
 * LEGACY SUPPORT - Für Backward Compatibility
 */
export function generateAmericanoSchedule(players, courts, rounds, roundDuration = 15) {
  return generateTournament({
    format: 'americano',
    players,
    courts,
    rounds,
    roundDuration,
    startTime: '09:00',
    endTime: '18:00'
  })
}

export const canRegenerateSchedule = () => true
export const getRegenerateMessage = (count) => {
  const messages = [
    "Neue Spielplan-Variante generieren",
    "Alternative Paarungen erstellen", 
    "Andere Kombinationen ausprobieren",
    "Weitere Variante generieren"
  ]
  return messages[count % 4]
}