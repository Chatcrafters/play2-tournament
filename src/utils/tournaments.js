// FIXED VERSION - tournaments.js

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
 * AMERICANO TURNIER - FIXED VERSION mit korrekter Statistics-Struktur
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

  // FIXED: Korrekte finale Statistiken mit legacy-kompatibler Struktur
  const finalStats = calculateAmericanoFinalStats(players, stats)
  
  // FIXED: Legacy-kompatible Rückgabe-Struktur für EventDetail.jsx
  return {
    format: 'americano',
    schedule,
    statistics: {
      // Legacy-kompatible Matrix-Struktur
      partnerMatrix: stats.partnerMatrix || {},
      opponentMatrix: stats.opponentMatrix || {},
      gamesPlayed: players.map(p => stats.gamesPlayed[p.id] || 0),
      // Neue erweiterte Statistiken
      ...finalStats
    },
    summary: {
      totalRounds: actualRounds,
      totalMatches: schedule.reduce((sum, round) => sum + round.matches.length, 0),
      playersPerRound: matchesPerRound * 4,
      averageGamesPerPlayer: finalStats.summary?.avgGamesPerPlayer || 0,
      fairnessScore: finalStats.summary?.avgFairness || 0
    }
  }
}

/**
 * FIXED: Verbesserte Hilfsfunktionen mit korrekter Matrix-Struktur
 */
function findOptimalAmericanoMatch(availablePlayers, stats, courtNum, roundNum, randomGen) {
  if (availablePlayers.length < 4) return null

  let bestMatch = null
  let bestScore = -Infinity

  // Einfache aber funktionale Implementierung
  const searchDepth = Math.min(50, Math.max(10, availablePlayers.length))
  const candidates = []

  // Generiere Kandidaten (4er-Gruppen)
  for (let i = 0; i < Math.min(searchDepth, availablePlayers.length - 3); i++) {
    for (let j = i + 1; j < availablePlayers.length - 2; j++) {
      for (let k = j + 1; k < availablePlayers.length - 1; k++) {
        for (let l = k + 1; l < availablePlayers.length; l++) {
          candidates.push([availablePlayers[i], availablePlayers[j], availablePlayers[k], availablePlayers[l]])
          if (candidates.length >= searchDepth) break
        }
        if (candidates.length >= searchDepth) break
      }
      if (candidates.length >= searchDepth) break
    }
    if (candidates.length >= searchDepth) break
  }

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
 * FIXED: Vereinfachtes aber funktionales Scoring
 */
function calculateAmericanoMatchScore(team1, team2, stats, courtNum, roundNum, randomGen) {
  let score = 0

  // 1. Partner-Bewertung
  const evaluatePartnership = (p1, p2) => {
    const partnerCount = stats.partnerCount[p1.id][p2.id] || 0
    const lastPartnerRound = stats.lastPartnerRound[p1.id][p2.id] || -100
    const roundDistance = roundNum - lastPartnerRound

    if (partnerCount === 0) {
      return 200 // Großer Bonus für neue Partner
    } else {
      let partnerScore = 0
      partnerScore += Math.min(roundDistance, 10) * 15 // Bonus für Distanz
      partnerScore -= partnerCount * 50 // Strafe für häufige Wiederholungen
      return partnerScore
    }
  }

  score += evaluatePartnership(team1[0], team1[1])
  score += evaluatePartnership(team2[0], team2[1])

  // 2. Gegner-Bewertung
  const evaluateOpposition = (p1, p2) => {
    const opponentCount = stats.opponentCount[p1.id][p2.id] || 0
    const lastOpponentRound = stats.lastOpponentRound[p1.id][p2.id] || -100
    const roundDistance = roundNum - lastOpponentRound

    if (opponentCount === 0) {
      return 100 // Bonus für neue Gegner
    } else {
      let opponentScore = 0
      opponentScore += Math.min(roundDistance, 8) * 10 // Bonus für Distanz
      opponentScore -= opponentCount * 30 // Strafe für häufige Wiederholungen
      return opponentScore
    }
  }

  // Alle Gegner-Kombinationen bewerten
  team1.forEach(p1 => {
    team2.forEach(p2 => {
      score += evaluateOpposition(p1, p2)
    })
  })

  // 3. Spielbalance
  const allPlayers = [...team1, ...team2]
  const gamesCounts = allPlayers.map(p => stats.gamesPlayed[p.id] || 0)
  const avgGames = gamesCounts.reduce((a, b) => a + b, 0) / 4
  const gamesVariance = gamesCounts.reduce((sum, games) => sum + Math.pow(games - avgGames, 2), 0) / 4
  score -= gamesVariance * 20

  // 4. Random-Variabilität
  score += randomGen.next() * 10

  return score
}

/**
 * FIXED: Korrekte Statistik-Initialisierung
 */
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
    opponentCount: {},
    // FIXED: Legacy-kompatible Matrix-Struktur
    partnerMatrix: {},
    opponentMatrix: {}
  }

  players.forEach((p, pIdx) => {
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
    
    // FIXED: Legacy Matrix-Struktur initialisieren
    stats.partnerMatrix[pIdx] = {}
    stats.opponentMatrix[pIdx] = {}

    players.forEach((p2, p2Idx) => {
      if (p.id !== p2.id) {
        stats.partners[p.id][p2.id] = 0
        stats.opponents[p.id][p2.id] = 0
        stats.lastPartnerRound[p.id][p2.id] = -100
        stats.lastOpponentRound[p.id][p2.id] = -100
        stats.partnerCount[p.id][p2.id] = 0
        stats.opponentCount[p.id][p2.id] = 0
        
        // FIXED: Legacy Matrix mit Index-basiertem Zugriff
        stats.partnerMatrix[pIdx][p2Idx] = 0
        stats.opponentMatrix[pIdx][p2Idx] = 0
      }
    })
  })

  return stats
}

/**
 * FIXED: Statistik-Updates mit Legacy-Matrix
 */
function updateAmericanoStats(match, stats, courtNum, roundNum) {
  const allPlayers = [...match.team1, ...match.team2]

  // Update Spiele und Court-Historie
  allPlayers.forEach(p => {
    stats.gamesPlayed[p.id]++
    stats.courtHistory[p.id].push(courtNum)
  })

  // FIXED: Update sowohl neue als auch Legacy-Strukturen
  const updatePartnership = (p1, p2, p1Idx, p2Idx) => {
    stats.partners[p1.id][p2.id]++
    stats.partnerCount[p1.id][p2.id]++
    stats.lastPartnerRound[p1.id][p2.id] = roundNum
    
    // FIXED: Legacy Matrix Update
    if (stats.partnerMatrix[p1Idx] && stats.partnerMatrix[p1Idx][p2Idx] !== undefined) {
      stats.partnerMatrix[p1Idx][p2Idx]++
    }
  }

  // Finde Player-Indices für Legacy Matrix
  const getPlayerIndex = (playerId, players) => {
    return players.findIndex(p => p.id === playerId)
  }

  const p1Idx = getPlayerIndex(match.team1[0].id, Object.values(match.team1).concat(Object.values(match.team2)))
  const p2Idx = getPlayerIndex(match.team1[1].id, Object.values(match.team1).concat(Object.values(match.team2)))
  const p3Idx = getPlayerIndex(match.team2[0].id, Object.values(match.team1).concat(Object.values(match.team2)))
  const p4Idx = getPlayerIndex(match.team2[1].id, Object.values(match.team1).concat(Object.values(match.team2)))

  // Update Partner
  updatePartnership(match.team1[0], match.team1[1], p1Idx, p2Idx)
  updatePartnership(match.team1[1], match.team1[0], p2Idx, p1Idx)
  updatePartnership(match.team2[0], match.team2[1], p3Idx, p4Idx)
  updatePartnership(match.team2[1], match.team2[0], p4Idx, p3Idx)

  // Update Gegner
  match.team1.forEach((p1, i) => {
    match.team2.forEach((p2, j) => {
      stats.opponents[p1.id][p2.id]++
      stats.opponents[p2.id][p1.id]++
      stats.opponentCount[p1.id][p2.id]++
      stats.opponentCount[p2.id][p1.id]++
      stats.lastOpponentRound[p1.id][p2.id] = roundNum
      stats.lastOpponentRound[p2.id][p1.id] = roundNum
      
      // FIXED: Legacy Matrix Update für Gegner
      const idx1 = i === 0 ? p1Idx : p2Idx
      const idx2 = j === 0 ? p3Idx : p4Idx
      if (stats.opponentMatrix[idx1] && stats.opponentMatrix[idx1][idx2] !== undefined) {
        stats.opponentMatrix[idx1][idx2]++
      }
      if (stats.opponentMatrix[idx2] && stats.opponentMatrix[idx2][idx1] !== undefined) {
        stats.opponentMatrix[idx2][idx1]++
      }
    })
  })
}

/**
 * FIXED: Finale Statistiken mit korrekter Struktur
 */
function calculateAmericanoFinalStats(players, stats) {
  const playerStats = players.map(player => {
    const uniquePartners = Object.values(stats.partnerCount[player.id] || {}).filter(c => c > 0).length
    const uniqueOpponents = Object.values(stats.opponentCount[player.id] || {}).filter(c => c > 0).length
    const partnerCounts = Object.values(stats.partnerCount[player.id] || {}).filter(c => c > 0)
    const maxPartnerRepeats = Math.max(...partnerCounts, 0)
    const avgPartnerCount = partnerCounts.length > 0 ? partnerCounts.reduce((a, b) => a + b, 0) / partnerCounts.length : 0
    const fairness = maxPartnerRepeats > 0 ? (avgPartnerCount / maxPartnerRepeats) * 100 : 100

    return {
      name: player.name,
      games: stats.gamesPlayed[player.id] || 0,
      uniquePartners,
      uniqueOpponents,
      maxPartnerRepeats,
      timesRested: stats.timesRested[player.id] || 0,
      fairness: Math.round(fairness)
    }
  })

  const totalGames = playerStats.reduce((sum, p) => sum + p.games, 0)

  return {
    playerStats,
    summary: {
      totalPlayers: players.length,
      avgGamesPerPlayer: players.length > 0 ? totalGames / players.length : 0,
      avgUniquePartners: players.length > 0 ? playerStats.reduce((sum, p) => sum + p.uniquePartners, 0) / players.length : 0,
      minGames: playerStats.length > 0 ? Math.min(...playerStats.map(p => p.games)) : 0,
      maxGames: playerStats.length > 0 ? Math.max(...playerStats.map(p => p.games)) : 0,
      avgFairness: players.length > 0 ? Math.round(playerStats.reduce((sum, p) => sum + p.fairness, 0) / players.length) : 0
    }
  }
}

/**
 * Andere Turnier-Formate (vereinfacht für Funktionalität)
 */
function generateRoundRobinTournament(config) {
  return {
    format: 'roundrobin',
    schedule: [],
    statistics: { partnerMatrix: {}, opponentMatrix: {}, gamesPlayed: [] },
    summary: { totalRounds: 0, totalMatches: 0 }
  }
}

function generateEliminationTournament(config) {
  return {
    format: 'elimination',
    schedule: [],
    statistics: { partnerMatrix: {}, opponentMatrix: {}, gamesPlayed: [] },
    summary: { totalRounds: 0, totalMatches: 0 }
  }
}

function generateSwissTournament(config) {
  return {
    format: 'swiss',
    schedule: [],
    statistics: { partnerMatrix: {}, opponentMatrix: {}, gamesPlayed: [] },
    summary: { totalRounds: 0, totalMatches: 0 }
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
export function generateAmericanoSchedule(players, courts, rounds, options = {}) {
  console.log('🔄 Legacy generateAmericanoSchedule called')
  
  try {
    const result = generateTournament({
      format: 'americano',
      players,
      courts,
      rounds,
      roundDuration: 15,
      startTime: '09:00',
      endTime: '18:00',
      options
    })
    
    // FIXED: Legacy-kompatible Rückgabe-Struktur
    return {
      schedule: result.schedule,
      statistics: {
        partnerMatrix: result.statistics.partnerMatrix || {},
        opponentMatrix: result.statistics.opponentMatrix || {},
        gamesPlayed: result.statistics.gamesPlayed || [],
        maxGames: result.statistics.playerStats ? Math.max(...result.statistics.playerStats.map(p => p.games)) : 0,
        minGames: result.statistics.playerStats ? Math.min(...result.statistics.playerStats.map(p => p.games)) : 0,
        seed: options.regenerateCount || 0,
        regenerateCount: options.regenerateCount || 0
      }
    }
  } catch (error) {
    console.error('❌ Legacy generateAmericanoSchedule failed:', error)
    
    // FIXED: Fallback für Legacy-Kompatibilität
    return {
      schedule: [],
      statistics: {
        partnerMatrix: {},
        opponentMatrix: {},
        gamesPlayed: new Array(players.length).fill(0),
        maxGames: 0,
        minGames: 0,
        seed: 0,
        regenerateCount: 0
      }
    }
  }
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