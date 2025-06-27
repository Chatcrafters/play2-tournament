import * as XLSX from 'xlsx';

const excelExportService = {
  // Export Event Details mit allen Informationen
  exportEventDetails: (event, schedule) => {
    if (!event || !schedule) return;

    // Workbook erstellen
    const wb = XLSX.utils.book_new();

    // 1. Overview Sheet
    const overviewData = [
      ['Event Details'],
      ['Name', event.name],
      ['Sport', event.sport],
      ['Type', event.type],
      ['Format', event.format],
      ['Date', event.isMultiDay ? `${event.startDate} - ${event.endDate}` : event.date],
      ['Courts', event.courts],
      ['Players', event.players.length],
      [''],
      ['Schedule'],
      ['Total Rounds', schedule.length],
      ['Round Duration', `${event.roundDuration} minutes`],
      ['Total Playing Time', `${schedule.length * event.roundDuration} minutes`]
    ];
    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, overviewSheet, 'Overview');

    // 2. Players Sheet
    const playersData = [
      ['Player List'],
      ['Name', 'Skill Level', 'Total Games', 'Wins', 'Points']
    ];
    
    event.players.forEach(player => {
      const stats = calculatePlayerStats(player.id, schedule);
      playersData.push([
        player.name,
        player.skillLevel || '-',
        stats.totalGames,
        stats.wins,
        stats.points
      ]);
    });
    
    const playersSheet = XLSX.utils.aoa_to_sheet(playersData);
    XLSX.utils.book_append_sheet(wb, playersSheet, 'Players');

    // 3. Schedule Sheet
    const scheduleData = [
      ['Game Schedule'],
      ['Round', 'Time', 'Court', 'Team 1', 'Team 2', 'Score', 'Winner']
    ];
    
    schedule.forEach((round, roundIndex) => {
      round.matches.forEach(match => {
        const team1 = match.team1.map(p => p.name).join(' & ');
        const team2 = match.team2.map(p => p.name).join(' & ');
        const score = match.result ? `${match.result.team1Score}-${match.result.team2Score}` : 'Not played';
        const winner = match.result ? 
          (match.result.team1Score > match.result.team2Score ? team1 : team2) : '-';
        
        scheduleData.push([
          `Round ${roundIndex + 1}`,
          formatTime(round.startTime),
          `Court ${match.court}`,
          team1,
          team2,
          score,
          winner
        ]);
      });
      
      // Add waiting players if any
      if (round.waitingPlayers && round.waitingPlayers.length > 0) {
        scheduleData.push([
          `Round ${roundIndex + 1}`,
          formatTime(round.startTime),
          'Waiting',
          round.waitingPlayers.map(p => p.name).join(', '),
          '-',
          '-',
          '-'
        ]);
      }
    });
    
    const scheduleSheet = XLSX.utils.aoa_to_sheet(scheduleData);
    XLSX.utils.book_append_sheet(wb, scheduleSheet, 'Schedule');

    // 4. Match Results Sheet (nur gespielte Matches)
    const resultsData = [
      ['Match Results'],
      ['Round', 'Court', 'Team 1', 'Score', 'Team 2', 'Points Team 1', 'Points Team 2']
    ];
    
    schedule.forEach((round, roundIndex) => {
      round.matches.forEach(match => {
        if (match.result) {
          const team1 = match.team1.map(p => p.name).join(' & ');
          const team2 = match.team2.map(p => p.name).join(' & ');
          
          resultsData.push([
            `Round ${roundIndex + 1}`,
            `Court ${match.court}`,
            team1,
            `${match.result.team1Score}-${match.result.team2Score}`,
            team2,
            match.result.team1Points || 0,
            match.result.team2Points || 0
          ]);
        }
      });
    });
    
    const resultsSheet = XLSX.utils.aoa_to_sheet(resultsData);
    XLSX.utils.book_append_sheet(wb, resultsSheet, 'Results');

    // 5. Standings Sheet
    const standingsData = [
      ['Final Standings'],
      ['Rank', 'Player', 'Games', 'Wins', 'Losses', 'Points', 'Win %']
    ];
    
    const playerStats = event.players.map(player => {
      const stats = calculatePlayerStats(player.id, schedule);
      return {
        ...player,
        ...stats,
        winPercentage: stats.totalGames > 0 ? 
          ((stats.wins / stats.totalGames) * 100).toFixed(1) : '0.0'
      };
    });
    
    // Sortieren nach Punkten
    playerStats.sort((a, b) => b.points - a.points);
    
    playerStats.forEach((player, index) => {
      standingsData.push([
        index + 1,
        player.name,
        player.totalGames,
        player.wins,
        player.losses,
        player.points,
        `${player.winPercentage}%`
      ]);
    });
    
    const standingsSheet = XLSX.utils.aoa_to_sheet(standingsData);
    XLSX.utils.book_append_sheet(wb, standingsSheet, 'Standings');

    // Excel-Datei speichern
    const fileName = `${event.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  },

  // Export Player Database
  exportPlayerDatabase: (players) => {
    const wb = XLSX.utils.book_new();
    
    const data = [
      ['Player Database Export'],
      ['Generated', new Date().toLocaleString()],
      [''],
      ['ID', 'Name', 'Skill Level', 'Email', 'Phone', 'Preferred Sports', 'Notes']
    ];
    
    players.forEach(player => {
      data.push([
        player.id,
        player.name,
        player.skillLevel || '',
        player.email || '',
        player.phone || '',
        player.preferredSports ? player.preferredSports.join(', ') : '',
        player.notes || ''
      ]);
    });
    
    const sheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, sheet, 'Players');
    
    XLSX.writeFile(wb, `player_database_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  // Import Players from Excel
  importPlayersFromExcel: async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Erste Sheet nehmen
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // In JSON konvertieren
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Header finden (suche nach der Zeile mit 'Name')
          let headerRowIndex = -1;
          for (let i = 0; i < jsonData.length; i++) {
            if (jsonData[i].includes('Name')) {
              headerRowIndex = i;
              break;
            }
          }
          
          if (headerRowIndex === -1) {
            reject(new Error('Keine gültige Header-Zeile gefunden. Stellen Sie sicher, dass eine Spalte "Name" existiert.'));
            return;
          }
          
          const headers = jsonData[headerRowIndex];
          const nameIndex = headers.indexOf('Name');
          const skillIndex = headers.indexOf('Skill Level');
          const emailIndex = headers.indexOf('Email');
          const phoneIndex = headers.indexOf('Phone');
          const sportsIndex = headers.indexOf('Preferred Sports');
          const notesIndex = headers.indexOf('Notes');
          
          const players = [];
          
          // Daten ab der Zeile nach dem Header verarbeiten
          for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            
            // Leere Zeilen überspringen
            if (!row[nameIndex] || row[nameIndex].toString().trim() === '') continue;
            
            const player = {
              id: Date.now() + Math.random(),
              name: row[nameIndex].toString().trim(),
              skillLevel: skillIndex !== -1 && row[skillIndex] ? 
                parseInt(row[skillIndex]) || 3 : 3,
              email: emailIndex !== -1 && row[emailIndex] ? 
                row[emailIndex].toString().trim() : '',
              phone: phoneIndex !== -1 && row[phoneIndex] ? 
                row[phoneIndex].toString().trim() : '',
              preferredSports: sportsIndex !== -1 && row[sportsIndex] ? 
                row[sportsIndex].toString().split(',').map(s => s.trim()).filter(s => s) : [],
              notes: notesIndex !== -1 && row[notesIndex] ? 
                row[notesIndex].toString().trim() : ''
            };
            
            players.push(player);
          }
          
          resolve(players);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
      reader.readAsArrayBuffer(file);
    });
  }
};

// Hilfsfunktionen
function calculatePlayerStats(playerId, schedule) {
  let totalGames = 0;
  let wins = 0;
  let losses = 0;
  let points = 0;
  
  schedule.forEach(round => {
    round.matches.forEach(match => {
      const inTeam1 = match.team1.some(p => p.id === playerId);
      const inTeam2 = match.team2.some(p => p.id === playerId);
      
      if ((inTeam1 || inTeam2) && match.result) {
        totalGames++;
        
        if (inTeam1) {
          points += match.result.team1Points || 0;
          if (match.result.team1Score > match.result.team2Score) {
            wins++;
          } else {
            losses++;
          }
        } else if (inTeam2) {
          points += match.result.team2Points || 0;
          if (match.result.team2Score > match.result.team1Score) {
            wins++;
          } else {
            losses++;
          }
        }
      }
    });
  });
  
  return { totalGames, wins, losses, points };
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export default excelExportService;