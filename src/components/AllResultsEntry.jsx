// src/components/AllResultsEntry.jsx
import React, { useState, useEffect } from 'react';
import { Save, Trophy, Users, Target, Check, X } from 'lucide-react';

export const AllResultsEntry = ({ event, schedule, existingResults = {}, onUpdateResults }) => {
  const [results, setResults] = useState(existingResults);
  const [hasChanges, setHasChanges] = useState(false);
  const [showStandings, setShowStandings] = useState(true);

  // Update results when prop changes
  useEffect(() => {
    setResults(existingResults);
  }, [existingResults]);

  if (!schedule || schedule.length === 0) {
    return <div className="text-center p-4">Kein Spielplan vorhanden</div>;
  }

  const handleScoreChange = (matchId, team, score) => {
    const newResults = { ...results };
    if (!newResults[matchId]) {
      newResults[matchId] = { team1Score: 0, team2Score: 0, completed: false };
    }
    
    newResults[matchId][`${team}Score`] = parseInt(score) || 0;
    
    // Markiere als abgeschlossen, wenn beide Scores eingegeben wurden
    if (newResults[matchId].team1Score !== 0 || newResults[matchId].team2Score !== 0) {
      newResults[matchId].completed = true;
    } else {
      newResults[matchId].completed = false;
    }
    
    setResults(newResults);
    setHasChanges(true);
  };

  const handleSaveAll = () => {
    onUpdateResults(results);
    setHasChanges(false);
  };

  const handleReset = () => {
    if (window.confirm('Möchten Sie alle ungespeicherten Änderungen verwerfen?')) {
      setResults(existingResults);
      setHasChanges(false);
    }
  };

  // Berechne Live-Statistiken
  const calculateLiveStats = () => {
    const playerStats = {};
    
    // Initialisiere alle Spieler
    event.players?.forEach(player => {
      playerStats[player.id] = {
        id: player.id,
        name: player.name,
        played: 0,
        won: 0,
        lost: 0,
        drawn: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        points: 0,
        partners: new Set(),
        opponents: new Set()
      };
    });
    
    // Gehe durch alle Runden und Spiele
    schedule.forEach((round, roundIndex) => {
      round.matches?.forEach((match, matchIndex) => {
        const matchId = `${roundIndex}-${matchIndex}`;
        const result = results[matchId];
        
        if (result?.completed) {
          const team1Score = result.team1Score || 0;
          const team2Score = result.team2Score || 0;
          
          // Team 1 Statistiken
          match.team1?.forEach(player => {
            if (playerStats[player.id]) {
              playerStats[player.id].played++;
              playerStats[player.id].pointsFor += team1Score;
              playerStats[player.id].pointsAgainst += team2Score;
              
              // Partner tracking
              match.team1?.forEach(partner => {
                if (partner.id !== player.id) {
                  playerStats[player.id].partners.add(partner.name);
                }
              });
              
              // Gegner tracking
              match.team2?.forEach(opponent => {
                playerStats[player.id].opponents.add(opponent.name);
              });
              
              if (team1Score > team2Score) {
                playerStats[player.id].won++;
                playerStats[player.id].points += 3;
              } else if (team1Score === team2Score) {
                playerStats[player.id].drawn++;
                playerStats[player.id].points += 1;
              } else {
                playerStats[player.id].lost++;
              }
            }
          });
          
          // Team 2 Statistiken
          match.team2?.forEach(player => {
            if (playerStats[player.id]) {
              playerStats[player.id].played++;
              playerStats[player.id].pointsFor += team2Score;
              playerStats[player.id].pointsAgainst += team1Score;
              
              // Partner tracking
              match.team2?.forEach(partner => {
                if (partner.id !== player.id) {
                  playerStats[player.id].partners.add(partner.name);
                }
              });
              
              // Gegner tracking
              match.team1?.forEach(opponent => {
                playerStats[player.id].opponents.add(opponent.name);
              });
              
              if (team2Score > team1Score) {
                playerStats[player.id].won++;
                playerStats[player.id].points += 3;
              } else if (team2Score === team1Score) {
                playerStats[player.id].drawn++;
                playerStats[player.id].points += 1;
              } else {
                playerStats[player.id].lost++;
              }
            }
          });
        }
      });
    });
    
    // Sortiere nach Punkten, dann nach Punktdifferenz
    return Object.values(playerStats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const diffA = a.pointsFor - a.pointsAgainst;
      const diffB = b.pointsFor - b.pointsAgainst;
      if (diffB !== diffA) return diffB - diffA;
      return b.pointsFor - a.pointsFor;
    });
  };

  const standings = calculateLiveStats();
  const totalMatches = schedule.reduce((sum, round) => sum + (round.matches?.length || 0), 0);
  const completedMatches = Object.values(results).filter(r => r?.completed).length;
  const completionPercentage = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header mit Speichern-Button */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">Alle Ergebnisse eingeben</h3>
            <p className="text-sm text-gray-600 mt-1">
              {completedMatches} von {totalMatches} Spielen eingetragen ({completionPercentage}%)
            </p>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-2"
                >
                  <X size={20} />
                  Verwerfen
                </button>
                <button
                  onClick={handleSaveAll}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <Save size={20} />
                  Alle Ergebnisse speichern
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Linke Spalte: Spielplan mit Eingabefeldern */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Spielplan & Ergebnisse</h4>
          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
            {schedule.map((round, roundIndex) => (
              <div key={roundIndex} className="bg-white rounded-lg shadow p-4">
                <h5 className="font-semibold mb-3 text-blue-600">
                  Runde {round.round || roundIndex + 1}
                </h5>
                <div className="space-y-2">
                  {round.matches?.map((match, matchIndex) => {
                    const matchId = `${roundIndex}-${matchIndex}`;
                    const result = results[matchId] || { team1Score: 0, team2Score: 0 };
                    const isCompleted = result.completed;
                    
                    return (
                      <div 
                        key={matchId} 
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600 font-medium">
                            Court {match.court}
                          </div>
                          {isCompleted && (
                            <Check size={16} className="text-green-600" />
                          )}
                        </div>
                        
                        <div className="grid grid-cols-5 gap-2 items-center mt-2">
                          {/* Team 1 */}
                          <div className="col-span-2 text-sm">
                            {match.team1?.map(p => p.name).join(' & ')}
                          </div>
                          
                          {/* Score Inputs */}
                          <div className="flex items-center gap-1 justify-center">
                            <input
                              type="number"
                              min="0"
                              max="99"
                              value={result.team1Score || ''}
                              onChange={(e) => handleScoreChange(matchId, 'team1', e.target.value)}
                              className="w-12 px-1 py-1 border rounded text-center text-sm"
                              placeholder="0"
                            />
                            <span className="text-gray-500">:</span>
                            <input
                              type="number"
                              min="0"
                              max="99"
                              value={result.team2Score || ''}
                              onChange={(e) => handleScoreChange(matchId, 'team2', e.target.value)}
                              className="w-12 px-1 py-1 border rounded text-center text-sm"
                              placeholder="0"
                            />
                          </div>
                          
                          {/* Team 2 */}
                          <div className="col-span-2 text-sm text-right">
                            {match.team2?.map(p => p.name).join(' & ')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Pausierte Spieler */}
                  {round.waitingPlayers && round.waitingPlayers.length > 0 && (
                    <div className="mt-2 p-2 bg-yellow-100 rounded text-sm">
                      <span className="font-medium">Pausiert: </span>
                      {round.waitingPlayers.map(p => p.name).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rechte Spalte: Live-Tabelle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Live-Tabelle</h4>
            <button
              onClick={() => setShowStandings(!showStandings)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showStandings ? 'Ausblenden' : 'Einblenden'}
            </button>
          </div>
          
          {showStandings && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left p-2">#</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-center p-2">Spiele</th>
                      <th className="text-center p-2">S/U/N</th>
                      <th className="text-center p-2">Punkte</th>
                      <th className="text-center p-2">+/-</th>
                      <th className="text-center p-2 font-bold">Pkt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((player, index) => {
                      const diff = player.pointsFor - player.pointsAgainst;
                      const fairnessScore = player.played > 0 
                        ? Math.round((player.partners.size / (event.players.length - 1)) * 100)
                        : 0;
                      
                      return (
                        <tr key={player.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="p-2 font-bold">
                            {index + 1}
                            {index < 3 && <Trophy size={14} className="inline ml-1 text-yellow-500" />}
                          </td>
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{player.name}</div>
                              <div className="text-xs text-gray-500">
                                {player.partners.size > 0 && (
                                  <span title={`Partner: ${[...player.partners].join(', ')}`}>
                                    <Users size={12} className="inline mr-1" />
                                    {player.partners.size}
                                  </span>
                                )}
                                {player.opponents.size > 0 && (
                                  <span title={`Gegner: ${[...player.opponents].join(', ')}`} className="ml-2">
                                    <Target size={12} className="inline mr-1" />
                                    {player.opponents.size}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-center p-2">{player.played}</td>
                          <td className="text-center p-2 text-xs">
                            <span className="text-green-600">{player.won}</span>/
                            <span className="text-gray-600">{player.drawn}</span>/
                            <span className="text-red-600">{player.lost}</span>
                          </td>
                          <td className="text-center p-2 text-xs">{player.pointsFor}:{player.pointsAgainst}</td>
                          <td className="text-center p-2">
                            <span className={diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : ''}>
                              {diff > 0 ? '+' : ''}{diff}
                            </span>
                          </td>
                          <td className="text-center p-2 font-bold text-lg">{player.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Fairness-Statistiken */}
              <div className="mt-4 pt-4 border-t">
                <h5 className="font-medium mb-2">Turnier-Statistiken</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Durchschnittliche Spiele:</span>
                    <span className="ml-2 font-medium">
                      {standings.length > 0 
                        ? (standings.reduce((sum, p) => sum + p.played, 0) / standings.length).toFixed(1)
                        : 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Fairness-Score:</span>
                    <span className="ml-2 font-medium">
                      {standings.length > 0 
                        ? Math.round(standings.reduce((sum, p) => 
                            sum + (p.partners.size / Math.max(1, event.players.length - 1) * 100), 0
                          ) / standings.length)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Save Button für mobile Ansicht */}
      {hasChanges && (
        <div className="lg:hidden fixed bottom-4 right-4">
          <button
            onClick={handleSaveAll}
            className="px-6 py-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Save size={20} />
            Speichern
          </button>
        </div>
      )}
    </div>
  );
};

export default AllResultsEntry;