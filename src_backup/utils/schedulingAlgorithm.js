// src/utils/schedulingAlgorithm.js

// Hilfsfunktion zum Mischen eines Arrays
const shuffleArray = (array) => {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Hauptfunktion für Americano Scheduling
export const generateAmericanoSchedule = (
  players,
  courts,
  roundDuration,
  startTime,
  endTime,
  breaks = [],
  eventDate,
  endDate = null,
  dailySchedule = null
) => {
  const rounds = []
  const playersPerMatch = 4
  const matchesPerRound = Math.min(courts, Math.floor(players.length / playersPerMatch))
  const playersPerRound = matchesPerRound * playersPerMatch
  const restingPlayers = players.length - playersPerRound
  
  // Tracking für faire Verteilung
  const playerStats = {}
  players.forEach(player => {
    playerStats[player.id] = {
      gamesPlayed: 0,
      timesRested: 0,
      partners: new Set(),
      opponents: new Set()
    }
  })

  // Berechne Tage für mehrtägige Events
  const days = []
  if (endDate) {
    const start = new Date(eventDate)
    const end = new Date(endDate)
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push({
        date: new Date(d),
        dateString: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('de-DE', { weekday: 'long' })
      })
    }
  } else {
    days.push({
      date: new Date(eventDate),
      dateString: eventDate,
      dayName: new Date(eventDate).toLocaleDateString('de-DE', { weekday: 'long' })
    })
  }

  // Für jeden Tag Spielplan erstellen
  days.forEach((day, dayIndex) => {
    // Bestimme Start- und Endzeit für diesen Tag
    let dayStartTime = startTime
    let dayEndTime = endTime
    
    if (dailySchedule && dailySchedule[day.dateString]) {
      const schedule = dailySchedule[day.dateString]
      if (schedule.active) {
        dayStartTime = schedule.startTime || startTime
        dayEndTime = schedule.endTime || endTime
      } else {
        return // Tag ist nicht aktiv
      }
    }
    
    // Berechne verfügbare Zeit
    const [startHour, startMinute] = dayStartTime.split(':').map(Number)
    const [endHour, endMinute] = dayEndTime.split(':').map(Number)
    
    let currentTime = startHour * 60 + startMinute
    const endTimeMinutes = endHour * 60 + endMinute
    
    // Filtere Pausen für diesen Tag
    const dayBreaks = breaks.filter(b => {
      if (!b.date) return true
      return b.date === day.dateString
    })
    
    // Generiere Runden für diesen Tag
    while (currentTime + roundDuration <= endTimeMinutes) {
      const roundStartTime = `${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${(currentTime % 60).toString().padStart(2, '0')}`
      const roundEndTime = `${Math.floor((currentTime + roundDuration) / 60).toString().padStart(2, '0')}:${((currentTime + roundDuration) % 60).toString().padStart(2, '0')}`
      
      // Prüfe Pausenzeiten
      const isBreakTime = dayBreaks.some(breakPeriod => {
        const [breakStartHour, breakStartMinute] = breakPeriod.startTime.split(':').map(Number)
        const [breakEndHour, breakEndMinute] = breakPeriod.endTime.split(':').map(Number)
        const breakStart = breakStartHour * 60 + breakStartMinute
        const breakEnd = breakEndHour * 60 + breakEndMinute
        
        return currentTime >= breakStart && currentTime < breakEnd
      })
      
      if (isBreakTime) {
        const currentBreak = dayBreaks.find(breakPeriod => {
          const [breakStartHour, breakStartMinute] = breakPeriod.startTime.split(':').map(Number)
          const [breakEndHour, breakEndMinute] = breakPeriod.endTime.split(':').map(Number)
          const breakStart = breakStartHour * 60 + breakStartMinute
          const breakEnd = breakEndHour * 60 + breakEndMinute
          
          return currentTime >= breakStart && currentTime < breakEnd
        })
        
        if (currentBreak) {
          const [breakEndHour, breakEndMinute] = currentBreak.endTime.split(':').map(Number)
          currentTime = breakEndHour * 60 + breakEndMinute
          
          rounds.push({
            roundNumber: rounds.filter(r => !r.isBreak).length + 1,
            date: day.dateString,
            dayName: day.dayName,
            dayIndex: dayIndex + 1,
            startTime: currentBreak.startTime,
            endTime: currentBreak.endTime,
            matches: [],
            isBreak: true,
            breakName: currentBreak.name || 'Pause'
          })
        }
        continue
      }
      
      // Erstelle Matches mit fairer Verteilung
      const roundMatches = []
      const availablePlayers = [...players].sort((a, b) => {
        // Priorisiere Spieler mit weniger Spielen
        const diff = playerStats[a.id].gamesPlayed - playerStats[b.id].gamesPlayed
        if (diff !== 0) return diff
        
        // Bei Gleichstand: Spieler die länger pausiert haben
        return playerStats[b.id].timesRested - playerStats[a.id].timesRested
      })
      
      const selectedPlayers = []
      
      // Wähle Spieler für Matches
      for (let i = 0; i < matchesPerRound && availablePlayers.length >= 4; i++) {
        const match = {
          court: i + 1,
          players: []
        }
        
        // Wähle erste 4 verfügbare Spieler (bereits nach Priorität sortiert)
        for (let j = 0; j < 4 && availablePlayers.length > 0; j++) {
          const player = availablePlayers.shift()
          match.players.push(player.id)
          selectedPlayers.push(player.id)
        }
        
        // Mische die Spieler für zufällige Paarungen
        match.players = shuffleArray(match.players)
        
        // Update Stats
        match.players.forEach(playerId => {
          playerStats[playerId].gamesPlayed++
        })
        
        // Track Paarungen
        playerStats[match.players[0]].partners.add(match.players[1])
        playerStats[match.players[1]].partners.add(match.players[0])
        playerStats[match.players[2]].partners.add(match.players[3])
        playerStats[match.players[3]].partners.add(match.players[2])
        
        // Track Gegner
        playerStats[match.players[0]].opponents.add(match.players[2])
        playerStats[match.players[0]].opponents.add(match.players[3])
        playerStats[match.players[1]].opponents.add(match.players[2])
        playerStats[match.players[1]].opponents.add(match.players[3])
        playerStats[match.players[2]].opponents.add(match.players[0])
        playerStats[match.players[2]].opponents.add(match.players[1])
        playerStats[match.players[3]].opponents.add(match.players[0])
        playerStats[match.players[3]].opponents.add(match.players[1])
        
        roundMatches.push(match)
      }
      
      // Pausende Spieler
      const restingPlayerIds = players
        .filter(p => !selectedPlayers.includes(p.id))
        .map(p => p.id)
      
      // Update Pausenstatistik
      restingPlayerIds.forEach(playerId => {
        playerStats[playerId].timesRested++
      })
      
      rounds.push({
        roundNumber: rounds.filter(r => !r.isBreak).length + 1,
        date: day.dateString,
        dayName: day.dayName,
        dayIndex: dayIndex + 1,
        startTime: roundStartTime,
        endTime: roundEndTime,
        matches: roundMatches,
        restingPlayerIds,
        isBreak: false
      })
      
      currentTime += roundDuration
    }
  })
  
  // Berechne Statistiken
  const stats = {
    playerStats: {},
    pairingMatrix: {}
  }
  
  players.forEach(player => {
    stats.playerStats[player.id] = {
      name: player.name,
      gamesPlayed: playerStats[player.id].gamesPlayed,
      timesRested: playerStats[player.id].timesRested,
      uniquePartners: playerStats[player.id].partners.size,
      uniqueOpponents: playerStats[player.id].opponents.size
    }
  })
  
  return {
    rounds,
    totalRounds: rounds.filter(r => !r.isBreak).length,
    totalDays: days.length,
    matchesPerRound,
    playersPerRound,
    restingPlayersPerRound: restingPlayers,
    stats
  }
}