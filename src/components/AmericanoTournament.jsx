import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Calendar, Clock, MapPin, Trophy, Users, Play, Pause, RotateCcw, Check, Edit2, X, ArrowLeft, Grid3X3 } from 'lucide-react'

// Tournament Overview Component
const TournamentOverview = ({ event, results, onUpdateResults, onBack, onCompleteTournament }) => {
  // Simple translation fallback
  const t = (key) => {
    const translations = {
      'schedule.round': 'Runde',
      'schedule.court': 'Platz',
      'results.resultEntered': 'Eingegeben',
      'results.liveStandings': 'Live-Tabelle',
      'results.hide': 'Ausblenden',
      'results.allResults': 'Alle Ergebnisse',
      'results.rank': 'Rang',
      'results.player': 'Spieler',
      'results.points': 'Punkte',
      'results.gamesWon': 'Spiele gewonnen',
      'results.gamesPlayed': 'Gespielt',
      'player.waitingPlayers': 'Wartende Spieler',
      'tournament.readyToComplete': 'Turnier bereit zum Abschluss',
      'tournament.allMatchesCompleted': 'Alle Spiele wurden gespielt',
      'buttons.completeTournament': 'Turnier abschließen'
    }
    return translations[key] || key
  }
  const [editingMatch, setEditingMatch] = useState(null);
  const [editScores, setEditScores] = useState({ team1Score: '', team2Score: '' });
  const [activeTab, setActiveTab] = useState(0);

  // Calculate standings
  const calculateStandings = () => {
    const playerStats = {};
    
    // Initialize all players
    event.players.forEach(player => {
      playerStats[player.id] = {
        ...player,
        points: 0,
        gamesWon: 0,
        gamesPlayed: 0
      };
    });
    
    // Process all results
    Object.entries(results).forEach(([matchKey, matchData]) => {
      if (!matchData.result) return;
      
      const { team1, team2, result } = matchData;
      
      // Update team 1
      team1?.forEach(player => {
        if (player && player.id && playerStats[player.id]) {
          playerStats[player.id].gamesPlayed++;
          playerStats[player.id].gamesWon += result.team1Score;
          playerStats[player.id].points += result.team1Points;
        }
      });

      // Update team 2
      team2?.forEach(player => {
        if (player && player.id && playerStats[player.id]) {
          playerStats[player.id].gamesPlayed++;
          playerStats[player.id].gamesWon += result.team2Score;
          playerStats[player.id].points += result.team2Points;
        }
      });
    });
    
    return Object.values(playerStats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.gamesWon - a.gamesWon;
    });
  };

  const allMatchesComplete = () => {
    return event.schedule.every((round, roundIdx) => 
      round.matches.every((_, matchIdx) => 
        results[`${roundIdx}-${matchIdx}`]?.result
      )
    );
  };

  const handleEditClick = (roundIdx, matchIdx, currentResult) => {
    const matchKey = `${roundIdx}-${matchIdx}`;
    setEditingMatch(matchKey);
    setEditScores({
      team1Score: currentResult?.team1Score || '',
      team2Score: currentResult?.team2Score || ''
    });
  };

  const handleSaveEdit = (roundIdx, matchIdx) => {
    const matchKey = `${roundIdx}-${matchIdx}`;
    const match = event.schedule[roundIdx].matches[matchIdx];
    
    const team1Score = parseInt(editScores.team1Score) || 0;
    const team2Score = parseInt(editScores.team2Score) || 0;
    
    // Calculate points
    const team1Points = team1Score > team2Score ? 2 : team1Score < team2Score ? 0 : 1;
    const team2Points = team1Score < team2Score ? 2 : team1Score > team2Score ? 0 : 1;
    
    const result = {
      ...match,
      result: {
        team1Score,
        team2Score,
        team1Points,
        team2Points
      }
    };
    
    const updatedResults = {
      ...results,
      [matchKey]: result
    };
    
    onUpdateResults(updatedResults);
    setEditingMatch(null);
    setEditScores({ team1Score: '', team2Score: '' });
  };

  const handleCancelEdit = () => {
    setEditingMatch(null);
    setEditScores({ team1Score: '', team2Score: '' });
  };

  const handleScoreSubmit = (roundIdx, matchIdx) => {
    const matchKey = `${roundIdx}-${matchIdx}`;
    
    if (!editScores.team1Score || !editScores.team2Score) {
      alert('Bitte beide Ergebnisse eingeben');
      return;
    }
    
    handleSaveEdit(roundIdx, matchIdx);
  };

  const standings = calculateStandings();
  const completedMatches = Object.values(results).filter(r => r.result).length;
  const totalMatches = event.schedule.reduce((total, round) => total + round.matches.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <ArrowLeft className="w-5 h-5" />
                Zurück
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
                <p className="text-gray-600">Spielplan-Übersicht & Ergebnisse</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Fortschritt</p>
                <p className="text-lg font-semibold">
                  {completedMatches} / {totalMatches} Spiele
                </p>
              </div>
              
              {allMatchesComplete() && (
                <button
                  onClick={onCompleteTournament}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 font-semibold"
                >
                  <Trophy className="w-5 h-5" />
                  Turnier abschließen
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar - Live Standings */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Live-Tabelle
              </h3>
              
              <div className="space-y-3">
                {standings.slice(0, 8).map((player, idx) => (
                  <div key={player.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                        idx === 1 ? 'bg-gray-100 text-gray-800' :
                        idx === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-medium text-sm truncate">{player.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{player.points}p</p>
                      <p className="text-xs text-gray-500">{player.gamesWon}g</p>
                    </div>
                  </div>
                ))}
              </div>

              {allMatchesComplete() && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">🏆 Turnier beendet!</h4>
                  <p className="text-green-700 text-sm">
                    Gewinner: <strong>{standings[0]?.name}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Tournament Schedule */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md">
              
              {/* Round Tabs */}
              <div className="border-b">
                <div className="flex flex-wrap">
                  {event.schedule.map((round, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTab(idx)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === idx
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Runde {idx + 1}
                      <span className="ml-2 text-xs">
                        ({round.matches.filter((_, matchIdx) => results[`${idx}-${matchIdx}`]?.result).length}/{round.matches.length})
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => setActiveTab(-1)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === -1
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Alle Runden
                  </button>
                </div>
              </div>

              {/* Round Content */}
              <div className="p-6">
                {activeTab === -1 ? (
                  // All Rounds View
                  <div className="space-y-8">
                    {event.schedule.map((round, roundIdx) => (
                      <div key={roundIdx} className="border-b pb-6 last:border-b-0">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Runde {roundIdx + 1}
                          <span className="text-sm font-normal text-gray-500">
                            ({round.matches.filter((_, matchIdx) => results[`${roundIdx}-${matchIdx}`]?.result).length}/{round.matches.length} Spiele)
                          </span>
                        </h3>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          {round.matches.map((match, matchIdx) => {
                            const matchKey = `${roundIdx}-${matchIdx}`;
                            const result = results[matchKey];
                            const isEditing = editingMatch === matchKey;
                            
                            return (
                              <div key={matchIdx} className="border rounded-lg p-4 bg-gray-50">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="font-semibold text-sm">Platz {match.court}</span>
                                  <div className="flex items-center gap-2">
                                    {result?.result && !isEditing && (
                                      <button
                                        onClick={() => handleEditClick(roundIdx, matchIdx, result.result)}
                                        className="text-blue-600 hover:text-blue-800 p-1"
                                        title="Ergebnis bearbeiten"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                    )}
                                    {result?.result && (
                                      <span className="text-green-600 text-sm font-medium">✓ Eingegeben</span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2 items-center text-sm">
                                  {/* Team 1 */}
                                  <div className="text-right">
                                    <p className="font-medium">
                                      {match.team1?.map(p => p.name).join(' & ')}
                                    </p>
                                  </div>
                                  
                                  {/* Score */}
                                  <div className="text-center">
                                    {isEditing ? (
                                      <div className="flex items-center justify-center gap-1">
                                        <input
                                          type="number"
                                          min="0"
                                          max="99"
                                          value={editScores.team1Score}
                                          onChange={(e) => setEditScores(prev => ({...prev, team1Score: e.target.value}))}
                                          className="w-12 text-center border rounded px-1 py-1 text-xs"
                                        />
                                        <span>-</span>
                                        <input
                                          type="number"
                                          min="0"
                                          max="99"
                                          value={editScores.team2Score}
                                          onChange={(e) => setEditScores(prev => ({...prev, team2Score: e.target.value}))}
                                          className="w-12 text-center border rounded px-1 py-1 text-xs"
                                        />
                                        <button
                                          onClick={() => handleSaveEdit(roundIdx, matchIdx)}
                                          className="text-green-600 hover:text-green-800 p-1 ml-1"
                                        >
                                          <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={handleCancelEdit}
                                          className="text-red-600 hover:text-red-800 p-1"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ) : result?.result ? (
                                      <div className="text-lg font-bold">
                                        {result.result.team1Score} - {result.result.team2Score}
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center gap-1">
                                        <input
                                          type="number"
                                          min="0"
                                          max="99"
                                          value={editingMatch === matchKey ? editScores.team1Score : ''}
                                          onChange={(e) => {
                                            if (editingMatch !== matchKey) {
                                              setEditingMatch(matchKey);
                                              setEditScores({ team1Score: e.target.value, team2Score: '' });
                                            } else {
                                              setEditScores(prev => ({...prev, team1Score: e.target.value}));
                                            }
                                          }}
                                          className="w-12 text-center border rounded px-1 py-1 text-xs"
                                          placeholder="0"
                                        />
                                        <span>-</span>
                                        <input
                                          type="number"
                                          min="0"
                                          max="99"
                                          value={editingMatch === matchKey ? editScores.team2Score : ''}
                                          onChange={(e) => {
                                            if (editingMatch !== matchKey) {
                                              setEditingMatch(matchKey);
                                              setEditScores({ team1Score: '', team2Score: e.target.value });
                                            } else {
                                              setEditScores(prev => ({...prev, team2Score: e.target.value}));
                                            }
                                          }}
                                          className="w-12 text-center border rounded px-1 py-1 text-xs"
                                          placeholder="0"
                                        />
                                        {editingMatch === matchKey && editScores.team1Score && editScores.team2Score && (
                                          <button
                                            onClick={() => handleScoreSubmit(roundIdx, matchIdx)}
                                            className="text-green-600 hover:text-green-800 p-1 ml-1"
                                          >
                                            <Check className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Team 2 */}
                                  <div className="text-left">
                                    <p className="font-medium">
                                      {match.team2?.map(p => p.name).join(' & ')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Waiting Players */}
                        {round.waitingPlayers?.length > 0 && (
                          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                            <p className="font-medium text-yellow-800 text-sm mb-1">Wartende Spieler:</p>
                            <p className="text-yellow-700 text-sm">
                              {round.waitingPlayers.map(p => p.name).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Single Round View
                  <div>
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Runde {activeTab + 1}
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        ({event.schedule[activeTab].matches.filter((_, matchIdx) => results[`${activeTab}-${matchIdx}`]?.result).length}/{event.schedule[activeTab].matches.length} Spiele abgeschlossen)
                      </span>
                    </h3>
                    
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      {event.schedule[activeTab].matches.map((match, matchIdx) => {
                        const matchKey = `${activeTab}-${matchIdx}`;
                        const result = results[matchKey];
                        const isEditing = editingMatch === matchKey;
                        
                        return (
                          <div key={matchIdx} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-semibold">Platz {match.court}</span>
                              <div className="flex items-center gap-2">
                                {result?.result && !isEditing && (
                                  <button
                                    onClick={() => handleEditClick(activeTab, matchIdx, result.result)}
                                    className="text-blue-600 hover:text-blue-800 p-1"
                                    title="Ergebnis bearbeiten"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                )}
                                {result?.result && (
                                  <span className="text-green-600 font-semibold">✓ Eingegeben</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 items-center">
                              {/* Team 1 */}
                              <div className="text-right">
                                <p className="font-medium">
                                  {match.team1?.map(p => p.name).join(' & ')}
                                </p>
                              </div>
                              
                              {/* Score */}
                              <div className="text-center">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      max="99"
                                      value={editScores.team1Score}
                                      onChange={(e) => setEditScores(prev => ({...prev, team1Score: e.target.value}))}
                                      className="w-16 text-center border rounded px-2 py-1"
                                    />
                                    <span className="text-xl">-</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="99"
                                      value={editScores.team2Score}
                                      onChange={(e) => setEditScores(prev => ({...prev, team2Score: e.target.value}))}
                                      className="w-16 text-center border rounded px-2 py-1"
                                    />
                                    <button
                                      onClick={() => handleSaveEdit(activeTab, matchIdx)}
                                      className="text-green-600 hover:text-green-800 p-1"
                                    >
                                      <Check className="w-5 h-5" />
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="text-red-600 hover:text-red-800 p-1"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  </div>
                                ) : result?.result ? (
                                  <div className="text-2xl font-bold">
                                    {result.result.team1Score} - {result.result.team2Score}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      max="99"
                                      value={editingMatch === matchKey ? editScores.team1Score : ''}
                                      onChange={(e) => {
                                        if (editingMatch !== matchKey) {
                                          setEditingMatch(matchKey);
                                          setEditScores({ team1Score: e.target.value, team2Score: '' });
                                        } else {
                                          setEditScores(prev => ({...prev, team1Score: e.target.value}));
                                        }
                                      }}
                                      className="w-16 text-center border rounded px-2 py-1"
                                      placeholder="0"
                                    />
                                    <span className="text-xl">-</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="99"
                                      value={editingMatch === matchKey ? editScores.team2Score : ''}
                                      onChange={(e) => {
                                        if (editingMatch !== matchKey) {
                                          setEditingMatch(matchKey);
                                          setEditScores({ team1Score: '', team2Score: e.target.value });
                                        } else {
                                          setEditScores(prev => ({...prev, team2Score: e.target.value}));
                                        }
                                      }}
                                      className="w-16 text-center border rounded px-2 py-1"
                                      placeholder="0"
                                    />
                                    {editingMatch === matchKey && editScores.team1Score && editScores.team2Score && (
                                      <button
                                        onClick={() => handleScoreSubmit(activeTab, matchIdx)}
                                        className="text-green-600 hover:text-green-800 p-1"
                                      >
                                        <Check className="w-5 h-5" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Team 2 */}
                              <div className="text-left">
                                <p className="font-medium">
                                  {match.team2?.map(p => p.name).join(' & ')}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Waiting Players */}
                    {event.schedule[activeTab].waitingPlayers?.length > 0 && (
                      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                        <p className="font-semibold text-yellow-800 mb-2">Wartende Spieler:</p>
                        <p className="text-yellow-700">
                          {event.schedule[activeTab].waitingPlayers.map(p => p.name).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Timer-Komponente
const Timer = ({ isRunning, onTick, duration, currentTime }) => {
  const intervalRef = useRef(null)
  
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        onTick()
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, onTick])
  
  const minutes = Math.floor(currentTime / 60)
  const seconds = currentTime % 60
  const progress = duration > 0 ? ((duration * 60 - currentTime) / (duration * 60)) * 100 : 100
  
  return (
    <div className="w-full">
      <div className="text-3xl font-bold text-center mb-2">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export const AmericanoTournament = ({ event, onComplete, onCancel }) => {
  // Simple translation fallback
  const t = (key) => {
    const translations = {
      'app.backToEventOverview': 'Zurück zur Event-Übersicht',
      'messages.tournamentManagement': 'Turnierverwaltung',
      'timer.roundTimer': 'Rundentimer',
      'timer.start': 'Start',
      'timer.pause': 'Pause',
      'timer.continue': 'Weiter',
      'tournament.roundNavigation': 'Runden-Navigation',
      'schedule.round': 'Runde',
      'tournament.previous': 'Zurück',
      'tournament.next': 'Weiter',
      'tournament.readyToComplete': 'Turnier bereit zum Abschluss',
      'tournament.allMatchesCompleted': 'Alle Spiele wurden gespielt',
      'buttons.completeTournament': 'Turnier abschließen',
      'messages.currentGames': 'Aktuelle Spiele',
      'schedule.court': 'Platz',
      'results.resultEntered': 'Ergebnis eingegeben',
      'player.waitingPlayers': 'Wartende Spieler',
      'results.liveStandings': 'Live-Tabelle',
      'results.hide': 'Ausblenden',
      'results.allResults': 'Alle Ergebnisse',
      'results.rank': 'Rang',
      'results.player': 'Spieler',
      'results.points': 'Punkte',
      'results.gamesWon': 'Spiele gewonnen',
      'results.gamesPlayed': 'Gespielt',
      'messages.enterBothScores': 'Bitte beide Ergebnisse eingeben'
    }
    return translations[key] || key
  }
  
  // States
  const [currentRound, setCurrentRound] = useState(event.currentRound || 0)
  const [timerState, setTimerState] = useState(event.timerState || 'stopped')
  const [currentTime, setCurrentTime] = useState(0)
  const [matchResults, setMatchResults] = useState(event.results || {})
  const [showResults, setShowResults] = useState(false)
  const [showOverview, setShowOverview] = useState(false)
  const [scores, setScores] = useState({})
  
  // Refs
  const lastUpdateRef = useRef(Date.now())
  
  // Callbacks
  const handleTimerTick = useCallback(() => {
    setCurrentTime(prev => prev + 1)
  }, [])
  
  const handleTimerControl = (action) => {
    switch (action) {
      case 'start':
        setTimerState('running')
        break
      case 'pause':
        setTimerState('paused')
        break
      case 'reset':
        setTimerState('stopped')
        setCurrentTime(0)
        break
    }
  }
  
  const handleNextRound = () => {
    if (currentRound < event.schedule.length - 1) {
      setCurrentRound(currentRound + 1)
      setTimerState('stopped')
      setCurrentTime(0)
    }
  }
  
  const handlePreviousRound = () => {
    if (currentRound > 0) {
      setCurrentRound(currentRound - 1)
      setTimerState('stopped')
      setCurrentTime(0)
    }
  }
  
  // Score handling
  const handleScoreChange = (matchIndex, team, value) => {
    setScores(prev => ({
      ...prev,
      [`${currentRound}-${matchIndex}`]: {
        ...prev[`${currentRound}-${matchIndex}`],
        [`team${team}Score`]: parseInt(value) || 0
      }
    }))
  }
  
  const handleScoreSubmit = (matchIndex) => {
    const matchKey = `${currentRound}-${matchIndex}`
    const score = scores[matchKey]
    const match = event.schedule[currentRound].matches[matchIndex]
    
    if (!score || score.team1Score === undefined || score.team2Score === undefined) {
      alert(t('messages.enterBothScores'))
      return
    }
    
    // Berechne Punkte: 2 für Sieg, 1 für Unentschieden, 0 für Niederlage
    const team1Points = score.team1Score > score.team2Score ? 2 : score.team1Score < score.team2Score ? 0 : 1
    const team2Points = score.team1Score < score.team2Score ? 2 : score.team1Score > score.team2Score ? 0 : 1
    
    const result = {
      ...match,
      result: {
        team1Score: score.team1Score,
        team2Score: score.team2Score,
        team1Points,
        team2Points
      }
    }
    
    setMatchResults(prev => ({
      ...prev,
      [matchKey]: result
    }))
    
    // Clear the score input
    setScores(prev => {
      const newScores = { ...prev }
      delete newScores[matchKey]
      return newScores
    })
  }
  
  // Calculate standings
  const calculateStandings = () => {
    const playerStats = {}
    
    // Initialize all players
    event.players.forEach(player => {
      playerStats[player.id] = {
        ...player,
        points: 0,
        gamesWon: 0,
        gamesPlayed: 0
      }
    })
    
    // Process all results
    Object.entries(matchResults).forEach(([matchKey, matchData]) => {
      if (!matchData.result) return
      
      const { team1, team2, result } = matchData
      
      // Update team 1
      team1?.forEach(player => {
        if (player && player.id && playerStats[player.id]) {
          playerStats[player.id].gamesPlayed++
          playerStats[player.id].gamesWon += result.team1Score
          playerStats[player.id].points += result.team1Points
        }
      })

      // Update team 2
      team2?.forEach(player => {
        if (player && player.id && playerStats[player.id]) {
          playerStats[player.id].gamesPlayed++
          playerStats[player.id].gamesWon += result.team2Score
          playerStats[player.id].points += result.team2Points
        }
      })
    }) 
    
    // Sort by points, then games won
    return Object.values(playerStats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      return b.gamesWon - a.gamesWon
    })
  }
  
  const allMatchesComplete = () => {
    return event.schedule.every((round, roundIdx) => 
      round.matches.every((_, matchIdx) => 
        matchResults[`${roundIdx}-${matchIdx}`]?.result
      )
    )
  }
  
  // ================================
  // TOURNAMENT COMPLETION FIX
  // ================================
  const handleCompleteTournament = () => {
    console.log('🏆 Tournament completion initiated')
    
    // 1. Berechne finale Standings
    const finalStandings = calculateStandings()
    console.log('📊 Final standings calculated:', finalStandings)
    
    // 2. Erstelle Tournament Summary
    const tournamentSummary = {
      eventId: event.id,
      eventName: event.name,
      completedAt: new Date().toISOString(),
      totalRounds: event.schedule.length,
      totalPlayers: event.players.length,
      finalStandings: finalStandings,
      allResults: matchResults,
      winner: finalStandings[0], // Erster Platz
      podium: finalStandings.slice(0, 3) // Top 3
    }
    
    console.log('🏆 Tournament Summary:', tournamentSummary)
    
    // 3. Rufe onComplete mit eindeutigem Completion-Objekt auf
    if (onComplete) {
      onComplete({
        action: 'TOURNAMENT_COMPLETED', // Eindeutiger Action-Typ
        completed: true,
        results: matchResults,
        summary: tournamentSummary
      })
    }
  }
  
  // WICHTIGER FIX: Button mit type="button" um Form-Submit zu verhindern
  const handleCancelClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onCancel) {
      onCancel()
    }
  }

  // Handle overview results update
  const handleOverviewResultsUpdate = (updatedResults) => {
    setMatchResults(updatedResults)
  }
  
  // Auto-save periodically
  useEffect(() => {
    const now = Date.now()
    if (now - lastUpdateRef.current > 5000) { // Save every 5 seconds
      lastUpdateRef.current = now
      // Here you would save to database
      // saveToDatabase({ currentRound, timerState, currentTime, matchResults })
    }
  }, [currentRound, timerState, currentTime, matchResults])
  
  const currentSchedule = event.schedule[currentRound]
  const standings = calculateStandings()

  // Show Tournament Overview if requested
  if (showOverview) {
    return (
      <TournamentOverview
        event={event}
        results={matchResults}
        onUpdateResults={handleOverviewResultsUpdate}
        onBack={() => setShowOverview(false)}
        onCompleteTournament={handleCompleteTournament}
      />
    )
  }
  
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          {/* WICHTIG: type="button" hinzugefügt um Form-Submit zu verhindern */}
          <button
            type="button"
            onClick={handleCancelClick}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← {t('app.backToEventOverview')}
          </button>
          
          <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
          <p className="text-gray-600">{t('messages.tournamentManagement')}</p>
        </div>
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Timer & Round Control */}
          <div className="lg:col-span-1">
            {/* Timer Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">{t('timer.roundTimer')}</h3>
              
              <Timer
                isRunning={timerState === 'running'}
                onTick={handleTimerTick}
                duration={event.roundDuration || 15}
                currentTime={currentTime}
              />
              
              <div className="mt-4 flex gap-2">
                {timerState === 'stopped' && (
                  <button
                    onClick={() => handleTimerControl('start')}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    {t('timer.start')}
                  </button>
                )}
                
                {timerState === 'running' && (
                  <button
                    onClick={() => handleTimerControl('pause')}
                    className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 flex items-center justify-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    {t('timer.pause')}
                  </button>
                )}
                
                {timerState === 'paused' && (
                  <button
                    onClick={() => handleTimerControl('start')}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    {t('timer.continue')}
                  </button>
                )}
                
                <button
                  onClick={() => handleTimerControl('reset')}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Round Navigation */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">{t('tournament.roundNavigation')}</h3>
              
              <div className="text-center mb-4">
                <p className="text-3xl font-bold">
                  {t('schedule.round')} {currentRound + 1} / {event.schedule.length}
                </p>
              </div>
              
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handlePreviousRound}
                  disabled={currentRound === 0}
                  className={`flex-1 px-4 py-2 rounded ${
                    currentRound === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  ← {t('tournament.previous')}
                </button>
                
                <button
                  onClick={handleNextRound}
                  disabled={currentRound === event.schedule.length - 1}
                  className={`flex-1 px-4 py-2 rounded ${
                    currentRound === event.schedule.length - 1
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {t('tournament.next')} →
                </button>
              </div>

              {/* Spielplan-Übersicht Button */}
              <button
                onClick={() => setShowOverview(true)}
                className="w-full mb-4 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 font-semibold"
              >
                <Grid3X3 className="w-5 h-5" />
                📋 Spielplan-Übersicht
              </button>
              
              {/* ================================ */}
              {/* VERBESSERTER TOURNAMENT COMPLETE BUTTON */}
              {/* ================================ */}
              {allMatchesComplete() && (
                <div className="mt-4 space-y-3">
                  {/* Completion Summary */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      {t('tournament.readyToComplete') || 'Turnier bereit zum Abschluss'}
                    </h4>
                    <div className="text-green-700 text-sm space-y-1">
                      <p>{t('tournament.allMatchesCompleted') || 'Alle Spiele wurden gespielt'}</p>
                      <p className="font-medium">
                        🏆 Gewinner: <strong>{calculateStandings()[0]?.name}</strong> 
                        ({calculateStandings()[0]?.points} Punkte)
                      </p>
                      {calculateStandings()[1] && (
                        <p>🥈 2. Platz: <strong>{calculateStandings()[1]?.name}</strong></p>
                      )}
                      {calculateStandings()[2] && (
                        <p>🥉 3. Platz: <strong>{calculateStandings()[2]?.name}</strong></p>
                      )}
                    </div>
                  </div>
                  
                  {/* Complete Button */}
                  <button
                    onClick={handleCompleteTournament}
                    className="w-full bg-green-600 text-white px-4 py-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-3 font-semibold text-lg transition-all transform hover:scale-[1.02]"
                  >
                    <Trophy className="w-6 h-6" />
                    {t('buttons.completeTournament') || 'Turnier abschließen'}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Middle Column - Current Matches */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">{t('messages.currentGames')}</h3>
              
              {currentSchedule && (
                <div className="space-y-4">
                  {currentSchedule.matches.map((match, matchIndex) => {
                    const matchKey = `${currentRound}-${matchIndex}`
                    const result = matchResults[matchKey]
                    const score = scores[matchKey] || {}
                    
                    return (
                      <div key={matchIndex} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-semibold">{t('schedule.court')} {match.court}</span>
                          {result?.result && (
                            <span className="text-green-600 font-semibold">✓ {t('results.resultEntered')}</span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          {/* Team 1 */}
                          <div className="text-center md:text-right">
                            <p className="font-medium text-lg">
                              {match.team1?.map(p => p.name).join(' & ')}
                            </p>
                          </div>
                          
                          {/* Score Input or Result */}
                          <div className="text-center">
                            {result?.result ? (
                              <div className="text-2xl font-bold">
                                {result.result.team1Score} - {result.result.team2Score}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="99"
                                  value={score.team1Score || ''}
                                  onChange={(e) => handleScoreChange(matchIndex, 1, e.target.value)}
                                  className="w-16 text-center border rounded px-2 py-1"
                                  placeholder="0"
                                />
                                <span className="text-xl">-</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="99"
                                  value={score.team2Score || ''}
                                  onChange={(e) => handleScoreChange(matchIndex, 2, e.target.value)}
                                  className="w-16 text-center border rounded px-2 py-1"
                                  placeholder="0"
                                />
                                <button
                                  onClick={() => handleScoreSubmit(matchIndex)}
                                  className="ml-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                >
                                  ✓
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* Team 2 */}
                          <div className="text-center md:text-left">
                            <p className="font-medium text-lg">
                              {match.team2?.map(p => p.name).join(' & ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Waiting Players */}
                  {currentSchedule.waitingPlayers?.length > 0 && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                      <p className="font-semibold text-yellow-800 mb-2">{t('player.waitingPlayers')}:</p>
                      <p className="text-yellow-700">
                        {currentSchedule.waitingPlayers.map(p => p.name).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Live Standings */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{t('results.liveStandings')}</h3>
                <button
                  onClick={() => setShowResults(!showResults)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {showResults ? t('results.hide') : t('results.allResults')}
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">{t('results.rank')}</th>
                      <th className="text-left py-2">{t('results.player')}</th>
                      <th className="text-center py-2">{t('results.points')}</th>
                      <th className="text-center py-2">{t('results.gamesWon')}</th>
                      <th className="text-center py-2">{t('results.gamesPlayed')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((player, idx) => (
                      <tr key={player.id} className="border-b">
                        <td className="py-2">{idx + 1}</td>
                        <td className="py-2 font-medium">{player.name}</td>
                        <td className="text-center py-2 font-bold">{player.points}</td>
                        <td className="text-center py-2">{player.gamesWon}</td>
                        <td className="text-center py-2">{player.gamesPlayed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        {/* All Results Modal */}
        {showResults && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{t('results.allResults')}</h2>
                <button
                  onClick={() => setShowResults(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              {/* Results by round */}
              {event.schedule.map((round, roundIdx) => (
                <div key={roundIdx} className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">{t('schedule.round')} {roundIdx + 1}</h3>
                  <div className="space-y-2">
                    {round.matches.map((match, matchIdx) => {
                      const result = matchResults[`${roundIdx}-${matchIdx}`]
                      return (
                        <div key={matchIdx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span>{match.team1?.map(p => p.name).join(' & ')}</span>
                          <span className="font-bold">
                            {result?.result ? `${result.result.team1Score} - ${result.result.team2Score}` : '-'}
                          </span>
                          <span>{match.team2?.map(p => p.name).join(' & ')}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}