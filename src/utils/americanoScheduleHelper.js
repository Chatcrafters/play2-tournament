// src/utils/americanoScheduleHelper.js

/**
 * Optimierter Americano-Algorithmus für maximale Partner/Gegner-Durchmischung
 * Ziel: Jeder spielt mit möglichst vielen verschiedenen Partnern gegen möglichst viele verschiedene Gegner
 */

/**
 * Generate Americano schedule with maximum partner/opponent variety
 * @param {Array} players - Array of player objects with id, name, skillLevel
 * @param {number} courts - Number of available courts
 * @param {number} rounds - Number of rounds to play
 * @param {number} roundDuration - Duration of each round in minutes
 * @returns {Array} Schedule array with rounds and matches
 */
export function generateAmericanoSchedule(players, courts, rounds, roundDuration = 15) {
  console.log('=== VERBESSERTER AMERICANO ALGORITHMUS ===')
  console.log(`Spieler: ${players.length}, Plätze: ${courts}, Runden: ${rounds}`)
  
  const schedule = []
  const playerCount = players.length
  const matchesPerRound = Math.min(courts, Math.floor(playerCount / 4))
  const playersPerRound = matchesPerRound * 4
  
  // Erweiterte Statistik-Tracking mit Rundendistanz
  const stats = {
    gamesPlayed: {},
    partners: {},
    opponents: {},
    timesRested: {},
    lastRestRound: {},
    courtHistory: {},
    lastPartnerRound: {}, // NEU: Wann zuletzt mit Partner gespielt
    lastOpponentRound: {}, // NEU: Wann zuletzt gegen Gegner gespielt
    partnerCount: {},      // NEU: Wie oft mit Partner gespielt
    opponentCount: {}      // NEU: Wie oft gegen Gegner gespielt
  }
  
  // Initialisiere Statistiken
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
    
    // Initialisiere Paarungen
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
  
  // Generiere Runden
  for (let roundNum = 0; roundNum < rounds; roundNum++) {
    console.log(`\n--- Runde ${roundNum + 1} ---`)
    
    const roundMatches = []
    const usedPlayers = new Set()
    
    // Spieler-Priorisierung mit verbessertem Scoring
    const availablePlayers = [...players].sort((a, b) => {
      // Primär: Weniger Spiele gespielt
      const gamesDiff = stats.gamesPlayed[a.id] - stats.gamesPlayed[b.id]
      if (gamesDiff !== 0) return gamesDiff
      
      // Sekundär: Länger pausiert
      const restDiff = (roundNum - stats.lastRestRound[b.id]) - (roundNum - stats.lastRestRound[a.id])
      if (restDiff !== 0) return restDiff
      
      // Tertiär: Weniger verschiedene Partner gehabt
      const uniquePartnersA = Object.values(stats.partnerCount[a.id]).filter(c => c > 0).length
      const uniquePartnersB = Object.values(stats.partnerCount[b.id]).filter(c => c > 0).length
      return uniquePartnersA - uniquePartnersB
    })
    
    // Generiere Matches für diese Runde
    for (let court = 1; court <= matchesPerRound && availablePlayers.length >= 4; court++) {
      const match = findOptimalMatch(
        availablePlayers.filter(p => !usedPlayers.has(p.id)),
        stats,
        court,
        roundNum,
        playerCount
      )
      
      if (match) {
        roundMatches.push({
          court,
          team1: match.team1,
          team2: match.team2
        })
        
        // Update Statistiken
        updateStats(match, stats, court, roundNum)
        
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
    const startTime = roundNum * roundDuration
    
    schedule.push({
      round: roundNum + 1,
      startTime,
      matches: roundMatches,
      waitingPlayers
    })
  }
  
  // Berechne finale Statistiken
  const finalStats = calculateFinalStats(players, stats)
  console.log('\n=== FINALE STATISTIKEN ===')
  console.log(finalStats)
  
  return schedule
}

/**
 * Finde das optimale Match mit verbessertem Algorithmus
 */
function findOptimalMatch(availablePlayers, stats, courtNum, roundNum, totalPlayers) {
  if (availablePlayers.length < 4) return null
  
  let bestMatch = null
  let bestScore = -Infinity
  
  // Adaptive Suchtiefe basierend auf Spielerzahl
  const searchDepth = calculateSearchDepth(availablePlayers.length, totalPlayers)
  
  // Intelligente Vorauswahl von Kandidaten
  const candidates = selectCandidates(availablePlayers, stats, roundNum, searchDepth)
  
  // Teste Kandidaten-Kombinationen
  for (const fourPlayers of candidates) {
    // Teste alle möglichen Team-Aufteilungen (3 Varianten)
    const teamConfigs = [
      [[fourPlayers[0], fourPlayers[1]], [fourPlayers[2], fourPlayers[3]]],
      [[fourPlayers[0], fourPlayers[2]], [fourPlayers[1], fourPlayers[3]]],
      [[fourPlayers[0], fourPlayers[3]], [fourPlayers[1], fourPlayers[2]]]
    ]
    
    for (const [team1, team2] of teamConfigs) {
      const score = calculateMatchScore(team1, team2, stats, courtNum, roundNum)
      
      if (score > bestScore) {
        bestScore = score
        bestMatch = { team1, team2 }
      }
    }
  }
  
  return bestMatch
}

/**
 * Intelligente Kandidatenauswahl für effizientere Suche
 */
function selectCandidates(players, stats, roundNum, maxCandidates) {
  const candidates = []
  
  // Strategie 1: Top-Priorität Spieler kombinieren
  const topPriority = players.slice(0, Math.min(8, players.length))
  
  // Generiere Kombinationen aus Top-Spielern
  for (let i = 0; i < topPriority.length - 3; i++) {
    for (let j = i + 1; j < topPriority.length - 2; j++) {
      for (let k = j + 1; k < topPriority.length - 1; k++) {
        for (let l = k + 1; l < topPriority.length; l++) {
          candidates.push([topPriority[i], topPriority[j], topPriority[k], topPriority[l]])
          
          if (candidates.length >= maxCandidates / 2) {
            break
          }
        }
        if (candidates.length >= maxCandidates / 2) break
      }
      if (candidates.length >= maxCandidates / 2) break
    }
    if (candidates.length >= maxCandidates / 2) break
  }
  
  // Strategie 2: Mische verschiedene Prioritätsstufen
  if (players.length > 8) {
    const midPriority = players.slice(4, Math.min(12, players.length))
    const lowPriority = players.slice(8, Math.min(16, players.length))
    
    // Kombiniere Spieler aus verschiedenen Prioritätsstufen
    for (let i = 0; i < Math.min(4, topPriority.length) && candidates.length < maxCandidates; i++) {
      for (let j = 0; j < Math.min(4, midPriority.length); j++) {
        for (let k = 0; k < Math.min(4, lowPriority.length); k++) {
          // Suche 4. Spieler aus beliebiger Gruppe
          const remainingPlayers = [...topPriority, ...midPriority, ...lowPriority]
            .filter(p => p !== topPriority[i] && p !== midPriority[j] && p !== lowPriority[k])
          
          if (remainingPlayers.length > 0) {
            candidates.push([
              topPriority[i],
              midPriority[j],
              lowPriority[k],
              remainingPlayers[0]
            ])
          }
          
          if (candidates.length >= maxCandidates) break
        }
        if (candidates.length >= maxCandidates) break
      }
      if (candidates.length >= maxCandidates) break
    }
  }
  
  return candidates.slice(0, maxCandidates)
}

/**
 * Berechne adaptive Suchtiefe basierend auf Spielerzahl
 */
function calculateSearchDepth(availablePlayers, totalPlayers) {
  if (availablePlayers <= 8) {
    return 70 // Alle Kombinationen bei wenigen Spielern
  } else if (availablePlayers <= 12) {
    return 150
  } else if (availablePlayers <= 20) {
    return 250
  } else {
    return 400 // Mehr Kombinationen bei vielen Spielern
  }
}

/**
 * Verbessertes Scoring mit Rundendistanz-Berücksichtigung
 */
function calculateMatchScore(team1, team2, stats, courtNum, roundNum) {
  let score = 0
  
  // 1. RUNDENDISTANZ für Partner (SEHR WICHTIG!)
  const partnerDistanceWeight = 200
  const partnerCountWeight = 100
  
  // Team 1 Partner
  const partner1Distance = roundNum - stats.lastPartnerRound[team1[0].id][team1[1].id]
  const partner1Count = stats.partnerCount[team1[0].id][team1[1].id]
  
  if (partner1Count === 0) {
    score += partnerDistanceWeight * 2 // Großer Bonus für neue Partner
  } else {
    score += Math.min(partner1Distance, 10) * 10 // Bonus für lange nicht gespielte Partner
    score -= partner1Count * partnerCountWeight // Strafe für häufige Partner
  }
  
  // Team 2 Partner
  const partner2Distance = roundNum - stats.lastPartnerRound[team2[0].id][team2[1].id]
  const partner2Count = stats.partnerCount[team2[0].id][team2[1].id]
  
  if (partner2Count === 0) {
    score += partnerDistanceWeight * 2
  } else {
    score += Math.min(partner2Distance, 10) * 10
    score -= partner2Count * partnerCountWeight
  }
  
  // 2. RUNDENDISTANZ für Gegner (WICHTIG!)
  const opponentDistanceWeight = 150
  const opponentCountWeight = 50
  
  team1.forEach(p1 => {
    team2.forEach(p2 => {
      const oppDistance = roundNum - stats.lastOpponentRound[p1.id][p2.id]
      const oppCount = stats.opponentCount[p1.id][p2.id]
      
      if (oppCount === 0) {
        score += opponentDistanceWeight // Bonus für neue Gegner
      } else {
        score += Math.min(oppDistance, 8) * 8 // Bonus basierend auf Distanz
        score -= oppCount * opponentCountWeight // Strafe für häufige Gegner
        
        // Extra-Strafe für aufeinanderfolgende Spiele gegen gleiche Gegner
        if (oppDistance < 3) {
          score -= (3 - oppDistance) * 100
        }
      }
    })
  })
  
  // 3. AUSGEGLICHENE SPIELANZAHL
  const allPlayers = [...team1, ...team2]
  const gamesCounts = allPlayers.map(p => stats.gamesPlayed[p.id])
  const avgGames = gamesCounts.reduce((a, b) => a + b, 0) / 4
  const gamesVariance = gamesCounts.reduce((sum, games) => sum + Math.pow(games - avgGames, 2), 0) / 4
  score -= gamesVariance * 30
  
  // 4. VIELFALT DER PARTNER/GEGNER
  // Bonus für Spieler mit weniger verschiedenen Partnern
  allPlayers.forEach(p => {
    const uniquePartners = Object.values(stats.partnerCount[p.id]).filter(c => c > 0).length
    const uniqueOpponents = Object.values(stats.opponentCount[p.id]).filter(c => c > 0).length
    const totalPossible = Object.keys(stats.partnerCount[p.id]).length
    
    // Bonus für weniger Partner-Vielfalt (mehr Potenzial für neue Partner)
    score += (totalPossible - uniquePartners) * 5
    score += (totalPossible - uniqueOpponents) * 3
  })
  
  // 5. SKILL-BALANCE (wenn vorhanden)
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
    
    score -= skillDiff * 20
  }
  
  // 6. COURT-ROTATION
  allPlayers.forEach(p => {
    const lastCourt = stats.courtHistory[p.id][stats.courtHistory[p.id].length - 1]
    if (lastCourt === courtNum) {
      score -= 10
    }
  })
  
  // 7. PAUSE-FAIRNESS
  allPlayers.forEach(p => {
    const roundsSinceRest = roundNum - stats.lastRestRound[p.id]
    if (roundsSinceRest > 5) {
      score += roundsSinceRest * 3
    }
  })
  
  return score
}

/**
 * Update Statistiken mit Rundendistanz-Tracking
 */
function updateStats(match, stats, courtNum, roundNum) {
  const allPlayers = [...match.team1, ...match.team2]
  
  // Update Spiele und Court-Historie
  allPlayers.forEach(p => {
    stats.gamesPlayed[p.id]++
    stats.courtHistory[p.id].push(courtNum)
  })
  
  // Update Partner mit Rundendistanz
  stats.partners[match.team1[0].id][match.team1[1].id]++
  stats.partners[match.team1[1].id][match.team1[0].id]++
  stats.partnerCount[match.team1[0].id][match.team1[1].id]++
  stats.partnerCount[match.team1[1].id][match.team1[0].id]++
  stats.lastPartnerRound[match.team1[0].id][match.team1[1].id] = roundNum
  stats.lastPartnerRound[match.team1[1].id][match.team1[0].id] = roundNum
  
  stats.partners[match.team2[0].id][match.team2[1].id]++
  stats.partners[match.team2[1].id][match.team2[0].id]++
  stats.partnerCount[match.team2[0].id][match.team2[1].id]++
  stats.partnerCount[match.team2[1].id][match.team2[0].id]++
  stats.lastPartnerRound[match.team2[0].id][match.team2[1].id] = roundNum
  stats.lastPartnerRound[match.team2[1].id][match.team2[0].id] = roundNum
  
  // Update Gegner mit Rundendistanz
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

/**
 * Berechne erweiterte finale Statistiken
 */
function calculateFinalStats(players, stats) {
  const playerStats = players.map(player => {
    const uniquePartners = Object.keys(stats.partnerCount[player.id])
      .filter(partnerId => stats.partnerCount[player.id][partnerId] > 0).length
    
    const uniqueOpponents = Object.keys(stats.opponentCount[player.id])
      .filter(oppId => stats.opponentCount[player.id][oppId] > 0).length
    
    // Berechne maximale Wiederholungen
    const partnerCounts = Object.values(stats.partnerCount[player.id]).filter(c => c > 0)
    const opponentCounts = Object.values(stats.opponentCount[player.id]).filter(c => c > 0)
    
    const maxPartnerRepeats = Math.max(...partnerCounts, 0)
    const maxOpponentRepeats = Math.max(...opponentCounts, 0)
    
    // Berechne Fairness-Score
    const avgPartnerCount = partnerCounts.length > 0 
      ? partnerCounts.reduce((a, b) => a + b, 0) / partnerCounts.length 
      : 0
    const fairness = maxPartnerRepeats > 0 ? (avgPartnerCount / maxPartnerRepeats) * 100 : 100
    
    // Berechne minimale Rundendistanz zwischen gleichen Paarungen
    let minPartnerDistance = Infinity
    let minOpponentDistance = Infinity
    
    Object.entries(stats.lastPartnerRound[player.id]).forEach(([partnerId, lastRound]) => {
      if (stats.partnerCount[player.id][partnerId] > 1) {
        // Hier müssten wir alle Runden tracken, nicht nur die letzte
        // Für die aktuelle Implementation nehmen wir einen Schätzwert
        const avgDistance = stats.gamesPlayed[player.id] / stats.partnerCount[player.id][partnerId]
        minPartnerDistance = Math.min(minPartnerDistance, avgDistance)
      }
    })
    
    return {
      name: player.name,
      games: stats.gamesPlayed[player.id],
      uniquePartners,
      uniqueOpponents,
      maxPartnerRepeats,
      maxOpponentRepeats,
      timesRested: stats.timesRested[player.id],
      fairness: Math.round(fairness)
    }
  })
  
  // Sortiere nach Spielanzahl
  playerStats.sort((a, b) => b.games - a.games)
  
  // Berechne Gesamtstatistiken
  const totalGames = playerStats.reduce((sum, p) => sum + p.games, 0)
  const avgUniquePartners = playerStats.reduce((sum, p) => sum + p.uniquePartners, 0) / players.length
  const avgUniqueOpponents = playerStats.reduce((sum, p) => sum + p.uniqueOpponents, 0) / players.length
  
  return {
    playerStats,
    summary: {
      totalPlayers: players.length,
      avgGamesPerPlayer: totalGames / players.length,
      avgUniquePartners: Math.round(avgUniquePartners * 10) / 10,
      avgUniqueOpponents: Math.round(avgUniqueOpponents * 10) / 10,
      minGames: Math.min(...playerStats.map(p => p.games)),
      maxGames: Math.max(...playerStats.map(p => p.games)),
      maxPartnerRepeats: Math.max(...playerStats.map(p => p.maxPartnerRepeats)),
      avgFairness: Math.round(playerStats.reduce((sum, p) => sum + p.fairness, 0) / players.length)
    }
  }
}

/**
 * Hilfsfunktion: Formatiere Zeit von Minuten zu HH:MM
 */
export function formatTimeFromMinutes(minutes, startTime = '09:00') {
  const [hours, mins] = startTime.split(':').map(Number)
  const startMinutes = hours * 60 + mins
  const totalMinutes = startMinutes + minutes
  
  const finalHours = Math.floor(totalMinutes / 60)
  const finalMins = totalMinutes % 60
  
  return `${finalHours.toString().padStart(2, '0')}:${finalMins.toString().padStart(2, '0')}`
}

/**
 * Analysiere Spielplan-Qualität
 */
export function analyzeScheduleQuality(schedule, players) {
  const analysis = {
    partnerDistribution: {},
    opponentDistribution: {},
    consecutivePairings: 0,
    minRoundsBetweenSamePairing: Infinity,
    recommendations: []
  }
  
  // Tracke alle Paarungen über alle Runden
  const pairingHistory = {}
  
  schedule.forEach((round, roundIdx) => {
    round.matches?.forEach(match => {
      if (match.team1 && match.team2) {
        // Partner-Paarungen
        const partner1Key = [match.team1[0].id, match.team1[1].id].sort().join('-')
        const partner2Key = [match.team2[0].id, match.team2[1].id].sort().join('-')
        
        // Tracke Partner-Historie
        if (!pairingHistory[partner1Key]) pairingHistory[partner1Key] = []
        if (!pairingHistory[partner2Key]) pairingHistory[partner2Key] = []
        
        pairingHistory[partner1Key].push(roundIdx)
        pairingHistory[partner2Key].push(roundIdx)
        
        // Gegner-Paarungen
        match.team1.forEach(p1 => {
          match.team2.forEach(p2 => {
            const oppKey = [p1.id, p2.id].sort().join('-')
            if (!pairingHistory[oppKey]) pairingHistory[oppKey] = []
            pairingHistory[oppKey].push(roundIdx)
          })
        })
      }
    })
  })
  
  // Analysiere Paarungs-Abstände
  Object.entries(pairingHistory).forEach(([pairing, rounds]) => {
    if (rounds.length > 1) {
      for (let i = 1; i < rounds.length; i++) {
        const distance = rounds[i] - rounds[i-1]
        analysis.minRoundsBetweenSamePairing = Math.min(
          analysis.minRoundsBetweenSamePairing,
          distance
        )
        
        if (distance === 1) {
          analysis.consecutivePairings++
        }
      }
    }
  })
  
  // Generiere Empfehlungen
  if (analysis.consecutivePairings > 0) {
    analysis.recommendations.push(
      `${analysis.consecutivePairings} aufeinanderfolgende gleiche Paarungen gefunden. ` +
      `Der Algorithmus sollte dies vermeiden.`
    )
  }
  
  if (analysis.minRoundsBetweenSamePairing < 3) {
    analysis.recommendations.push(
      `Minimaler Abstand zwischen gleichen Paarungen: ${analysis.minRoundsBetweenSamePairing} Runden. ` +
      `Ideal wären mindestens 3 Runden Abstand.`
    )
  }
  
  return analysis
}

// Exportiere calculateFinalStats am Ende der Datei
export { calculateFinalStats }